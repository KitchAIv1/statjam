'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGameStream } from './useGameStream';
import { usePlayFeed } from './usePlayFeed';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { useResponsive } from './useResponsive';
import { GameViewerData, PlayByPlayEntry } from '@/lib/types/playByPlay';
import { supabase } from '@/lib/supabase';

export interface PlayerStats {
  fieldGoalMade: number;
  fieldGoalAttempts: number;
  threePointerMade: number;
  threePointerAttempts: number;
  freeThrowMade: number;
  freeThrowAttempts: number;
}

export interface GameViewerState {
  // Core game data
  gameData: GameViewerData | null;
  
  // UI state
  loading: boolean;
  error: string | null;
  isLive: boolean;
  
  // Auth state
  user: any;
  initialized: boolean;
  authLoading: boolean;
  
  // Device state
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // Real-time status
  realtimeStatus: 'connected' | 'polling' | 'disconnected';
  lastUpdate: Date | null;
  
  // Enhanced data
  playerStatsMap: Map<string, PlayerStats>;
  
  // Configuration
  enableViewerV2: boolean;
}

export interface UseGameViewerDataReturn extends GameViewerState {
  // Helper functions
  calculatePlayerStats: (playIndex: number, playerId?: string) => PlayerStats | undefined;
  calculatePlayerPoints: (playIndex: number, playerId?: string) => number | undefined;
  refetch: () => Promise<void>;
  
  // V2 data (if enabled)
  v2Data?: {
    plays: PlayByPlayEntry[];
    homeScore: number;
    awayScore: number;
    teamMap: {
      teamAId: string;
      teamBId: string;
      teamAName: string;
      teamBName: string;
    };
  };
}

/**
 * Unified Game Viewer Data Hook
 * 
 * Combines all game viewer logic into a single, reusable hook.
 * Provides both V1 (useGameStream) and V2 (usePlayFeed) data sources.
 * Includes player statistics calculation and device detection.
 */
