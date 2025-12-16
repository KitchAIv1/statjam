'use client';

/**
 * StatInputWrapper - Wrapper for stat input with mode toggle
 * 
 * Handles switching between Classic (button) and Shot Tracker (court) modes.
 * Renders appropriate component based on selected mode.
 * 
 * @module StatInputWrapper
 */

import React, { useState } from 'react';
import { DesktopStatGridV3 } from './DesktopStatGridV3';
import { ShotTrackerPanel } from './shot-tracker/ShotTrackerPanel';
import { TrackerModeToggle } from './shot-tracker/TrackerModeToggle';
import { TrackerInputMode, ShotLocationData } from '@/lib/types/shotTracker';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  photo_url?: string;
  is_custom_player?: boolean;
}

interface StatInputWrapperProps {
  // Player state
  selectedPlayer: string | null;
  selectedPlayerData?: Player | null;
  
  // Team context
  teamAId: string;
  teamBId: string;
  teamAName?: string;
  teamBName?: string;
  teamAPlayers: Player[];
  teamBPlayers: Player[];
  
  // Game state
  gameId: string;
  isClockRunning: boolean;
  gameStatus?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overtime';
  
  // Callbacks - existing
  onStatRecord: (statType: string, modifier?: string) => Promise<void>;
  onFoulRecord: (foulType: 'personal' | 'technical') => Promise<void>;
  onTimeOut: () => void;
  onSubstitution?: () => void;
  onGameEnd: () => void;
  onGameCancel: () => void;
  onUndoLastAction?: () => Promise<void>;
  canUndo?: boolean;
  
  // Callbacks - shot tracker specific
  onStatRecordWithLocation?: (
    statType: string,
    modifier: string,
    locationData?: ShotLocationData
  ) => Promise<void>;
  
  // Last action display
  lastAction?: string | null;
  lastActionPlayerId?: string | null;
  
  // Possession
  possession?: {
    currentTeamId: string;
    possessionArrow: string;
  };
  onPossessionChange?: (teamId: string) => void;
  
  // Mode
  isCoachMode?: boolean;
  
  // Sticky button fix
  onClearRecordingStateRef?: (clearFn: () => void) => void;
  
  // Clock state for Add Stat modal
  currentQuarter?: number;
  currentMinutes?: number;
  currentSeconds?: number;
}

export function StatInputWrapper({
  selectedPlayer,
  selectedPlayerData,
  teamAId,
  teamBId,
  teamAName,
  teamBName,
  teamAPlayers,
  teamBPlayers,
  gameId,
  isClockRunning,
  gameStatus,
  onStatRecord,
  onFoulRecord,
  onTimeOut,
  onSubstitution,
  onGameEnd,
  onGameCancel,
  onUndoLastAction,
  canUndo,
  onStatRecordWithLocation,
  lastAction,
  lastActionPlayerId,
  possession,
  onPossessionChange,
  isCoachMode,
  onClearRecordingStateRef,
  currentQuarter = 1,
  currentMinutes = 10,
  currentSeconds = 0
}: StatInputWrapperProps) {
  const [inputMode, setInputMode] = useState<TrackerInputMode>('classic');

  // Determine selected team based on player
  const selectedTeamId = selectedPlayerData
    ? teamAPlayers.some(p => p.id === selectedPlayer) ? teamAId : teamBId
    : teamAId;

  // Check if player is custom (for coach mode)
  const isCustomPlayer = selectedPlayerData?.is_custom_player || 
    selectedPlayer?.startsWith('custom-');
  const selectedCustomPlayerId = isCustomPlayer ? selectedPlayer : null;

  // Default handler if no location handler provided
  const handleStatRecordWithLocation = onStatRecordWithLocation || 
    (async (statType: string, modifier: string) => {
      await onStatRecord(statType, modifier);
    });

  // Classic mode: Let DesktopStatGridV3 handle its own layout
  if (inputMode === 'classic') {
    return (
      <div 
        className="w-full h-full flex flex-col"
        style={{ 
          minHeight: '650px',
          maxHeight: '650px',
          height: '650px'
        }}
      >
        {/* Mode Toggle Header - Available for all tracking modes */}
        <div className="flex items-center justify-end p-2 flex-shrink-0">
          <TrackerModeToggle
            mode={inputMode}
            onModeChange={setInputMode}
            disabled={gameStatus === 'completed' || gameStatus === 'cancelled'}
          />
        </div>

        {/* DesktopStatGridV3 handles its own container styling */}
        <div className="flex-1 min-h-0">
          <DesktopStatGridV3
            selectedPlayer={selectedPlayer}
            selectedPlayerData={selectedPlayerData}
            isClockRunning={isClockRunning}
            onStatRecord={onStatRecord}
            onFoulRecord={onFoulRecord}
            onTimeOut={onTimeOut}
            onSubstitution={onSubstitution}
            onGameEnd={onGameEnd}
            onGameCancel={onGameCancel}
            lastAction={lastAction}
            lastActionPlayerId={lastActionPlayerId}
            onUndoLastAction={onUndoLastAction}
            canUndo={canUndo}
            possession={possession}
            teamAId={teamAId}
            teamBId={teamBId}
            teamAName={teamAName}
            teamBName={teamBName}
            isCoachMode={isCoachMode}
            onPossessionChange={onPossessionChange}
            gameStatus={gameStatus}
            gameId={gameId}
            teamAPlayers={teamAPlayers}
            teamBPlayers={teamBPlayers}
            onClearRecordingStateRef={onClearRecordingStateRef}
            currentQuarter={currentQuarter}
            currentMinutes={currentMinutes}
            currentSeconds={currentSeconds}
          />
        </div>
      </div>
    );
  }

  // Shot Tracker mode: Full-width court with compact buttons
  return (
    <div 
      className="w-full h-full flex flex-col"
      style={{ 
        minHeight: '650px',
        maxHeight: '650px',
        height: '650px'
      }}
    >
      {/* Mode Toggle Header - Available for all tracking modes */}
      <div className="flex items-center justify-end p-2 flex-shrink-0">
        <TrackerModeToggle
          mode={inputMode}
          onModeChange={setInputMode}
          disabled={gameStatus === 'completed' || gameStatus === 'cancelled'}
        />
      </div>

      {/* Shot Tracker Panel - Full width, no padding */}
      <div className="flex-1 min-h-0">
        <ShotTrackerPanel
          selectedPlayer={selectedPlayer}
          selectedPlayerData={selectedPlayerData}
          selectedCustomPlayerId={selectedCustomPlayerId}
          selectedTeamId={selectedTeamId}
          teamAId={teamAId}
          isClockRunning={isClockRunning}
          onStatRecord={onStatRecord}
          onStatRecordWithLocation={handleStatRecordWithLocation}
          onFoulRecord={onFoulRecord}
          onTimeOut={onTimeOut}
          onSubstitution={onSubstitution}
          onGameEnd={onGameEnd}
          onGameCancel={onGameCancel}
        />
      </div>
    </div>
  );
}
