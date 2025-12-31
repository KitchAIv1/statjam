/**
 * useClips Hook - Game Clips Data Fetching
 * 
 * PURPOSE: Fetch game clips and player data for the Clips tab.
 * Designed for prefetching pattern - parent page calls this hook,
 * passes data down to pure child components.
 * 
 * @module useClips
 */

import { useState, useEffect, useRef } from 'react';
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
  
  // Track if we've already fetched to prevent duplicate requests
  const hasFetchedRef = useRef(false);
  const lastFetchKeyRef = useRef<string>('');

  useEffect(() => {
    // Don't fetch if not enabled
    if (options.enabled === false) {
      setLoading(false);
      return;
    }

    // Don't fetch if missing required params
    if (!gameId || !teamId) {
      setLoading(false);
      return;
    }

    // Create a unique key for this fetch
    const fetchKey = `${gameId}-${teamId}`;
    
    // Skip if we've already fetched this exact data
    if (hasFetchedRef.current && lastFetchKeyRef.current === fetchKey) {
      return;
    }

    let isMounted = true;

    async function fetchData() {
      try {
        setError(null);
        // Only set loading true on first fetch, not refetches
        if (!hasFetchedRef.current) {
          setLoading(true);
        }

        // Parallel fetch for clips and players
        const [gameClips, teamPlayers] = await Promise.all([
          getGameClips(gameId),
          CoachPlayerService.getCoachTeamPlayers(teamId),
        ]);

        if (!isMounted) return;

        setClips(gameClips);
        setPlayers(
          teamPlayers.map((p) => ({
            id: p.id,
            name: p.name,
            jersey_number: p.jersey_number,
          }))
        );
        
        hasFetchedRef.current = true;
        lastFetchKeyRef.current = fetchKey;
      } catch (e: any) {
        if (!isMounted) return;
        console.error('❌ useClips: Error fetching clips data:', e);
        setError(e?.message || 'Failed to load clips');
        setClips([]);
        setPlayers([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, [gameId, teamId, options.enabled]);

  return {
    clips,
    players,
    loading,
    error,
  };
}
