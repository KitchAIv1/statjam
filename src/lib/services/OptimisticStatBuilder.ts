/**
 * OptimisticStatBuilder Service
 * 
 * Constructs temporary VideoStat objects for optimistic UI updates.
 * Stats appear instantly in timeline before DB confirmation.
 * 
 * SINGLE RESPONSIBILITY: Build optimistic stat objects only.
 * 
 * @module OptimisticStatBuilder
 */

import type { VideoStat } from '@/lib/types/video';

export interface OptimisticStatInput {
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
  playerName: string;
  jerseyNumber: string;
  shotLocationX?: number;
  shotLocationY?: number;
  shotZone?: string;
}

/**
 * Build an optimistic VideoStat for immediate UI display
 * Uses 'pending-' prefix for ID to identify as unconfirmed
 */
export function buildOptimisticStat(input: OptimisticStatInput): VideoStat {
  const gameClockSeconds = input.gameTimeMinutes * 60 + input.gameTimeSeconds;
  
  return {
    id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    gameStatId: '', // Will be set when DB confirms
    videoTimestampMs: input.videoTimestampMs,
    quarter: input.quarter,
    gameClockSeconds,
    playerId: input.playerId || null,
    customPlayerId: input.customPlayerId || null,
    isOpponentStat: input.isOpponentStat,
    playerName: input.playerName,
    jerseyNumber: input.jerseyNumber,
    teamId: input.teamId,
    statType: input.statType,
    modifier: input.modifier,
    statValue: 1,
    shotLocationX: input.shotLocationX,
    shotLocationY: input.shotLocationY,
    shotZone: input.shotZone,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Check if a stat is an optimistic (pending) stat
 */
export function isPendingStat(stat: VideoStat): boolean {
  return stat.id.startsWith('pending-');
}
