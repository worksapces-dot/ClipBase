"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SparklesIcon } from "./icons";

interface VideoInputProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function VideoInput({ onSubmit, isLoading, disabled }: VideoInputProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = () => {
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  const isValidUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/.test(url);

  return (
    <div className="glass-card rounded-2xl p-2 glow-border">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
          <svg className="w-5 h-5 text-red-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <input 
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && isValidUrl && handleSubmit()}
            placeholder="Paste YouTube link..."
            className="flex-1 bg-transparent text-white placeholder:text-muted-foreground outline-none text-base"
            disabled={isLoading || disabled}
          />
        </div>
        <Button 
          size="lg" 
          className="bg-white text-black hover:bg-white/90 text-base px-6 h-12 gap-2 shrink-0 disabled:opacity-50"
          onClick={handleSubmit}
          disabled={!isValidUrl || isLoading || disabled}
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <SparklesIcon className="w-4 h-4" />
              Generate Clips
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
