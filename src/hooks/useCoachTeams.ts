import { useState, useEffect, useCallback } from 'react';
import { CoachTeamService } from '@/lib/services/coachTeamService';
import { CoachTeam } from '@/lib/types/coach';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';

interface CoachTeamsState {
  teams: CoachTeam[];
  loading: boolean;
  error: string | null;
}

export function useCoachTeams(user: { id: string; role: string } | null) {
  // ⚡ Check cache SYNCHRONOUSLY on initial render - prevents spinner flash
  const [state, setState] = useState<CoachTeamsState>(() => {
    if (user?.id && user.role === 'coach') {
      const cacheKey = CacheKeys.coachTeams(user.id);
      const cachedTeams = cache.get<CoachTeam[]>(cacheKey);
      if (cachedTeams) {
        return { teams: cachedTeams, loading: false, error: null };
      }
    }
    return { teams: [], loading: true, error: null };
  });

  const refetch = useCallback(async (skipCache: boolean = false) => {
    if (!user?.id || user.role !== 'coach') {
      console.log('🔍 useCoachTeams: No coach user, skipping fetch');
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    // ⚡ Check cache first (unless skipCache is true)
    if (!skipCache) {
      const cacheKey = CacheKeys.coachTeams(user.id);
      const cachedTeams = cache.get<CoachTeam[]>(cacheKey);
      
      if (cachedTeams) {
        console.log('⚡ useCoachTeams: Using cached teams data');
        setState({
          teams: cachedTeams,
          loading: false,
          error: null
        });
        return;
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('🔍 useCoachTeams: Fetching fresh teams data...');
      const coachTeams = await CoachTeamService.getCoachTeams(user.id);
      
      // ⚡ Store in cache
      const cacheKey = CacheKeys.coachTeams(user.id);
      cache.set(cacheKey, coachTeams, CacheTTL.coachTeams);
      console.log('⚡ useCoachTeams: Teams cached for', CacheTTL.coachTeams, 'minutes');
      
      setState({
        teams: coachTeams,
        loading: false,
        error: null
      });
      
      console.log('✅ useCoachTeams: Teams fetched successfully:', coachTeams.length, 'teams');
    } catch (error) {
      console.error('❌ useCoachTeams: Error fetching teams:', error);
      setState({
        teams: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load teams'
      });
    }
  }, [user?.id, user?.role]);

  // Invalidate cache and refetch
  const invalidateCache = useCallback(() => {
    if (user?.id) {
      const cacheKey = CacheKeys.coachTeams(user.id);
      cache.delete(cacheKey);
      console.log('🗑️ useCoachTeams: Cache invalidated');
      refetch(true); // Skip cache and fetch fresh data
    }
  }, [user?.id, refetch]);

  // Load data when user is available
  useEffect(() => {
    if (user?.id && user.role === 'coach') {
      refetch();
    }
  }, [user?.id, user?.role, refetch]);

  // Return the state, refetch, and invalidateCache functions
  return {
    teams: state.teams,
    loading: state.loading,
    error: state.error,
    refetch,
    invalidateCache
  };
}

