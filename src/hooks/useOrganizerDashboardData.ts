import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { OrganizerDashboardService } from '@/lib/services/organizerDashboardService';
import { 
  OrganizerDashboardData, 
  OrganizerDashboardState,
  defaultOrganizerDashboardData 
} from '@/lib/types/organizerDashboard';

export function useOrganizerDashboardData() {
  const { user, initialized, loading: authLoading } = useAuthStore();
  const [state, setState] = useState<OrganizerDashboardState>({
    data: defaultOrganizerDashboardData,
    loading: true,
    error: null
  });

  const refetch = useCallback(async () => {
    if (!user?.id) {
      console.log('🔍 useOrganizerDashboardData: No user ID, skipping fetch');
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('🔍 useOrganizerDashboardData: Fetching dashboard data...');
      const dashboardData = await OrganizerDashboardService.getDashboardData(user.id);
      
      setState({
        data: dashboardData,
        loading: false,
        error: null
      });
      
      console.log('🔍 useOrganizerDashboardData: Dashboard data fetched successfully:', {
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

  // Load data when auth is initialized and user is available
  useEffect(() => {
    if (initialized && !authLoading && user?.id) {
      refetch();
    }
  }, [initialized, authLoading, user?.id, refetch]);

  // Return the state and refetch function
  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch
  };
}
