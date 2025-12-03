import { getPendingVideos, updateVideoStatus, Video, supabase } from "./supabase";
import { downloadVideo } from "./youtube";
import { transcribeVideo } from "./transcribe";
import { findHighlights, ClipSuggestion } from "./highlights";
import { generateClip, generateThumbnail } from "./ffmpeg";
import { uploadFile } from "./storage";
import * as fs from "fs";
import * as path from "path";

const POLL_INTERVAL = 5000;
const TEMP_DIR = "./temp";

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

async function processVideo(video: Video): Promise<void> {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`Processing video: ${video.id}`);
  console.log(`URL: ${video.source_url}`);
  console.log("=".repeat(50));

  if (!video.source_url) {
    await updateVideoStatus(video.id, "failed", { error_message: "No source URL" });
    return;
  }

  const videoPath = path.join(TEMP_DIR, `${video.id}.mp4`);
  const clipPaths: string[] = [];

  try {
    // Step 1: Download
    await updateVideoStatus(video.id, "downloading");
    await downloadVideo(video.source_url, videoPath);

    // Step 2: Transcribe
    await updateVideoStatus(video.id, "transcribing");
    const transcript = await transcribeVideo(videoPath);

    // Save transcript to database
    await supabase.from("transcripts").insert({
      video_id: video.id,
      full_text: transcript.fullText,
      segments: transcript.segments,
      language: "en",
    });

    // Update video duration
    await updateVideoStatus(video.id, "analyzing", {
      duration_seconds: Math.round(transcript.duration),
    });

    // Step 3: Find highlights
    const highlights = await findHighlights(transcript.segments, transcript.duration);
    console.log(`Found ${highlights.length} potential clips`);

    if (highlights.length === 0) {
      throw new Error("No viral moments found in video");
    }


    // Step 4: Generate clips
    await updateVideoStatus(video.id, "generating");

    for (let i = 0; i < highlights.length; i++) {
      const clip = highlights[i];
      console.log(`\nGenerating clip ${i + 1}/${highlights.length}: ${clip.title}`);

      const clipId = `${video.id}_clip_${i}`;
      const clipPath = path.join(TEMP_DIR, `${clipId}.mp4`);
      const thumbPath = path.join(TEMP_DIR, `${clipId}.jpg`);
      clipPaths.push(clipPath, thumbPath);

      try {
        // Generate clip video
        await generateClip({
          inputPath: videoPath,
          outputPath: clipPath,
          startTime: clip.startTime,
          endTime: clip.endTime,
        });

        // Generate thumbnail
        await generateThumbnail(clipPath, thumbPath);

        // Upload to storage
        const videoUrl = await uploadFile(clipPath, `${video.user_id}/${clipId}.mp4`);
        const thumbUrl = await uploadFile(thumbPath, `${video.user_id}/${clipId}.jpg`);

        // Save clip to database
        await supabase.from("clips").insert({
          video_id: video.id,
          user_id: video.user_id,
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

        console.log(`Clip saved: ${clip.title}`);
      } catch (clipError) {
        console.error(`Failed to generate clip ${i + 1}:`, clipError);
      }
    }

    // Mark video as completed
    await updateVideoStatus(video.id, "completed");
    console.log(`\nVideo ${video.id} completed!`);

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Video ${video.id} failed:`, message);
    await updateVideoStatus(video.id, "failed", { error_message: message });
  } finally {
    // Cleanup temp files
    [videoPath, ...clipPaths].forEach((p) => {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
  }
}


async function pollForVideos(): Promise<void> {
  console.log("\nChecking for pending videos...");

  const videos = await getPendingVideos();

  if (videos.length === 0) {
    console.log("No pending videos");
    return;
  }

  console.log(`Found ${videos.length} pending video(s)`);

  for (const video of videos) {
    await processVideo(video);
  }
}

async function main(): Promise<void> {
  console.log("=".repeat(50));
  console.log("  ClipBlaze Worker Started");
  console.log("=".repeat(50));
  console.log(`Poll interval: ${POLL_INTERVAL}ms`);

  // Validate environment
  const required = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "OPENAI_API_KEY", "RAPIDAPI_KEY"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`Missing env vars: ${missing.join(", ")}`);
    process.exit(1);
  }

  // Initial poll
  await pollForVideos();

  // Continue polling
  setInterval(pollForVideos, POLL_INTERVAL);
}

main().catch(console.error);
