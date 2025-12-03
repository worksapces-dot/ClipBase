"use client";

import { Button } from "@/components/ui/button";
import { ZapIcon } from "./icons";

export function Navbar() {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl">
      <div className="glass-card rounded-2xl px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <ZapIcon className="w-5 h-5 text-black" />
          </div>
          <span className="text-xl font-bold tracking-tight">ClipBlaze</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-white transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-white transition-colors">
            How it works
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-white transition-colors">
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-sm">
            Sign in
          </Button>
          <Button className="text-sm bg-white text-black hover:bg-white/90">
            Get Started Free
          </Button>
        </div>
      </div>
    </nav>
  );
}
