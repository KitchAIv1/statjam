"use client";

import { Video, Badge as BadgeIcon, Palette } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function RoadmapSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">On the Roadmap</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Exciting features coming soon to make StatJam even more powerful.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-8">
          {/* Live Streaming */}
          <div className="rounded-xl border-2 border-orange-200 hover:border-orange-300 bg-white p-8 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Live Streaming</h3>
              <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-500 text-white">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                Coming Soon
              </span>
            </div>
            <p className="text-base text-gray-600 mb-6 leading-relaxed">Stream games natively with synced stat overlays and real‑time scoreboards.</p>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto px-6 py-3">Join the Streaming Waitlist</Button>
          </div>

          {/* NBA Card Generation */}
          <div className="rounded-xl border-2 border-orange-200 hover:border-orange-300 bg-white p-8 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">NBA Card Generation</h3>
              <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-500 text-white">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                Coming Soon
              </span>
            </div>
            <p className="text-base text-gray-600 mb-6 leading-relaxed">Turn highlights and stat lines into collectible player cards in seconds.</p>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto px-6 py-3">Get Early Access</Button>
          </div>
        </div>
      </div>
    </section>
  );
}


