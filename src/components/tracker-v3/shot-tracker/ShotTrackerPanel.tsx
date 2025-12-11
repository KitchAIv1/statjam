'use client';

/**
 * ShotTrackerPanel - Combined court diagram and compact stat buttons
 * 
 * Used when Shot Tracker mode is active. Replaces the full stat button grid
 * with a court diagram for 2PT/3PT shots plus compact buttons for other stats.
 * 
 * @module ShotTrackerPanel
 */

import React, { useState } from 'react';
import { ShotTrackerContainer } from './ShotTrackerContainer';
import { CompactStatButtons } from './CompactStatButtons';
import { ShotLocationData } from '@/lib/types/shotTracker';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
}

interface ShotTrackerPanelProps {
  // Player selection
  selectedPlayer: string | null;
  selectedPlayerData?: Player | null;
  selectedCustomPlayerId?: string | null;
  selectedTeamId: string;
  teamAId: string;
  
  // Game state
  isClockRunning: boolean;
  
  // Callbacks
  onStatRecord: (statType: string, modifier?: string) => Promise<void>;
  onStatRecordWithLocation: (
    statType: string,
    modifier: string,
    locationData?: ShotLocationData
  ) => Promise<void>;
  onFoulRecord: (foulType: 'personal' | 'technical') => Promise<void>;
  onTimeOut: () => void;
  onSubstitution?: () => void;
  onGameEnd: () => void;
  onGameCancel: () => void;
}

export function ShotTrackerPanel({
  selectedPlayer,
  selectedPlayerData,
  selectedCustomPlayerId,
  selectedTeamId,
  teamAId,
  isClockRunning,
  onStatRecord,
  onStatRecordWithLocation,
  onFoulRecord,
  onTimeOut,
  onSubstitution,
  onGameEnd,
  onGameCancel
}: ShotTrackerPanelProps) {
  const [isRecording, setIsRecording] = useState<string | null>(null);

  const hasPlayerSelected = !!(selectedPlayer || selectedCustomPlayerId);
  const playerName = selectedPlayerData?.name || 'Unknown Player';
  const jerseyNumber = selectedPlayerData?.jerseyNumber;

  return (
    <div className="flex flex-col h-full">
      {/* Court Diagram - Takes most of the space */}
      <div className="flex-1 min-h-0 relative">
        <ShotTrackerContainer
          selectedPlayerId={selectedPlayer}
          selectedCustomPlayerId={selectedCustomPlayerId}
          selectedTeamId={selectedTeamId}
          teamAId={teamAId}
          playerName={playerName}
          jerseyNumber={jerseyNumber}
          onRecordStat={onStatRecordWithLocation}
          hasPlayerSelected={hasPlayerSelected}
        />
      </div>

      {/* Compact Stat Buttons */}
      <div className="flex-shrink-0 px-2 pt-2">
        <CompactStatButtons
          selectedPlayer={selectedPlayer}
          isClockRunning={isClockRunning}
          onStatRecord={onStatRecord}
          onFoulRecord={onFoulRecord}
          onTimeOut={onTimeOut}
          onSubstitution={onSubstitution}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
        />
      </div>

      {/* Cancel/End Game Buttons */}
      <div className="flex-shrink-0 px-2 pt-2 pb-2">
        <div className="flex gap-2">
          <button
            className="flex-1 text-sm font-bold py-2.5 rounded-xl border-2 border-orange-400 bg-orange-500 hover:bg-orange-600 text-white transition-all"
            onClick={() => {
              if (confirm('Cancel this game?')) onGameCancel();
            }}
          >
            🚫 CANCEL
          </button>
          <button
            className="flex-1 text-sm font-bold py-2.5 rounded-xl border-2 border-red-400 bg-red-500 hover:bg-red-600 text-white transition-all"
            onClick={onGameEnd}
          >
            🏁 END GAME
          </button>
        </div>
      </div>
    </div>
  );
}
