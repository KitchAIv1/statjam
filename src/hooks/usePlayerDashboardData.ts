"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from 'react';
import { PlayerDashboardService } from '@/lib/services/playerDashboardService';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';
import type { PlayerDashboardData } from '@/lib/types/playerDashboard';

export function usePlayerDashboardData() {
  const [data, setData] = useState<PlayerDashboardData>({
    identity: null,
    season: null,
    careerHighs: null,
    kpis: null,
    series: [],
    upcomingGames: [],
    achievements: [],
    notifications: [],
    trial: { isTrialActive: false },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      console.log('🔄 PlayerDashboard Hook: Starting data fetch...');
      setLoading(true);
      setError(null);
      
      // Check if we have cached dashboard data first
      const userId = (await import('@/store/authStore')).useAuthStore.getState().user?.id;
      if (userId) {
        const dashboardCacheKey = CacheKeys.playerDashboard(userId);
        const cachedDashboard = cache.get<PlayerDashboardData>(dashboardCacheKey);
        if (cachedDashboard) {
          console.log('✅ PlayerDashboard Hook: Returning cached dashboard data');
          setData(cachedDashboard);
          setLoading(false);
          return;
        }
      }
      
      // Fetch all data in parallel (reduced from 8 to essential calls)
      const [identity, season, careerHighs, perf, achievements, notifications, upcomingGames, trial] = await Promise.all([
        PlayerDashboardService.getIdentity(),
        PlayerDashboardService.getSeasonAverages(),
        PlayerDashboardService.getCareerHighs(),
        PlayerDashboardService.getPerformance(),
        PlayerDashboardService.getAchievements(),
        PlayerDashboardService.getNotifications(),
        PlayerDashboardService.getUpcomingGames(),
        PlayerDashboardService.getTrialState(),
      ]);

      console.log('🔄 PlayerDashboard Hook: Data fetch results:', {
        hasIdentity: !!identity,
        hasSeason: !!season,
        hasCareerHighs: !!careerHighs,
        hasKpis: !!perf.kpis,
        seriesCount: perf.series?.length || 0,
        achievementCount: achievements?.length || 0,
        notificationCount: notifications?.length || 0,
        upcomingGameCount: upcomingGames?.length || 0,
      });

      const dashboardData = {
        identity,
        season,
        careerHighs,
        kpis: perf.kpis,
        series: perf.series,
        achievements,
        notifications,
        upcomingGames,
        trial,
      };

      setData(dashboardData);

      // Cache the complete dashboard data for future requests
      if (userId) {
        const dashboardCacheKey = CacheKeys.playerDashboard(userId);
        cache.set(dashboardCacheKey, dashboardData, CacheTTL.DASHBOARD_DATA);
        console.log('💾 PlayerDashboard Hook: Cached complete dashboard data');
      }
    } catch (e: any) {
      console.error('🔄 PlayerDashboard Hook: Data fetch error:', e);
      setError(e?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}


