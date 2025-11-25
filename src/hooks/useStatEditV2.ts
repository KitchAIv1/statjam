/**
 * useStatEditV2 - Optimized Hook for Stat Edit Modal
 * 
 * PERFORMANCE IMPROVEMENTS:
 * - Caching layer (5 min TTL)
 * - Optimized filtering with useMemo
 * - Error handling with retry
 * 
 * Follows .cursorrules: <100 lines hook
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { StatEditServiceV2 } from '@/lib/services/statEditServiceV2';
import { GameStatRecord } from '@/lib/services/statEditService';

interface UseStatEditV2Return {
  gameStats: GameStatRecord[];
  filteredStats: GameStatRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useStatEditV2(
  gameId: string,
  filterQuarter: string
): UseStatEditV2Return {
  const [gameStats, setGameStats] = useState<GameStatRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!gameId) return;
    
    try {
      setLoading(true);
      setError(null);
      const stats = await StatEditServiceV2.getGameStats(gameId);
      setGameStats(stats);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
      setError(err?.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ⚡ MEMOIZED FILTERING: Only recalculates when gameStats or filterQuarter changes
  const filteredStats = useMemo(() => {
    if (filterQuarter === 'all') return gameStats;
    return gameStats.filter(stat => stat.quarter === parseInt(filterQuarter));
  }, [gameStats, filterQuarter]);

  return {
    gameStats,
    filteredStats,
    loading,
    error,
    refetch: fetchStats
  };
}

