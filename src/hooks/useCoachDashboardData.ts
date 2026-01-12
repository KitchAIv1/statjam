'use client';

/**
 * useCoachDashboardData - Consolidated hook for Coach Mission Control
 * 
 * Fetches all dashboard data in parallel for maximum performance:
 * - Video tracking queue status
 * - Live/in-progress games
 * - Recent completed games
 * - Ready clips count
 * 
 * ⚡ Optimized with 2-minute caching to prevent slow dashboard returns
 * 
 * Follows .cursorrules: <100 lines, single responsibility (data fetching)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CoachGame } from '@/lib/types/coach';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';

export interface VideoQueueSummary {
  pending: number;
  assigned: number;
  inProgress: number;
  completed: number;
  total: number;
}

export interface ClipsSummary {
  readyClips: number;
  processingJobs: number;
}

interface CachedDashboardData {
  videoQueue: VideoQueueSummary;
  liveGames: CoachGame[];
  recentGames: CoachGame[];
  clips: ClipsSummary;
}

export interface CoachDashboardData {
  videoQueue: VideoQueueSummary;
  liveGames: CoachGame[];
  recentGames: CoachGame[];
  clips: ClipsSummary;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCoachDashboardData(userId: string | undefined): CoachDashboardData {
  // ⚡ Check cache SYNCHRONOUSLY on initial render - prevents spinner flash
  const [state, setState] = useState<{
    videoQueue: VideoQueueSummary;
    liveGames: CoachGame[];
    recentGames: CoachGame[];
    clips: ClipsSummary;
    loading: boolean;
    error: string | null;
  }>(() => {
    if (userId) {
      const cacheKey = CacheKeys.coachDashboard(userId);
      const cached = cache.get<CachedDashboardData>(cacheKey);
      if (cached) {
        return { ...cached, loading: false, error: null };
      }
    }
    return {
      videoQueue: { pending: 0, assigned: 0, inProgress: 0, completed: 0, total: 0 },
      liveGames: [],
      recentGames: [],
      clips: { readyClips: 0, processingJobs: 0 },
      loading: true,
      error: null
    };
  });

  const fetchData = useCallback(async (skipCache = false) => {
    if (!userId) return;
    
    const cacheKey = CacheKeys.coachDashboard(userId);
    const cached = cache.get<CachedDashboardData>(cacheKey);
    
    // ⚡ Return cached data immediately (unless skipCache)
    if (!skipCache && cached) {
      setState(prev => ({ ...prev, ...cached, loading: false, error: null }));
      return;
    }

    // ⚡ KEY: Only show loading if NO cached data exists (prevents flash on return)
    if (!cached) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }
    
    try {
      // Parallel fetch all dashboard data
      const [videosRes, gamesRes, clipsRes] = await Promise.all([
        supabase.from('game_videos').select('id, assignment_status').eq('uploaded_by', userId),
        supabase.from('games')
          .select('id, opponent_name, status, quarter, game_clock_minutes, game_clock_seconds, home_score, away_score, start_time, end_time, team_a_id')
          .eq('stat_admin_id', userId)
          .order('updated_at', { ascending: false })
          .limit(10),
        supabase.from('generated_clips').select('id, status, job_id').eq('status', 'ready')
      ]);

      // Process video queue
      const videos = videosRes.data || [];
      const videoQueue: VideoQueueSummary = {
        pending: videos.filter(v => v.assignment_status === 'pending').length,
        assigned: videos.filter(v => v.assignment_status === 'assigned').length,
        inProgress: videos.filter(v => v.assignment_status === 'in_progress').length,
        completed: videos.filter(v => v.assignment_status === 'completed').length,
        total: videos.length,
      };

      // ✅ FIX: Calculate scores from game_stats (source of truth)
      const gameIds = (gamesRes.data || []).map(g => g.id);
      const { data: allStats } = gameIds.length > 0 
        ? await supabase
            .from('game_stats')
            .select('game_id, team_id, stat_type, modifier, is_opponent_stat')
            .in('game_id', gameIds)
            .eq('modifier', 'made')
        : { data: [] };

      // Pre-calculate scores from game_stats
      const scoresByGameId = new Map<string, { home: number; away: number }>();
      for (const g of gamesRes.data || []) {
        const gameStats = (allStats || []).filter(s => s.game_id === g.id);
        let home = 0, away = 0;
        
        for (const stat of gameStats) {
          let points = 0;
          if (stat.stat_type === 'field_goal' || stat.stat_type === 'two_pointer') points = 2;
          else if (stat.stat_type === 'three_pointer' || stat.stat_type === '3_pointer') points = 3;
          else if (stat.stat_type === 'free_throw') points = 1;
          else continue;

          if (stat.is_opponent_stat) {
            away += points;
          } else if (stat.team_id === g.team_a_id) {
            home += points;
          } else {
            away += points;
          }
        }
        scoresByGameId.set(g.id, { home, away });
      }

      // Process games with calculated scores
      const games = (gamesRes.data || []).map(g => {
        const calculated = scoresByGameId.get(g.id) || { home: g.home_score || 0, away: g.away_score || 0 };
        return {
          id: g.id,
          opponent_name: g.opponent_name || 'Unknown',
          status: g.status,
          quarter: g.quarter,
          game_clock_minutes: g.game_clock_minutes,
          game_clock_seconds: g.game_clock_seconds,
          home_score: calculated.home, // ✅ Use calculated score
          away_score: calculated.away, // ✅ Use calculated score
          start_time: g.start_time,
          end_time: g.end_time,
          coach_team_id: g.team_a_id,
        } as CoachGame;
      });

      const liveGames = games.filter(g => g.status === 'in_progress');
      const recentGames = games.filter(g => g.status === 'completed').slice(0, 4);

      // Process clips
      const clips: ClipsSummary = {
        readyClips: (clipsRes.data || []).length,
        processingJobs: 0,
      };

      // ⚡ Cache the data
      const dataToCache: CachedDashboardData = { videoQueue, liveGames, recentGames, clips };
      cache.set(cacheKey, dataToCache, CacheTTL.coachDashboard);

      setState({ videoQueue, liveGames, recentGames, clips, loading: false, error: null });

    } catch (err) {
      // ⚡ KEY: Keep showing cached data on error (graceful degradation)
      setState(prev => ({
        ...(cached || prev),
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load dashboard data'
      }));
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchData();
  }, [userId, fetchData]);

  return {
    ...state,
    refetch: () => fetchData(true), // Skip cache when explicitly refetching
  };
}

