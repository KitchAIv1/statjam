/**
 * useBoxScoreOverlay Hook
 * 
 * Manual-trigger box score overlay for live broadcast
 * REUSES existing useTeamStats hook - no duplicate logic
 * 
 * @module useBoxScoreOverlay
 */

import { useState, useCallback, useMemo } from 'react';
import { useTeamStats, TeamStatsData } from './useTeamStats';
import { PlayerStats } from '@/lib/services/teamStatsService';

export interface BoxScoreTeamData {
  id: string;
  name: string;
  score: number;
  primaryColor?: string;
  logoUrl?: string;
  players: PlayerStats[]; // Top 5 scorers
  loading: boolean;
  error: string | null;
}

export interface BoxScoreData {
  teamA: BoxScoreTeamData;
  teamB: BoxScoreTeamData;
}

interface UseBoxScoreOverlayOptions {
  gameId: string | null;
  teamAId: string | null;
  teamBId: string | null;
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  teamAPrimaryColor?: string;
  teamBPrimaryColor?: string;
  teamALogoUrl?: string;
  teamBLogoUrl?: string;
}

export function useBoxScoreOverlay(options: UseBoxScoreOverlayOptions) {
  const [isVisible, setIsVisible] = useState(false);

  // ✅ REUSE existing useTeamStats hook for each team
  // Only fetch when overlay is visible (enabled: isVisible)
  const teamAStats = useTeamStats(
    options.gameId ?? '',
    options.teamAId ?? '',
    { enabled: isVisible && !!options.gameId && !!options.teamAId }
  );

  const teamBStats = useTeamStats(
    options.gameId ?? '',
    options.teamBId ?? '',
    { enabled: isVisible && !!options.gameId && !!options.teamBId }
  );

  // Combine all players and sort by points for top scorers
  const boxScoreData = useMemo<BoxScoreData | null>(() => {
    if (!isVisible) return null;

    const allPlayersA = [...teamAStats.onCourtPlayers, ...teamAStats.benchPlayers];
    const allPlayersB = [...teamBStats.onCourtPlayers, ...teamBStats.benchPlayers];

    // Sort by points (top scorers first) and take top 5
    const sortByPoints = (a: PlayerStats, b: PlayerStats) => b.points - a.points;

    return {
      teamA: {
        id: options.teamAId ?? '',
        name: options.teamAName,
        score: options.teamAScore,
        primaryColor: options.teamAPrimaryColor,
        logoUrl: options.teamALogoUrl,
        players: allPlayersA.sort(sortByPoints).slice(0, 5),
        loading: teamAStats.loading,
        error: teamAStats.error,
      },
      teamB: {
        id: options.teamBId ?? '',
        name: options.teamBName,
        score: options.teamBScore,
        primaryColor: options.teamBPrimaryColor,
        logoUrl: options.teamBLogoUrl,
        players: allPlayersB.sort(sortByPoints).slice(0, 5),
        loading: teamBStats.loading,
        error: teamBStats.error,
      },
    };
  }, [
    isVisible,
    options,
    teamAStats.onCourtPlayers,
    teamAStats.benchPlayers,
    teamAStats.loading,
    teamAStats.error,
    teamBStats.onCourtPlayers,
    teamBStats.benchPlayers,
    teamBStats.loading,
    teamBStats.error,
  ]);

  const isLoading = teamAStats.loading || teamBStats.loading;

  const show = useCallback(() => setIsVisible(true), []);
  const hide = useCallback(() => setIsVisible(false), []);
  const toggle = useCallback(() => setIsVisible(v => !v), []);

  return {
    isVisible,
    isLoading,
    boxScoreData,
    show,
    hide,
    toggle,
  };
}
