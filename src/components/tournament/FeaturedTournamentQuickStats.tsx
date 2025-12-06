"use client";

import { TournamentNextGame } from './TournamentNextGame';

interface FeaturedTournamentQuickStatsProps {
  tournamentId: string;
  tournamentStartDate?: string | null;
  tournamentEndDate?: string | null;
  tournamentStatus?: string;
  onLiveGamesClick?: () => void;
}

/**
 * FeaturedTournamentQuickStats - Quick stats sidebar for featured tournament
 * 
 * Purpose: Display next game countdown in glassmorphism sidebar
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function FeaturedTournamentQuickStats({
  tournamentId,
  tournamentStartDate,
  tournamentEndDate,
  tournamentStatus,
  onLiveGamesClick
}: FeaturedTournamentQuickStatsProps) {
  return (
    <div className="lg:w-64 xl:w-72 shrink-0 self-start rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-3 sm:p-4">
      <TournamentNextGame
        tournamentId={tournamentId}
        tournamentStartDate={tournamentStartDate}
        tournamentEndDate={tournamentEndDate}
        tournamentStatus={tournamentStatus}
        onLiveClick={onLiveGamesClick}
      />
    </div>
  );
}