export const useGameViewerData = (gameId: string): UseGameViewerDataReturn => {
  const [playerStatsMap, setPlayerStatsMap] = useState<Map<string, PlayerStats>>(new Map());
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'polling' | 'disconnected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Configuration
  const enableViewerV2 = process.env.NEXT_PUBLIC_VIEWER_V2 === '1';
  console.log('🔧 GameViewerData: V2 enabled?', enableViewerV2, 'env var:', process.env.NEXT_PUBLIC_VIEWER_V2);
  
  // V1 provides all game data, V2 just provides better stats/feed
  
  // Core hooks - Always use V1 for game data, but V1 will skip stats queries when V2 enabled
  const { user, initialized, loading: authLoading } = useAuthStore();
  const { gameData, loading, error, isLive } = useGameStream(gameId, enableViewerV2); // Pass V2 flag to skip stats
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // TEMPORARY: Smart polling fallback since real-time subscriptions aren't working
  useEffect(() => {
    if (!gameId) return;
    
    // V1 always provides isLive status now
    const shouldPoll = gameData?.game && isLive;
    if (!shouldPoll) {
      setRealtimeStatus('disconnected');
      return;
    }

    console.log('🔄 GameViewerData: Starting smart polling fallback for', enableViewerV2 ? 'V2' : 'V1');
    setRealtimeStatus('polling'); // Indicate we're in fallback mode
    
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 GameViewerData: Polling for updates -', enableViewerV2 ? 'V2 only' : 'V1 + V2');
        setLastUpdate(new Date());
        if (enableViewerV2) {
          // V2 only: Just trigger V2 refresh
          window.dispatchEvent(new CustomEvent('force-v2-refresh', { detail: { gameId } }));
        } else {
          // V1 mode: Trigger both V1 and V2 updates
          window.dispatchEvent(new CustomEvent('force-game-refresh', { detail: { gameId } }));
        }
      }
    }, 2000); // Poll every 2 seconds for live games

    return () => {
      console.log('🔄 GameViewerData: Stopping smart polling');
      clearInterval(pollInterval);
    };
  }, [gameId, isLive, enableViewerV2, gameData?.game]);
  
  // V1 always provides team mapping data
  const teamMap = gameData ? {
    teamAId: gameData.game.teamAId,
    teamBId: gameData.game.teamBId,
    teamAName: gameData.game.teamAName,
    teamBName: gameData.game.teamBName,
  } : { teamAId: '', teamBId: '', teamAName: '', teamBName: '' };
  
  // Only call usePlayFeed if we have valid team data from V1
  const shouldUseV2 = enableViewerV2 && gameData;
  console.log('🔧 GameViewerData: shouldUseV2?', shouldUseV2, 'enableViewerV2:', enableViewerV2, 'gameData:', !!gameData);
  const { plays: v2Plays = [], homeScore = 0, awayScore = 0 } = usePlayFeed(
    gameId, 
    teamMap
  );

  /**
   * Calculate player stats up to a specific play (chronologically)
   * This logic was previously in PlayByPlayFeed component
   */
  const calculatePlayerStats = useCallback((currentPlayIndex: number, playerId?: string): PlayerStats | undefined => {
    if (!playerId || !gameData?.playByPlay) return undefined;

    const stats: PlayerStats = {
      fieldGoalMade: 0,
      fieldGoalAttempts: 0,
      threePointerMade: 0,
      threePointerAttempts: 0,
      freeThrowMade: 0,
      freeThrowAttempts: 0,
    };

    const playByPlay = enableViewerV2 ? v2Plays : gameData.playByPlay;

    // playByPlay is in reverse chronological order (newest first)
    // So we need to process from the end to the current play
    for (let i = playByPlay.length - 1; i >= currentPlayIndex; i--) {
      const play = playByPlay[i];
      
      // Only count stats for this specific player
      if (play.playerId !== playerId) continue;

      switch (play.statType) {
        case 'field_goal':
          stats.fieldGoalAttempts++;
          if (play.modifier === 'made') {
            stats.fieldGoalMade++;
          }
          break;
        case 'three_pointer':
          stats.threePointerAttempts++;
          if (play.modifier === 'made') {
            stats.threePointerMade++;
          }
          break;
        case 'free_throw':
          stats.freeThrowAttempts++;
          if (play.modifier === 'made') {
            stats.freeThrowMade++;
          }
          break;
      }
    }

    return stats;
  }, [gameData?.playByPlay, v2Plays, enableViewerV2]);

  /**
   * Calculate total points for a player up to a specific play index
   */
  const calculatePlayerPoints = useCallback((currentPlayIndex: number, playerId?: string): number | undefined => {
    if (!playerId || !gameData?.playByPlay) return undefined;

    const playByPlay = enableViewerV2 ? v2Plays : gameData.playByPlay;
    let points = 0;

    for (let i = playByPlay.length - 1; i >= currentPlayIndex; i--) {
      const play = playByPlay[i];
      if (play.playerId !== playerId) continue;
      if (play.modifier !== 'made') continue;
      if (play.statType === 'three_pointer') points += 3;
      else if (play.statType === 'field_goal') points += 2;
      else if (play.statType === 'free_throw') points += 1;
    }

    return points;
  }, [gameData?.playByPlay, v2Plays, enableViewerV2]);

  /**
   * Recalculate all player stats when data changes
   */
  useEffect(() => {
    if (!gameData?.playByPlay && !v2Plays.length) return;

    const newStatsMap = new Map<string, PlayerStats>();
    const playByPlay = enableViewerV2 ? v2Plays : gameData?.playByPlay || [];
    
    // Get unique player IDs
    const playerIds = new Set(
      playByPlay
        .filter(play => play.playerId)
        .map(play => play.playerId!)
    );

    // Calculate final stats for each player
    playerIds.forEach(playerId => {
      const stats = calculatePlayerStats(0, playerId);
      if (stats) {
        newStatsMap.set(playerId, stats);
      }
    });

    setPlayerStatsMap(newStatsMap);
  }, [gameData?.playByPlay, v2Plays, calculatePlayerStats, enableViewerV2]);

  /**
   * Refetch game data
   */
  const refetch = useCallback(async () => {
    // This would trigger refetch in the underlying hooks
    // For now, it's a placeholder - the hooks handle auto-refresh
    console.log('🔄 Refetching game data...');
  }, []);

  // Prepare V2 data if enabled - USE V1 SCORES FOR REAL-TIME UPDATES (V1 subscriptions work perfectly)
  const v2Data = shouldUseV2 ? {
    plays: v2Plays,
    homeScore: gameData?.game?.homeScore || homeScore || 0, // Always prefer V1 scores (real-time)
    awayScore: gameData?.game?.awayScore || awayScore || 0,  // Always prefer V1 scores (real-time)
    teamMap,
  } : undefined;
  
  console.log('🔧 GameViewerData: Final data source - V2 data exists?', !!v2Data, 'V2 scores:', homeScore, awayScore, 'V1 scores:', gameData?.game?.homeScore, gameData?.game?.awayScore);
  console.log('🔧 GameViewerData: Using scores - V2 final:', v2Data?.homeScore, v2Data?.awayScore);

  return {
    // Core game data
    gameData,
    
    // UI state
    loading,
    error,
    isLive,
    
    // Auth state
    user,
    initialized,
    authLoading,
    
    // Device state
    isMobile,
    isTablet,
    isDesktop,
    
    // Real-time status
    realtimeStatus,
    lastUpdate,
    
    // Enhanced data
    playerStatsMap,
    
    // Configuration
    enableViewerV2,
    
    // Helper functions
    calculatePlayerStats,
    calculatePlayerPoints,
    refetch,
    
    // V2 data
    v2Data,
  };
};
