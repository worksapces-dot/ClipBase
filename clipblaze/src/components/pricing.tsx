"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Perfect for trying out ClipBlaze",
    features: [
      "3 clips per month",
      "720p export quality",
      "Basic captions",
      "ClipBlaze watermark",
      "Email support",
    ],
    cta: "Current Plan",
    popular: false,
    disabled: true,
  },
  {
    id: "starter",
    name: "Starter",
    price: 9,
    description: "For casual content creators",
    features: [
      "10 clips per month",
      "1080p export quality",
      "Advanced captions",
      "No watermark",
      "Priority support",
    ],
    cta: "Get Starter",
    popular: false,
    disabled: false,
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Popular",
    price: 29,
    description: "For serious content creators",
    features: [
      "50 clips per month",
      "1080p export quality",
      "Advanced captions & emojis",
      "No watermark",
      "Priority support",
      "Auto YouTube upload",
      "Auto Instagram upload",
    ],
    cta: "Get Pro",
    popular: true,
    disabled: false,
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: 79,
    description: "For teams and agencies",
    features: [
      "Unlimited clips",
      "4K export quality",
      "Everything in Pro",
      "API access",
      "Custom integrations",
      "Dedicated support",
    ],
    cta: "Get Unlimited",
    popular: false,
    disabled: false,
  },
];

const CheckIcon = () => (
  <svg
    className="w-4 h-4 text-white"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

interface PricingProps {
  currentPlan?: string;
  isLoggedIn?: boolean;
}

export function Pricing({ currentPlan = "free", isLoggedIn = false }: PricingProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleUpgrade = async (planId: string) => {
    if (!isLoggedIn) {
      router.push("/login?redirect=/dashboard");
      return;
    }

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
        console.error("Checkout error:", data.error);
        alert("Failed to start checkout. Please try again.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <section id="pricing" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan;
            const isUpgrade = plans.findIndex(p => p.id === plan.id) > plans.findIndex(p => p.id === currentPlan);

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-2xl p-6 flex flex-col",
                  plan.popular
                    ? "bg-white/[0.08] border-2 border-emerald-500/50"
                    : "bg-white/[0.03] border border-white/10",
                  isCurrentPlan && "ring-2 ring-emerald-500"
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-6">
                    <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-medium">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 right-6">
                    <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium">
                      Current
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.description}
                  </p>
                </div>

                {plan.popular && isUpgrade ? (
                  <ShimmerButton
                    className="w-full mb-6"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading === plan.id || isCurrentPlan}
                  >
                    {loading === plan.id ? "Loading..." : isCurrentPlan ? "Current Plan" : plan.cta}
                  </ShimmerButton>
                ) : (
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full mb-6 border-white/20 hover:bg-white/10",
                      isCurrentPlan && "bg-white/10"
                    )}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={plan.disabled || loading === plan.id || isCurrentPlan}
                  >
                    {loading === plan.id ? "Loading..." : isCurrentPlan ? "Current Plan" : plan.cta}
                  </Button>
                )}

                <div className="space-y-3 flex-1">
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
      </div>
    </section>
  );
}
