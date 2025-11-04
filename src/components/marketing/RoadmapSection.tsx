"use client";

import { Video, Badge as BadgeIcon, Palette } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function RoadmapSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">On the Roadmap</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Live Streaming */}
          <div className="rounded-xl border-2 border-orange-200/60 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Live Streaming</h3>
              <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-orange-500 text-white">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                Coming Soon
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">Stream games natively with synced stat overlays and real‑time scoreboards.</p>
            <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">Join the Streaming Waitlist</Button>
          </div>

          {/* NBA Card Generation */}
          <div className="rounded-xl border-2 border-orange-200/60 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Palette className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">NBA Card Generation</h3>
              <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-orange-500 text-white">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                Coming Soon
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">Turn highlights and stat lines into collectible player cards in seconds.</p>
            <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">Get Early Access</Button>
          </div>
        </div>
      </div>
    </section>
  );
}


