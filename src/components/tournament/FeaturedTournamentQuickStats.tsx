"use client";

import { ExternalLink } from 'lucide-react';

interface FeaturedTournamentQuickStatsProps {
  teamCount: number;
  gameCount: number;
  liveGameCount: number;
  isLive: boolean;
  onLiveGamesClick?: () => void;
}

/**
 * FeaturedTournamentQuickStats - Quick stats sidebar for featured tournament
 * 
 * Purpose: Display tournament stats in compact sidebar
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function FeaturedTournamentQuickStats({
  teamCount,
  gameCount,
  liveGameCount,
  isLive,
  onLiveGamesClick
}: FeaturedTournamentQuickStatsProps) {
  return (
    <div className="lg:w-64 xl:w-72 shrink-0">
      <div className="rounded-xl border border-white/10 bg-[#121212] p-3 sm:p-4">
        <div className="text-[10px] uppercase tracking-wide text-[#B3B3B3] mb-2 sm:text-xs sm:mb-3">Quick Stats</div>
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-[#B3B3B3]">Teams Registered</span>
            <span className="font-semibold text-white">{teamCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-[#B3B3B3]">Games Scheduled</span>
            <span className="font-semibold text-white">{gameCount}</span>
          </div>
          {isLive && liveGameCount > 0 && (
            <button
              onClick={onLiveGamesClick}
              className="flex items-center justify-between text-xs sm:text-sm w-full hover:bg-white/5 rounded px-1 py-0.5 -mx-1 transition-colors group"
            >
              <span className="text-[#B3B3B3] group-hover:text-white transition-colors">Live Games</span>
              <span className="font-semibold text-[#FF3B30] flex items-center gap-1 group-hover:gap-1.5 transition-all">
                {liveGameCount}
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

