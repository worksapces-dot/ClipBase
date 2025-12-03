import ffmpeg from "fluent-ffmpeg";
import * as path from "path";
import * as fs from "fs";

export interface ClipOptions {
  inputPath: string;
  outputPath: string;
  startTime: number;
  endTime: number;
  addCaptions?: boolean;
  captionText?: string;
}

// Generate a clip from video
export async function generateClip(options: ClipOptions): Promise<void> {
  const { inputPath, outputPath, startTime, endTime } = options;
  const duration = endTime - startTime;

  console.log(`Generating clip: ${startTime}s - ${endTime}s (${duration}s)`);

  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      // Crop to 9:16 (vertical) - center crop
      .videoFilters([
        "scale=1080:1920:force_original_aspect_ratio=increase",
        "crop=1080:1920",
      ])
      .outputOptions([
        "-c:v libx264",
        "-preset fast",
        "-crf 23",
        "-c:a aac",
        "-b:a 128k",
      ])
      .output(outputPath);

    command
      .on("start", (cmd) => console.log("FFmpeg:", cmd))
      .on("progress", (p) => console.log(`Progress: ${Math.round(p.percent || 0)}%`))
      .on("end", () => {
        console.log("Clip generated successfully");
        resolve();
      })
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
        reject(err);
      })
      .run();
  });
}

// Generate thumbnail from video
export async function generateThumbnail(
  videoPath: string,
  outputPath: string,
  timestamp: number = 1
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: [timestamp],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: "1080x1920",
      })
      .on("end", () => resolve())
      .on("error", reject);
  });
}
