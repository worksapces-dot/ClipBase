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
exports.getVideoInfo = getVideoInfo;
exports.downloadVideo = downloadVideo;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs"));
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// Extract video ID from YouTube URL
function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match)
            return match[1];
    }
    return null;
}
// Use YouTube oEmbed API for basic info (no auth needed)
async function getVideoInfo(url) {
    const videoId = extractVideoId(url);
    if (!videoId)
        throw new Error("Invalid YouTube URL");
    try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const response = await fetch(oembedUrl);
        const oembedData = await response.json();
        return {
            id: videoId,
            title: oembedData.title || `Video ${videoId}`,
            duration: 300,
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            channel: oembedData.author_name || "Unknown",
        };
    }
    catch {
        return {
            id: videoId,
            title: `Video ${videoId}`,
            duration: 300,
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            channel: "Unknown",
        };
    }
}
// Download video - try multiple methods
async function downloadVideo(url, outputPath) {
    const videoId = extractVideoId(url);
    if (!videoId)
        throw new Error("Invalid YouTube URL");
    // Method 1: Try yt-dlp with cookies workaround
    try {
        console.log("Trying yt-dlp with web client...");
        const command = `yt-dlp --extractor-args "youtube:player_client=web" -f "best[height<=720][ext=mp4]/best[ext=mp4]/best" --no-check-certificates -o "${outputPath}" "${url}"`;
        await execAsync(command, { timeout: 5 * 60 * 1000 });
        console.log("yt-dlp download complete");
        return;
    }
    catch (err) {
        console.log("yt-dlp failed, trying alternative...");
    }
    // Method 2: Use y2mate API (public)
    try {
        console.log("Trying y2mate API...");
        await downloadViaY2mate(videoId, outputPath);
        return;
    }
    catch (err) {
        console.log("y2mate failed:", err);
    }
    // Method 3: Use savetube API
    try {
        console.log("Trying savetube API...");
        await downloadViaSavetube(url, outputPath);
        return;
    }
    catch (err) {
        console.log("savetube failed:", err);
    }
    throw new Error("All download methods failed. YouTube may be blocking this video.");
}
// Y2mate download method
async function downloadViaY2mate(videoId, outputPath) {
    // Step 1: Analyze video
    const analyzeRes = await fetch("https://www.y2mate.com/mates/analyzeV2/ajax", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `k_query=https://www.youtube.com/watch?v=${videoId}&k_page=home&hl=en&q_auto=1`,
    });
    const analyzeData = await analyzeRes.json();
    if (analyzeData.status !== "ok")
        throw new Error("Y2mate analyze failed");
    // Find 720p or best available
    const formats = analyzeData.links?.mp4 || {};
    const format = formats["22"] || formats["18"] || Object.values(formats)[0];
    if (!format?.k)
        throw new Error("No format found");
    // Step 2: Convert
    const convertRes = await fetch("https://www.y2mate.com/mates/convertV2/index", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `vid=${analyzeData.vid}&k=${format.k}`,
    });
    const convertData = await convertRes.json();
    if (convertData.status !== "ok" || !convertData.dlink)
        throw new Error("Y2mate convert failed");
    await downloadFile(convertData.dlink, outputPath);
}
// Savetube download method
async function downloadViaSavetube(url, outputPath) {
    const response = await fetch(`https://api.savetube.me/info?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    if (!data.status || !data.data?.video_formats?.length) {
        throw new Error("Savetube failed");
    }
    // Get 720p or first available
    const format = data.data.video_formats.find(f => f.quality === "720p") || data.data.video_formats[0];
    if (!format?.url)
        throw new Error("No download URL");
    await downloadFile(format.url, outputPath);
}
// Helper to download file
function downloadFile(url, outputPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(outputPath);
        const protocol = url.startsWith("https") ? https : http;
        const makeRequest = (requestUrl) => {
            const request = protocol.get(requestUrl, (response) => {
                if (response.statusCode === 301 || response.statusCode === 302) {
                    const redirectUrl = response.headers.location;
                    if (redirectUrl) {
                        file.close();
                        try {
                            fs.unlinkSync(outputPath);
                        }
                        catch { }
                        downloadFile(redirectUrl, outputPath).then(resolve).catch(reject);
                        return;
                    }
                }
                if (response.statusCode !== 200) {
                    reject(new Error(`Download failed: ${response.statusCode}`));
                    return;
                }
                response.pipe(file);
                file.on("finish", () => {
                    file.close();
                    resolve();
                });
            });
            request.on("error", reject);
        };
        file.on("error", (err) => {
            try {
                fs.unlinkSync(outputPath);
            }
            catch { }
            reject(err);
        });
        makeRequest(url);
    });
}
