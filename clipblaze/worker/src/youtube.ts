import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as https from "https";
import * as http from "http";

const execAsync = promisify(exec);

export interface VideoInfo {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  channel: string;
}

// Extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Use YouTube oEmbed API for basic info (no auth needed)
export async function getVideoInfo(url: string): Promise<VideoInfo> {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);
    const oembedData = await response.json() as { title?: string; author_name?: string };
    
    return {
      id: videoId,
      title: oembedData.title || `Video ${videoId}`,
      duration: 300,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      channel: oembedData.author_name || "Unknown",
    };
  } catch {
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
export async function downloadVideo(
  url: string,
  outputPath: string
): Promise<void> {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  // Method 1: Try yt-dlp with cookies workaround
  try {
    console.log("Trying yt-dlp with web client...");
    const command = `yt-dlp --extractor-args "youtube:player_client=web" -f "best[height<=720][ext=mp4]/best[ext=mp4]/best" --no-check-certificates -o "${outputPath}" "${url}"`;
    await execAsync(command, { timeout: 5 * 60 * 1000 });
    console.log("yt-dlp download complete");
    return;
  } catch (err) {
    console.log("yt-dlp failed, trying alternative...");
  }

  // Method 2: Use y2mate API (public)
  try {
    console.log("Trying y2mate API...");
    await downloadViaY2mate(videoId, outputPath);
    return;
  } catch (err) {
    console.log("y2mate failed:", err);
  }

  // Method 3: Use savetube API
  try {
    console.log("Trying savetube API...");
    await downloadViaSavetube(url, outputPath);
    return;
  } catch (err) {
    console.log("savetube failed:", err);
  }

  throw new Error("All download methods failed. YouTube may be blocking this video.");
}

// Y2mate download method
async function downloadViaY2mate(videoId: string, outputPath: string): Promise<void> {
  // Step 1: Analyze video
  const analyzeRes = await fetch("https://www.y2mate.com/mates/analyzeV2/ajax", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `k_query=https://www.youtube.com/watch?v=${videoId}&k_page=home&hl=en&q_auto=1`,
  });
  
  const analyzeData = await analyzeRes.json() as { status?: string; links?: { mp4?: Record<string, { k?: string; size?: string }> }; vid?: string };
  if (analyzeData.status !== "ok") throw new Error("Y2mate analyze failed");

  // Find 720p or best available
  const formats = analyzeData.links?.mp4 || {};
  const format = formats["22"] || formats["18"] || Object.values(formats)[0];
  if (!format?.k) throw new Error("No format found");

  // Step 2: Convert
  const convertRes = await fetch("https://www.y2mate.com/mates/convertV2/index", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `vid=${analyzeData.vid}&k=${format.k}`,
  });

  const convertData = await convertRes.json() as { status?: string; dlink?: string };
  if (convertData.status !== "ok" || !convertData.dlink) throw new Error("Y2mate convert failed");

  await downloadFile(convertData.dlink, outputPath);
}

// Savetube download method
async function downloadViaSavetube(url: string, outputPath: string): Promise<void> {
  const response = await fetch(`https://api.savetube.me/info?url=${encodeURIComponent(url)}`);
  const data = await response.json() as { status?: boolean; data?: { video_formats?: Array<{ url?: string; quality?: string }> } };
  
  if (!data.status || !data.data?.video_formats?.length) {
    throw new Error("Savetube failed");
  }

  // Get 720p or first available
  const format = data.data.video_formats.find(f => f.quality === "720p") || data.data.video_formats[0];
  if (!format?.url) throw new Error("No download URL");

  await downloadFile(format.url, outputPath);
}

// Helper to download file
function downloadFile(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    const protocol = url.startsWith("https") ? https : http;
    
    const makeRequest = (requestUrl: string) => {
      const request = protocol.get(requestUrl, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            file.close();
            try { fs.unlinkSync(outputPath); } catch {}
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
      try { fs.unlinkSync(outputPath); } catch {}
      reject(err);
    });
    
    makeRequest(url);
  });
}
