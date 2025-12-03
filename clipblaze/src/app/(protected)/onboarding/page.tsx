"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ZapIcon } from "@/components/icons";
import { Particles } from "@/components/ui/particles";
import { cn } from "@/lib/utils";

const steps = [
  {
    id: 1,
    title: "How did you hear about us?",
    subtitle: "Help us understand where our users come from",
    options: [
      { id: "youtube", label: "YouTube", icon: "📺" },
      { id: "tiktok", label: "TikTok", icon: "🎵" },
      { id: "twitter", label: "Twitter/X", icon: "🐦" },
      { id: "friend", label: "Friend referral", icon: "👥" },
      { id: "google", label: "Google search", icon: "🔍" },
      { id: "other", label: "Other", icon: "✨" },
    ],
  },
  {
    id: 2,
    title: "What's your main goal?",
    subtitle: "We'll customize your experience based on this",
    options: [
      { id: "grow-audience", label: "Grow my audience", icon: "📈" },
      { id: "save-time", label: "Save editing time", icon: "⏱️" },
      { id: "repurpose", label: "Repurpose long content", icon: "♻️" },
      { id: "viral", label: "Create viral clips", icon: "🔥" },
      { id: "monetize", label: "Monetize content", icon: "💰" },
      { id: "explore", label: "Just exploring", icon: "🧭" },
    ],
  },
  {
    id: 3,
    title: "What type of content do you create?",
    subtitle: "Select all that apply",
    multiple: true,
    options: [
      { id: "podcast", label: "Podcasts", icon: "🎙️" },
      { id: "gaming", label: "Gaming", icon: "🎮" },
      { id: "education", label: "Education", icon: "📚" },
      { id: "vlog", label: "Vlogs", icon: "📷" },
      { id: "business", label: "Business", icon: "💼" },
      { id: "entertainment", label: "Entertainment", icon: "🎬" },
    ],
  },
  {
    id: 4,
    title: "How often do you post short-form content?",
    subtitle: "This helps us recommend the right plan",
    options: [
      { id: "daily", label: "Daily", icon: "📅" },
      { id: "few-week", label: "Few times a week", icon: "📆" },
      { id: "weekly", label: "Weekly", icon: "🗓️" },
      { id: "monthly", label: "Monthly", icon: "📋" },
      { id: "starting", label: "Just starting out", icon: "🌱" },
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<number, string[]>>({});

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const currentSelections = selections[currentStep] || [];

  const handleSelect = (optionId: string) => {
    if (step.multiple) {
      setSelections((prev) => ({
        ...prev,
        [currentStep]: currentSelections.includes(optionId)
          ? currentSelections.filter((id) => id !== optionId)
          : [...currentSelections, optionId],
      }));
    } else {
      setSelections((prev) => ({
        ...prev,
        [currentStep]: [optionId],
      }));
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      // Save to localStorage and cookie
      localStorage.setItem("onboarding_complete", "true");
      localStorage.setItem("onboarding_data", JSON.stringify(selections));
      document.cookie = "onboarding_complete=true; path=/; max-age=31536000";
      router.push("/welcome");
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const canProceed = currentSelections.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      <Particles className="absolute inset-0" quantity={50} staticity={40} ease={80} />

      <div className="w-full max-w-2xl relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
            <ZapIcon className="w-6 h-6 text-black" />
          </div>
          <span className="text-2xl font-bold">ClipBlaze</span>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                index <= currentStep ? "bg-white" : "bg-white/20"
              )}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{step.title}</h1>
          <p className="text-muted-foreground">{step.subtitle}</p>
        </div>

        {/* Options grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {step.options.map((option) => {
            const isSelected = currentSelections.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={cn(
                  "group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all duration-200",
                  isSelected
                    ? "bg-white text-black scale-[1.02] shadow-lg shadow-white/10"
                    : "bg-white/5 hover:bg-white/10 text-white"
                )}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <span className="text-3xl">{option.icon}</span>
                <span className="text-sm font-medium text-center">{option.label}</span>
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 px-6 rounded-lg border border-white/10 font-semibold hover:bg-white/5 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={cn(
              "flex-1 py-3 px-6 rounded-lg font-semibold transition-colors",
              canProceed
                ? "bg-white text-black hover:bg-white/90"
                : "bg-white/20 text-white/40 cursor-not-allowed"
            )}
          >
            {isLastStep ? "Get Started" : "Next"}
          </button>
        </div>

        {/* Skip option */}
        <button
          onClick={() => {
            localStorage.setItem("onboarding_complete", "true");
            document.cookie = "onboarding_complete=true; path=/; max-age=31536000";
            router.push("/dashboard");
          }}
          className="w-full mt-4 text-sm text-muted-foreground hover:text-white transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
