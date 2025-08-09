'use client';

import React, { useEffect, useCallback } from 'react';
import { GameService } from '@/lib/services/gameService';

interface GameStateSyncProps {
  gameId: string;
  currentQuarter: number;
  gameClockMinutes: number;
  gameClockSeconds: number;
  isClockRunning: boolean;
  homeScore: number;
  awayScore: number;
  onSyncComplete?: (success: boolean) => void;
  onSyncError?: (error: string) => void;
}

interface GameStateData {
  quarter: number;
  game_clock_minutes: number;
  game_clock_seconds: number;
  is_clock_running: boolean;
  home_score: number;
  away_score: number;
}

/**
 * GameStateSync Component
 * 
 * Syncs game clock, scores, and quarter state to database.
 * Uses existing database schema from Game interface.
 * 
 * Database fields updated:
 * - quarter: number
 * - game_clock_minutes: number  
 * - game_clock_seconds: number
 * - is_clock_running: boolean
 * - home_score: number
 * - away_score: number
 */
export const GameStateSync: React.FC<GameStateSyncProps> = ({
  gameId,
  currentQuarter,
  gameClockMinutes,
  gameClockSeconds,
  isClockRunning,
  homeScore,
  awayScore,
  onSyncComplete,
  onSyncError
}) => {

  /**
   * Sync current game state to database
   */
  const syncGameState = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 GameStateSync: Syncing state to database...');
      console.log('🔄 GameStateSync: Data:', {
        gameId,
        quarter: currentQuarter,
        clock: `${gameClockMinutes}:${gameClockSeconds.toString().padStart(2, '0')}`,
        running: isClockRunning,
        scores: `${homeScore}-${awayScore}`
      });

      const gameStateData: GameStateData = {
        quarter: currentQuarter,
        game_clock_minutes: gameClockMinutes,
        game_clock_seconds: gameClockSeconds,
        is_clock_running: isClockRunning,
        home_score: homeScore,
        away_score: awayScore
      };

      const success = await GameService.updateGameState(gameId, gameStateData);

      if (success) {
        console.log('✅ GameStateSync: Successfully synced to database');
        onSyncComplete?.(true);
        return true;
      } else {
        console.error('❌ GameStateSync: Failed to sync to database');
        onSyncError?.('Failed to update game state');
        onSyncComplete?.(false);
        return false;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      console.error('❌ GameStateSync: Sync error:', errorMessage);
      onSyncError?.(errorMessage);
      onSyncComplete?.(false);
      return false;
    }
  }, [
    gameId,
    currentQuarter,
    gameClockMinutes,
    gameClockSeconds,
    isClockRunning,
    homeScore,
    awayScore,
    onSyncComplete,
    onSyncError
  ]);

  /**
   * Auto-sync when critical state changes
   * Triggers on: quarter change, score change, clock start/stop
   */
  useEffect(() => {
    const shouldSync = gameId && (
      currentQuarter > 0 && 
      (homeScore >= 0 || awayScore >= 0)
    );

    if (shouldSync) {
      // Debounce rapid updates (e.g., during score changes)
      const syncTimeout = setTimeout(() => {
        syncGameState();
      }, 1000); // 1 second debounce

      return () => clearTimeout(syncTimeout);
    }
  }, [
    gameId,
    currentQuarter,
    homeScore,
    awayScore,
    isClockRunning,
    syncGameState
  ]);

  /**
   * Sync clock time every 10 seconds when running
   */
  useEffect(() => {
    if (!isClockRunning || !gameId) return;

    const clockSyncInterval = setInterval(() => {
      console.log('⏰ GameStateSync: Auto-syncing clock time...');
      syncGameState();
    }, 10000); // Sync every 10 seconds when clock is running

    return () => clearInterval(clockSyncInterval);
  }, [isClockRunning, gameId, syncGameState]);

  // Component renders nothing - pure sync functionality
  return null;
};

export default GameStateSync;