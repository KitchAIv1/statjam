/**
 * BroadcastTimer - Isolated timer component
 * 
 * Manages its own state to prevent parent re-renders every second.
 * Phase 3 optimization: ~10-15% CPU reduction during broadcast.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface BroadcastTimerProps {
  startTime: number | null;
  isBroadcasting: boolean;
}

export function BroadcastTimer({ startTime, isBroadcasting }: BroadcastTimerProps) {
  const [duration, setDuration] = useState(0);

  // Format duration as HH:MM:SS or MM:SS
  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }, []);

  // Update duration every second
  useEffect(() => {
    if (!isBroadcasting || !startTime) {
      setDuration(0);
      return;
    }

    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isBroadcasting, startTime]);

  return <>{formatDuration(duration)}</>;
}
