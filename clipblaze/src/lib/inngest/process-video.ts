import { inngest } from "../inngest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// Lazy-load clients to avoid build-time errors
let supabase: SupabaseClient;
let openai: OpenAI;

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabase;
}

function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// Types
interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

interface ClipSuggestion {
  title: string;
  startTime: number;
  endTime: number;
  viralScore: number;
  reason: string;
  transcript: string;
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

export const processVideo = inngest.createFunction(
  { id: "process-video", retries: 3 },
  { event: "video/process" },
  async ({ event, step }) => {
    const { videoId, youtubeUrl, userId } = event.data;

    // Step 1: Get video info and download URL
    const videoInfo = await step.run("get-video-info", async () => {
      await getSupabase()
        .from("videos")
        .update({ status: "downloading", updated_at: new Date().toISOString() })
        .eq("id", videoId);

      const videoIdMatch = youtubeUrl.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/
      );
      const ytVideoId = videoIdMatch?.[1];

      if (!ytVideoId) throw new Error("Invalid YouTube URL");

      const response = await fetch(
        `https://ytstream-download-youtube-videos.p.rapidapi.com/dl?id=${ytVideoId}`,
        {
          headers: {
            "X-RapidAPI-Key": process.env.RAPIDAPI_KEY!,
            "X-RapidAPI-Host": "ytstream-download-youtube-videos.p.rapidapi.com",
          },
        }
      );

      const data = await response.json();
      
      if (!data.formats?.length) throw new Error("No download formats available");

      // Find audio-only format for transcription (smaller file)
      const audioFormat = data.formats.find(
        (f: { mimeType?: string }) => f.mimeType?.includes("audio/")
      );

      // Find video format for clips
      const videoFormat =
        data.formats.find(
          (f: { mimeType?: string; qualityLabel?: string }) =>
            f.mimeType?.includes("video/mp4") &&
            (f.qualityLabel === "720p" || f.qualityLabel === "480p")
        ) || data.formats.find((f: { mimeType?: string }) => f.mimeType?.includes("video/mp4"));

      return {
        title: data.title || "Untitled",
        duration: data.lengthSeconds ? parseInt(data.lengthSeconds) : null,
        audioUrl: audioFormat?.url || videoFormat?.url,
        videoUrl: videoFormat?.url,
      };
    });

    if (!videoInfo.audioUrl) {
      await getSupabase()
        .from("videos")
        .update({ status: "failed", error_message: "Could not get download URL" })
        .eq("id", videoId);
      return { success: false, error: "Download failed" };
    }

    // Update video title
    await getSupabase()
      .from("videos")
      .update({ title: videoInfo.title, duration_seconds: videoInfo.duration })
      .eq("id", videoId);


    // Step 2: Transcribe with Whisper
    const transcript = await step.run("transcribe-video", async () => {
      await getSupabase()
        .from("videos")
        .update({ status: "transcribing", updated_at: new Date().toISOString() })
        .eq("id", videoId);

      // Download audio for Whisper (max 25MB)
      const audioResponse = await fetch(videoInfo.audioUrl);
      const audioBuffer = await audioResponse.arrayBuffer();

      // Create a File object for OpenAI
      const audioFile = new File([audioBuffer], "audio.mp3", { type: "audio/mpeg" });

      const response = await getOpenAI().audio.transcriptions.create({
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

      // Save transcript to database
      await getSupabase().from("transcripts").insert({
        video_id: videoId,
        full_text: response.text,
        segments,
        language: "en",
      });

      return {
        fullText: response.text,
        segments,
        duration: response.duration || segments[segments.length - 1]?.end || 0,
      };
    });

    // Step 3: Find highlights with GPT-4
    const highlights = await step.run("find-highlights", async () => {
      await getSupabase()
        .from("videos")
        .update({ status: "analyzing", updated_at: new Date().toISOString() })
        .eq("id", videoId);

      const formattedTranscript = transcript.segments
        .map((s) => `[${formatTime(s.start)} - ${formatTime(s.end)}] ${s.text}`)
        .join("\n");

      const prompt = `You are a viral content expert. Analyze this video transcript and find 3-5 clips that would perform well on TikTok/Reels/Shorts.

TRANSCRIPT:
${formattedTranscript}

VIDEO DURATION: ${formatTime(transcript.duration)}

For each clip:
1. Catchy title (max 50 chars)
2. Start and end timestamps (15-60 seconds each)
3. Viral score (1-100)
4. Why it would go viral

Look for: Strong hooks, emotional moments, valuable insights, controversial statements.

Return ONLY a JSON array:
[{"title": "...", "startTime": 0, "endTime": 30, "viralScore": 85, "reason": "..."}]`;

      const response = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || "[]";
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const clips: Omit<ClipSuggestion, "transcript">[] = JSON.parse(jsonMatch?.[0] || "[]");

      return clips.map((clip) => ({
        ...clip,
        transcript: getTranscriptForRange(transcript.segments, clip.startTime, clip.endTime),
      }));
    });

    if (highlights.length === 0) {
      await getSupabase()
        .from("videos")
        .update({ status: "failed", error_message: "No viral moments found" })
        .eq("id", videoId);
      return { success: false, error: "No highlights found" };
    }


    // Step 4: Create clip records
    const clipResults = await step.run("create-clips", async () => {
      await getSupabase()
        .from("videos")
        .update({ status: "generating", updated_at: new Date().toISOString() })
        .eq("id", videoId);

      const createdClips = [];

      for (const clip of highlights) {
        const { data, error } = await getSupabase()
          .from("clips")
          .insert({
            video_id: videoId,
            user_id: userId,
            title: clip.title,
            start_time: clip.startTime,
            end_time: clip.endTime,
            transcript: clip.transcript,
            viral_score: clip.viralScore,
            highlights: [{ type: "ai", description: clip.reason }],
            status: "completed",
          })
          .select()
          .single();

        if (!error && data) {
          createdClips.push(data);
        }
      }

      return { clipsCreated: createdClips.length };
    });

    // Step 5: Mark video as completed
    await step.run("complete", async () => {
      await getSupabase()
        .from("videos")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", videoId);
    });

    return {
      success: true,
      videoId,
      clipsCreated: clipResults.clipsCreated,
      duration: transcript.duration,
    };
  }
);
