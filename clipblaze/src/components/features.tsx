"use client";

import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import {
  SparklesIcon,
  CaptionsIcon,
  CropIcon,
  WaveformIcon,
  ZapIcon,
  UploadIcon,
} from "./icons";

const features = [
  {
    Icon: SparklesIcon,
    name: "AI Highlight Detection",
    description:
      "Our AI analyzes your video to find the most engaging moments automatically.",
    href: "#",
    cta: "Learn more",
    className: "md:col-span-1 lg:col-span-1",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-violet-500/5 to-transparent" />
    ),
  },
  {
    Icon: CaptionsIcon,
    name: "Auto Captions & Emojis",
    description: "Word-by-word animated subtitles with smart emoji placement.",
    href: "#",
    cta: "Learn more",
    className: "md:col-span-1 lg:col-span-2",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-blue-500/5 to-transparent" />
    ),
  },
  {
    Icon: CropIcon,
    name: "Smart 9:16 Crop",
    description:
      "Intelligent reframing that tracks speakers. Perfect for TikTok, Reels, and Shorts.",
    href: "#",
    cta: "Learn more",
    className: "md:col-span-1 lg:col-span-2",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-emerald-500/5 to-transparent" />
    ),
  },
  {
    Icon: WaveformIcon,
    name: "Audio Enhancement",
    description: "Automatic volume normalization and noise reduction.",
    href: "#",
    cta: "Learn more",
    className: "md:col-span-1 lg:col-span-1",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 via-rose-500/5 to-transparent" />
    ),
  },
  {
    Icon: ZapIcon,
    name: "Dynamic Effects",
    description:
      "Auto zoom, jump cuts, and motion tracking at the perfect moments.",
    href: "#",
    cta: "Learn more",
    className: "md:col-span-1 lg:col-span-1",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-amber-500/5 to-transparent" />
    ),
  },
  {
    Icon: UploadIcon,
    name: "One-Click Export",
    description: "Export ready-to-post MP4s in under 2 minutes.",
    href: "#",
    cta: "Learn more",
    className: "md:col-span-1 lg:col-span-2",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-cyan-500/5 to-transparent" />
    ),
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
          <p className="text-muted-foreground text-base max-w-2xl mx-auto leading-relaxed">
            ClipBlaze handles the entire editing process so you can focus on
            creating.
          </p>
        </div>

        <BentoGrid>
          {features.map((feature, idx) => (
            <BentoCard key={idx} {...feature} />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}
