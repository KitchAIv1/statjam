'use client';

/**
 * ShotLocationMarker - Visual marker for shot locations on court
 * 
 * Displays made/missed indicators at the correct position on the court.
 * Handles coordinate transformation for flipped perspectives.
 * 
 * @module ShotLocationMarker
 */

import React from 'react';
import { CourtCoordinates, CourtPerspective } from '@/lib/types/shotTracker';

interface ShotLocationMarkerProps {
  /** Normalized court coordinates (0-100) */
  location: CourtCoordinates;
  /** Whether shot was made (true), missed (false), or pending (null) */
  made: boolean | null;
  /** Current court perspective for coordinate transformation */
  perspective: CourtPerspective;
  /** Whether this is a pending shot awaiting confirmation */
  isPending?: boolean;
}

export function ShotLocationMarker({
  location,
  made,
  perspective,
  isPending = false
}: ShotLocationMarkerProps) {
  // Transform coordinates if perspective is flipped
  const displayX = perspective === 'team_b_attacks_up' 
    ? 100 - location.x 
    : location.x;
  const displayY = perspective === 'team_b_attacks_up' 
    ? 100 - location.y 
    : location.y;

  // Determine marker styling
  const getMarkerStyles = (): string => {
    if (isPending) {
      return 'bg-yellow-400 border-yellow-200 animate-pulse';
    }
    if (made === true) {
      return 'bg-green-500 border-green-300';
    }
    if (made === false) {
      return 'bg-red-500 border-red-300';
    }
    return 'bg-gray-400 border-gray-300';
  };

  return (
    <div
      className={`absolute w-4 h-4 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 ${getMarkerStyles()}`}
      style={{
        left: `${displayX}%`,
        top: `${displayY}%`
      }}
      aria-label={isPending ? 'Pending shot' : made ? 'Made shot' : 'Missed shot'}
    >
      {/* Inner indicator */}
      {!isPending && made !== null && (
        <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
          {made ? '✓' : '✗'}
        </span>
      )}
    </div>
  );
}
