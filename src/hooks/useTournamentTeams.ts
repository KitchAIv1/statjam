import { useEffect, useState, useCallback } from 'react';
import { TeamService } from '@/lib/services/tournamentService';
import { Team } from '@/lib/types/team';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';
import { logger } from '@/lib/utils/logger';

interface TournamentTeamsState {
  teams: Team[];
  loading: boolean;
  error: string | null;
}

/**
 * ✅ OPTIMIZED: Custom hook for tournament teams with cache-first loading
 * Prevents loading flash by checking cache BEFORE setting loading state
 */
export function useTournamentTeams(tournamentId: string) {
  const [state, setState] = useState<TournamentTeamsState>({
    teams: [],
    loading: true,
    error: null,
  });

  const loadTeams = useCallback(async (skipCache: boolean = false) => {
    if (!tournamentId) {
      setState({ teams: [], loading: false, error: null });
      return;
    }

    // ✅ CRITICAL: Check cache FIRST before setting loading=true
    // This prevents the loading skeleton flash on subsequent visits
    if (!skipCache) {
      const cacheKey = CacheKeys.tournamentTeams(tournamentId);
      const cachedTeams = cache.get<Team[]>(cacheKey);
      
      if (cachedTeams) {
        logger.debug('⚡ useTournamentTeams: Using cached teams data');
        // Set data immediately without loading state
        setState({ teams: cachedTeams, loading: false, error: null });
        return;
      }
    }

    // Only set loading=true if cache miss
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      logger.debug('🔍 useTournamentTeams: Fetching teams for tournament:', tournamentId);
      const teams = await TeamService.getTeamsByTournament(tournamentId);

      // ✅ Cache the result
      const cacheKey = CacheKeys.tournamentTeams(tournamentId);
      cache.set(cacheKey, teams, CacheTTL.tournamentTeams);
      logger.debug('⚡ useTournamentTeams: Teams cached for', CacheTTL.tournamentTeams, 'minutes');

      setState({ teams, loading: false, error: null });
    } catch (error) {
      console.error('❌ useTournamentTeams: Error loading teams:', error);
      setState({
        teams: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load teams',
      });
    }
  }, [tournamentId]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  return {
    ...state,
    refetch: () => loadTeams(true),
  };
}

