"use client";

import React, { forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { ZapIcon } from "./icons";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-16 items-center justify-center rounded-full border-2 border-white/20 bg-white/5 p-4 backdrop-blur-sm",
        className
      )}
    >
      {children}
    </div>
  );
});
Circle.displayName = "Circle";

const Icons = {
  user: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  youtube: () => (
    <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  tiktok: () => (
    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  ),
  instagram: () => (
    <svg className="w-5 h-5 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  shorts: () => (
    <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 14.65v-5.3L15 12l-5 2.65zm7.77-4.33-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.24-2.53-5.07-1.56L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.67 2.22 3.25.03.01 1.2.5 1.2.5L6 14.93c-1.83.97-2.53 3.24-1.56 5.07.97 1.83 3.24 2.53 5.07 1.56l8.5-4.5c1.29-.68 2.06-2.04 1.99-3.49-.07-1.42-.94-2.68-2.23-3.25z"/>
    </svg>
  ),
  twitter: () => (
    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
};

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);

  return (
    <section id="how-it-works" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">How it works</h2>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto leading-relaxed">
            Upload your content, let AI do the magic, export to every platform
          </p>
        </div>

        <div
          className="relative flex h-[500px] w-full items-center justify-center overflow-hidden p-10"
          ref={containerRef}
        >
          <div className="flex size-full max-w-2xl flex-row items-stretch justify-between gap-16">
            {/* Left - User */}
            <div className="flex flex-col justify-center">
              <Circle ref={div7Ref}>
                <Icons.user />
              </Circle>
            </div>

            {/* Center - ClipBlaze */}
            <div className="flex flex-col justify-center">
              <Circle ref={div6Ref} className="size-24 bg-white border-white">
                <ZapIcon className="w-12 h-12 text-black" />
              </Circle>
            </div>

            {/* Right - Output platforms */}
            <div className="flex flex-col justify-center gap-4">
              <Circle ref={div1Ref}>
                <Icons.youtube />
              </Circle>
              <Circle ref={div2Ref}>
                <Icons.tiktok />
              </Circle>
              <Circle ref={div3Ref}>
                <Icons.instagram />
              </Circle>
              <Circle ref={div4Ref}>
                <Icons.shorts />
              </Circle>
              <Circle ref={div5Ref}>
                <Icons.twitter />
              </Circle>
            </div>
          </div>

          {/* Beams from outputs to ClipBlaze */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div1Ref}
            toRef={div6Ref}
            duration={3}
            gradientStartColor="#ffffff"
            gradientStopColor="#888888"
            pathColor="rgba(255,255,255,0.3)"
            pathWidth={2}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div2Ref}
            toRef={div6Ref}
            duration={3}
            gradientStartColor="#ffffff"
            gradientStopColor="#888888"
            pathColor="rgba(255,255,255,0.3)"
            pathWidth={2}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div3Ref}
            toRef={div6Ref}
            duration={3}
            gradientStartColor="#ffffff"
            gradientStopColor="#888888"
            pathColor="rgba(255,255,255,0.3)"
            pathWidth={2}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div4Ref}
            toRef={div6Ref}
            duration={3}
            gradientStartColor="#ffffff"
            gradientStopColor="#888888"
            pathColor="rgba(255,255,255,0.3)"
            pathWidth={2}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div5Ref}
            toRef={div6Ref}
            duration={3}
            gradientStartColor="#ffffff"
            gradientStopColor="#888888"
            pathColor="rgba(255,255,255,0.3)"
            pathWidth={2}
          />

          {/* Beam from ClipBlaze to User */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div6Ref}
            toRef={div7Ref}
            duration={3}
            gradientStartColor="#ffffff"
            gradientStopColor="#888888"
            pathColor="rgba(255,255,255,0.3)"
            pathWidth={2}
          />
        </div>

        {/* Steps below */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-mono mb-3">01</div>
            <h3 className="text-lg font-semibold mb-2">Upload Content</h3>
            <p className="text-sm text-muted-foreground">YouTube links, video files, or podcasts</p>
          </div>
          <div className="text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-mono mb-3">02</div>
            <h3 className="text-lg font-semibold mb-2">AI Processing</h3>
            <p className="text-sm text-muted-foreground">Highlights, captions, 9:16 crop</p>
          </div>
          <div className="text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-mono mb-3">03</div>
            <h3 className="text-lg font-semibold mb-2">Export Everywhere</h3>
            <p className="text-sm text-muted-foreground">TikTok, Reels, Shorts, X</p>
          </div>
        </div>
      </div>
    </section>
  );
}
