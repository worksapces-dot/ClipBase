"use client";

import { NumberTicker } from "@/components/ui/number-ticker";

const stats = [
  { value: 95, suffix: "%", label: "Caption Accuracy" },
  { value: 2, prefix: "<", suffix: "min", label: "Export Time" },
  { value: 80, suffix: "%+", label: "Highlight Accuracy" },
  { value: 60, suffix: "min", label: "Max Video Length" },
];

export function Stats() {
  return (
    <section className="py-20 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                {stat.prefix}
                <NumberTicker value={stat.value} delay={index * 0.1} />
                {stat.suffix}
              </div>
              <div className="text-muted-foreground text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
