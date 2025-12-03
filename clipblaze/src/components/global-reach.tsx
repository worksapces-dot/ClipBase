"use client";

import { Globe } from "@/components/ui/globe";

const GLOBE_CONFIG = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 1,
  diffuse: 0.4,
  mapSamples: 16000,
  mapBrightness: 6,
  baseColor: [0.3, 0.3, 0.3] as [number, number, number],
  markerColor: [1, 1, 1] as [number, number, number],
  glowColor: [0.2, 0.2, 0.2] as [number, number, number],
  markers: [
    { location: [40.7128, -74.006] as [number, number], size: 0.1 },
    { location: [51.5074, -0.1278] as [number, number], size: 0.08 },
    { location: [35.6762, 139.6503] as [number, number], size: 0.08 },
    { location: [-33.8688, 151.2093] as [number, number], size: 0.06 },
    { location: [1.3521, 103.8198] as [number, number], size: 0.05 },
    { location: [55.7558, 37.6173] as [number, number], size: 0.06 },
    { location: [-23.5505, -46.6333] as [number, number], size: 0.07 },
    { location: [19.076, 72.8777] as [number, number], size: 0.08 },
    { location: [52.52, 13.405] as [number, number], size: 0.06 },
    { location: [37.5665, 126.978] as [number, number], size: 0.06 },
  ],
};

export function GlobalReach() {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Creators worldwide
              <br />
              <span className="gradient-text">trust ClipBlaze</span>
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed mb-8">
              Join thousands of content creators across the globe who use ClipBlaze 
              to transform their long-form content into viral shorts for TikTok, 
              Instagram Reels, and YouTube Shorts.
            </p>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-3xl font-bold text-white">50K+</div>
                <div className="text-sm text-muted-foreground">Creators</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">1M+</div>
                <div className="text-sm text-muted-foreground">Clips Generated</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">180+</div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </div>
            </div>
          </div>
          
          <div className="relative h-[500px]">
            <Globe config={GLOBE_CONFIG} />
          </div>
        </div>
      </div>
    </section>
  );
}
