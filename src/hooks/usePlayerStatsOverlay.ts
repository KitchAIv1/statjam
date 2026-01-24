/**
 * usePlayerStatsOverlay Hook
 * 
 * Detects free throw events and fetches player stats for NBA-style overlay.
 * Follows existing calculatePlayerStats pattern from game-viewer.
 * Separated from useGameOverlayData to comply with .cursorrules (single responsibility).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PlayerStatsOverlayData } from '@/lib/services/canvas-overlay';

interface GameStat {
  id: string;
  game_id: string;
  player_id: string | null;
  custom_player_id?: string | null;
  team_id: string;
  stat_type: string;
  stat_value: number;
  modifier?: string;
  created_at?: string;
}

interface PlayerInfo {
  id: string;
  name: string;
  jersey_number?: number;
  profile_photo_url?: string;
}

interface TeamInfo {
  id: string;
  name: string;
  primary_color?: string;
}

const OVERLAY_DISPLAY_DURATION = 7000; // 7 seconds (matches NBA timing)

/**
 * Calculate player's current game stats
 * Follows pattern from game-viewer/[gameId]/page.tsx calculatePlayerStats
 */
function calculatePlayerGameStats(
  stats: GameStat[],
  playerId: string,
  isCustomPlayer: boolean
): { points: number; rebounds: number; assists: number; ftMade: number; ftAttempts: number } {
  let points = 0;
  let rebounds = 0;
  let assists = 0;
  let ftMade = 0;
  let ftAttempts = 0;

  for (const stat of stats) {
    // Match by player_id or custom_player_id
    const statPlayerId = isCustomPlayer ? stat.custom_player_id : stat.player_id;
    if (statPlayerId !== playerId) continue;

    const isMade = stat.modifier === 'made';
    const value = stat.stat_value || 0;

    switch (stat.stat_type) {
      case 'field_goal':
      case 'two_pointer':
        if (isMade) points += value;
        break;
      case 'three_pointer':
      case '3_pointer':
        if (isMade) points += value;
        break;
      case 'free_throw':
        ftAttempts++;
        if (isMade) {
          ftMade++;
          points += value;
        }
        break;
      case 'rebound':
        rebounds++;
        break;
      case 'assist':
        assists++;
        break;
    }
  }

  return { points, rebounds, assists, ftMade, ftAttempts };
}

export function usePlayerStatsOverlay(gameId: string | null, autoTriggerEnabled: boolean = true) {
  const [activePlayerStats, setActivePlayerStats] = useState<PlayerStatsOverlayData | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedStatRef = useRef<string | null>(null);

  /**
   * Fetch player info and calculate stats for overlay display
   */
  const showPlayerOverlay = useCallback(async (
    playerId: string,
    teamId: string,
    isCustomPlayer: boolean
  ) => {
    if (!gameId || !supabase) return;

    try {
      // Fetch player info
      const playerTable = isCustomPlayer ? 'custom_players' : 'users';
      const { data: player } = await supabase
        .from(playerTable)
        .select('id, name, jersey_number, profile_photo_url')
        .eq('id', playerId)
        .single();

      if (!player) return;

      // Fetch team info
      const { data: team } = await supabase
        .from('teams')
        .select('id, name, primary_color')
        .eq('id', teamId)
        .single();

      // Fetch all game stats for this player
      const statsQuery = supabase
        .from('game_stats')
        .select('id, game_id, player_id, custom_player_id, team_id, stat_type, stat_value, modifier')
        .eq('game_id', gameId);

      const { data: allStats } = await statsQuery;

      // Calculate player's current game stats
      const calculatedStats = calculatePlayerGameStats(
        allStats || [],
        playerId,
        isCustomPlayer
      );

      // Clear any existing hide timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      // Set overlay data
      const overlayData: PlayerStatsOverlayData = {
        playerId,
        playerName: player.name || 'Unknown Player',
        jerseyNumber: player.jersey_number,
        teamName: team?.name || 'Team',
        teamId,
        teamPrimaryColor: team?.primary_color,
        profilePhotoUrl: player.profile_photo_url,
        points: calculatedStats.points,
        rebounds: calculatedStats.rebounds,
        assists: calculatedStats.assists,
        freeThrowMade: calculatedStats.ftMade,
        freeThrowAttempts: calculatedStats.ftAttempts,
        isVisible: true,
        showUntil: Date.now() + OVERLAY_DISPLAY_DURATION,
      };

      setActivePlayerStats(overlayData);

      // Auto-hide after duration
      hideTimeoutRef.current = setTimeout(() => {
        setActivePlayerStats(prev => prev ? { ...prev, isVisible: false } : null);
      }, OVERLAY_DISPLAY_DURATION);

    } catch (error) {
      console.error('Error fetching player stats for overlay:', error);
    }
  }, [gameId]);

  /**
   * Handle new stat event - detect free throws
   */
  const handleStatEvent = useCallback((payload: { new: GameStat }) => {
    const stat = payload.new;
    
    // Only trigger on free throw stats
    if (stat.stat_type !== 'free_throw') return;
    
    // Prevent duplicate processing
    if (lastProcessedStatRef.current === stat.id) return;
    lastProcessedStatRef.current = stat.id;

    // Determine player ID (support both regular and custom players)
    const playerId = stat.player_id || stat.custom_player_id;
    const isCustomPlayer = !stat.player_id && !!stat.custom_player_id;

    if (!playerId) return;

    showPlayerOverlay(playerId, stat.team_id, isCustomPlayer);
  }, [showPlayerOverlay]);

  /**
   * Subscribe to real-time stat events (only when autoTriggerEnabled)
   */
  useEffect(() => {
    if (!gameId || !supabase || !autoTriggerEnabled) {
      return;
    }

    // Subscribe to INSERT events on game_stats (new stats only)
    const channel = supabase
      .channel(`player_stats_overlay:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_stats',
          filter: `game_id=eq.${gameId}`,
        },
        handleStatEvent
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, handleStatEvent, autoTriggerEnabled]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Manually trigger overlay (for testing)
   */
  const triggerOverlay = useCallback((
    playerId: string,
    teamId: string,
    isCustomPlayer: boolean = false
  ) => {
    showPlayerOverlay(playerId, teamId, isCustomPlayer);
  }, [showPlayerOverlay]);

  /**
   * Manually hide overlay
   */
  const hideOverlay = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setActivePlayerStats(prev => prev ? { ...prev, isVisible: false } : null);
  }, []);

  return {
    activePlayerStats,
    triggerOverlay,
    hideOverlay,
  };
}
