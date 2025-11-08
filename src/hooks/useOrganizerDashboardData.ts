import { useState, useEffect, useCallback } from 'react';
import { OrganizerDashboardService } from '@/lib/services/organizerDashboardService';
import { 
  OrganizerDashboardData, 
  OrganizerDashboardState,
  defaultOrganizerDashboardData 
} from '@/lib/types/organizerDashboard';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';

export function useOrganizerDashboardData(user: { id: string } | null) {
  const [state, setState] = useState<OrganizerDashboardState>({
    data: defaultOrganizerDashboardData,
    loading: true,
    error: null
  });

  const refetch = useCallback(async (skipCache: boolean = false) => {
    if (!user?.id) {
      console.log('🔍 useOrganizerDashboardData: No user ID, skipping fetch');
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    // ⚡ Check cache first (unless skipCache is true)
    if (!skipCache) {
      const cacheKey = CacheKeys.organizerDashboard(user.id);
      const cachedData = cache.get<OrganizerDashboardData>(cacheKey);
      
      if (cachedData) {
        console.log('⚡ useOrganizerDashboardData: Using cached data');
        setState({
          data: cachedData,
          loading: false,
          error: null
        });
        return;
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('🔍 useOrganizerDashboardData: Fetching fresh dashboard data...');
      const dashboardData = await OrganizerDashboardService.getDashboardData(user.id);
      
      // ⚡ Store in cache
      const cacheKey = CacheKeys.organizerDashboard(user.id);
      cache.set(cacheKey, dashboardData, CacheTTL.organizerDashboard);
      console.log('⚡ useOrganizerDashboardData: Data cached for', CacheTTL.organizerDashboard, 'minutes');
      
      setState({
        data: dashboardData,
        loading: false,
        error: null
      });
      
      console.log('✅ useOrganizerDashboardData: Dashboard data fetched successfully:', {
        tournamentsCount: dashboardData.recentTournaments.length,
        upcomingGamesCount: dashboardData.upcomingGames.length,
        stats: dashboardData.stats
      });
    } catch (error) {
      console.error('❌ useOrganizerDashboardData: Error fetching dashboard data:', error);
      setState({
        data: defaultOrganizerDashboardData,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data'
      });
    }
  }, [user?.id]);

  // Invalidate cache and refetch
  const invalidateCache = useCallback(() => {
    if (user?.id) {
      const cacheKey = CacheKeys.organizerDashboard(user.id);
      cache.delete(cacheKey);
      console.log('🗑️ useOrganizerDashboardData: Cache invalidated');
      refetch(true); // Skip cache and fetch fresh data
    }
  }, [user?.id, refetch]);

  // Load data when user is available
  useEffect(() => {
    if (user?.id) {
      refetch();
    }
  }, [user?.id, refetch]);

  // Return the state, refetch, and invalidateCache functions
  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch,
    invalidateCache
  };
}
