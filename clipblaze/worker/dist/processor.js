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
exports.processVideo = processVideo;
const supabase_js_1 = require("@supabase/supabase-js");
const youtube_1 = require("./youtube");
const ffmpeg_1 = require("./ffmpeg");
const ai_1 = require("./ai");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const TEMP_DIR = "/tmp/clipblaze";
async function updateStatus(videoId, status, error) {
    await supabase
        .from("videos")
        .update({ status, error_message: error || null })
        .eq("id", videoId);
}
async function processVideo(videoId, youtubeUrl, userId) {
    const workDir = path.join(TEMP_DIR, videoId);
    try {
        // Create temp directory
        fs.mkdirSync(workDir, { recursive: true });
        // Step 1: Get video info and download
        await updateStatus(videoId, "downloading");
        console.log(`[${videoId}] Downloading video...`);
        const videoInfo = await (0, youtube_1.getVideoInfo)(youtubeUrl);
        const videoPath = path.join(workDir, "video.mp4");
        await (0, youtube_1.downloadVideo)(youtubeUrl, videoPath);
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
        await (0, ffmpeg_1.extractAudio)(videoPath, audioPath);
        console.log(`[${videoId}] Transcribing...`);
        const { text, segments } = await (0, ai_1.transcribeAudio)(audioPath);
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
        const highlights = await (0, ai_1.detectHighlights)(text, segments, videoInfo.duration);
        console.log(`[${videoId}] Found ${highlights.length} highlights`);
        // Step 4: Generate clips
        await updateStatus(videoId, "generating");
        console.log(`[${videoId}] Generating clips...`);
        for (const highlight of highlights) {
            const clipId = (0, uuid_1.v4)();
            const clipPath = path.join(workDir, `clip_${clipId}.mp4`);
            // Get segments for this clip's timerange
            const clipSegments = segments.filter((s) => s.start >= highlight.start_time && s.end <= highlight.end_time);
            // Generate clip with captions
            await (0, ffmpeg_1.generateClip)(videoPath, clipPath, highlight.start_time, highlight.end_time, clipSegments);
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
    }
    catch (error) {
        console.error(`[${videoId}] Error:`, error);
        await updateStatus(videoId, "failed", error instanceof Error ? error.message : "Unknown error");
    }
    finally {
        // Cleanup temp files
        try {
            fs.rmSync(workDir, { recursive: true, force: true });
        }
        catch { }
    }
}
