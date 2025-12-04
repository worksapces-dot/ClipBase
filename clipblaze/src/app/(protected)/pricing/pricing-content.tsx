"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { ZapIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "free",
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    clips: 3,
    description: "Perfect for trying out ClipBlaze",
    features: [
      "3 clips per month",
      "720p export quality",
      "Basic captions",
      "ClipBlaze watermark",
      "Community support",
    ],
    cta: "Current Plan",
    popular: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: { monthly: 9, yearly: 7 },
    clips: 10,
    description: "For creators getting started",
    features: [
      "10 clips per month",
      "1080p export quality",
      "Animated captions",
      "No watermark",
      "Email support",
    ],
    cta: "Upgrade",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Popular",
    price: { monthly: 29, yearly: 23 },
    clips: 50,
    description: "For serious content creators",
    features: [
      "50 clips per month",
      "1080p export quality",
      "Priority processing",
      "Custom branding",
      "Priority support",
      "API access",
    ],
    cta: "Upgrade",
    popular: true,
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: { monthly: 79, yearly: 63 },
    clips: -1,
    description: "For teams and agencies",
    features: [
      "Unlimited clips",
      "4K export quality",
      "Fastest processing",
      "White-label option",
      "Dedicated support",
      "Custom integrations",
    ],
    cta: "Upgrade",
    popular: false,
  },
];

const CheckIcon = () => (
  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export function PricingContent({
  currentPlan: initialPlan,
  clipsUsed: initialClipsUsed,
  clipsLimit: initialClipsLimit,
}: {
  currentPlan: string;
  clipsUsed: number;
  clipsLimit: number;
}) {
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(initialPlan);
  const [clipsUsed, setClipsUsed] = useState(initialClipsUsed);
  const [clipsLimit, setClipsLimit] = useState(initialClipsLimit);

  // Auto-sync subscription on mount
  useEffect(() => {
    syncSubscription();
  }, []);

  const syncSubscription = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/subscription/sync", { method: "POST" });
      const data = await res.json();
      if (data.synced && data.plan) {
        setCurrentPlan(data.plan);
        setClipsLimit(data.clipsLimit || initialClipsLimit);
        // Refresh full subscription data
        const subRes = await fetch("/api/subscription");
        const subData = await subRes.json();
        if (subData.plan) {
          setCurrentPlan(subData.plan);
          setClipsUsed(subData.clipsUsed);
          setClipsLimit(subData.clipsLimit);
        }
      }
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setSyncing(false);
    }
  };

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
      } else if (data.error?.includes("sync")) {
        // Need to sync first
        await syncSubscription();
        alert("Your subscription has been synced. Please try again.");
      } else {
        alert(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(null);
    }
  };

  const usagePercent = clipsLimit === -1 ? 0 : (clipsUsed / clipsLimit) * 100;

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

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Usage Banner */}
        <div className="relative rounded-2xl p-6 mb-12 bg-white/[0.03] border border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-muted-foreground">Current Usage</p>
                {syncing && (
                  <span className="text-xs text-blue-400 animate-pulse">Syncing...</span>
                )}
              </div>
              <p className="text-3xl font-bold">
                {clipsUsed} / {clipsLimit === -1 ? "∞" : clipsLimit} clips
              </p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground">
                  {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
                </p>
                <button
                  onClick={syncSubscription}
                  disabled={syncing}
                  className="text-xs text-blue-400 hover:text-blue-300 underline disabled:opacity-50"
                >
                  {syncing ? "Syncing..." : "Sync"}
                </button>
              </div>
            </div>
            {clipsLimit !== -1 && (
              <div className="w-full md:w-64">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-right">
                  {Math.round(usagePercent)}% used
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className="inline-flex items-center p-1 rounded-full bg-white/5 border border-white/10">
            <button
              onClick={() => setIsYearly(false)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                !isYearly ? "bg-white text-black" : "text-white/60 hover:text-white"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                isYearly ? "bg-white text-black" : "text-white/60 hover:text-white"
              )}
            >
              Yearly
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                isYearly ? "bg-green-500 text-white" : "bg-green-500/20 text-green-400"
              )}>
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => {
            const isCurrent = plan.id === currentPlan;
            const currentPlanIndex = plans.findIndex((p) => p.id === currentPlan);
            const isDowngrade = index < currentPlanIndex;

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-2xl p-6 flex flex-col",
                  plan.popular
                    ? "bg-white/[0.08] border-2 border-blue-500/50"
                    : "bg-white/[0.03] border border-white/10",
                  isCurrent && "ring-2 ring-green-500/50"
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-6">
                    <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-medium">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3 right-6">
                    <span className="px-3 py-1 rounded-full bg-green-500 text-white text-xs font-medium">
                      Current
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      ${isYearly ? plan.price.yearly : plan.price.monthly}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  <p className="text-xs text-white/40 mt-1">
                    {plan.clips === -1 ? "Unlimited clips" : `${plan.clips} clips/month`}
                  </p>
                </div>

                {plan.popular && !isCurrent ? (
                  <ShimmerButton
                    className="w-full mb-6"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading !== null || isDowngrade}
                  >
                    {loading === plan.id ? "Loading..." : plan.cta}
                  </ShimmerButton>
                ) : (
                  <Button
                    variant={isCurrent ? "secondary" : "outline"}
                    className={cn(
                      "w-full mb-6",
                      !isCurrent && "border-white/20 hover:bg-white/10"
                    )}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrent || loading !== null || isDowngrade || plan.id === "free"}
                  >
                    {loading === plan.id
                      ? "Loading..."
                      : isCurrent
                      ? "Current Plan"
                      : isDowngrade
                      ? "Downgrade"
                      : plan.cta}
                  </Button>
                )}

                <div className="space-y-3 flex-1">
                  <p className="text-sm text-white/60 font-medium">
                    {index === 0 ? "Includes:" : `Everything in ${plans[index - 1]?.name} +`}
                  </p>
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <CheckIcon />
                      </div>
                      <span className="text-sm text-white/80">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Link */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Have questions?{" "}
            <Link href="/contact" className="text-white underline hover:no-underline">
              Contact us
            </Link>{" "}
            or check our{" "}
            <Link href="/#faq" className="text-white underline hover:no-underline">
              FAQ
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
