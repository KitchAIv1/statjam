"use client";

import { Clock, Repeat2, Link2, Zap } from "lucide-react";

export function Differentiators() {
  const items = [
    {
      icon: <Clock className="w-6 h-6 text-orange-600" />,
      title: "Smart Automation",
      text: "Auto‑pause clock, shot clock resets, and instant possession flips.",
    },
    {
      icon: <Zap className="w-6 h-6 text-orange-600" />,
      title: "Real‑Time Reliability",
      text: "WebSockets with intelligent fallback keep updates under 3 seconds.",
    },
    {
      icon: <Link2 className="w-6 h-6 text-orange-600" />,
      title: "Pro‑Grade Stats",
      text: "Full box score + play sequences (assists, rebounds, blocks, FTs).",
    },
    {
      icon: <Repeat2 className="w-6 h-6 text-orange-600" />,
      title: "Built for Everyone",
      text: "Organizers, stat admins, coaches, players, and fans — all covered.",
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-gray-200 p-5 bg-white shadow-sm">
              <div className="w-11 h-11 rounded-lg bg-orange-50 flex items-center justify-center mb-3">
                {item.icon}
              </div>
              <h3 className="font-semibold mb-1.5 text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


