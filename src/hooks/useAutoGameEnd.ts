/** useAutoGameEnd - Auto-closes game when Q4 ends with no tie */
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Options {
  gameId: string | null;
  quarter: number;
  clockMinutes: number;
  clockSeconds: number;
  isClockRunning: boolean;
  homeScore: number;
  awayScore: number;
  gameStatus: string; // 'scheduled' | 'in_progress' | 'completed'
}

/**
 * Auto-closes game when:
 * - Q4 clock hits 0:00
 * - Scores are NOT tied
 * - Game is not already completed
 * 
 * Does NOT auto-close if tied (overtime needed)
 */
export function useAutoGameEnd({
  gameId,
  quarter,
  clockMinutes,
  clockSeconds,
  isClockRunning,
  homeScore,
  awayScore,
  gameStatus,
}: Options): void {
  const hasAutoClosedRef = useRef(false);
  const gameIdRef = useRef(gameId);

  // Reset when game changes
  useEffect(() => {
    if (gameIdRef.current !== gameId) {
      hasAutoClosedRef.current = false;
      gameIdRef.current = gameId;
    }
  }, [gameId]);

  const closeGame = useCallback(async () => {
    if (!gameId || !supabase || hasAutoClosedRef.current) return;

    hasAutoClosedRef.current = true;

    const { error } = await supabase
      .from('games')
      .update({ status: 'completed' })
      .eq('id', gameId);

    if (error) {
      console.error('Failed to auto-close game:', error.message);
      hasAutoClosedRef.current = false; // Allow retry
    }
  }, [gameId]);

  useEffect(() => {
    // Skip if already completed or already auto-closed
    if (gameStatus === 'completed' || hasAutoClosedRef.current) return;

    // Check Q4 end conditions
    const isQ4Ended = quarter === 4 && clockMinutes === 0 && clockSeconds === 0 && !isClockRunning;
    
    // Don't auto-close if tied (overtime needed)
    const isTied = homeScore === awayScore;

    if (isQ4Ended && !isTied) {
      closeGame();
    }
  }, [quarter, clockMinutes, clockSeconds, isClockRunning, homeScore, awayScore, gameStatus, closeGame]);
}
