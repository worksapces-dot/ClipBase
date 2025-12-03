"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("./supabase");
const youtube_1 = require("./youtube");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const POLL_INTERVAL = 5000; // 5 seconds
const TEMP_DIR = "./temp";
// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}
async function processJob(job) {
    console.log(`\nProcessing job ${job.id}`);
    console.log(`YouTube URL: ${job.youtube_url}`);
    const videoPath = path.join(TEMP_DIR, `${job.id}.mp4`);
    try {
        // Update status to processing
        await (0, supabase_1.updateJobStatus)(job.id, "processing");
        // Download the video
        await (0, youtube_1.downloadVideo)(job.youtube_url, videoPath);
        // TODO: Add video processing here (AI highlights, captions, etc.)
        // For now, mark as completed
        await (0, supabase_1.updateJobStatus)(job.id, "completed", {
            output_url: `processed/${job.id}.mp4`,
        });
        console.log(`Job ${job.id} completed`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`Job ${job.id} failed:`, message);
        await (0, supabase_1.updateJobStatus)(job.id, "failed", { error_message: message });
    }
    finally {
        // Cleanup temp file
        if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
        }
    }
}
async function pollForJobs() {
    console.log("Checking for pending jobs...");
    const jobs = await (0, supabase_1.getPendingJobs)();
    if (jobs.length === 0) {
        console.log("No pending jobs");
        return;
    }
    console.log(`Found ${jobs.length} pending job(s)`);
    for (const job of jobs) {
        await processJob(job);
    }
}
async function main() {
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
