/**
 * Stat Batch Queue Service
 * 
 * Queues stat inserts and flushes them periodically to prevent
 * connection pool exhaustion during rapid stat entry.
 * 
 * SINGLE RESPONSIBILITY: Batch and queue stat inserts only.
 * 
 * @module statBatchQueue
 */

export interface QueuedStat {
  gameId: string;
  videoId: string;
  playerId?: string;
  customPlayerId?: string;
  isOpponentStat?: boolean;
  teamId: string;
  statType: string;
  modifier?: string;
  videoTimestampMs: number;
  quarter: number;
  gameTimeMinutes: number;
  gameTimeSeconds: number;
  shotLocationX?: number;
  shotLocationY?: number;
  shotZone?: string;
}

interface QueuedStatWithCallback extends QueuedStat {
  resolve: (statId: string) => void;
  reject: (error: Error) => void;
}

// Queue state
let queue: QueuedStatWithCallback[] = [];
let flushTimeout: NodeJS.Timeout | null = null;
let isProcessing = false;

// Configuration
const FLUSH_INTERVAL_MS = 1500; // Flush every 1.5 seconds
const MAX_BATCH_SIZE = 10; // Max stats per batch

/**
 * Add a stat to the queue
 * Returns a promise that resolves with the stat ID when inserted
 */
export function queueStat(stat: QueuedStat): Promise<string> {
  return new Promise((resolve, reject) => {
    queue.push({ ...stat, resolve, reject });
    
    // Schedule flush if not already scheduled
    if (!flushTimeout && !isProcessing) {
      flushTimeout = setTimeout(flushQueue, FLUSH_INTERVAL_MS);
    }
    
    // Immediate flush if queue is full
    if (queue.length >= MAX_BATCH_SIZE) {
      if (flushTimeout) {
        clearTimeout(flushTimeout);
        flushTimeout = null;
      }
      flushQueue();
    }
  });
}

/**
 * Get current queue length (for debugging/monitoring)
 */
export function getQueueLength(): number {
  return queue.length;
}

/**
 * Force immediate flush of the queue
 */
export async function forceFlush(): Promise<void> {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  await flushQueue();
}

/**
 * Flush the queue - process all pending stats
 */
async function flushQueue(): Promise<void> {
  if (isProcessing || queue.length === 0) return;
  
  isProcessing = true;
  flushTimeout = null;
  
  // Take all items from queue
  const batch = queue.splice(0, queue.length);
  
  console.log(`📦 Flushing stat batch: ${batch.length} items`);
  
  try {
    // Import VideoStatService dynamically to avoid circular deps
    const { VideoStatService } = await import('./videoStatService');
    
    // Process each stat in sequence (not parallel) to avoid connection storms
    for (const item of batch) {
      try {
        const statId = await VideoStatService.recordVideoStat({
          gameId: item.gameId,
          videoId: item.videoId,
          playerId: item.playerId,
          customPlayerId: item.customPlayerId,
          isOpponentStat: item.isOpponentStat,
          teamId: item.teamId,
          statType: item.statType,
          modifier: item.modifier,
          videoTimestampMs: item.videoTimestampMs,
          quarter: item.quarter,
          gameTimeMinutes: item.gameTimeMinutes,
          gameTimeSeconds: item.gameTimeSeconds,
          shotLocationX: item.shotLocationX,
          shotLocationY: item.shotLocationY,
          shotZone: item.shotZone,
          skipPostUpdates: true, // Always skip per-item updates in batch
        });
        item.resolve(statId);
      } catch (error) {
        console.error('❌ Batch insert failed for stat:', error);
        item.reject(error instanceof Error ? error : new Error('Insert failed'));
      }
    }
    
    // Single batch cleanup after all inserts
    if (batch.length > 0) {
      const firstItem = batch[0];
      const lastItem = batch[batch.length - 1];
      
      await Promise.all([
        VideoStatService.updateStatsCount(firstItem.gameId),
        VideoStatService.updateGameClockState(
          lastItem.gameId,
          lastItem.quarter,
          lastItem.gameTimeMinutes,
          lastItem.gameTimeSeconds
        ),
      ]);
      
      console.log(`✅ Batch complete: ${batch.length} stats inserted`);
    }
  } catch (error) {
    console.error('❌ Batch flush error:', error);
    // Reject all remaining items
    batch.forEach(item => {
      item.reject(error instanceof Error ? error : new Error('Batch flush failed'));
    });
  } finally {
    isProcessing = false;
    
    // If more items arrived during processing, schedule next flush
    if (queue.length > 0 && !flushTimeout) {
      flushTimeout = setTimeout(flushQueue, FLUSH_INTERVAL_MS);
    }
  }
}

/**
 * Clear the queue (for cleanup/testing)
 */
export function clearQueue(): void {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  queue.forEach(item => item.reject(new Error('Queue cleared')));
  queue = [];
  isProcessing = false;
}

export const StatBatchQueue = {
  queueStat,
  forceFlush,
  getQueueLength,
  clearQueue,
};
