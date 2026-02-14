"use client";

import { Users, Trophy, MapPin, Layers } from 'lucide-react';
import { useTournamentTheme } from '@/contexts/TournamentThemeContext';
import { getTournamentThemeClass } from '@/lib/utils/tournamentThemeClasses';

interface TournamentHeroStatsStripProps {
  teamCount: number;
  gameCount: number;
  venueCount?: number;
  divisionCount?: number;
}

/**
 * Compact stats strip for tournament hero: Teams · Games (and optionally Venues, Divisions).
 * Presentational only; no business logic.
 */
export function TournamentHeroStatsStrip({
  teamCount,
  gameCount,
  venueCount = 0,
  divisionCount = 0,
}: TournamentHeroStatsStripProps) {
  const { theme } = useTournamentTheme();
  const parts: { icon: React.ReactNode; label: string }[] = [
    { icon: <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />, label: `${teamCount} Team${teamCount !== 1 ? 's' : ''}` },
    { icon: <Trophy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />, label: `${gameCount} Game${gameCount !== 1 ? 's' : ''}` },
  ];
  if (venueCount > 0) {
    parts.push({ icon: <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />, label: `${venueCount} Venue${venueCount !== 1 ? 's' : ''}` });
  }
  if (divisionCount > 0) {
    parts.push({ icon: <Layers className="h-3 w-3 sm:h-3.5 sm:w-3.5" />, label: `${divisionCount} Division${divisionCount !== 1 ? 's' : ''}` });
  }

  return (
    <div className={`mt-1 flex flex-wrap items-center gap-1.5 text-[10px] sm:gap-2 sm:text-xs ${getTournamentThemeClass('heroStatsText', theme)}`}>
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className={getTournamentThemeClass('heroStatsDot', theme)}>·</span>}
          <span className="flex items-center gap-1">{part.icon}{part.label}</span>
        </span>
      ))}
    </div>
  );
}
