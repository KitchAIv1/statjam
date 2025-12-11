'use client';

/**
 * TrackerModeToggle - Toggle between Classic and Shot Tracker modes
 * 
 * Simple toggle button for switching input modes in the stat tracker.
 * 
 * @module TrackerModeToggle
 */

import React from 'react';
import { Grid3X3, Target } from 'lucide-react';
import { TrackerInputMode } from '@/lib/types/shotTracker';

interface TrackerModeToggleProps {
  /** Current input mode */
  mode: TrackerInputMode;
  /** Callback when mode changes */
  onModeChange: (mode: TrackerInputMode) => void;
  /** Whether toggle is disabled */
  disabled?: boolean;
}

export function TrackerModeToggle({
  mode,
  onModeChange,
  disabled = false
}: TrackerModeToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
      <button
        onClick={() => onModeChange('classic')}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          mode === 'classic'
            ? 'bg-orange-500 text-white'
            : 'text-slate-400 hover:text-white hover:bg-slate-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-pressed={mode === 'classic'}
        aria-label="Classic button mode"
      >
        <Grid3X3 className="w-4 h-4" />
        <span className="hidden sm:inline">Buttons</span>
      </button>
      
      <button
        onClick={() => onModeChange('shot_tracker')}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          mode === 'shot_tracker'
            ? 'bg-orange-500 text-white'
            : 'text-slate-400 hover:text-white hover:bg-slate-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-pressed={mode === 'shot_tracker'}
        aria-label="Court shot tracker mode"
      >
        <Target className="w-4 h-4" />
        <span className="hidden sm:inline">Court</span>
      </button>
    </div>
  );
}
