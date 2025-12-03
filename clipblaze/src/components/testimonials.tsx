"use client";

import { Marquee } from "@/components/ui/marquee";

const testimonials = [
  {
    name: "Alex Chen",
    handle: "@alexcreates",
    avatar: "AC",
    content: "ClipBlaze saved me 10+ hours a week. My shorts are getting 3x more views now! 🔥",
  },
  {
    name: "Sarah Miller",
    handle: "@sarahvlogs",
    avatar: "SM",
    content: "The AI highlight detection is insane. It finds the best moments I would've missed.",
  },
  {
    name: "Marcus Johnson",
    handle: "@marcusj",
    avatar: "MJ",
    content: "Finally, a tool that actually understands viral content. Game changer for my podcast clips.",
  },
  {
    name: "Emma Davis",
    handle: "@emmacontent",
    avatar: "ED",
    content: "Auto captions with emojis? Yes please! My engagement went up 40% in a month.",
  },
  {
    name: "Ryan Park",
    handle: "@ryantech",
    avatar: "RP",
    content: "I was skeptical but the 9:16 smart crop is actually smart. It tracks speakers perfectly.",
  },
  {
    name: "Lisa Wang",
    handle: "@lisawang",
    avatar: "LW",
    content: "From 2-hour podcast to 5 viral clips in minutes. This is the future of content creation.",
  },
];

const TestimonialCard = ({ name, handle, avatar, content }: typeof testimonials[0]) => (
  <div className="glass-card rounded-2xl p-6 w-[350px] shrink-0">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium">
        {avatar}
      </div>
      <div>
        <div className="font-medium text-white">{name}</div>
        <div className="text-sm text-muted-foreground">{handle}</div>
      </div>
    </div>
    <p className="text-white/80 text-sm leading-relaxed">{content}</p>
  </div>
);

export function Testimonials() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Loved by creators
          </h2>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto">
            See what content creators are saying about ClipBlaze
          </p>
        </div>
      </div>

      <Marquee pauseOnHover className="[--duration:30s] [--gap:1.5rem]">
        {testimonials.map((testimonial, idx) => (
          <TestimonialCard key={idx} {...testimonial} />
        ))}
      </Marquee>
      
      <Marquee reverse pauseOnHover className="[--duration:30s] [--gap:1.5rem] mt-6">
        {[...testimonials].reverse().map((testimonial, idx) => (
          <TestimonialCard key={idx} {...testimonial} />
        ))}
      </Marquee>
    </section>
  );
}
