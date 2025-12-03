"use client";

import { ZapIcon, YoutubeIcon, TiktokIcon, InstagramIcon } from "./icons";
import { DotText } from "./dot-text";

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <ZapIcon className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold tracking-tight">ClipBlaze</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#" className="text-muted-foreground hover:text-white transition-colors">
              <YoutubeIcon className="w-5 h-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-white transition-colors">
              <TiktokIcon className="w-5 h-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-white transition-colors">
              <InstagramIcon className="w-5 h-5" />
            </a>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <a href="/contact" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>

        <DotText text="Go viral with ClipBlaze" />

        <div className="pt-8 border-t border-white/5 text-center text-sm text-muted-foreground">
          © 2025 ClipBlaze. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
