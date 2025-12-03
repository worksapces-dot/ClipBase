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
const transcribe_1 = require("./transcribe");
const highlights_1 = require("./highlights");
const ffmpeg_1 = require("./ffmpeg");
const storage_1 = require("./storage");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const POLL_INTERVAL = 5000;
const TEMP_DIR = "./temp";
// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}
async function processVideo(video) {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`Processing video: ${video.id}`);
    console.log(`URL: ${video.source_url}`);
    console.log("=".repeat(50));
    if (!video.source_url) {
        await (0, supabase_1.updateVideoStatus)(video.id, "failed", { error_message: "No source URL" });
        return;
    }
    const videoPath = path.join(TEMP_DIR, `${video.id}.mp4`);
    const clipPaths = [];
    try {
        // Step 1: Download
        await (0, supabase_1.updateVideoStatus)(video.id, "downloading");
        await (0, youtube_1.downloadVideo)(video.source_url, videoPath);
        // Step 2: Transcribe
        await (0, supabase_1.updateVideoStatus)(video.id, "transcribing");
        const transcript = await (0, transcribe_1.transcribeVideo)(videoPath);
        // Save transcript to database
        await supabase_1.supabase.from("transcripts").insert({
            video_id: video.id,
            full_text: transcript.fullText,
            segments: transcript.segments,
            language: "en",
        });
        // Update video duration
        await (0, supabase_1.updateVideoStatus)(video.id, "analyzing", {
            duration_seconds: Math.round(transcript.duration),
        });
        // Step 3: Find highlights
        const highlights = await (0, highlights_1.findHighlights)(transcript.segments, transcript.duration);
        console.log(`Found ${highlights.length} potential clips`);
        if (highlights.length === 0) {
            throw new Error("No viral moments found in video");
        }
        // Step 4: Generate clips
        await (0, supabase_1.updateVideoStatus)(video.id, "generating");
        for (let i = 0; i < highlights.length; i++) {
            const clip = highlights[i];
            console.log(`\nGenerating clip ${i + 1}/${highlights.length}: ${clip.title}`);
            const clipId = `${video.id}_clip_${i}`;
            const clipPath = path.join(TEMP_DIR, `${clipId}.mp4`);
            const thumbPath = path.join(TEMP_DIR, `${clipId}.jpg`);
            clipPaths.push(clipPath, thumbPath);
            try {
                // Generate clip video
                await (0, ffmpeg_1.generateClip)({
                    inputPath: videoPath,
                    outputPath: clipPath,
                    startTime: clip.startTime,
                    endTime: clip.endTime,
                });
                // Generate thumbnail
                await (0, ffmpeg_1.generateThumbnail)(clipPath, thumbPath);
                // Upload to storage
                const videoUrl = await (0, storage_1.uploadFile)(clipPath, `${video.user_id}/${clipId}.mp4`);
                const thumbUrl = await (0, storage_1.uploadFile)(thumbPath, `${video.user_id}/${clipId}.jpg`);
                // Save clip to database
                await supabase_1.supabase.from("clips").insert({
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
            }
            catch (clipError) {
                console.error(`Failed to generate clip ${i + 1}:`, clipError);
            }
        }
        // Mark video as completed
        await (0, supabase_1.updateVideoStatus)(video.id, "completed");
        console.log(`\nVideo ${video.id} completed!`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`Video ${video.id} failed:`, message);
        await (0, supabase_1.updateVideoStatus)(video.id, "failed", { error_message: message });
    }
    finally {
        // Cleanup temp files
        [videoPath, ...clipPaths].forEach((p) => {
            if (fs.existsSync(p))
                fs.unlinkSync(p);
        });
    }
}
async function pollForVideos() {
    console.log("\nChecking for pending videos...");
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
