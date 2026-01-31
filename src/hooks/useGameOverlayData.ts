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

/**
 * Calculate fouls from game_stats
 * Counts all foul stats per team for accurate overlay display
 */
function calculateFoulsFromStats(
  stats: GameStat[],
  teamAId: string,
  teamBId: string
): { teamAFouls: number; teamBFouls: number } {
  let teamAFouls = 0;
  let teamBFouls = 0;

  for (const stat of stats) {
    // Only count foul stat types
    if (stat.stat_type !== 'foul') continue;
    
    // ✅ Handle is_opponent_stat flag (COACH mode)
    if (stat.is_opponent_stat) {
      // Opponent fouls go to away team (Team B)
      teamBFouls++;
    } else if (stat.team_id === teamAId) {
      teamAFouls++;
    } else if (stat.team_id === teamBId) {
      teamBFouls++;
    }
  }

  return { teamAFouls, teamBFouls };
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
  const prevScoresRef = useRef<{ homeScore: number; awayScore: number; teamAFouls: number; teamBFouls: number }>({
    homeScore: 0, awayScore: 0, teamAFouls: 0, teamBFouls: 0
  });

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
      let calculatedFouls: { teamAFouls: number; teamBFouls: number };
      
      if (statsError || !stats) {
        // Preserve previous scores on error - don't reset to 0-0
        calculatedScores = {
          homeScore: prevScoresRef.current.homeScore,
          awayScore: prevScoresRef.current.awayScore,
        };
        calculatedFouls = {
          teamAFouls: prevScoresRef.current.teamAFouls,
          teamBFouls: prevScoresRef.current.teamBFouls,
        };
        console.warn('⚠️ Stats query failed, preserving previous scores:', statsError?.message);
      } else {
        // Calculate scores and fouls from game_stats (source of truth)
        calculatedScores = calculateScoresFromStats(stats, game.team_a_id, game.team_b_id);
        calculatedFouls = calculateFoulsFromStats(stats, game.team_a_id, game.team_b_id);
        // Update ref with successful values
        prevScoresRef.current = { ...calculatedScores, ...calculatedFouls };
      }

      if (!mountedRef.current) return;
      
      setOverlayData({
        teamAName: teamA?.name || 'Team A',
        teamBName: teamB?.name || 'Team B',
        teamAId: game.team_a_id,
        teamBId: game.team_b_id,
        homeScore: calculatedScores.homeScore,
        awayScore: calculatedScores.awayScore,
        quarter: game.quarter || 1,
        // ✅ FIX: Use ?? instead of || to allow 0 as valid value (under 1 minute remaining)
        gameClockMinutes: game.game_clock_minutes ?? 0,
        gameClockSeconds: game.game_clock_seconds ?? 0,
        shotClockSeconds: game.shot_clock_seconds,
        teamALogo: teamA?.logo_url,
        teamBLogo: teamB?.logo_url,
        teamAPrimaryColor: teamA?.primary_color,
        teamBPrimaryColor: teamB?.primary_color,
        teamASecondaryColor: teamA?.secondary_color,
        teamBSecondaryColor: teamB?.secondary_color,
        teamAAccentColor: teamA?.accent_color,
        teamBAccentColor: teamB?.accent_color,
        // ✅ Calculate fouls from stats (not games table) for accurate display
        teamAFouls: calculatedFouls.teamAFouls,
        teamBFouls: calculatedFouls.teamBFouls,
        teamATimeouts: game.team_a_timeouts_remaining ?? 5,
        teamBTimeouts: game.team_b_timeouts_remaining ?? 5,
        currentPossessionTeamId: game.current_possession_team_id,
        jumpBallArrowTeamId: game.jump_ball_arrow_team_id,
        venue: game.venue,
        // ✅ Tournament info from joined query
        tournamentName: tournament?.name,
        tournamentLogo: tournament?.logo,
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
        debouncedRefetch
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(statsChannel);
      supabase.removeChannel(gamesChannel);
    };
  }, [gameId, fetchGameData, debouncedRefetch]);

  return { overlayData, loading, error };
}
