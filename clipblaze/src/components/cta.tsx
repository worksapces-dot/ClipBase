"use client";

import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "./icons";

export function CTA() {
  return (
    <section className="py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-t from-white/[0.02] to-transparent" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-6xl font-bold mb-6">
          Ready to go viral?
        </h2>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Join thousands of creators using ClipBlaze to turn their content into scroll-stopping shorts.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="bg-white text-black hover:bg-white/90 text-base px-8 h-14 gap-2">
            Start Creating Free
            <ArrowRightIcon className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mt-6">
          No credit card required • 3 free clips per month
        </p>
      </div>
    </section>
  );
}
