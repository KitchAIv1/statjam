/**
 * useGameOverlayData Hook
 * 
 * Fetches and subscribes to real-time game data for overlay rendering.
 * Returns GameOverlayData for use with video composition.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { GameOverlayData } from '@/lib/services/canvas-overlay';

interface GameStat {
  id: string;
  game_id: string;
  player_id: string;
  team_id: string;
  stat_type: string;
  stat_value: number;
  modifier?: string;
  is_opponent_stat?: boolean;
}

/**
 * Calculate scores from game_stats
 * Matches logic from OrganizerLiveStream and useTracker (source of truth)
 * Works with both COACH mode (is_opponent_stat) and STAT ADMIN mode (team_id matching)
 */
function calculateScoresFromStats(
  stats: GameStat[],
  teamAId: string,
  teamBId: string
): { homeScore: number; awayScore: number } {
  let homeScore = 0;
  let awayScore = 0;

  for (const stat of stats) {
    // ✅ CRITICAL: Only count MADE shots (modifier === 'made')
    if (stat.modifier !== 'made') continue;
    
    const points = stat.stat_value || 0;
    
    // ✅ Handle is_opponent_stat flag (COACH mode)
    // When is_opponent_stat is true, the stat belongs to the opponent team
    if (stat.is_opponent_stat) {
      // Opponent stats go to away score (matches Tracker logic)
      awayScore += points;
    } else if (stat.team_id === teamAId) {
      // Team A stats go to home score
      homeScore += points;
    } else if (stat.team_id === teamBId) {
      // Team B stats go to away score
      awayScore += points;
    }
  }

  return { homeScore, awayScore };
}


