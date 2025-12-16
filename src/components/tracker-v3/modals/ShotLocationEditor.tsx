/**
 * ShotLocationEditor - Shot Location Editor for StatEditForm
 * 
 * PURPOSE:
 * - Display/edit shot location on half-court diagram
 * - Reuses HalfCourtDiagram component
 * - Shows existing location, allows tap to update
 * 
 * Follows .cursorrules: <100 lines component
 */

'use client';

import React, { useState, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { HalfCourtDiagram } from '../shot-tracker/HalfCourtDiagram';
import { CourtCoordinates } from '@/lib/types/shotTracker';
import { detectZoneFromCoordinates } from '@/lib/services/shotLocationService';

interface ShotLocationEditorProps {
  /** Current X coordinate (0-100) */
  locationX: number | null;
  /** Current Y coordinate (0-100) */
  locationY: number | null;
  /** Current zone */
  zone: string | null;
  /** Callback when location changes */
  onLocationChange: (x: number, y: number, zone: string) => void;
}

export function ShotLocationEditor({
  locationX,
  locationY,
  zone,
  onLocationChange
}: ShotLocationEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCourtTap = useCallback((coordinates: CourtCoordinates) => {
    const detection = detectZoneFromCoordinates(coordinates);
    onLocationChange(coordinates.x, coordinates.y, detection.zone);
  }, [onLocationChange]);

  const hasLocation = locationX !== null && locationY !== null;

  // Create marker for existing location
  const pendingLocation = hasLocation ? { x: locationX, y: locationY } : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-700">
          Shot Location
        </label>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-purple-600 hover:text-purple-700 font-medium"
        >
          {isExpanded ? 'Hide Court' : (hasLocation ? 'Edit Location' : 'Add Location')}
        </button>
      </div>

      {/* Location Summary */}
      {hasLocation && !isExpanded && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
          <MapPin className="w-4 h-4 text-purple-500" />
          <span>{zone?.replace(/_/g, ' ').toUpperCase() || 'Unknown zone'}</span>
          <span className="text-gray-400">({Math.round(locationX)}%, {Math.round(locationY)}%)</span>
        </div>
      )}

      {/* Court Diagram - Full aspect ratio for complete court visibility */}
      {isExpanded && (
        <div className="relative w-full aspect-[4/3] border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
          <HalfCourtDiagram
            onCourtTap={handleCourtTap}
            perspective="team_a_attacks_up"
            isInteractive={true}
            pendingLocation={pendingLocation}
          />
          <div className="absolute bottom-2 left-2 right-2 text-center">
            <p className="text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
              Tap court to {hasLocation ? 'update' : 'set'} shot location
            </p>
          </div>
        </div>
      )}

      {/* No location message */}
      {!hasLocation && !isExpanded && (
        <p className="text-xs text-gray-400">No location recorded</p>
      )}
    </div>
  );
}
