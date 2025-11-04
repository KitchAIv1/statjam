"use client";

import { Button } from "@/components/ui/Button";

export function FinalCta({ onWatchLive, onStartTracking }: { onWatchLive?: () => void; onStartTracking?: () => void; }) {
  return (
    <section className="py-16 bg-gradient-to-r from-orange-600 to-red-600">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center text-white">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Start Tracking Like the Pros</h2>
        <p className="text-lg text-white/90 mb-8">Run pro‑grade tournaments with real‑time stats and automation that thinks ahead.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button onClick={onStartTracking} className="bg-white text-gray-900 hover:bg-white/90 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold">Launch the Stat Tracker</Button>
          <Button onClick={onWatchLive} className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-orange-600 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-200">Watch Live Games</Button>
        </div>
      </div>
    </section>
  );
}


