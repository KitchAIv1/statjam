/**
 * useGameAwards - Hook for Fetching Game Awards
 * 
 * PURPOSE: Fetch Player of the Game and Hustle Player awards for display
 * - Cache-first loading pattern
 * - Supports tournament-level and game-level queries
 * 
 * Follows .cursorrules: <100 lines hook
 */

import { useState, useEffect } from 'react';
import { GameAwardsService, GameAwards } from '@/lib/services/gameAwardsService';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';

export interface GameAwardDisplay {
  gameId: string;
  gameDate: string;
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  playerOfTheGame: {
    id: string;
    name: string;
    stats?: {
      points: number;
      rebounds: number;
      assists: number;
    };
  } | null;
  hustlePlayer: {
    id: string;
    name: string;
    stats?: {
      points: number;
      rebounds: number;
      assists: number;
    };
  } | null;
}

export function useGameAwards(gameId: string | null) {
  const [awards, setAwards] = useState<GameAwards | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      return;
    }

    const loadAwards = async () => {
      // Check cache first
      const cacheKey = CacheKeys.gameAwards(gameId);
      const cached = cache.get<GameAwards>(cacheKey);
      
      if (cached) {
        setAwards(cached);
        setLoading(false);
        return;
      }

      // Fetch from database
      const data = await GameAwardsService.getGameAwards(gameId);
      
      if (data) {
        cache.set(cacheKey, data, CacheTTL.gameAwards); // TTL in minutes
        setAwards(data);
      }
      
      setLoading(false);
    };

    loadAwards();
  }, [gameId]);

  return { awards, loading };
}

