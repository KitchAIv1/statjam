"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from 'react';
import { PlayerDashboardService } from '@/lib/services/playerDashboardService';
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

      setData({
        identity,
        season,
        careerHighs,
        kpis: perf.kpis,
        series: perf.series,
        achievements,
        notifications,
        upcomingGames,
        trial,
      });
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


