/**
 * useGameAnalytics Hook - Game Analytics with Prefetching
 * 
 * PURPOSE: Fetch game analytics breakdown with prefetch support
 * for instant tab switching in Command Center.
 * 
 * FEATURES:
 * - Prefetch mode for background loading
 * - Smart loading state management
 * - Follows existing hook patterns (useTeamStats, useGameAwards)
 * 
 * Follows .cursorrules: <100 lines, single responsibility
 */

import { useState, useEffect, useCallback } from 'react';
import { CoachAnalyticsService } from '@/lib/services/coachAnalyticsService';
import { GameBreakdown } from '@/lib/types/coachAnalytics';

export interface UseGameAnalyticsOptions {
  prefetch?: boolean;
  enabled?: boolean;
}

export interface GameAnalyticsData {
  analytics: GameBreakdown | null;
  loading: boolean;
  error: string | null;
}

export function useGameAnalytics(
  gameId: string,
  teamId: string,
  options: UseGameAnalyticsOptions = {}
): GameAnalyticsData {
  const [analytics, setAnalytics] = useState<GameBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!gameId || !teamId) return;
    
    // Respect enabled option (default true for backward compatibility)
    if (options.enabled === false) return;

    try {
      // Smart loading: No spinner during prefetch
      if (!options.prefetch) {
        setLoading(true);
      }
      setError(null);

      const data = await CoachAnalyticsService.getGameBreakdown(gameId, teamId);
      setAnalytics(data);

    } catch (e: any) {
      console.error('❌ useGameAnalytics: Error fetching analytics:', e);
      setError(e?.message || 'Failed to load analytics');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [gameId, teamId, options.enabled, options.prefetch]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error
  };
}

