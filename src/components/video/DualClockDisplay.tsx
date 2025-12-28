'use client';

/**
 * DualClockDisplay - Video time + Game clock + Scores display
 * 
 * Shows video timestamp, game clock, and live scores.
 * Used in the video stat tracker header.
 * Includes visual indicators for quarter expiry.
 * 
 * @module DualClockDisplay
 */

import React from 'react';
import { Clock, Film, AlertTriangle, Trophy } from 'lucide-react';
import type { GameClock } from '@/lib/types/video';

interface DualClockDisplayProps {
  videoTimeMs: number;
  gameClock: GameClock | null;
  isCalibrated: boolean;
  className?: string;
  showQuarterExpiredWarning?: boolean;
  // Score display
  teamAName?: string;
  teamBName?: string;
  teamAScore?: number;
  teamBScore?: number;
  showScores?: boolean;
}

export function DualClockDisplay({
  videoTimeMs,
  gameClock,
  isCalibrated,
  className = '',
  showQuarterExpiredWarning = false,
  teamAName = 'Home',
  teamBName = 'Away',
  teamAScore = 0,
  teamBScore = 0,
  showScores = false,
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
  
  // Check if clock is at 0:00 (quarter ended)
  const isClockExpired = gameClock && 
    gameClock.minutesRemaining === 0 && 
    gameClock.secondsRemaining === 0;
  
  // Check if clock is low (under 1 minute)
  const isClockLow = gameClock && 
    gameClock.minutesRemaining === 0 && 
    gameClock.secondsRemaining > 0 && 
    gameClock.secondsRemaining <= 59;
  
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
        <div 
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg transition-all
            ${isClockExpired 
              ? 'bg-red-100 border-2 border-red-300 animate-pulse' 
              : isClockLow 
                ? 'bg-amber-100 border border-amber-300'
                : 'bg-orange-100'
            }
          `}
        >
          {isClockExpired ? (
            <AlertTriangle className="w-4 h-4 text-red-600" />
          ) : (
            <Clock className={`w-4 h-4 ${isClockLow ? 'text-amber-600' : 'text-orange-600'}`} />
          )}
          <span className={`font-bold ${isClockExpired ? 'text-red-700' : isClockLow ? 'text-amber-700' : 'text-orange-700'}`}>
            {getQuarterLabel(gameClock)}
          </span>
          <span className={`font-mono font-bold text-lg ${isClockExpired ? 'text-red-900' : isClockLow ? 'text-amber-900' : 'text-orange-900'}`}>
            {formatGameClock(gameClock)}
          </span>
          {isClockExpired && showQuarterExpiredWarning && (
            <span className="text-xs text-red-600 font-medium ml-2">
              Press Q to advance
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-yellow-100 px-3 py-2 rounded-lg">
          <Clock className="w-4 h-4 text-yellow-600" />
          <span className="text-sm text-yellow-700">
            Not synced
          </span>
        </div>
      )}
      
      {/* Live Scores */}
      {showScores && (
        <div className="flex items-center gap-3 bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-2 rounded-lg">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300 truncate max-w-[80px]" title={teamAName}>
              {teamAName}
            </span>
            <span className="font-mono font-bold text-xl text-white">
              {teamAScore}
            </span>
          </div>
          <span className="text-gray-500 font-bold">-</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xl text-white">
              {teamBScore}
            </span>
            <span className="text-sm text-gray-300 truncate max-w-[80px]" title={teamBName}>
              {teamBName}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

