/**
 * useTournamentAwards - Hook for Fetching Tournament Awards
 * 
 * PURPOSE: Fetch recent game awards for a tournament with cache-first loading
 * 
 * Follows .cursorrules: <100 lines hook
 */

import { useState, useEffect } from 'react';
import { GameAwardsService } from '@/lib/services/gameAwardsService';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';

export interface TournamentAward {
  gameId: string;
  gameDate: string;
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  playerOfTheGame: {
    id: string;
    name: string;
    isCustomPlayer?: boolean;  // ✅ Custom player support
    stats: {
      points: number;
      rebounds: number;
      assists: number;
      steals: number;
      blocks: number;
    };
  } | null;
  hustlePlayer: {
    id: string;
    name: string;
    isCustomPlayer?: boolean;  // ✅ Custom player support
    stats: {
      points: number;
      rebounds: number;
      assists: number;
      steals: number;
      blocks: number;
    };
  } | null;
}

export function useTournamentAwards(tournamentId: string | null, limit: number = 5) {
  const [awards, setAwards] = useState<TournamentAward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournamentId) {
      setLoading(false);
      return;
    }

    const loadAwards = async () => {
      // Check cache first (v5 uses per-game queries to avoid PostgREST 1000 row limit)
      const cacheKey = `tournament_awards_v5_${tournamentId}_${limit}`;
      const cached = cache.get<TournamentAward[]>(cacheKey);
      
      if (cached) {
        setAwards(cached);
        setLoading(false);
        return;
      }

      // Fetch from database
      const data = await GameAwardsService.getTournamentAwards(tournamentId, limit);
      
      if (data) {
        cache.set(cacheKey, data, CacheTTL.tournamentLeaders); // Use same TTL as leaders
        setAwards(data);
      }
      
      setLoading(false);
    };

    loadAwards();
  }, [tournamentId, limit]);

  return { awards, loading };
}

