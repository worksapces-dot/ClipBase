import OpenAI from 'openai'
import { TranscriptSegment } from './database.types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export type HighlightClip = {
  title: string
  start_time: number
  end_time: number
  transcript: string
  viral_score: number
  hook: string
  reason: string
}

// Transcribe audio using OpenAI Whisper
export async function transcribeAudio(audioBuffer: Buffer): Promise<{
  text: string
  segments: TranscriptSegment[]
}> {
  // Convert Buffer to Uint8Array for File constructor compatibility
  const uint8Array = new Uint8Array(audioBuffer)
  const file = new File([uint8Array], 'audio.mp3', { type: 'audio/mp3' })
  
  const response = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  })

  const segments: TranscriptSegment[] = (response.segments || []).map((seg) => ({
    start: seg.start,
    end: seg.end,
    text: seg.text,
  }))

  return {
    text: response.text,
    segments,
  }
}

// Use GPT-4 to detect viral-worthy highlights
export async function detectHighlights(
  transcript: string,
  segments: TranscriptSegment[],
  videoDuration: number
): Promise<HighlightClip[]> {
  const prompt = `You are an expert at identifying viral short-form content from long videos.

Analyze this transcript and find 3-5 clips that would perform well on TikTok, Instagram Reels, and YouTube Shorts.

TRANSCRIPT WITH TIMESTAMPS:
${segments.map(s => `[${formatTime(s.start)} - ${formatTime(s.end)}] ${s.text}`).join('\n')}

VIDEO DURATION: ${formatTime(videoDuration)}

For each clip, identify:
1. A catchy title (max 60 chars)
2. Start and end timestamps (clips should be 15-60 seconds)
3. The exact transcript for that segment
4. A viral score (0-100) based on engagement potential
5. The hook - what makes viewers stop scrolling
6. Why this clip would go viral

Look for:
- Strong hooks in the first 3 seconds
- Emotional moments (surprise, humor, inspiration)
- Controversial or thought-provoking statements
- Clear actionable advice or insights
- Story arcs with tension and resolution

Return JSON array:
[{
  "title": "string",
  "start_time": number (seconds),
  "end_time": number (seconds),
  "transcript": "string",
  "viral_score": number,
  "hook": "string",
  "reason": "string"
}]

Only return the JSON array, no other text.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content || '{"clips":[]}'
  
  try {
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? parsed : parsed.clips || []
  } catch {
    console.error('Failed to parse highlights:', content)
    return []
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Generate FFmpeg command for clip extraction with captions
export function generateFFmpegCommand(
  inputPath: string,
  outputPath: string,
  startTime: number,
  endTime: number,
  transcript: string
): string {
  const duration = endTime - startTime
  
  // Basic clip extraction with 9:16 crop for vertical video
  return `ffmpeg -i "${inputPath}" -ss ${startTime} -t ${duration} -vf "crop=ih*9/16:ih,scale=1080:1920" -c:v libx264 -c:a aac -y "${outputPath}"`
}

// Generate ASS subtitle file for animated captions
export function generateSubtitles(
  segments: TranscriptSegment[],
  startOffset: number
): string {
  let ass = `[Script Info]
Title: ClipBlaze Captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,72,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,0,2,50,50,100,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`

  for (const seg of segments) {
    const start = seg.start - startOffset
    const end = seg.end - startOffset
    if (start < 0) continue
    
    const startStr = formatASSTime(start)
    const endStr = formatASSTime(end)
    const text = seg.text.trim().replace(/\n/g, '\\N')
    
    ass += `Dialogue: 0,${startStr},${endStr},Default,,0,0,0,,${text}\n`
  }

  return ass
}

function formatASSTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const cs = Math.floor((seconds % 1) * 100)
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`
}
