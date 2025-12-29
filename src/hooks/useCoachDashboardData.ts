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
 * Follows .cursorrules: <100 lines, single responsibility (data fetching)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CoachGame } from '@/lib/types/coach';

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
  const [videoQueue, setVideoQueue] = useState<VideoQueueSummary>({ pending: 0, assigned: 0, inProgress: 0, completed: 0, total: 0 });
  const [liveGames, setLiveGames] = useState<CoachGame[]>([]);
  const [recentGames, setRecentGames] = useState<CoachGame[]>([]);
  const [clips, setClips] = useState<ClipsSummary>({ readyClips: 0, processingJobs: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);

      // Parallel fetch all dashboard data
      const [videosRes, gamesRes, clipsRes] = await Promise.all([
        // 1. Video queue status (coach's uploaded videos)
        supabase
          .from('game_videos')
          .select('id, assignment_status')
          .eq('uploaded_by', userId),
        
        // 2. Games (live + recent)
        supabase
          .from('games')
          .select('id, opponent_name, status, quarter, game_clock_minutes, game_clock_seconds, home_score, away_score, start_time, end_time, team_a_id')
          .eq('stat_admin_id', userId)
          .order('updated_at', { ascending: false })
          .limit(10),
        
        // 3. Clips ready count
        supabase
          .from('generated_clips')
          .select('id, status, job_id')
          .eq('status', 'ready')
      ]);

      // Process video queue
      const videos = videosRes.data || [];
      setVideoQueue({
        pending: videos.filter(v => v.assignment_status === 'pending').length,
        assigned: videos.filter(v => v.assignment_status === 'assigned').length,
        inProgress: videos.filter(v => v.assignment_status === 'in_progress').length,
        completed: videos.filter(v => v.assignment_status === 'completed').length,
        total: videos.length,
      });

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

      setLiveGames(games.filter(g => g.status === 'in_progress'));
      setRecentGames(games.filter(g => g.status === 'completed').slice(0, 4));

      // Process clips
      const readyClips = clipsRes.data || [];
      setClips({
        readyClips: readyClips.length,
        processingJobs: 0, // Could add processing job count if needed
      });

    } catch (err) {
      console.error('❌ useCoachDashboardData error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    videoQueue,
    liveGames,
    recentGames,
    clips,
    loading,
    error,
    refetch: fetchData,
  };
}

