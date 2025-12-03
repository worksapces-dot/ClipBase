"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon, PlayIcon, SparklesIcon } from "./icons";

export function Hero() {
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
        <Badge variant="outline" className="mb-6 px-4 py-2 border-white/10 bg-white/5">
          <SparklesIcon className="w-4 h-4 mr-2" />
          AI-Powered Video Editing
        </Badge>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
          <span className="gradient-text">Turn long videos</span>
          <br />
          <span className="text-white">into viral shorts</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
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
                  placeholder="Paste YouTube link or drop a video file..."
                  className="flex-1 bg-transparent text-white placeholder:text-muted-foreground outline-none text-base"
                />
              </div>
              <Button size="lg" className="bg-white text-black hover:bg-white/90 text-base px-6 h-12 gap-2 shrink-0">
                <SparklesIcon className="w-4 h-4" />
                Generate Clips
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Or <button className="text-white underline underline-offset-2 hover:no-underline">upload a file</button> • Supports MP4, MOV, WebM up to 60 min
          </p>
        </div>

        {/* Video preview mockup */}
        <div className="relative max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-2 glow-border">
            <div className="relative aspect-video rounded-xl bg-gradient-to-br from-white/5 to-transparent overflow-hidden">
              {/* Fake video player UI */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-colors">
                  <PlayIcon className="w-8 h-8 text-white ml-1" />
                </div>
              </div>
              
              {/* Fake timeline */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-white/50 rounded-full" />
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-xs">
                🔥 Viral Score: 94
              </div>
              
              <div className="absolute bottom-16 left-4 right-4 text-center">
                <div className="inline-block px-4 py-2 rounded-lg bg-black/60 backdrop-blur-sm">
                  <span className="text-white font-semibold">This is how you </span>
                  <span className="text-yellow-400 font-bold">go viral</span>
                  <span className="text-white font-semibold"> 🚀</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Floating badges */}
          <div className="absolute -left-4 top-1/4 animate-float">
            <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <span className="text-sm font-medium">Auto Captions</span>
            </div>
          </div>
          
          <div className="absolute -right-4 top-1/3 animate-float" style={{ animationDelay: '1s' }}>
            <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <span className="text-sm font-medium">Smart Crop</span>
            </div>
          </div>
          
          <div className="absolute -left-8 bottom-1/4 animate-float" style={{ animationDelay: '2s' }}>
            <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span className="text-sm font-medium">2min Export</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
