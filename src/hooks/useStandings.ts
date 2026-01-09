// ============================================================================
// USE STANDINGS HOOK (<100 lines)
// Purpose: Reusable standings calculation for seasons AND tournaments
// Follows .cursorrules: Single responsibility, <100 lines, reusable
// ============================================================================

import { useMemo } from 'react';

export interface StandingsGame {
  home_score: number;
  away_score: number;
  status: string;
}

export interface StandingsRecord {
  wins: number;
  losses: number;
  winPct: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  streak: string;
  last5: ('W' | 'L')[];
}

export interface UseStandingsOptions {
  games: StandingsGame[];
  onlyCompleted?: boolean;
}

export function useStandings({ games, onlyCompleted = true }: UseStandingsOptions): StandingsRecord {
  return useMemo(() => {
    const filtered = onlyCompleted
      ? games.filter(g => g.status === 'completed')
      : games;

    if (filtered.length === 0) {
      return {
        wins: 0, losses: 0, winPct: 0,
        pointsFor: 0, pointsAgainst: 0, pointDiff: 0,
        streak: '-', last5: [],
      };
    }

    let wins = 0, losses = 0, pointsFor = 0, pointsAgainst = 0;
    const results: ('W' | 'L')[] = [];

    for (const game of filtered) {
      const won = game.home_score > game.away_score;
      if (won) wins++;
      else losses++;
      
      pointsFor += game.home_score;
      pointsAgainst += game.away_score;
      results.push(won ? 'W' : 'L');
    }

    // Calculate streak (from most recent)
    const reversed = [...results].reverse();
    let streak = '';
    let streakType = reversed[0];
    let streakCount = 0;
    for (const r of reversed) {
      if (r === streakType) streakCount++;
      else break;
    }
    streak = `${streakType}${streakCount}`;

    // Last 5 games
    const last5 = reversed.slice(0, 5);

    const total = wins + losses;
    return {
      wins,
      losses,
      winPct: total > 0 ? Math.round((wins / total) * 1000) / 1000 : 0,
      pointsFor,
      pointsAgainst,
      pointDiff: pointsFor - pointsAgainst,
      streak,
      last5,
    };
  }, [games, onlyCompleted]);
}

// Helper for formatting win percentage
export function formatWinPct(pct: number): string {
  return pct.toFixed(3).replace(/^0/, '');
}

// Helper for point differential display
export function formatPointDiff(diff: number): string {
  return diff >= 0 ? `+${diff}` : `${diff}`;
}

