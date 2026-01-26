/**
 * useOptimisticTimeline Hook
 * 
 * Manages optimistic stat updates for instant UI feedback.
 * Stats appear immediately in timeline, background sync verifies with DB.
 * 
 * SINGLE RESPONSIBILITY: Manage pending stats state and merge logic.
 * 
 * @module useOptimisticTimeline
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { VideoStat } from '@/lib/types/video';
import { isPendingStat } from '@/lib/services/OptimisticStatBuilder';

const BACKGROUND_SYNC_INTERVAL_MS = 30000; // Sync with DB every 30 seconds

interface UseOptimisticTimelineProps {
  onBackgroundSync: () => Promise<VideoStat[]>;
}

interface UseOptimisticTimelineReturn {
  pendingStats: VideoStat[];
  addPendingStat: (stat: VideoStat) => void;
  reconcileWithDbStats: (dbStats: VideoStat[]) => VideoStat[];
  clearPendingStats: () => void;
}

/**
 * Hook for managing optimistic timeline updates
 */
export function useOptimisticTimeline(
  props: UseOptimisticTimelineProps
): UseOptimisticTimelineReturn {
  const { onBackgroundSync } = props;
  const [pendingStats, setPendingStats] = useState<VideoStat[]>([]);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Add a new optimistic stat
  const addPendingStat = useCallback((stat: VideoStat) => {
    setPendingStats(prev => [stat, ...prev]);
    console.log('⚡ Optimistic stat added:', stat.statType, stat.playerName);
  }, []);

  // Clear all pending stats (after successful DB sync)
  const clearPendingStats = useCallback(() => {
    setPendingStats([]);
  }, []);

  /**
   * Reconcile pending stats with DB stats
   * - If DB has a stat with matching timestamp/type/player, remove from pending
   * - Returns merged list: DB stats + remaining pending stats
   */
  const reconcileWithDbStats = useCallback((dbStats: VideoStat[]): VideoStat[] => {
    if (pendingStats.length === 0) return dbStats;

    // Find pending stats that are NOT yet in DB
    const remainingPending = pendingStats.filter(pending => {
      // Check if this pending stat exists in DB (by matching key fields)
      const existsInDb = dbStats.some(db => 
        db.videoTimestampMs === pending.videoTimestampMs &&
        db.statType === pending.statType &&
        db.teamId === pending.teamId &&
        !isPendingStat(db)
      );
      return !existsInDb;
    });

    // Update pending stats to only keep unconfirmed ones
    if (remainingPending.length !== pendingStats.length) {
      setPendingStats(remainingPending);
    }

    // Return merged: DB stats first, then remaining pending
    return [...dbStats, ...remainingPending];
  }, [pendingStats]);

  // Background sync interval
  useEffect(() => {
    syncIntervalRef.current = setInterval(async () => {
      if (pendingStats.length > 0) {
        console.log('🔄 Background sync: Verifying pending stats...');
        try {
          const dbStats = await onBackgroundSync();
          reconcileWithDbStats(dbStats);
        } catch (error) {
          console.error('Background sync failed:', error);
        }
      }
    }, BACKGROUND_SYNC_INTERVAL_MS);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [onBackgroundSync, pendingStats.length, reconcileWithDbStats]);

  return {
    pendingStats,
    addPendingStat,
    reconcileWithDbStats,
    clearPendingStats,
  };
}
