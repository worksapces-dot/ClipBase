import { Inngest } from "inngest";
import { serve } from "inngest/express";
import express from "express";
import { createClient } from "@supabase/supabase-js";
import { downloadVideo } from "./youtube";
import { generateClip, generateThumbnail } from "./ffmpeg";
import { uploadFile } from "./storage";
import * as fs from "fs";
import * as path from "path";

const app = express();
const PORT = process.env.PORT || 3001;
const TEMP_DIR = "./temp";

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Initialize clients
const inngest = new Inngest({ id: "clipblaze-worker" });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Types
interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

// Helper: Format seconds to MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Helper: Get transcript for time range
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


// Main video processing function with FFmpeg
const processVideo = inngest.createFunction(
  { id: "process-video-ffmpeg", retries: 2 },
  { event: "video/process" },
  async ({ event, step }) => {
    const { videoId, youtubeUrl, userId } = event.data;
    const videoPath = path.join(TEMP_DIR, `${videoId}.mp4`);

    // Step 1: Download video
    await step.run("download-video", async () => {
      await supabase
        .from("videos")
        .update({ status: "downloading", updated_at: new Date().toISOString() })
        .eq("id", videoId);

      await downloadVideo(youtubeUrl, videoPath);
      console.log("Video downloaded");
    });

    // Step 2: Transcribe with Whisper (using OpenAI API)
    const transcript = await step.run("transcribe-video", async () => {
      await supabase
        .from("videos")
        .update({ status: "transcribing", updated_at: new Date().toISOString() })
        .eq("id", videoId);

      // Use fetch to call OpenAI Whisper API
      const formData = new FormData();
      const videoBuffer = fs.readFileSync(videoPath);
      const videoBlob = new Blob([videoBuffer], { type: "video/mp4" });
      formData.append("file", videoBlob, "video.mp4");
      formData.append("model", "whisper-1");
      formData.append("response_format", "verbose_json");
      formData.append("timestamp_granularities[]", "segment");

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Whisper API error: ${response.status}`);
      }

      const data = await response.json();
      const segments: TranscriptSegment[] = (data.segments || []).map((seg: any) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text.trim(),
      }));

      // Save transcript
      await supabase.from("transcripts").insert({
        video_id: videoId,
        full_text: data.text,
        segments,
        language: "en",
      });

      // Update video duration
      const duration = data.duration || segments[segments.length - 1]?.end || 0;
      await supabase
        .from("videos")
        .update({ duration_seconds: Math.round(duration) })
        .eq("id", videoId);

      return { fullText: data.text, segments, duration };
    });


    // Step 3: Find highlights with GPT-4
    const highlights = await step.run("find-highlights", async () => {
      await supabase
        .from("videos")
        .update({ status: "analyzing", updated_at: new Date().toISOString() })
        .eq("id", videoId);

      const formattedTranscript = transcript.segments
        .map((s) => `[${formatTime(s.start)} - ${formatTime(s.end)}] ${s.text}`)
        .join("\n");

      const prompt = `You are a viral content expert. Find 3-5 clips for TikTok/Reels/Shorts.

TRANSCRIPT:
${formattedTranscript}

VIDEO DURATION: ${formatTime(transcript.duration)}

Return ONLY JSON array:
[{"title": "Catchy Title", "startTime": 0, "endTime": 30, "viralScore": 85, "reason": "Why viral"}]

Rules: titles max 50 chars, clips 15-60 seconds, look for hooks/emotions/insights.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "[]";
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const clips = JSON.parse(jsonMatch?.[0] || "[]");

      return clips.map((clip: any) => ({
        ...clip,
        transcript: getTranscriptForRange(transcript.segments, clip.startTime, clip.endTime),
      }));
    });

    if (highlights.length === 0) {
      await supabase
        .from("videos")
        .update({ status: "failed", error_message: "No viral moments found" })
        .eq("id", videoId);
      return { success: false, error: "No highlights" };
    }


    // Step 4: Generate clips with FFmpeg
    await step.run("generate-clips", async () => {
      await supabase
        .from("videos")
        .update({ status: "generating", updated_at: new Date().toISOString() })
        .eq("id", videoId);

      for (let i = 0; i < highlights.length; i++) {
        const clip = highlights[i];
        const clipId = `${videoId}_clip_${i}`;
        const clipPath = path.join(TEMP_DIR, `${clipId}.mp4`);
        const thumbPath = path.join(TEMP_DIR, `${clipId}.jpg`);

        try {
          console.log(`Generating clip ${i + 1}/${highlights.length}: ${clip.title}`);

          // Generate clip with FFmpeg
          await generateClip({
            inputPath: videoPath,
            outputPath: clipPath,
            startTime: clip.startTime,
            endTime: clip.endTime,
          });

          // Generate thumbnail
          await generateThumbnail(clipPath, thumbPath);

          // Upload to Supabase Storage
          const videoUrl = await uploadFile(clipPath, `${userId}/${clipId}.mp4`);
          const thumbUrl = await uploadFile(thumbPath, `${userId}/${clipId}.jpg`);

          // Save clip to database
          await supabase.from("clips").insert({
            video_id: videoId,
            user_id: userId,
            title: clip.title,
            start_time: clip.startTime,
            end_time: clip.endTime,
            storage_path: videoUrl,
            thumbnail_path: thumbUrl,
            transcript: clip.transcript,
            viral_score: clip.viralScore,
            highlights: [{ type: "ai", description: clip.reason }],
            status: "completed",
          });

          // Cleanup clip files
          if (fs.existsSync(clipPath)) fs.unlinkSync(clipPath);
          if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);

          console.log(`Clip ${i + 1} done: ${clip.title}`);
        } catch (err) {
          console.error(`Clip ${i + 1} failed:`, err);
        }
      }
    });

    // Step 5: Complete
    await step.run("complete", async () => {
      // Cleanup video file
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);

      await supabase
        .from("videos")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", videoId);
    });

    return { success: true, videoId, clipsCreated: highlights.length };
  }
);


// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Inngest endpoint
app.use("/api/inngest", serve({ client: inngest, functions: [processVideo] }));

// Start server
app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log("  ClipBlaze Worker (Inngest + FFmpeg)");
  console.log("=".repeat(50));
  console.log(`Port: ${PORT}`);
  console.log(`Inngest endpoint: /api/inngest`);
});
