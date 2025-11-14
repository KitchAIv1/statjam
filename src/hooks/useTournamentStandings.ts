import { useEffect, useState, useCallback } from 'react';
import { TournamentStandingsService, TeamStanding } from '@/lib/services/tournamentStandingsService';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';

interface TournamentStandingsState {
  standings: TeamStanding[];
  loading: boolean;
  error: string | null;
}

/**
 * ✅ OPTIMIZED: Custom hook for tournament standings with caching
 * TournamentStandingsService already batches queries, this adds caching layer
 */
export function useTournamentStandings(tournamentId: string) {
  const [state, setState] = useState<TournamentStandingsState>({
    standings: [],
    loading: true,
    error: null,
  });

  const loadStandings = useCallback(async (skipCache: boolean = false) => {
    if (!tournamentId) {
      setState({ standings: [], loading: false, error: null });
      return;
    }

    // ✅ Check cache first
    if (!skipCache) {
      const cacheKey = CacheKeys.tournamentStandings(tournamentId);
      const cachedStandings = cache.get<TeamStanding[]>(cacheKey);
      
      if (cachedStandings) {
        console.log('⚡ useTournamentStandings: Using cached standings data');
        setState({ standings: cachedStandings, loading: false, error: null });
        return;
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🔍 useTournamentStandings: Fetching standings for tournament:', tournamentId);
      const standings = await TournamentStandingsService.getTournamentStandings(tournamentId);

      // ✅ Cache the result
      const cacheKey = CacheKeys.tournamentStandings(tournamentId);
      cache.set(cacheKey, standings, CacheTTL.tournamentStandings);
      console.log('⚡ useTournamentStandings: Standings cached for', CacheTTL.tournamentStandings, 'minutes');

      setState({ standings, loading: false, error: null });
    } catch (error) {
      console.error('❌ useTournamentStandings: Error loading standings:', error);
      setState({
        standings: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load standings',
      });
    }
  }, [tournamentId]);

  useEffect(() => {
    loadStandings();
  }, [loadStandings]);

  return {
    ...state,
    refetch: () => loadStandings(true),
  };
}

