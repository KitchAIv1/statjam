'use client';

/**
 * MadeMissedBar - Full-width confirmation bar for shot outcome
 * 
 * Appears after court tap to confirm whether shot was made or missed.
 * Shows player name, detected zone, and large Made/Missed buttons.
 * 
 * @module MadeMissedBar
 */

import React from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { PendingShot } from '@/lib/types/shotTracker';
import { getZoneLabel } from '@/lib/services/shotLocationService';

interface MadeMissedBarProps {
  /** Pending shot data */
  pendingShot: PendingShot;
  /** Player display name */
  playerName: string;
  /** Player jersey number */
  jerseyNumber?: string | number;
  /** Callback when Made is selected */
  onMade: () => void;
  /** Callback when Missed is selected */
  onMissed: () => void;
  /** Callback to cancel the pending shot */
  onCancel: () => void;
  /** Whether buttons are disabled (during processing) */
  isProcessing?: boolean;
}

export function MadeMissedBar({
  pendingShot,
  playerName,
  jerseyNumber,
  onMade,
  onMissed,
  onCancel,
  isProcessing = false
}: MadeMissedBarProps) {
  const zoneLabel = getZoneLabel(pendingShot.zone);
  const pointsLabel = pendingShot.points === 3 ? '3PT' : '2PT';

  return (
    <div className="w-full bg-slate-800 border-t border-slate-700 p-4">
      {/* Player and Zone Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">
            {jerseyNumber && <span className="text-orange-400">#{jerseyNumber}</span>}
            {' '}{playerName}
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-300">{zoneLabel}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
            pendingShot.points === 3 
              ? 'bg-purple-600 text-white' 
              : 'bg-blue-600 text-white'
          }`}>
            {pointsLabel}
          </span>
        </div>
        
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-white transition-colors p-1"
          aria-label="Cancel shot"
          disabled={isProcessing}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Made/Missed Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onMade}
          disabled={isProcessing}
          className={`flex items-center justify-center gap-3 py-4 px-6 rounded-lg border-2 
            border-green-500 bg-green-500/20 
            hover:bg-green-500/30 active:bg-green-500/40
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-150`}
        >
          <CheckCircle className="w-8 h-8 text-green-400" />
          <div className="text-left">
            <div className="text-xl font-bold text-white">Made</div>
            <div className="text-sm text-green-300">+{pendingShot.points} pts</div>
          </div>
        </button>

        <button
          onClick={onMissed}
          disabled={isProcessing}
          className={`flex items-center justify-center gap-3 py-4 px-6 rounded-lg border-2 
            border-red-500 bg-red-500/20 
            hover:bg-red-500/30 active:bg-red-500/40
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-150`}
        >
          <XCircle className="w-8 h-8 text-red-400" />
          <div className="text-left">
            <div className="text-xl font-bold text-white">Missed</div>
            <div className="text-sm text-red-300">0 pts</div>
          </div>
        </button>
      </div>
    </div>
  );
}
