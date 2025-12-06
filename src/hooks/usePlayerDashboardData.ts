"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from 'react';
import { PlayerDashboardService } from '@/lib/services/playerDashboardService';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';
import { logger } from '@/lib/utils/logger';
import type { PlayerDashboardData } from '@/lib/types/playerDashboard';

export function usePlayerDashboardData(user: { id: string } | null) {
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
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // ⚡ OPTIMIZATION: Check cache BEFORE setting loading=true to prevent flash
      const userId = user.id;
      const dashboardCacheKey = CacheKeys.playerDashboard(userId);
      const cachedDashboard = cache.get<PlayerDashboardData>(dashboardCacheKey);
      
      if (cachedDashboard) {
        logger.debug('⚡ usePlayerDashboardData: Using cached dashboard data for', userId.substring(0, 8));
        logger.debug('📦 Cached data:', JSON.stringify({
          identity: cachedDashboard.identity,
          season: cachedDashboard.season,
          careerHighs: cachedDashboard.careerHighs,
        }, null, 2));
        // Cache hit: instant load, no loading state
        setData(cachedDashboard);
        setLoading(false);
        return;
      }
      
      logger.debug('🔍 usePlayerDashboardData: Cache miss, fetching fresh data for', userId.substring(0, 8));
      
      // Cache miss: show loading state
      setLoading(true);
      setError(null);
      
      // Fetch only essential data first (reduced from 8 to 4 critical calls)
      const [identity, season, careerHighs, perf] = await Promise.all([
        PlayerDashboardService.getIdentity(userId),
        PlayerDashboardService.getSeasonAverages(userId),
        PlayerDashboardService.getCareerHighs(userId),
        PlayerDashboardService.getPerformance(userId),
      ]);

      // Set essential data immediately for faster UI
      const essentialData = {
        identity,
        season,
        careerHighs,
        kpis: perf.kpis,
        series: perf.series,
        achievements: [],
        notifications: [],
        upcomingGames: [],
        trial: { isTrialActive: false },
      };

      setData(essentialData);
      setLoading(false);

      // Load non-critical data in background
      Promise.all([
        PlayerDashboardService.getAchievements(userId),
        PlayerDashboardService.getNotifications(userId),
        PlayerDashboardService.getUpcomingGames(userId),
        PlayerDashboardService.getTrialState(userId),
      ]).then(([achievements, notifications, upcomingGames, trial]) => {
        const completeData = {
          ...essentialData,
          achievements,
          notifications,
          upcomingGames,
          trial,
        };
        setData(completeData);
        
        // Cache complete data
        if (userId) {
          const dashboardCacheKey = CacheKeys.playerDashboard(userId);
          cache.set(dashboardCacheKey, completeData, CacheTTL.playerDashboard);
        }
      }).catch(err => {
        logger.warn('Background data fetch failed:', err);
      });

    } catch (e: any) {
      logger.error('Dashboard data fetch error:', e);
      setError(e?.message || 'Failed to load dashboard');
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      void refetch();
    }
  }, [user?.id, refetch]);

  return { data, loading, error, refetch };
}


