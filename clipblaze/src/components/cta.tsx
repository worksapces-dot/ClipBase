"use client";

import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-white">
          {/* Decorative geometric shapes */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Left pill shape */}
            <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-64 h-96 bg-neutral-100 rounded-full rotate-12" />
            
            {/* Right rounded rectangle */}
            <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-72 h-80 bg-neutral-100 rounded-[3rem]" />
            
            {/* Top right corner accent */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-neutral-200 rounded-full opacity-50" />
            
            {/* Bottom left accent */}
            <div className="absolute -bottom-8 left-20 w-32 h-32 bg-neutral-200 rounded-full opacity-40" />
          </div>

          {/* Content */}
          <div className="relative z-10 py-20 px-8 text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-16 leading-tight">
              Upload.<br />
              Clip. Go Viral.
            </h2>

            <div className="flex flex-col items-center gap-4">
              <Button 
                size="lg" 
                className="bg-black text-white hover:bg-black/90 text-sm font-semibold px-8 h-12 rounded-full shadow-lg"
              >
                Start Creating Free
              </Button>
              
              <p className="text-black/60 text-sm">
                No credit card required • 3 free clips per month
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
