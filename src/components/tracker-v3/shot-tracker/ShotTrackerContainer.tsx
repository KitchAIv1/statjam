'use client';

/**
 * ShotTrackerContainer - Main wrapper for shot tracking interface
 * 
 * Combines HalfCourtDiagram, MadeMissedBar, and manages the shot tracking flow.
 * Integrates with the parent tracker for stat recording.
 * 
 * @module ShotTrackerContainer
 */

import React from 'react';
import { HalfCourtDiagram } from './HalfCourtDiagram';
import { MadeMissedBar } from './MadeMissedBar';
import { useShotTracker } from '@/hooks/useShotTracker';
import { ShotLocationData } from '@/lib/types/shotTracker';

interface ShotTrackerContainerProps {
  /** Currently selected player ID */
  selectedPlayerId: string | null;
  /** Currently selected custom player ID (coach mode) */
  selectedCustomPlayerId?: string | null;
  /** Currently selected team ID */
  selectedTeamId: string;
  /** Team A ID for perspective */
  teamAId: string;
  /** Selected player display name */
  playerName: string;
  /** Selected player jersey number */
  jerseyNumber?: string | number;
  /** Callback to record stat via parent tracker */
  onRecordStat: (
    statType: string,
    modifier: string,
    locationData?: ShotLocationData
  ) => Promise<void>;
  /** Whether a player is selected */
  hasPlayerSelected: boolean;
}

export function ShotTrackerContainer({
  selectedPlayerId,
  selectedCustomPlayerId,
  selectedTeamId,
  teamAId,
  playerName,
  jerseyNumber,
  onRecordStat,
  hasPlayerSelected
}: ShotTrackerContainerProps) {
  const {
    pendingShot,
    shotMarkers,
    perspective,
    isProcessing,
    handleCourtTap,
    confirmMade,
    confirmMissed,
    cancelPendingShot
  } = useShotTracker({
    selectedPlayerId,
    selectedCustomPlayerId: selectedCustomPlayerId || null,
    selectedTeamId,
    teamAId,
    onRecordStat
  });

  const isCourtInteractive = hasPlayerSelected && !pendingShot && !isProcessing;

  return (
    <div className="relative w-full h-full">
      {/* Player Selection Prompt Overlay */}
      {!hasPlayerSelected && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 rounded-lg">
          <div className="text-center p-6">
            <p className="text-white text-lg font-medium mb-2">
              Select a Player First
            </p>
            <p className="text-slate-400 text-sm">
              Tap a player from the roster, then tap the court
            </p>
          </div>
        </div>
      )}

      {/* Court Diagram - Full width, no padding */}
      <div className="w-full h-full">
        <HalfCourtDiagram
          onCourtTap={handleCourtTap}
          perspective={perspective}
          shotMarkers={shotMarkers}
          isInteractive={isCourtInteractive}
          pendingLocation={pendingShot?.location}
        />
      </div>

      {/* Made/Missed Confirmation Bar - Overlays bottom of court */}
      {pendingShot && (
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <MadeMissedBar
            pendingShot={pendingShot}
            playerName={playerName}
            jerseyNumber={jerseyNumber}
            onMade={confirmMade}
            onMissed={confirmMissed}
            onCancel={cancelPendingShot}
            isProcessing={isProcessing}
          />
        </div>
      )}

      {/* Instruction hint - Overlays bottom of court when no pending shot */}
      {!pendingShot && hasPlayerSelected && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/40 z-10">
          <p className="text-white/80 text-sm text-center">
            Tap the court where the shot was taken
          </p>
        </div>
      )}
    </div>
  );
}
