/**
 * useShotTracker - Hook for managing shot tracker state
 * 
 * Handles pending shots, perspective, and shot markers.
 * Delegates recording to the parent tracker via callback.
 * 
 * Follows .cursorrules: <100 lines
 * @module useShotTracker
 */

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  CourtCoordinates,
  CourtPerspective,
  PendingShot,
  ShotMarker,
  ShotLocationData
} from '@/lib/types/shotTracker';
import { detectZoneFromCoordinates } from '@/lib/services/shotLocationService';

interface UseShotTrackerProps {
  /** Currently selected player ID */
  selectedPlayerId: string | null;
  /** Currently selected custom player ID (coach mode) */
  selectedCustomPlayerId: string | null;
  /** Currently selected team ID */
  selectedTeamId: string;
  /** Team A ID for perspective determination */
  teamAId: string;
  /** Callback to record stat via parent tracker */
  onRecordStat: (
    statType: string,
    modifier: string,
    locationData?: ShotLocationData
  ) => Promise<void>;
}

export function useShotTracker({
  selectedPlayerId,
  selectedCustomPlayerId,
  selectedTeamId,
  teamAId,
  onRecordStat
}: UseShotTrackerProps) {
  const [pendingShot, setPendingShot] = useState<PendingShot | null>(null);
  const [shotMarkers, setShotMarkers] = useState<ShotMarker[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Perspective based on selected team
  const perspective: CourtPerspective = 
    selectedTeamId === teamAId ? 'team_a_attacks_up' : 'team_b_attacks_up';

  const handleCourtTap = useCallback((coordinates: CourtCoordinates) => {
    if (!selectedPlayerId && !selectedCustomPlayerId) return;

    const detection = detectZoneFromCoordinates(coordinates);
    
    setPendingShot({
      pendingId: uuidv4(),
      playerId: selectedPlayerId,
      customPlayerId: selectedCustomPlayerId || null,
      teamId: selectedTeamId,
      location: coordinates,
      zone: detection.zone,
      shotType: detection.shotType,
      points: detection.points,
      timestamp: Date.now()
    });
  }, [selectedPlayerId, selectedCustomPlayerId, selectedTeamId]);

  const confirmShot = useCallback(async (made: boolean) => {
    if (!pendingShot || isProcessing) return;

    setIsProcessing(true);
    try {
      const statType = pendingShot.shotType === 'three_pointer' 
        ? 'three_pointer' 
        : 'field_goal';
      
      await onRecordStat(statType, made ? 'made' : 'missed', {
        shotLocationX: pendingShot.location.x,
        shotLocationY: pendingShot.location.y,
        shotZone: pendingShot.zone
      });

      // Add marker for visual feedback
      setShotMarkers(prev => [...prev, {
        id: pendingShot.pendingId,
        location: pendingShot.location,
        made,
        shotType: pendingShot.shotType,
        playerId: pendingShot.playerId,
        timestamp: Date.now()
      }]);
    } finally {
      setPendingShot(null);
      setIsProcessing(false);
    }
  }, [pendingShot, isProcessing, onRecordStat]);

  const cancelPendingShot = useCallback(() => {
    setPendingShot(null);
  }, []);

  const clearMarkers = useCallback(() => {
    setShotMarkers([]);
  }, []);

  return {
    pendingShot,
    shotMarkers,
    perspective,
    isProcessing,
    handleCourtTap,
    confirmMade: () => confirmShot(true),
    confirmMissed: () => confirmShot(false),
    cancelPendingShot,
    clearMarkers
  };
}
