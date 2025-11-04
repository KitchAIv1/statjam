"use client";

import { Clock, Repeat2, Link2, Zap } from "lucide-react";

export function Differentiators() {
  const items = [
    {
      icon: <Clock className="w-7 h-7 text-white" />,
      title: "Smart Automation",
      text: "Auto‑pause clock, shot clock resets, and instant possession flips.",
    },
    {
      icon: <Zap className="w-7 h-7 text-white" />,
      title: "Real‑Time Reliability",
      text: "WebSockets with intelligent fallback keep updates under 3 seconds.",
    },
    {
      icon: <Link2 className="w-7 h-7 text-white" />,
      title: "Pro‑Grade Stats",
      text: "Full box score + play sequences (assists, rebounds, blocks, FTs).",
    },
    {
      icon: <Repeat2 className="w-7 h-7 text-white" />,
      title: "Built for Everyone",
      text: "Organizers, stat admins, coaches, players, and fans — all covered.",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, idx) => (
            <div key={idx} className="rounded-xl border-2 border-gray-200 hover:border-orange-300 p-6 bg-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                {item.icon}
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-900">{item.title}</h3>
              <p className="text-base text-gray-600 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


