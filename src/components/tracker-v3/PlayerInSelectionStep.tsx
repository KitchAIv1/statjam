'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { SubstitutionPlayerGrid } from './SubstitutionPlayerGrid';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  is_custom_player?: boolean;
}

interface PlayerInSelectionStepProps {
  onCourtPlayers: Player[];
  benchPlayers: Player[];
  selectedPlayerOut: string | null;
  selectedPlayersIn: Set<string>;
  multiSelectMode: boolean;
  allTeamPlayers: Player[];
  onPlayerInSelect: (playerId: string) => void;
  onPlayerInDeselect?: (playerId: string) => void;
  onJerseyUpdate: (playerId: string, updatedPlayer: Player) => void;
}

export function PlayerInSelectionStep({
  onCourtPlayers,
  benchPlayers,
  selectedPlayerOut,
  selectedPlayersIn,
  multiSelectMode,
  allTeamPlayers,
  onPlayerInSelect,
  onPlayerInDeselect,
  onJerseyUpdate
}: PlayerInSelectionStepProps) {
  const playerOut = selectedPlayerOut ? allTeamPlayers.find(p => p.id === selectedPlayerOut) : null;

  return (
    <div className="space-y-6">
      {/* Selected Player Out Display */}
      {playerOut && (
        <div 
          className="p-4 rounded-xl border-2"
          style={{ 
            borderColor: '#ef4444',
            background: 'rgba(239, 68, 68, 0.15)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-400 mb-1">
                Player Coming Out:
              </p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs">
                  #{playerOut.jerseyNumber ?? '?'}
                </div>
                <span className="font-semibold text-white">
                  {playerOut.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2 text-white">
          {multiSelectMode ? 'Select Multiple Players' : 'Select Substitute Player'}
        </h3>
        <p className="text-sm text-gray-300">
          {multiSelectMode 
            ? 'Select players to substitute in. Click jersey number to edit.'
            : 'Click any player to substitute immediately. Toggle multi-select for bulk changes.'}
        </p>
        {multiSelectMode && selectedPlayersIn.size > 0 && (
          <p className="text-sm text-green-400 mt-2 font-semibold">
            {selectedPlayersIn.size} player{selectedPlayersIn.size > 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* Player Lists - Side by Side */}
      <SubstitutionPlayerGrid
        onCourtPlayers={onCourtPlayers}
        benchPlayers={benchPlayers}
        selectedPlayers={selectedPlayersIn}
        multiSelectMode={multiSelectMode}
        onPlayerSelect={onPlayerInSelect}
        onPlayerDeselect={onPlayerInDeselect}
        onJerseyUpdate={onJerseyUpdate}
      />
    </div>
  );
}

