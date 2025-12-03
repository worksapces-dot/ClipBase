import OpenAI from "openai";
import * as fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptResult {
  fullText: string;
  segments: TranscriptSegment[];
  duration: number;
}

// Transcribe video using OpenAI Whisper
export async function transcribeVideo(videoPath: string): Promise<TranscriptResult> {
  console.log("Transcribing with OpenAI Whisper...");

  const audioFile = fs.createReadStream(videoPath);

  const response = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  });

  const segments: TranscriptSegment[] = (response.segments || []).map((seg) => ({
    start: seg.start,
    end: seg.end,
    text: seg.text.trim(),
  }));

  const duration = response.duration || segments[segments.length - 1]?.end || 0;

  console.log(`Transcription complete: ${segments.length} segments, ${duration}s duration`);

  return {
    fullText: response.text,
    segments,
    duration,
  };
}
