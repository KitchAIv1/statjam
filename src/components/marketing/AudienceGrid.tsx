"use client";

import { Users, Settings, BarChart3, Trophy, PlayCircle } from "lucide-react";

export function AudienceGrid() {
  const roles = [
    {
      icon: <Settings className="w-6 h-6 text-white" />,
      title: "Organizers",
      text: "Run tournaments from one dashboard. Automation reduces errors and workload.",
    },
    {
      icon: <PlayCircle className="w-6 h-6 text-white" />,
      title: "Stat Admins",
      text: "NBA‑level precision. Automation thinks ahead so you don't miss the moment.",
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-white" />,
      title: "Coaches",
      text: "See performance game‑to‑game with real stats and play sequences.",
    },
    {
      icon: <Users className="w-6 h-6 text-white" />,
      title: "Players",
      text: "Build your basketball legacy with a permanent, pro‑grade stat history.",
    },
    {
      icon: <Trophy className="w-6 h-6 text-white" />,
      title: "Fans",
      text: "Watch live with real‑time scores and play‑by‑play that tells the story.",
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Built for Every Role</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Whether you organize tournaments or play in them, StatJam adapts to your needs.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((r, idx) => (
            <div key={idx} className="rounded-xl border-2 border-gray-200 hover:border-orange-300 bg-white p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                {r.icon}
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">{r.title}</h3>
              <p className="text-base text-gray-600 leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


