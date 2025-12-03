"use client";

const steps = [
  {
    number: "01",
    title: "Upload your video",
    description: "Drop a video file or paste a YouTube link. We support videos up to 60 minutes.",
    visual: "📤",
  },
  {
    number: "02",
    title: "AI finds the gold",
    description: "Our AI transcribes, analyzes, and identifies the most viral-worthy moments.",
    visual: "🔍",
  },
  {
    number: "03",
    title: "Auto-edit magic",
    description: "Captions, emojis, zooms, and 9:16 crop are applied automatically.",
    visual: "✨",
  },
  {
    number: "04",
    title: "Export & share",
    description: "Download your clips in under 2 minutes. Ready for TikTok, Reels, and Shorts.",
    visual: "🚀",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How it works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From raw footage to viral clip in 4 simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-white/20 to-transparent z-0" />
              )}
              
              <div className="relative z-10">
                <div className="text-6xl mb-4">{step.visual}</div>
                <div className="text-sm text-muted-foreground font-mono mb-2">{step.number}</div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
