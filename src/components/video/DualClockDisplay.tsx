'use client';

/**
 * DualClockDisplay - Video time + Game clock display
 * 
 * Shows both video timestamp and calculated game clock side by side.
 * Used in the video stat tracker header.
 * 
 * @module DualClockDisplay
 */

import React from 'react';
import { Clock, Film } from 'lucide-react';
import type { GameClock } from '@/lib/types/video';

interface DualClockDisplayProps {
  videoTimeMs: number;
  gameClock: GameClock | null;
  isCalibrated: boolean;
  className?: string;
}

export function DualClockDisplay({
  videoTimeMs,
  gameClock,
  isCalibrated,
  className = '',
}: DualClockDisplayProps) {
  // Format video time as MM:SS or HH:MM:SS
  const formatVideoTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format game clock
  const formatGameClock = (clock: GameClock): string => {
    const mins = clock.minutesRemaining.toString().padStart(2, '0');
    const secs = clock.secondsRemaining.toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  // Get quarter label
  const getQuarterLabel = (clock: GameClock): string => {
    if (clock.isOvertime) {
      return `OT${clock.overtimePeriod}`;
    }
    return `Q${clock.quarter}`;
  };
  
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Video Time */}
      <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
        <Film className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">Video:</span>
        <span className="font-mono font-semibold text-gray-900">
          {formatVideoTime(videoTimeMs)}
        </span>
      </div>
      
      {/* Game Clock */}
      {isCalibrated && gameClock ? (
        <div className="flex items-center gap-2 bg-orange-100 px-3 py-2 rounded-lg">
          <Clock className="w-4 h-4 text-orange-600" />
          <span className="font-bold text-orange-700">
            {getQuarterLabel(gameClock)}
          </span>
          <span className="font-mono font-bold text-orange-900 text-lg">
            {formatGameClock(gameClock)}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-yellow-100 px-3 py-2 rounded-lg">
          <Clock className="w-4 h-4 text-yellow-600" />
          <span className="text-sm text-yellow-700">
            Not synced
          </span>
        </div>
      )}
    </div>
  );
}

