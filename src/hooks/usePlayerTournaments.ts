/**
 * usePlayerTournaments - Hook for player tournaments and schedules
 * 
 * PURPOSE: Cache-aware hook for player tournaments with efficient loading
 * Follows same pattern as useTournamentTeams
 * 
 * Follows .cursorrules: <100 lines hook
 */

import { useEffect, useState, useCallback } from 'react';
import { PlayerTournamentsService, PlayerTournament, PlayerGameSchedule } from '@/lib/services/playerTournamentsService';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';

interface PlayerTournamentsState {
  tournaments: PlayerTournament[];
  schedules: PlayerGameSchedule[];
  loading: boolean;
  error: string | null;
}

export function usePlayerTournaments(userId: string) {
  const [state, setState] = useState<PlayerTournamentsState>({
    tournaments: [],
    schedules: [],
    loading: true,
    error: null,
  });

  const loadTournaments = useCallback(async (skipCache: boolean = false) => {
    if (!userId) {
      setState({ tournaments: [], schedules: [], loading: false, error: null });
      return;
    }

    // ✅ CRITICAL: Check cache FIRST before setting loading=true
    if (!skipCache) {
      const cacheKey = CacheKeys.playerTournaments(userId);
      const cachedData = cache.get<PlayerTournamentsState>(cacheKey);
      
      if (cachedData) {
        console.log('⚡ usePlayerTournaments: Using cached tournaments data');
        setState({ ...cachedData, loading: false });
        return;
      }
    }

    // Only set loading=true if cache miss
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🔍 usePlayerTournaments: Fetching tournaments for player:', userId);
      
      // Parallel fetch tournaments and schedules
      const [tournaments, schedules] = await Promise.all([
        PlayerTournamentsService.getPlayerTournaments(userId),
        PlayerTournamentsService.getPlayerGameSchedules(userId),
      ]);

      const result: PlayerTournamentsState = {
        tournaments,
        schedules,
        loading: false,
        error: null,
      };

      // ✅ Cache the result
      const cacheKey = CacheKeys.playerTournaments(userId);
      cache.set(cacheKey, result, CacheTTL.playerTournaments);
      console.log('⚡ usePlayerTournaments: Tournaments cached for', CacheTTL.playerTournaments, 'minutes');

      setState(result);
    } catch (error) {
      console.error('❌ usePlayerTournaments: Error loading tournaments:', error);
      setState({
        tournaments: [],
        schedules: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load tournaments',
      });
    }
  }, [userId]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  return {
    ...state,
    refetch: () => loadTournaments(true),
  };
}

