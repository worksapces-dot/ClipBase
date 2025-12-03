import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface VideoInfo {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  channel: string;
}

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  const { stdout } = await execAsync(
    `yt-dlp --dump-json --no-download "${url}"`,
    { maxBuffer: 10 * 1024 * 1024 }
  );

  const info = JSON.parse(stdout);

  return {
    id: info.id,
    title: info.title,
    duration: info.duration,
    thumbnail: info.thumbnail,
    channel: info.channel || info.uploader,
  };
}

export async function downloadVideo(
  url: string,
  outputPath: string
): Promise<void> {
  // Download best quality up to 1080p, merge to mp4
  const command = `yt-dlp -f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best" --merge-output-format mp4 -o "${outputPath}" "${url}"`;

  await execAsync(command, {
    maxBuffer: 50 * 1024 * 1024,
    timeout: 10 * 60 * 1000, // 10 min timeout
  });
}
