import { createClient } from "@supabase/supabase-js";
import { downloadVideo, getVideoInfo } from "./youtube";
import { extractAudio, generateClip } from "./ffmpeg";
import { transcribeAudio, detectHighlights } from "./ai";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuid } from "uuid";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEMP_DIR = "/tmp/clipblaze";

async function updateStatus(videoId: string, status: string, error?: string) {
  await supabase
    .from("videos")
    .update({ status, error_message: error || null })
    .eq("id", videoId);
}

export async function processVideo(
  videoId: string,
  youtubeUrl: string,
  userId: string
) {
  const workDir = path.join(TEMP_DIR, videoId);

  try {
    // Create temp directory
    fs.mkdirSync(workDir, { recursive: true });

    // Step 1: Get video info and download
    await updateStatus(videoId, "downloading");
    console.log(`[${videoId}] Downloading video...`);

    const videoInfo = await getVideoInfo(youtubeUrl);
    const videoPath = path.join(workDir, "video.mp4");
    await downloadVideo(youtubeUrl, videoPath);

    // Update video metadata
    await supabase
      .from("videos")
      .update({
        title: videoInfo.title,
        duration_seconds: videoInfo.duration,
        metadata: {
          youtube_id: videoInfo.id,
          thumbnail: videoInfo.thumbnail,
          channel: videoInfo.channel,
        },
      })
      .eq("id", videoId);

    // Upload original video to storage
    const videoBuffer = fs.readFileSync(videoPath);
    const storagePath = `${userId}/videos/${videoId}.mp4`;
    await supabase.storage
      .from("videos")
      .upload(storagePath, videoBuffer, { contentType: "video/mp4" });

    await supabase
      .from("videos")
      .update({ storage_path: storagePath })
      .eq("id", videoId);

    // Step 2: Extract audio and transcribe
    await updateStatus(videoId, "transcribing");
    console.log(`[${videoId}] Extracting audio...`);

    const audioPath = path.join(workDir, "audio.mp3");
    await extractAudio(videoPath, audioPath);

    console.log(`[${videoId}] Transcribing...`);
    const { text, segments } = await transcribeAudio(audioPath);

    // Save transcript
    await supabase.from("transcripts").insert({
      video_id: videoId,
      full_text: text,
      segments,
      language: "en",
    });

    // Step 3: Detect highlights with AI
    await updateStatus(videoId, "analyzing");
    console.log(`[${videoId}] Analyzing for highlights...`);

    const highlights = await detectHighlights(
      text,
      segments,
      videoInfo.duration
    );
    console.log(`[${videoId}] Found ${highlights.length} highlights`);

    // Step 4: Generate clips
    await updateStatus(videoId, "generating");
    console.log(`[${videoId}] Generating clips...`);

    for (const highlight of highlights) {
      const clipId = uuid();
      const clipPath = path.join(workDir, `clip_${clipId}.mp4`);

      // Get segments for this clip's timerange
      const clipSegments = segments.filter(
        (s) => s.start >= highlight.start_time && s.end <= highlight.end_time
      );

      // Generate clip with captions
      await generateClip(
        videoPath,
        clipPath,
        highlight.start_time,
        highlight.end_time,
        clipSegments
      );

      // Upload clip
      const clipBuffer = fs.readFileSync(clipPath);
      const clipStoragePath = `${userId}/clips/${clipId}.mp4`;
      await supabase.storage
        .from("videos")
        .upload(clipStoragePath, clipBuffer, { contentType: "video/mp4" });

      // Create clip record
      await supabase.from("clips").insert({
        id: clipId,
        video_id: videoId,
        user_id: userId,
        title: highlight.title,
        start_time: highlight.start_time,
        end_time: highlight.end_time,
        transcript: highlight.transcript,
        viral_score: highlight.viral_score,
        highlights: [
          { type: "hook", description: highlight.hook },
          { type: "reason", description: highlight.reason },
        ],
        storage_path: clipStoragePath,
        status: "completed",
      });

      console.log(`[${videoId}] Created clip: ${highlight.title}`);
    }

    // Done!
    await updateStatus(videoId, "completed");
    console.log(`[${videoId}] Processing complete!`);
  } catch (error) {
    console.error(`[${videoId}] Error:`, error);
    await updateStatus(
      videoId,
      "failed",
      error instanceof Error ? error.message : "Unknown error"
    );
  } finally {
    // Cleanup temp files
    try {
      fs.rmSync(workDir, { recursive: true, force: true });
    } catch {}
  }
}
