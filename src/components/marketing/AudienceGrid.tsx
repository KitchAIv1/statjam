"use client";

import { Users, Settings, BarChart3, Trophy, PlayCircle } from "lucide-react";

export function AudienceGrid() {
  const roles = [
    {
      icon: <Settings className="w-6 h-6 text-orange-600" />,
      title: "Organizers",
      text: "Run tournaments from one dashboard. Automation reduces errors and workload.",
      size: "col-span-2",
    },
    {
      icon: <PlayCircle className="w-6 h-6 text-orange-600" />,
      title: "Stat Admins",
      text: "NBA‑level precision. Automation thinks ahead so you don’t miss the moment.",
      size: "",
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-orange-600" />,
      title: "Coaches",
      text: "See performance game‑to‑game with real stats and play sequences.",
      size: "",
    },
    {
      icon: <Users className="w-6 h-6 text-orange-600" />,
      title: "Players",
      text: "Build your basketball legacy with a permanent, pro‑grade stat history.",
      size: "",
    },
    {
      icon: <Trophy className="w-6 h-6 text-orange-600" />,
      title: "Fans",
      text: "Watch live with real‑time scores and play‑by‑play that tells the story.",
      size: "",
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Built for Every Role</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((r, idx) => (
            <div key={idx} className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${r.size}`}>
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center mb-2.5">
                {r.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{r.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


