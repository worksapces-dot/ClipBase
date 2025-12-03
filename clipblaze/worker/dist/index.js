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
async function processVideo(video) {
    console.log(`\nProcessing video ${video.id}`);
    console.log(`URL: ${video.source_url}`);
    if (!video.source_url) {
        await (0, supabase_1.updateVideoStatus)(video.id, "failed", { error_message: "No source URL" });
        return;
    }
    const videoPath = path.join(TEMP_DIR, `${video.id}.mp4`);
    try {
        // Step 1: Downloading
        await (0, supabase_1.updateVideoStatus)(video.id, "downloading");
        await (0, youtube_1.downloadVideo)(video.source_url, videoPath);
        console.log("Download complete");
        // Step 2: Transcribing (TODO: implement with Whisper/AssemblyAI)
        await (0, supabase_1.updateVideoStatus)(video.id, "transcribing");
        console.log("Transcribing... (placeholder)");
        // Step 3: Analyzing (TODO: implement AI highlight detection)
        await (0, supabase_1.updateVideoStatus)(video.id, "analyzing");
        console.log("Analyzing for highlights... (placeholder)");
        // Step 4: Generating clips (TODO: implement FFmpeg processing)
        await (0, supabase_1.updateVideoStatus)(video.id, "generating");
        console.log("Generating clips... (placeholder)");
        // Mark as completed
        await (0, supabase_1.updateVideoStatus)(video.id, "completed");
        console.log(`Video ${video.id} completed`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`Video ${video.id} failed:`, message);
        await (0, supabase_1.updateVideoStatus)(video.id, "failed", { error_message: message });
    }
    finally {
        // Cleanup temp file
        if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
        }
    }
}
async function pollForVideos() {
    console.log("Checking for pending videos...");
    const videos = await (0, supabase_1.getPendingVideos)();
    if (videos.length === 0) {
        console.log("No pending videos");
        return;
    }
    console.log(`Found ${videos.length} pending video(s)`);
    for (const video of videos) {
        await processVideo(video);
    }
}
async function main() {
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
