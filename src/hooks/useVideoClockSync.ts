/**
 * useVideoClockSync - Video to Game Clock Synchronization
 * 
 * Converts video timestamps to game clock and vice versa.
 * Handles quarters, halftime, and overtime periods.
 * 
 * @module useVideoClockSync
 */

import { useMemo, useCallback } from 'react';
import type { ClockSyncConfig, GameClock } from '@/lib/types/video';
import { VIDEO_CONFIG } from '@/lib/config/videoConfig';

interface UseVideoClockSyncProps {
  config: ClockSyncConfig | null;
}

interface UseVideoClockSyncReturn {
  isCalibrated: boolean;
  videoToGameClock: (videoMs: number) => GameClock;
  gameClockToVideo: (clock: GameClock) => number;
  getQuarterStartMs: (quarter: number) => number | null;
  formatGameClock: (clock: GameClock) => string;
}

export function useVideoClockSync({ config }: UseVideoClockSyncProps): UseVideoClockSyncReturn {
  const isCalibrated = !!config?.jumpballTimestampMs;
  
  // Get quarter length in milliseconds
  const quarterLengthMs = useMemo(() => {
    if (!config) return 12 * 60 * 1000; // Default 12 min
    return config.quarterLengthMinutes * 60 * 1000;
  }, [config]);
  
  // Overtime length in milliseconds
  const overtimeLengthMs = VIDEO_CONFIG.overtimeLengthMinutes * 60 * 1000;
  
  // Get all quarter start timestamps
  const quarterStarts = useMemo(() => {
    if (!config) return new Map<number, number>();
    
    const starts = new Map<number, number>();
    
    // Q1 starts at jumpball
    starts.set(1, config.jumpballTimestampMs);
    
    // Use explicit markers if available, otherwise calculate
    if (config.q2StartTimestampMs) starts.set(2, config.q2StartTimestampMs);
    if (config.q3StartTimestampMs) starts.set(3, config.q3StartTimestampMs);
    if (config.q4StartTimestampMs) starts.set(4, config.q4StartTimestampMs);
    if (config.ot1StartTimestampMs) starts.set(5, config.ot1StartTimestampMs);
    if (config.ot2StartTimestampMs) starts.set(6, config.ot2StartTimestampMs);
    if (config.ot3StartTimestampMs) starts.set(7, config.ot3StartTimestampMs);
    
    return starts;
  }, [config]);
  
  // Convert video timestamp to game clock
  const videoToGameClock = useCallback((videoMs: number): GameClock => {
    if (!config || !isCalibrated) {
      return { quarter: 1, minutesRemaining: 12, secondsRemaining: 0, isOvertime: false, overtimePeriod: 0 };
    }
    
    const jumpball = config.jumpballTimestampMs;
    
    // Before game started
    if (videoMs < jumpball) {
      return { 
        quarter: 1, 
        minutesRemaining: config.quarterLengthMinutes, 
        secondsRemaining: 0,
        isOvertime: false,
        overtimePeriod: 0
      };
    }
    
    // Find which quarter we're in based on markers
    let currentQuarter = 1;
    let quarterStartMs = jumpball;
    
    for (let q = 7; q >= 1; q--) {
      const start = quarterStarts.get(q);
      if (start && videoMs >= start) {
        currentQuarter = q;
        quarterStartMs = start;
        break;
      }
    }
    
    // Calculate time elapsed in current quarter
    const elapsedInQuarterMs = videoMs - quarterStartMs;
    
    // Determine quarter length (regulation vs OT)
    const isOvertime = currentQuarter > 4;
    const currentQuarterLengthMs = isOvertime ? overtimeLengthMs : quarterLengthMs;
    
    // Calculate time remaining
    const timeRemainingMs = Math.max(0, currentQuarterLengthMs - elapsedInQuarterMs);
    const totalSecondsRemaining = Math.floor(timeRemainingMs / 1000);
    
    return {
      quarter: currentQuarter,
      minutesRemaining: Math.floor(totalSecondsRemaining / 60),
      secondsRemaining: totalSecondsRemaining % 60,
      isOvertime,
      overtimePeriod: isOvertime ? currentQuarter - 4 : 0,
    };
  }, [config, isCalibrated, quarterStarts, quarterLengthMs, overtimeLengthMs]);
  
  // Convert game clock to video timestamp
  const gameClockToVideo = useCallback((clock: GameClock): number => {
    if (!config || !isCalibrated) return 0;
    
    const quarterStart = quarterStarts.get(clock.quarter);
    if (!quarterStart) {
      // Estimate based on previous quarters if marker not set
      const isOT = clock.quarter > 4;
      const regularQuarters = Math.min(clock.quarter - 1, 4);
      const otPeriods = Math.max(0, clock.quarter - 5);
      
      const estimatedStart = config.jumpballTimestampMs + 
        (regularQuarters * quarterLengthMs) + 
        (otPeriods * overtimeLengthMs);
      
      // Calculate time into quarter
      const quarterLength = isOT ? overtimeLengthMs : quarterLengthMs;
      const timeRemainingMs = (clock.minutesRemaining * 60 + clock.secondsRemaining) * 1000;
      const elapsedMs = quarterLength - timeRemainingMs;
      
      return estimatedStart + elapsedMs;
    }
    
    // Use explicit marker
    const isOT = clock.quarter > 4;
    const quarterLength = isOT ? overtimeLengthMs : quarterLengthMs;
    const timeRemainingMs = (clock.minutesRemaining * 60 + clock.secondsRemaining) * 1000;
    const elapsedMs = quarterLength - timeRemainingMs;
    
    return quarterStart + elapsedMs;
  }, [config, isCalibrated, quarterStarts, quarterLengthMs, overtimeLengthMs]);
  
  // Get quarter start timestamp
  const getQuarterStartMs = useCallback((quarter: number): number | null => {
    return quarterStarts.get(quarter) ?? null;
  }, [quarterStarts]);
  
  // Format game clock for display
  const formatGameClock = useCallback((clock: GameClock): string => {
    const mins = clock.minutesRemaining.toString().padStart(2, '0');
    const secs = clock.secondsRemaining.toString().padStart(2, '0');
    const quarterLabel = clock.isOvertime ? `OT${clock.overtimePeriod}` : `Q${clock.quarter}`;
    return `${quarterLabel} - ${mins}:${secs}`;
  }, []);
  
  return {
    isCalibrated,
    videoToGameClock,
    gameClockToVideo,
    getQuarterStartMs,
    formatGameClock,
  };
}

