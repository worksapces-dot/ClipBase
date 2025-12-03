"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MorphingText } from "@/components/ui/morphing-text";
import { Particles } from "@/components/ui/particles";
import { ZapIcon } from "@/components/icons";

const texts = [
  "Creating magic",
  "Setting up your studio",
  "Preparing your clips",
  "Let's go viral",
];

export default function WelcomePage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <Particles
        className="absolute inset-0"
        quantity={60}
        staticity={30}
        ease={80}
      />

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        {/* Logo */}
        <div className="mb-20">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center">
            <ZapIcon className="w-9 h-9 text-black" />
          </div>
        </div>

        {/* Morphing text */}
        <div className="w-full">
          <MorphingText texts={texts} />
        </div>
      </div>
    </div>
  );
}
