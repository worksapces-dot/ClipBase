import * as fs from "fs";
import * as https from "https";
import * as http from "http";

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

  // Use oEmbed for title
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  
  const oembedData = await fetchJson(oembedUrl);
  
  return {
    id: videoId,
    title: oembedData.title || `Video ${videoId}`,
    duration: 300, // Default 5 min, will be updated after download
    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    channel: oembedData.author_name || "Unknown",
  };
}

// Download video using Cobalt API (free, no auth)
export async function downloadVideo(
  url: string,
  outputPath: string
): Promise<void> {
  console.log("Downloading via Cobalt API...");
  
  // Try Cobalt API
  const cobaltResponse = await fetch("https://api.cobalt.tools/", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: url,
      downloadMode: "auto",
      filenameStyle: "basic",
    }),
  });

  if (!cobaltResponse.ok) {
    const error = await cobaltResponse.text();
    console.error("Cobalt API error:", error);
    throw new Error(`Cobalt API failed: ${cobaltResponse.status}`);
  }

  const cobaltData = await cobaltResponse.json() as { status?: string; error?: { code?: string }; url?: string; audio?: string };
  console.log("Cobalt response:", cobaltData);

  if (cobaltData.status === "error") {
    throw new Error(cobaltData.error?.code || "Cobalt download failed");
  }

  // Get the download URL
  const downloadUrl = cobaltData.url || cobaltData.audio;
  if (!downloadUrl) {
    throw new Error("No download URL from Cobalt");
  }

  // Download the file
  await downloadFile(downloadUrl, outputPath);
  console.log("Download complete:", outputPath);
}

// Helper to fetch JSON
async function fetchJson(url: string): Promise<any> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// Helper to download file
function downloadFile(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    const protocol = url.startsWith("https") ? https : http;
    
    const request = protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          fs.unlinkSync(outputPath);
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
    
    request.on("error", (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
    
    file.on("error", (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}
