'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGameStream } from './useGameStream';
import { usePlayFeed } from './usePlayFeed';
import { useAuthStore } from '@/store/authStore';
import { useResponsive } from './useResponsive';
import { GameViewerData, PlayByPlayEntry } from '@/lib/types/playByPlay';

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
  
  // Enhanced data
  playerStatsMap: Map<string, PlayerStats>;
  
  // Configuration
  enableViewerV2: boolean;
}

export interface UseGameViewerDataReturn extends GameViewerState {
  // Helper functions
  calculatePlayerStats: (playIndex: number, playerId?: string) => PlayerStats | undefined;
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
  
  // Core hooks
  const { user, initialized, loading: authLoading } = useAuthStore();
  const { gameData, loading, error, isLive } = useGameStream(gameId);
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  // Configuration
  const enableViewerV2 = process.env.NEXT_PUBLIC_VIEWER_V2 === '1';
  
  // V2 data (conditional)
  const teamMap = gameData ? {
    teamAId: gameData.game.teamAId,
    teamBId: gameData.game.teamBId,
    teamAName: gameData.game.teamAName,
    teamBName: gameData.game.teamBName,
  } : { teamAId: '', teamBId: '', teamAName: '', teamBName: '' };
  
  // Only call usePlayFeed if we have valid team data or V2 is enabled
  const shouldUseV2 = enableViewerV2 && gameData;
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

  // Prepare V2 data if enabled
  const v2Data = shouldUseV2 ? {
    plays: v2Plays,
    homeScore,
    awayScore,
    teamMap,
  } : undefined;

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
    
    // Enhanced data
    playerStatsMap,
    
    // Configuration
    enableViewerV2,
    
    // Helper functions
    calculatePlayerStats,
    refetch,
    
    // V2 data
    v2Data,
  };
};
