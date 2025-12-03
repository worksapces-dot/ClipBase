"use client";

import { Clip } from "@/lib/database.types";
import { cn } from "@/lib/utils";

interface ClipCardProps {
  clip: Clip;
  onPlay?: () => void;
}

export function ClipCard({ clip, onPlay }: ClipCardProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all">
      {/* Thumbnail */}
      <div 
        className="relative aspect-[9/16] bg-neutral-900 cursor-pointer"
        onClick={onPlay}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <svg className="w-6 h-6 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
        
        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs font-medium">
          {formatDuration(clip.duration_seconds)}
        </div>

        {/* Viral score */}
        {clip.viral_score && (
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
            "{clip.transcript.slice(0, 100)}..."
          </p>
        )}

        <div className="flex items-center gap-2">
          <button className="flex-1 py-2 px-3 bg-white text-black text-xs font-semibold rounded-lg hover:bg-white/90 transition-colors">
            Download
          </button>
          <button className="py-2 px-3 bg-white/10 text-xs font-semibold rounded-lg hover:bg-white/20 transition-colors">
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
