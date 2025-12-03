import * as fs from "fs";
import * as https from "https";
import * as http from "http";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// Extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Download video using RapidAPI
export async function downloadVideo(
  url: string,
  outputPath: string
): Promise<void> {
  if (!RAPIDAPI_KEY) {
    throw new Error("RAPIDAPI_KEY not configured");
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  console.log(`Fetching download link for video: ${videoId}`);

  const response = await fetch(
    `https://ytstream-download-youtube-videos.p.rapidapi.com/dl?id=${videoId}`,
    {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "ytstream-download-youtube-videos.p.rapidapi.com",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`RapidAPI error: ${response.status}`);
  }

  const data = (await response.json()) as {
    status?: string;
    formats?: Array<{
      url?: string;
      qualityLabel?: string;
      mimeType?: string;
    }>;
  };


  if (!data.formats?.length) {
    throw new Error("No download formats available");
  }

  // Find best MP4 format (prefer 720p or 480p)
  const mp4Format = data.formats.find(
    (f) =>
      f.mimeType?.includes("video/mp4") &&
      (f.qualityLabel === "720p" || f.qualityLabel === "480p")
  ) || data.formats.find((f) => f.mimeType?.includes("video/mp4")) || data.formats[0];

  if (!mp4Format?.url) {
    throw new Error("No download URL found");
  }

  console.log(`Downloading ${mp4Format.qualityLabel || "video"}...`);
  await downloadFile(mp4Format.url, outputPath);
  console.log("Download complete");
}

// Helper to download file with redirect support
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
          fs.unlink(outputPath, () => {});
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
