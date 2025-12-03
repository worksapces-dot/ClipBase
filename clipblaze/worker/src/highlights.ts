import OpenAI from "openai";
import { TranscriptSegment } from "./transcribe";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ClipSuggestion {
  title: string;
  startTime: number;
  endTime: number;
  viralScore: number;
  reason: string;
  transcript: string;
}

// Find viral moments using GPT-4
export async function findHighlights(
  segments: TranscriptSegment[],
  duration: number
): Promise<ClipSuggestion[]> {
  console.log("Analyzing transcript for viral moments...");

  // Format transcript with timestamps
  const formattedTranscript = segments
    .map((s) => `[${formatTime(s.start)} - ${formatTime(s.end)}] ${s.text}`)
    .join("\n");

  const prompt = `You are a viral content expert. Analyze this video transcript and find 3-5 clips that would perform well on TikTok/Reels/Shorts.

TRANSCRIPT:
${formattedTranscript}

VIDEO DURATION: ${formatTime(duration)}

For each clip, identify:
1. A catchy title (max 50 chars)
2. Start and end timestamps (clips should be 15-60 seconds)
3. Viral score (1-100)
4. Why it would go viral

Look for:
- Strong hooks in the first 3 seconds
- Emotional moments (funny, shocking, inspiring)
- Valuable insights or tips
- Controversial or debate-worthy statements
- Story arcs with payoff

Return JSON array:
[
  {
    "title": "Catchy Title Here",
    "startTime": 0,
    "endTime": 30,
    "viralScore": 85,
    "reason": "Strong hook + valuable insight"
  }
]

Only return the JSON array, no other text.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content || "[]";
  
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const clips: ClipSuggestion[] = JSON.parse(jsonMatch?.[0] || "[]");


    // Add transcript text to each clip
    return clips.map((clip) => ({
      ...clip,
      transcript: getTranscriptForRange(segments, clip.startTime, clip.endTime),
    }));
  } catch (error) {
    console.error("Failed to parse highlights:", content);
    return [];
  }
}

// Get transcript text for a time range
function getTranscriptForRange(
  segments: TranscriptSegment[],
  start: number,
  end: number
): string {
  return segments
    .filter((s) => s.start >= start && s.end <= end)
    .map((s) => s.text)
    .join(" ");
}

// Format seconds to MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
