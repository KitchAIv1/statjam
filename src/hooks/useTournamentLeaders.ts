import { useEffect, useState, useCallback, useRef } from 'react';
import { TournamentLeadersService, PlayerLeader, LeaderGamePhase } from '@/lib/services/tournamentLeadersService';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';
import { logger } from '@/lib/utils/logger';

/**
 * Tournament leaders hook with caching and in-flight guard.
 * - fetchingRef: Tracks cache keys currently being fetched. Multiple hook instances
 *   (OverviewTab, LeadersTab, prefetch) can mount at once; without this guard they would
 *   all fire duplicate fetches for the same key before any single one populates the cache.
 *   Do not remove fetchingRef — it prevents 8–10× duplicate full fetches on cold load.
 * See docs/performance/tournament-page-optimizations.md for full context.
 */

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
  const fetchingRef = useRef<Set<string>>(new Set());

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

    // Guard against duplicate in-flight fetches
    if (fetchingRef.current.has(cacheKey)) {
      logger.debug('⏳ useTournamentLeaders: Fetch already in-flight for', cacheKey);
      return;
    }
    fetchingRef.current.add(cacheKey);

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
    } finally {
      fetchingRef.current.delete(cacheKey);
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

