"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ZapIcon, CheckIcon, SparklesIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    clips: 3,
    features: ["3 clips per month", "720p export", "Basic captions", "Community support"],
    cta: "Current Plan",
    popular: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: 9,
    clips: 10,
    features: ["10 clips per month", "1080p export", "Animated captions", "Email support", "No watermark"],
    cta: "Upgrade",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    clips: 50,
    features: ["50 clips per month", "1080p export", "Priority processing", "Custom branding", "Priority support", "API access"],
    cta: "Upgrade",
    popular: true,
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: 79,
    clips: -1,
    features: ["Unlimited clips", "4K export", "Fastest processing", "White-label option", "Dedicated support", "Custom integrations"],
    cta: "Upgrade",
    popular: false,
  },
];

export function PricingContent({
  currentPlan,
  clipsUsed,
  clipsLimit,
}: {
  currentPlan: string;
  clipsUsed: number;
  clipsLimit: number;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    if (planId === "free" || planId === currentPlan) return;

    setLoading(planId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <ZapIcon className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold">ClipBlaze</span>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost">← Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Usage Banner */}
        <div className="glass-card p-6 mb-12 text-center">
          <p className="text-muted-foreground mb-2">Current Usage</p>
          <p className="text-3xl font-bold">
            {clipsUsed} / {clipsLimit === -1 ? "∞" : clipsLimit} clips
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
          </p>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground">
            Scale your content creation with the right plan for you
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isDowngrade = plans.findIndex((p) => p.id === currentPlan) > plans.findIndex((p) => p.id === plan.id);

            return (
              <div
                key={plan.id}
                className={cn(
                  "glass-card p-6 relative flex flex-col",
                  plan.popular && "ring-2 ring-white"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <SparklesIcon className="w-3 h-3" />
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.clips === -1 ? "Unlimited clips" : `${plan.clips} clips/month`}
                  </p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckIcon className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    "w-full",
                    isCurrent && "bg-white/10 cursor-default",
                    plan.popular && !isCurrent && "bg-white text-black hover:bg-white/90"
                  )}
                  disabled={isCurrent || isDowngrade || loading !== null}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {loading === plan.id
                    ? "Loading..."
                    : isCurrent
                    ? "Current Plan"
                    : isDowngrade
                    ? "Downgrade"
                    : plan.cta}
                </Button>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Questions? <Link href="/contact" className="text-white underline">Contact us</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
