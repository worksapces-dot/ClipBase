"use client";

import { SparklesIcon, CaptionsIcon, CropIcon, WaveformIcon, ZapIcon, UploadIcon } from "./icons";

const features = [
  {
    icon: SparklesIcon,
    title: "AI Highlight Detection",
    description: "Our AI analyzes your video to find the most engaging moments automatically. No more scrubbing through hours of footage.",
  },
  {
    icon: CaptionsIcon,
    title: "Auto Captions & Emojis",
    description: "Word-by-word animated subtitles with smart emoji placement. Boost engagement and accessibility instantly.",
  },
  {
    icon: CropIcon,
    title: "Smart 9:16 Crop",
    description: "Intelligent reframing that tracks speakers and keeps the action centered. Perfect for TikTok, Reels, and Shorts.",
  },
  {
    icon: WaveformIcon,
    title: "Audio Enhancement",
    description: "Automatic volume normalization and noise reduction. Your clips sound professional every time.",
  },
  {
    icon: ZapIcon,
    title: "Dynamic Effects",
    description: "Auto zoom, jump cuts, and motion tracking applied at the perfect moments to keep viewers hooked.",
  },
  {
    icon: UploadIcon,
    title: "One-Click Export",
    description: "Export ready-to-post MP4s in under 2 minutes. Upload directly or download for later.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything you need to
            <br />
            <span className="gradient-text">create viral content</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            ClipBlaze handles the entire editing process so you can focus on creating.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card rounded-2xl p-6 hover:bg-white/[0.04] transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
