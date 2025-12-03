"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    description: "Perfect for trying out ClipBlaze",
    features: [
      "3 clips per month",
      "720p export quality",
      "Basic captions",
      "ClipBlaze watermark",
      "Email support",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    badge: "Popular",
    price: { monthly: 19, yearly: 15 },
    description: "For content creators who want more",
    features: [
      "Unlimited clips",
      "1080p export quality",
      "Advanced captions & emojis",
      "No watermark",
      "Priority support",
      "Custom branding",
      "YouTube link import",
      "Batch processing",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: { monthly: 49, yearly: 39 },
    description: "For teams and agencies",
    features: [
      "Everything in Pro",
      "4K export quality",
      "Team collaboration",
      "API access",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
      "Advanced analytics",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const CheckIcon = () => (
  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

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
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={cn(
                "relative rounded-2xl p-6 flex flex-col",
                plan.popular
                  ? "bg-white/[0.08] border-2 border-blue-500/50"
                  : "bg-white/[0.03] border border-white/10"
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-6">
                  <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-medium">
                    {plan.badge}
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
              </div>

              {plan.popular ? (
                <ShimmerButton className="w-full mb-6">
                  {plan.cta}
                </ShimmerButton>
              ) : (
                <Button
                  variant="outline"
                  className="w-full mb-6 border-white/20 hover:bg-white/10"
                >
                  {plan.cta}
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
          ))}
        </div>
      </div>
    </section>
  );
}
