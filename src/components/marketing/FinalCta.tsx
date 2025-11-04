"use client";

import { Button } from "@/components/ui/Button";

export function FinalCta({ onWatchLive, onStartTracking }: { onWatchLive?: () => void; onStartTracking?: () => void; }) {
  return (
    <section className="py-14 bg-gradient-to-r from-orange-600 to-red-600">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center text-white">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">Start Tracking Like the Pros</h2>
        <p className="text-white/90 mb-6">Run pro‑grade tournaments with real‑time stats and automation that thinks ahead.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button onClick={onStartTracking} className="bg-white text-gray-900 hover:bg-white/90 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg">Launch the Stat Tracker</Button>
          <Button onClick={onWatchLive} variant="outline" className="border-white text-white hover:bg-white/10 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg">Watch Live Games</Button>
        </div>
      </div>
    </section>
  );
}


