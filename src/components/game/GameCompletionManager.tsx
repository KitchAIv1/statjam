'use client';

import React, { useEffect, useCallback } from 'react';
import { GameService } from '@/lib/services/gameService';

interface GameCompletionManagerProps {
  gameId: string;
  currentQuarter: number;
  gameClockMinutes: number;
  gameClockSeconds: number;
  isClockRunning: boolean;
  homeScore: number;
  awayScore: number;
  onGameComplete?: (finalScores: { home: number; away: number }) => void;
  onOvertimeStart?: (overtimePeriod: number) => void;
  onQuarterEnd?: (quarter: number, scores: { home: number; away: number }) => void;
}

export type GameStatus = 'in_progress' | 'completed' | 'overtime';
export type OvertimePeriod = number; // 1 = OT1, 2 = OT2, etc.

/**
 * GameCompletionManager Component
 * 
 * Handles game completion logic, overtime detection, and final score determination.
 * Clean separation from main stat tracker - only monitors clock and triggers events.
 * 
 * Features:
 * - Q4 end detection (00:00)
 * - Tie game → Overtime logic
 * - Game completion with final scores
 * - Overtime period management (OT1, OT2, etc.)
 * - Database status updates
 */
export const GameCompletionManager: React.FC<GameCompletionManagerProps> = ({
  gameId,
  currentQuarter,
  gameClockMinutes,
  gameClockSeconds,
  isClockRunning,
  homeScore,
  awayScore,
  onGameComplete,
  onOvertimeStart,
  onQuarterEnd
}) => {

  /**
   * Check if current quarter time has expired (00:00)
   */
  const isTimeExpired = useCallback((): boolean => {
    return gameClockMinutes === 0 && gameClockSeconds === 0;
  }, [gameClockMinutes, gameClockSeconds]);

  /**
   * Check if scores are tied
   */
  const isGameTied = useCallback((): boolean => {
    return homeScore === awayScore;
  }, [homeScore, awayScore]);

  /**
   * Determine if current period is overtime (Q5+)
   */
  const isOvertimePeriod = useCallback((): boolean => {
    return currentQuarter > 4;
  }, [currentQuarter]);

  /**
   * Get overtime period number (Q5 = OT1, Q6 = OT2, etc.)
   */
  const getOvertimePeriod = useCallback((): number => {
    return Math.max(0, currentQuarter - 4);
  }, [currentQuarter]);

  /**
   * Handle Q4 end - check for game completion or overtime
   */
  const handleQ4End = useCallback(async () => {
    console.log('🏁 Q4 has ended - checking game completion...');
    console.log(`🏀 Final Regulation Scores: Home ${homeScore} - Away ${awayScore}`);

    // Trigger quarter end callback
    onQuarterEnd?.(4, { home: homeScore, away: awayScore });

    if (isGameTied()) {
      console.log('🔄 Game tied - Starting Overtime OT1');
      
      // Update game status to overtime
      await GameService.updateGameStatus(gameId, 'overtime');
      
      // Notify overtime start
      onOvertimeStart?.(1);
    } else {
      console.log('🏆 Game Complete - Final Scores Determined');
      
      // Update game status to completed
      await GameService.updateGameStatus(gameId, 'completed');
      
      // Notify game completion
      onGameComplete?.({ home: homeScore, away: awayScore });
    }
  }, [gameId, homeScore, awayScore, isGameTied, onGameComplete, onOvertimeStart, onQuarterEnd]);

  /**
   * Handle Overtime end - check for game completion or additional overtime
   */
  const handleOvertimeEnd = useCallback(async () => {
    const overtimePeriod = getOvertimePeriod();
    console.log(`🏁 OT${overtimePeriod} has ended - checking completion...`);
    console.log(`🏀 Overtime Scores: Home ${homeScore} - Away ${awayScore}`);

    // Trigger quarter end callback
    onQuarterEnd?.(currentQuarter, { home: homeScore, away: awayScore });

    if (isGameTied()) {
      const nextOvertimePeriod = overtimePeriod + 1;
      console.log(`🔄 Still tied - Starting Overtime OT${nextOvertimePeriod}`);
      
      // Notify next overtime start
      onOvertimeStart?.(nextOvertimePeriod);
    } else {
      console.log(`🏆 Game Complete after OT${overtimePeriod} - Final Scores Determined`);
      
      // Update game status to completed
      await GameService.updateGameStatus(gameId, 'completed');
      
      // Notify game completion
      onGameComplete?.({ home: homeScore, away: awayScore });
    }
  }, [currentQuarter, homeScore, awayScore, isGameTied, getOvertimePeriod, onGameComplete, onOvertimeStart, onQuarterEnd, gameId]);

  /**
   * Monitor clock for period completion
   */
  useEffect(() => {
    // Only check when clock is stopped and time is expired
    if (!isClockRunning && isTimeExpired()) {
      
      if (currentQuarter === 4) {
        // Q4 has ended
        handleQ4End();
      } else if (isOvertimePeriod()) {
        // Overtime period has ended
        handleOvertimeEnd();
      }
      // Regular quarters (Q1-Q3) are handled by existing quarter management
    }
  }, [
    isClockRunning,
    isTimeExpired,
    currentQuarter,
    isOvertimePeriod,
    handleQ4End,
    handleOvertimeEnd
  ]);

  // Component renders nothing - pure logic component
  return null;
};

export default GameCompletionManager;