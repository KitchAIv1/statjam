import { useEffect, useState, useCallback } from 'react';
import { TournamentLeadersService, PlayerLeader } from '@/lib/services/tournamentLeadersService';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';
import { logger } from '@/lib/utils/logger';

type LeaderCategory = 'points' | 'rebounds' | 'assists' | 'steals' | 'blocks';

interface TournamentLeadersState {
  leaders: PlayerLeader[];
  loading: boolean;
  error: string | null;
}

/**
 * ✅ OPTIMIZED: Custom hook for tournament leaders with caching
 * Caches leader data per category and minGames to avoid recalculation
 */
export function useTournamentLeaders(
  tournamentId: string,
  category: LeaderCategory = 'points',
  minGames: number = 1
) {
  const [state, setState] = useState<TournamentLeadersState>({
    leaders: [],
    loading: true,
    error: null,
  });

  const loadLeaders = useCallback(async (skipCache: boolean = false) => {
    if (!tournamentId) {
      setState({ leaders: [], loading: false, error: null });
      return;
    }

    // ✅ Check cache first
    if (!skipCache) {
      const cacheKey = CacheKeys.tournamentLeaders(tournamentId, category, minGames);
      const cachedLeaders = cache.get<PlayerLeader[]>(cacheKey);
      
      if (cachedLeaders) {
        logger.debug('⚡ useTournamentLeaders: Using cached leaders data');
        setState({ leaders: cachedLeaders, loading: false, error: null });
        return;
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      logger.debug('🔍 useTournamentLeaders: Fetching leaders for tournament:', tournamentId, 'category:', category);
      const leaders = await TournamentLeadersService.getTournamentPlayerLeaders(
        tournamentId,
        category,
        minGames
      );

      // ✅ Cache the result
      const cacheKey = CacheKeys.tournamentLeaders(tournamentId, category, minGames);
      cache.set(cacheKey, leaders, CacheTTL.tournamentLeaders);
      logger.debug('⚡ useTournamentLeaders: Leaders cached for', CacheTTL.tournamentLeaders, 'minutes');

      setState({ leaders, loading: false, error: null });
    } catch (error) {
      console.error('❌ useTournamentLeaders: Error loading leaders:', error);
      setState({
        leaders: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load leaders',
      });
    }
  }, [tournamentId, category, minGames]);

  useEffect(() => {
    loadLeaders();
  }, [loadLeaders]);

  return {
    ...state,
    refetch: () => loadLeaders(true),
  };
}

