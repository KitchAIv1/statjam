'use client';

/**
 * TimeOffsetAdjuster Component
 * 
 * Allows adjusting both video timestamp and game clock for a stat
 * by shifting them together (+/- seconds).
 * 
 * Reusable in: QC Review, Video Tracker Timeline
 */

import React, { useState } from 'react';
import { Minus, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TimeOffsetAdjusterProps {
  statId: string;
  currentVideoTimestampMs: number;
  currentGameTimeMinutes: number;
  currentGameTimeSeconds: number;
  onAdjusted?: () => void; // Callback after successful adjustment
  compact?: boolean; // Smaller buttons for inline use
}

/**
 * Adjusts stat timestamps by a given offset
 */
async function adjustStatTimestamps(
  statId: string,
  offsetMs: number,
  currentVideoTimestampMs: number,
  currentGameTimeMinutes: number,
  currentGameTimeSeconds: number
): Promise<boolean> {
  // Calculate new values
  const newVideoTimestampMs = Math.max(0, currentVideoTimestampMs + offsetMs);
  
  // Convert game clock to total seconds, adjust, then convert back
  const currentTotalSeconds = currentGameTimeMinutes * 60 + currentGameTimeSeconds;
  // Game clock counts DOWN, so subtract offset (positive offset = later in game = lower clock)
  const offsetSeconds = offsetMs / 1000;
  const newTotalSeconds = Math.max(0, currentTotalSeconds - offsetSeconds);
  const newGameTimeMinutes = Math.floor(newTotalSeconds / 60);
  const newGameTimeSeconds = Math.round(newTotalSeconds % 60);

  const { error } = await supabase
    .from('game_stats')
    .update({
      video_timestamp_ms: Math.round(newVideoTimestampMs),
      game_time_minutes: newGameTimeMinutes,
      game_time_seconds: newGameTimeSeconds,
    })
    .eq('id', statId);

  if (error) {
    console.error('❌ Error adjusting stat timestamps:', error);
    return false;
  }

  console.log(`✅ Adjusted stat ${statId}: ${offsetMs > 0 ? '+' : ''}${offsetMs}ms`);
  return true;
}

export function TimeOffsetAdjuster({
  statId,
  currentVideoTimestampMs,
  currentGameTimeMinutes,
  currentGameTimeSeconds,
  onAdjusted,
  compact = false,
}: TimeOffsetAdjusterProps) {
  const [isAdjusting, setIsAdjusting] = useState(false);

  const handleAdjust = async (offsetMs: number) => {
    setIsAdjusting(true);
    try {
      const success = await adjustStatTimestamps(
        statId,
        offsetMs,
        currentVideoTimestampMs,
        currentGameTimeMinutes,
        currentGameTimeSeconds
      );
      if (success && onAdjusted) {
        onAdjusted();
      }
    } finally {
      setIsAdjusting(false);
    }
  };

  const buttonClass = compact
    ? 'px-1.5 py-0.5 text-xs rounded'
    : 'px-2 py-1 text-sm rounded-lg';

  const offsets = compact
    ? [{ ms: -1000, label: '-1s' }, { ms: 1000, label: '+1s' }]
    : [
        { ms: -5000, label: '-5s' },
        { ms: -1000, label: '-1s' },
        { ms: 1000, label: '+1s' },
        { ms: 5000, label: '+5s' },
      ];

  if (isAdjusting) {
    return (
      <div className="flex items-center gap-1">
        <Loader2 className={`animate-spin ${compact ? 'w-3 h-3' : 'w-4 h-4'} text-orange-500`} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {offsets.map(({ ms, label }) => (
        <button
          key={ms}
          onClick={(e) => {
            e.stopPropagation();
            handleAdjust(ms);
          }}
          className={`
            ${buttonClass}
            ${ms < 0 
              ? 'bg-red-100 hover:bg-red-200 text-red-700' 
              : 'bg-green-100 hover:bg-green-200 text-green-700'
            }
            transition-colors font-medium
          `}
          title={`Shift ${label}`}
        >
          {ms < 0 ? <Minus className="w-3 h-3 inline" /> : <Plus className="w-3 h-3 inline" />}
          {label.replace('-', '').replace('+', '')}
        </button>
      ))}
    </div>
  );
}

