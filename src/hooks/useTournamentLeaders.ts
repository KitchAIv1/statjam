import { useEffect, useState, useCallback } from 'react';
import { TournamentLeadersService, PlayerLeader, LeaderGamePhase } from '@/lib/services/tournamentLeadersService';
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
 * Caches leader data per category, minGames, and gamePhase to avoid recalculation
 * 
 * @param gamePhase - Optional filter: 'all' (default), 'regular', 'playoffs', 'finals'
 */
export function useTournamentLeaders(
  tournamentId: string,
  category: LeaderCategory = 'points',
  minGames: number = 1,
  gamePhase: LeaderGamePhase = 'all'
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

    // ✅ Include gamePhase in cache key for proper separation
    const cacheKey = `${CacheKeys.tournamentLeaders(tournamentId, category, minGames)}_${gamePhase}`;
    logger.debug('🎯 useTournamentLeaders: gamePhase =', gamePhase, 'cacheKey =', cacheKey);

    // ✅ Check cache first
    if (!skipCache) {
      const cachedLeaders = cache.get<PlayerLeader[]>(cacheKey);
      
      if (cachedLeaders) {
        logger.debug('⚡ useTournamentLeaders: Using cached leaders for phase:', gamePhase, 'count:', cachedLeaders.length);
        setState({ leaders: cachedLeaders, loading: false, error: null });
        return;
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      logger.debug('🔍 useTournamentLeaders: Fetching leaders for tournament:', tournamentId, 'category:', category, 'phase:', gamePhase);
      const leaders = await TournamentLeadersService.getTournamentPlayerLeaders(
        tournamentId,
        category,
        minGames,
        gamePhase
      );

      // ✅ Cache the result
      cache.set(cacheKey, leaders, CacheTTL.tournamentLeaders);
      logger.debug('⚡ useTournamentLeaders: Leaders cached for', CacheTTL.tournamentLeaders, 'minutes');

      setState({ leaders, loading: false, error: null });
    } catch (error) {
      logger.error('❌ useTournamentLeaders: Error loading leaders:', error);
      setState({
        leaders: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load leaders',
      });
    }
  }, [tournamentId, category, minGames, gamePhase]);

  useEffect(() => {
    loadLeaders();
  }, [loadLeaders]);

  return {
    ...state,
    refetch: () => loadLeaders(true),
  };
}

