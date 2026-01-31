/**
 * useGameEndOverlay Hook
 * 
 * Detects game completion and returns "FINAL" overlay item
 * Triggers when gameStatus === 'completed' (either manual or auto)
 * 
 * @module useGameEndOverlay
 */

import { useMemo } from 'react';
import { InfoBarItem, createGameEndItem } from '@/lib/services/canvas-overlay/infoBarManager';

interface Options {
  gameStatus: string; // 'scheduled' | 'in_progress' | 'completed'
}

/**
 * Returns "FINAL" overlay when game is completed
 * Lightweight - no subscriptions, just state-based
 */
export function useGameEndOverlay({ gameStatus }: Options): InfoBarItem | null {
  return useMemo(() => {
    if (gameStatus === 'completed') {
      return createGameEndItem();
    }
    return null;
  }, [gameStatus]);
}
