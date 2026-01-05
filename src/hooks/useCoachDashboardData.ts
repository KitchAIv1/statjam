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
    
    // ⚡ Check cache first (unless skipCache is true)
    if (!skipCache) {
      const cached = cache.get<CachedDashboardData>(cacheKey);
      if (cached) {
        setState(prev => ({ ...prev, ...cached, loading: false, error: null }));
        return;
      }
    }
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

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

      // Process games
      const games = (gamesRes.data || []).map(g => ({
        id: g.id,
        opponent_name: g.opponent_name || 'Unknown',
        status: g.status,
        quarter: g.quarter,
        game_clock_minutes: g.game_clock_minutes,
        game_clock_seconds: g.game_clock_seconds,
        home_score: g.home_score,
        away_score: g.away_score,
        start_time: g.start_time,
        end_time: g.end_time,
        coach_team_id: g.team_a_id,
      } as CoachGame));

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
      console.error('❌ useCoachDashboardData error:', err);
      setState(prev => ({
        ...prev,
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

