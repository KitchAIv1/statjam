/**
 * StatBatchQueue Unit Tests
 * 
 * Tests the batch queue service for video stat tracking optimization.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock VideoStatService
vi.mock('@/lib/services/videoStatService', () => ({
  VideoStatService: {
    recordVideoStat: vi.fn().mockResolvedValue('mock-stat-id'),
    updateStatsCount: vi.fn().mockResolvedValue(undefined),
    updateGameClockState: vi.fn().mockResolvedValue(undefined),
  },
}));

// Import after mocking
import { StatBatchQueue, clearQueue, getQueueLength, forceFlush } from '@/lib/services/statBatchQueue';

describe('StatBatchQueue', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Flush any pending items instead of clearing (to avoid unhandled rejections)
    await forceFlush();
    vi.useFakeTimers();
  });

  afterEach(async () => {
    vi.useRealTimers();
    // Clean up any remaining items
    await forceFlush();
  });

  const mockStat = {
    gameId: 'game-123',
    videoId: 'video-456',
    playerId: 'player-789',
    teamId: 'team-abc',
    statType: 'field_goal',
    modifier: 'made',
    videoTimestampMs: 10000,
    quarter: 1,
    gameTimeMinutes: 8,
    gameTimeSeconds: 30,
  };

  it('should queue stats and return queue length', async () => {
    // Queue a stat (don't await yet)
    StatBatchQueue.queueStat(mockStat);
    
    expect(getQueueLength()).toBe(1);
  });

  it('should batch multiple stats together', async () => {
    // Queue multiple stats
    StatBatchQueue.queueStat(mockStat);
    StatBatchQueue.queueStat({ ...mockStat, statType: 'assist' });
    StatBatchQueue.queueStat({ ...mockStat, statType: 'rebound' });
    
    expect(getQueueLength()).toBe(3);
  });

  it('should flush queue on forceFlush', async () => {
    const { VideoStatService } = await import('@/lib/services/videoStatService');
    
    // Queue stats
    const promise1 = StatBatchQueue.queueStat(mockStat);
    const promise2 = StatBatchQueue.queueStat({ ...mockStat, statType: 'assist' });
    
    // Force flush
    await forceFlush();
    
    // Verify both promises resolved
    const [id1, id2] = await Promise.all([promise1, promise2]);
    expect(id1).toBe('mock-stat-id');
    expect(id2).toBe('mock-stat-id');
    
    // Verify recordVideoStat was called twice
    expect(VideoStatService.recordVideoStat).toHaveBeenCalledTimes(2);
    
    // Verify batch cleanup was called once
    expect(VideoStatService.updateStatsCount).toHaveBeenCalledTimes(1);
    expect(VideoStatService.updateGameClockState).toHaveBeenCalledTimes(1);
    
    // Queue should be empty
    expect(getQueueLength()).toBe(0);
  });

  it('should flush and clear queue on forceFlush', async () => {
    StatBatchQueue.queueStat(mockStat);
    StatBatchQueue.queueStat(mockStat);
    
    expect(getQueueLength()).toBe(2);
    
    await forceFlush();
    
    expect(getQueueLength()).toBe(0);
  });
});