export function useGameOverlayData(gameId: string | null) {
  const [overlayData, setOverlayData] = useState<GameOverlayData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs to prevent stale closures and duplicate fetches
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // ✅ P0 FIX: Track previous scores to preserve on query failure
  const prevScoresRef = useRef<{ homeScore: number; awayScore: number }>({
    homeScore: 0, awayScore: 0
  });

  const lastBroadcastAtRef = useRef<number>(0); // timestamp of last broadcast received

  // Stable fetch function
  const fetchGameData = useCallback(async (isInitialLoad: boolean = false) => {
    if (!gameId || !supabase || fetchingRef.current) return;
    
    fetchingRef.current = true;
    
    if (isInitialLoad) {
      setLoading(true);
      setError(null);
    }

    try {
      // Fetch game data (tournament fetched separately to avoid join failures)
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError || !game) {
        throw new Error('Game not found');
      }
      
      // Fetch tournament info separately (optional - won't fail if no tournament)
      // Note: Tournament name is now passed directly from studio's tournament selector
      // This is kept as fallback for cases where tournament selector isn't used
      let tournament: { id: string; name: string; logo?: string } | null = null;
      if (game.tournament_id) {
        const { data: tournamentData } = await supabase
          .from('tournaments')
          .select('id, name, logo')
          .eq('id', game.tournament_id)
          .single();
        tournament = tournamentData;
      }

      // Fetch team data
      const teamIds = [game.team_a_id, game.team_b_id].filter(Boolean);
      const { data: teams } = await supabase
        .from('teams')
        .select('id, name, logo_url, primary_color, secondary_color, accent_color')
        .in('id', teamIds);

      const teamsMap = new Map((teams || []).map(t => [t.id, t]));
      const teamA = teamsMap.get(game.team_a_id);
      const teamB = teamsMap.get(game.team_b_id);

      // Fetch game stats for score calculation
      const { data: stats, error: statsError } = await supabase
        .from('game_stats')
        .select('id, game_id, player_id, team_id, stat_type, stat_value, modifier, is_opponent_stat')
        .eq('game_id', gameId);

      // ✅ P0 FIX: If stats query fails, preserve previous scores instead of resetting to 0-0
      let calculatedScores: { homeScore: number; awayScore: number };
      
      if (statsError || !stats) {
        // Preserve previous scores on error - don't reset to 0-0
        calculatedScores = {
          homeScore: prevScoresRef.current.homeScore,
          awayScore: prevScoresRef.current.awayScore,
        };
        console.warn('⚠️ Stats query failed, preserving previous scores:', statsError?.message);
      } else {
        // Calculate scores from game_stats (source of truth for points)
        calculatedScores = calculateScoresFromStats(stats, game.team_a_id, game.team_b_id);
        // Update ref with successful values
        prevScoresRef.current = calculatedScores;
      }

      if (!mountedRef.current) return;
      
      // Only overwrite clock from DB if no recent broadcast (within 5 seconds)
      const broadcastIsActive = Date.now() - lastBroadcastAtRef.current < 5000;
      setOverlayData((prev) => {
        // Quarter changed: use DB clock so halftime overlay sees correct isClockRunning (false) and stays until Q3 starts
        const quarterChanged = prev != null && prev.quarter !== (game.quarter || 1);
        const useDbClock = !broadcastIsActive || quarterChanged;
        return {
        teamAName: teamA?.name || 'Team A',
        teamBName: teamB?.name || 'Team B',
        teamAId: game.team_a_id,
        teamBId: game.team_b_id,
        homeScore: calculatedScores.homeScore,
        awayScore: calculatedScores.awayScore,
        quarter: game.quarter || 1,
        gameClockMinutes: useDbClock ? (game.game_clock_minutes ?? 0) : (prev?.gameClockMinutes ?? game.game_clock_minutes ?? 0),
        gameClockSeconds: useDbClock ? (game.game_clock_seconds ?? 0) : (prev?.gameClockSeconds ?? game.game_clock_seconds ?? 0),
        shotClockSeconds: game.shot_clock_seconds,
        isClockRunning: useDbClock ? (game.is_clock_running ?? false) : (prev?.isClockRunning ?? game.is_clock_running ?? false),
        gameStatus: game.status ?? 'scheduled',
        teamALogo: teamA?.logo_url,
        teamBLogo: teamB?.logo_url,
        teamAPrimaryColor: teamA?.primary_color,
        teamBPrimaryColor: teamB?.primary_color,
        teamASecondaryColor: teamA?.secondary_color,
        teamBSecondaryColor: teamB?.secondary_color,
        teamAAccentColor: teamA?.accent_color,
        teamBAccentColor: teamB?.accent_color,
        // ✅ FIX: Read fouls from games table (source of truth - resets each quarter)
        teamAFouls: game.team_a_fouls ?? 0,
        teamBFouls: game.team_b_fouls ?? 0,
        teamATimeouts: game.team_a_timeouts_remaining ?? 5,
        teamBTimeouts: game.team_b_timeouts_remaining ?? 5,
        currentPossessionTeamId: game.current_possession_team_id,
        jumpBallArrowTeamId: game.jump_ball_arrow_team_id,
        venue: game.venue,
        // ✅ Tournament info from joined query
        tournamentName: tournament?.name,
        tournamentLogo: tournament?.logo,
      };
      });
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load game data');
      }
    } finally {
      fetchingRef.current = false;
      if (mountedRef.current && isInitialLoad) {
        setLoading(false);
      }
    }
  }, [gameId]);

  // Debounced refetch for real-time updates
  const debouncedRefetch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchGameData(false);
    }, 300); // 300ms debounce
  }, [fetchGameData]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!gameId || !supabase) {
      setOverlayData(null);
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchGameData(true);

    // Subscribe to clock broadcast from tracker
    const clockChannel = supabase
      .channel(`clock:${gameId}`)
      .on('broadcast', { event: 'clock_tick' }, ({ payload }) => {
        // Ignore stale broadcasts (e.g. from previous tracker session)
        if (payload.sentAt && Date.now() - payload.sentAt > 3000) return;
        console.log('🕐 Clock broadcast received:', payload.secondsRemaining, payload.isRunning);
        if (!mountedRef.current) return;
        lastBroadcastAtRef.current = Date.now();
        setOverlayData(prev => prev ? {
          ...prev,
          gameClockMinutes: Math.floor(payload.secondsRemaining / 60),
          gameClockSeconds: payload.secondsRemaining % 60,
          isClockRunning: payload.isRunning
        } : null);
      })
      .subscribe();

    // Subscribe to real-time updates (debounced)
    const statsChannel = supabase
      .channel(`overlay_stats:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_stats',
          filter: `game_id=eq.${gameId}`,
        },
        debouncedRefetch
      )
      .subscribe();

    const gamesChannel = supabase
      .channel(`overlay_game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          const scoringKeys = [
            'home_score', 'away_score',
            'team_a_fouls', 'team_b_fouls',
            'quarter', 'status',
            'team_a_timeouts_remaining', 'team_b_timeouts_remaining'
          ] as const;
          const oldRow = payload?.old as Record<string, unknown> | undefined;
          const newRow = payload?.new as Record<string, unknown> | undefined;
          if (!newRow) return;
          if (!oldRow || Object.keys(oldRow).length <= 1) {
            // payload.old only has id — REPLICA IDENTITY FULL not active yet, safe fallback
            debouncedRefetch();
            return;
          }
          const scoringChanged = scoringKeys.some(
            (key) => oldRow[key] !== newRow[key]
          );
          if (scoringChanged) debouncedRefetch();
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (clockChannel) supabase?.removeChannel(clockChannel);
      supabase?.removeChannel(statsChannel);
      supabase?.removeChannel(gamesChannel);
    };
  }, [gameId, fetchGameData, debouncedRefetch]);

  return { overlayData, loading, error };
}
