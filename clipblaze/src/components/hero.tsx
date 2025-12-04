"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { Highlighter } from "@/components/ui/highlighter";
import { SparklesIcon } from "./icons";

export function Hero() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isValidUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/.test(url);

  const handleSubmit = async () => {
    if (!isValidUrl) return;
    
    setIsLoading(true);
    
    // Redirect to dashboard with the URL as a query param
    // The dashboard will handle the actual processing after auth check
    router.push(`/dashboard?url=${encodeURIComponent(url)}`);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />
      
      {/* Animated grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <RainbowButton size="lg" className="mb-8 px-6 py-3 text-base rounded-full">
          <SparklesIcon className="w-5 h-5 mr-2" />
          AI-Powered Video Editing
        </RainbowButton>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
          <span className="gradient-text">Turn long videos</span>
          <br />
          <span className="text-white">into </span>
          <Highlighter action="highlight" color="rgba(255,255,255,0.15)" strokeWidth={2} isView>
            <span className="text-white">viral shorts</span>
          </Highlighter>
        </h1>

        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          ClipBlaze uses AI to find the best moments, add captions, emojis, and effects — 
          then exports ready-to-post clips in seconds.
        </p>

        {/* Video URL Input */}
        <div className="max-w-2xl mx-auto mb-16">
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
                />
              </div>
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-white/90 text-base px-6 h-12 gap-2 shrink-0 disabled:opacity-50"
                onClick={handleSubmit}
                disabled={!isValidUrl || isLoading}
              >
                {isLoading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    Generate Clips
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4 tracking-wide">
            Supports YouTube videos up to 60 minutes
          </p>
        </div>
      </div>
    </section>
  );
}
