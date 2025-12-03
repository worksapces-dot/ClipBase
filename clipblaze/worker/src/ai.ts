import OpenAI from "openai";
import * as fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Segment {
  start: number;
  end: number;
  text: string;
}

interface Highlight {
  title: string;
  start_time: number;
  end_time: number;
  transcript: string;
  viral_score: number;
  hook: string;
  reason: string;
}

export async function transcribeAudio(
  audioPath: string
): Promise<{ text: string; segments: Segment[] }> {
  const audioFile = fs.createReadStream(audioPath);

  const response = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  });

  const segments: Segment[] = (response.segments || []).map((seg) => ({
    start: seg.start,
    end: seg.end,
    text: seg.text,
  }));

  return {
    text: response.text,
    segments,
  };
}

export async function detectHighlights(
  transcript: string,
  segments: Segment[],
  videoDuration: number
): Promise<Highlight[]> {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const prompt = `You are an expert at identifying viral short-form content from long videos.

Analyze this transcript and find 3-5 clips that would perform well on TikTok, Instagram Reels, and YouTube Shorts.

TRANSCRIPT WITH TIMESTAMPS:
${segments.map((s) => `[${formatTime(s.start)} - ${formatTime(s.end)}] ${s.text}`).join("\n")}

VIDEO DURATION: ${formatTime(videoDuration)}

For each clip, identify:
1. A catchy title (max 60 chars, attention-grabbing)
2. Start and end timestamps (clips should be 15-60 seconds)
3. The exact transcript for that segment
4. A viral score (0-100) based on engagement potential
5. The hook - what makes viewers stop scrolling in first 3 seconds
6. Why this clip would go viral

Look for:
- Strong hooks in the first 3 seconds (questions, bold statements, surprising facts)
- Emotional moments (surprise, humor, inspiration, controversy)
- Clear actionable advice or insights
- Story arcs with tension and resolution
- Quotable moments

Return a JSON object with a "clips" array:
{
  "clips": [
    {
      "title": "string",
      "start_time": number (seconds),
      "end_time": number (seconds),
      "transcript": "string",
      "viral_score": number,
      "hook": "string",
      "reason": "string"
    }
  ]
}

Only return valid JSON, no other text.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || '{"clips":[]}';

  try {
    // Try to extract JSON from the response
    let jsonStr = content.trim();
    
    // If it starts with ``` or has markdown, extract the JSON
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    const parsed = JSON.parse(jsonStr);
    const clips = Array.isArray(parsed) ? parsed : parsed.clips || [];

    console.log(`Parsed ${clips.length} clips from GPT response`);

    // Validate and clean up clips
    return clips
      .filter(
        (c: Highlight) =>
          c.start_time !== undefined &&
          c.end_time !== undefined &&
          c.end_time > c.start_time &&
          c.end_time - c.start_time >= 10 && // Min 10 seconds
          c.end_time - c.start_time <= 90 // Max 90 seconds
      )
      .slice(0, 5); // Max 5 clips
  } catch (error) {
    console.error("Failed to parse highlights:", content);
    console.error("Parse error:", error);
    return [];
  }
}
