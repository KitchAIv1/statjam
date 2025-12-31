/**
 * useClips Hook - Game Clips Prefetching
 * 
 * PURPOSE: Prefetch game clips and player data for instant tab switching.
 * Similar to useTeamStats but for the Clips tab.
 * 
 * @module useClips
 */

import { useState, useEffect, useCallback } from 'react';
import { getGameClips, GeneratedClip } from '@/lib/services/clipService';
import { CoachPlayerService } from '@/lib/services/coachPlayerService';

export interface Player {
  id: string;
  name: string;
  jersey_number?: number;
}

export interface UseClipsData {
  clips: GeneratedClip[];
  players: Player[];
  loading: boolean;
  error: string | null;
}

export interface UseClipsOptions {
  prefetch?: boolean;
  enabled?: boolean;
}

export function useClips(
  gameId: string,
  teamId: string,
  options: UseClipsOptions = {}
): UseClipsData {
  const [clips, setClips] = useState<GeneratedClip[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!gameId || !teamId) return;
    
    // Respect enabled option
    if (options.enabled === false) return;

    try {
      // Smart loading state - only show spinner on non-prefetch
      if (!options.prefetch) {
        setLoading(true);
      }
      setError(null);

      // Parallel fetch for clips and players
      const [gameClips, teamPlayers] = await Promise.all([
        getGameClips(gameId),
        CoachPlayerService.getCoachTeamPlayers(teamId),
      ]);

      setClips(gameClips);
      setPlayers(
        teamPlayers.map((p) => ({
          id: p.id,
          name: p.name,
          jersey_number: p.jersey_number,
        }))
      );
    } catch (e: any) {
      console.error('❌ useClips: Error fetching clips data:', e);
      setError(e?.message || 'Failed to load clips');
      setClips([]);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [gameId, teamId, options.enabled, options.prefetch]);

  // Initial fetch
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return {
    clips,
    players,
    loading,
    error,
  };
}

