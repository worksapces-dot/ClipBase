import { getPendingVideos, updateVideoStatus, Video } from "./supabase";
import { downloadVideo } from "./youtube";
import * as fs from "fs";
import * as path from "path";

const POLL_INTERVAL = 5000; // 5 seconds
const TEMP_DIR = "./temp";

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

async function processVideo(video: Video): Promise<void> {
  console.log(`\nProcessing video ${video.id}`);
  console.log(`URL: ${video.source_url}`);

  if (!video.source_url) {
    await updateVideoStatus(video.id, "failed", { error_message: "No source URL" });
    return;
  }

  const videoPath = path.join(TEMP_DIR, `${video.id}.mp4`);

  try {
    // Step 1: Downloading
    await updateVideoStatus(video.id, "downloading");
    await downloadVideo(video.source_url, videoPath);
    console.log("Download complete");

    // Step 2: Transcribing (TODO: implement with Whisper/AssemblyAI)
    await updateVideoStatus(video.id, "transcribing");
    console.log("Transcribing... (placeholder)");

    // Step 3: Analyzing (TODO: implement AI highlight detection)
    await updateVideoStatus(video.id, "analyzing");
    console.log("Analyzing for highlights... (placeholder)");

    // Step 4: Generating clips (TODO: implement FFmpeg processing)
    await updateVideoStatus(video.id, "generating");
    console.log("Generating clips... (placeholder)");

    // Mark as completed
    await updateVideoStatus(video.id, "completed");
    console.log(`Video ${video.id} completed`);

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Video ${video.id} failed:`, message);
    await updateVideoStatus(video.id, "failed", { error_message: message });
  } finally {
    // Cleanup temp file
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }
  }
}

async function pollForVideos(): Promise<void> {
  console.log("Checking for pending videos...");

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
  console.log("=================================");
  console.log("  ClipBlaze Worker Started");
  console.log("=================================");
  console.log(`Poll interval: ${POLL_INTERVAL}ms\n`);

  // Initial poll
  await pollForVideos();

  // Continue polling
  setInterval(pollForVideos, POLL_INTERVAL);
}

main().catch(console.error);
