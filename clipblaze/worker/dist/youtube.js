"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVideoInfo = getVideoInfo;
exports.downloadVideo = downloadVideo;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function getVideoInfo(url) {
    const { stdout } = await execAsync(`yt-dlp --dump-json --no-download "${url}"`, { maxBuffer: 10 * 1024 * 1024 });
    const info = JSON.parse(stdout);
    return {
        id: info.id,
        title: info.title,
        duration: info.duration,
        thumbnail: info.thumbnail,
        channel: info.channel || info.uploader,
    };
}
async function downloadVideo(url, outputPath) {
    // Download best quality up to 1080p, merge to mp4
    const command = `yt-dlp -f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best" --merge-output-format mp4 -o "${outputPath}" "${url}"`;
    await execAsync(command, {
        maxBuffer: 50 * 1024 * 1024,
        timeout: 10 * 60 * 1000, // 10 min timeout
    });
}
