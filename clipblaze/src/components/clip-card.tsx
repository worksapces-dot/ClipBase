"use client";

import { useState, useRef, useEffect } from "react";
import { Clip } from "@/lib/database.types";
import { cn } from "@/lib/utils";

interface ClipCardProps {
  clip: Clip;
}

export function ClipCard({ clip }: ClipCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoadingThumb, setIsLoadingThumb] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const videoUrl = clip.storage_path;

  // Generate thumbnail from video
  useEffect(() => {
    if (!videoUrl || clip.thumbnail_path) {
      setIsLoadingThumb(false);
      return;
    }

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.src = videoUrl;
    video.muted = true;
    video.preload = "metadata";

    video.onloadeddata = () => {
      // Seek to 1 second or 10% of video
      video.currentTime = Math.min(1, video.duration * 0.1);
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setThumbnailUrl(canvas.toDataURL("image/jpeg", 0.8));
      }
      setIsLoadingThumb(false);
    };

    video.onerror = () => {
      setIsLoadingThumb(false);
    };

    return () => {
      video.src = "";
    };
  }, [videoUrl, clip.thumbnail_path]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDownload = async () => {
    if (!videoUrl) return;

    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = `${clip.title || "clip"}.mp4`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!videoUrl) return;

    if (navigator.share) {
      await navigator.share({
        title: clip.title || "Check out this clip!",
        url: videoUrl,
      });
    } else {
      await navigator.clipboard.writeText(videoUrl);
      alert("Link copied to clipboard!");
    }
  };

  const displayThumbnail = clip.thumbnail_path || thumbnailUrl;

  return (
    <div className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all">
      {/* Video/Thumbnail */}
      <div
        className="relative aspect-[9/16] bg-neutral-900 cursor-pointer overflow-hidden"
        onClick={() => setIsPlaying(!isPlaying)}
      >
        {isPlaying && videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            autoPlay
            controls
            playsInline
            onEnded={() => setIsPlaying(false)}
          />
        ) : (
          <>
            {/* Thumbnail or Video Preview */}
            {displayThumbnail ? (
              <img
                src={displayThumbnail}
                alt={clip.title || "Clip thumbnail"}
                className="w-full h-full object-cover"
              />
            ) : isLoadingThumb ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            ) : (
              /* Fallback: use video element as preview */
              <video
                src={videoUrl || ""}
                className="w-full h-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
            )}

            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all">
                <svg
                  className="w-6 h-6 text-white ml-1"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>

            {/* Duration badge */}
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-xs font-medium">
              {formatDuration(clip.duration_seconds)}
            </div>

            {/* Viral score */}
            {clip.viral_score && (
              <div
                className={cn(
                  "absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold flex items-center gap-1",
                  clip.viral_score >= 80
                    ? "bg-green-500"
                    : clip.viral_score >= 60
                      ? "bg-yellow-500 text-black"
                      : "bg-white/20"
                )}
              >
                🔥 {clip.viral_score}
              </div>
            )}

            {/* Upload status badges */}
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              {clip.youtube_upload_status === "uploaded" && (
                <div className="px-2 py-1 bg-red-600 rounded text-xs font-medium flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                  </svg>
                </div>
              )}
              {clip.instagram_upload_status === "uploaded" && (
                <div className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded text-xs font-medium flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
              )}
            </div>
          </>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-sm line-clamp-2 mb-2">
          {clip.title || "Untitled Clip"}
        </h3>

        {clip.transcript && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            &ldquo;{clip.transcript.slice(0, 100)}...&rdquo;
          </p>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={!videoUrl}
            className="flex-1 py-2 px-3 bg-white text-black text-xs font-semibold rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            Download
          </button>
          <button
            onClick={handleShare}
            disabled={!videoUrl}
            className="py-2 px-3 bg-white/10 text-xs font-semibold rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
