import { getPendingJobs, updateJobStatus, Job } from "./supabase";
import { downloadVideo } from "./youtube";
import * as fs from "fs";
import * as path from "path";

const POLL_INTERVAL = 5000; // 5 seconds
const TEMP_DIR = "./temp";

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

async function processJob(job: Job): Promise<void> {
  console.log(`\nProcessing job ${job.id}`);
  console.log(`YouTube URL: ${job.youtube_url}`);

  const videoPath = path.join(TEMP_DIR, `${job.id}.mp4`);

  try {
    // Update status to processing
    await updateJobStatus(job.id, "processing");

    // Download the video
    await downloadVideo(job.youtube_url, videoPath);

    // TODO: Add video processing here (AI highlights, captions, etc.)

    // For now, mark as completed
    await updateJobStatus(job.id, "completed", {
      output_url: `processed/${job.id}.mp4`,
    });

    console.log(`Job ${job.id} completed`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Job ${job.id} failed:`, message);
    await updateJobStatus(job.id, "failed", { error_message: message });
  } finally {
    // Cleanup temp file
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }
  }
}


async function pollForJobs(): Promise<void> {
  console.log("Checking for pending jobs...");

  const jobs = await getPendingJobs();

  if (jobs.length === 0) {
    console.log("No pending jobs");
    return;
  }

  console.log(`Found ${jobs.length} pending job(s)`);

  for (const job of jobs) {
    await processJob(job);
  }
}

async function main(): Promise<void> {
  console.log("=================================");
  console.log("  ClipBlaze Worker Started");
  console.log("=================================");
  console.log(`Poll interval: ${POLL_INTERVAL}ms`);

  // Initial poll
  await pollForJobs();

  // Continue polling
  setInterval(pollForJobs, POLL_INTERVAL);
}

main().catch(console.error);
