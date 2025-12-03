"use client";

import { useState } from "react";
import { Clip } from "@/lib/database.types";
import { cn } from "@/lib/utils";

interface ClipCardProps {
  clip: Clip;
}

export function ClipCard({ clip }: ClipCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDownload = async () => {
    if (!clip.storage_path) return;
    
    const link = document.createElement("a");
    link.href = clip.storage_path;
    link.download = `${clip.title || "clip"}.mp4`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!clip.storage_path) return;
    
    if (navigator.share) {
      await navigator.share({
        title: clip.title || "Check out this clip!",
        url: clip.storage_path,
      });
    } else {
      await navigator.clipboard.writeText(clip.storage_path);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all">
      {/* Video/Thumbnail */}
      <div 
        className="relative aspect-[9/16] bg-neutral-900 cursor-pointer"
        onClick={() => setIsPlaying(!isPlaying)}
      >
        {isPlaying && clip.storage_path ? (
          <video
            src={clip.storage_path}
            className="w-full h-full object-cover"
            autoPlay
            controls
            onEnded={() => setIsPlaying(false)}
          />
        ) : (
          <>
            {clip.thumbnail_path ? (
              <img 
                src={clip.thumbnail_path} 
                alt={clip.title || "Clip thumbnail"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <svg className="w-6 h-6 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            )}
            
            {/* Play overlay */}
            {clip.thumbnail_path && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Duration badge */}
        {!isPlaying && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs font-medium">
            {formatDuration(clip.duration_seconds)}
          </div>
        )}

        {/* Viral score */}
        {clip.viral_score && !isPlaying && (
          <div className={cn(
            "absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold",
            clip.viral_score >= 80 ? "bg-green-500" :
            clip.viral_score >= 60 ? "bg-yellow-500 text-black" :
            "bg-white/20"
          )}>
            🔥 {clip.viral_score}
          </div>
        )}
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
            disabled={!clip.storage_path}
            className="flex-1 py-2 px-3 bg-white text-black text-xs font-semibold rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            Download
          </button>
          <button 
            onClick={handleShare}
            disabled={!clip.storage_path}
            className="py-2 px-3 bg-white/10 text-xs font-semibold rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
