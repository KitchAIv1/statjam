'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { SubstitutionPlayerSection } from './SubstitutionPlayerSection';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  is_custom_player?: boolean;
}

interface PlayerOutSelectionStepProps {
  onCourtPlayers: Player[];
  benchPlayers: Player[];
  selectedPlayerOut: string | null;
  onSelectPlayerOut: (playerId: string) => void;
  onJerseyUpdate: (playerId: string, updatedPlayer: Player) => void;
}

export function PlayerOutSelectionStep({
  onCourtPlayers,
  benchPlayers,
  selectedPlayerOut,
  onSelectPlayerOut,
  onJerseyUpdate
}: PlayerOutSelectionStepProps) {
  const selectedPlayers = selectedPlayerOut ? new Set([selectedPlayerOut]) : new Set();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2 text-white">
          Select Player Coming Out
        </h3>
        <p className="text-sm text-gray-300">
          Choose which player will be substituted out
        </p>
      </div>

      {selectedPlayerOut && (
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
                {(() => {
                  const player = [...onCourtPlayers, ...benchPlayers].find(p => p.id === selectedPlayerOut);
                  return (
                    <>
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs">
                        #{player?.jerseyNumber ?? '?'}
                      </div>
                      <span className="font-semibold text-white">
                        {player?.name || 'Unknown'}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player Lists - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SubstitutionPlayerSection
          title="On Court"
          players={onCourtPlayers}
          isOnCourt={true}
          selectedPlayers={selectedPlayers}
          multiSelectMode={false}
          onPlayerSelect={onSelectPlayerOut}
          onJerseyUpdate={onJerseyUpdate}
        />

        <SubstitutionPlayerSection
          title="Bench"
          players={benchPlayers}
          isOnCourt={false}
          selectedPlayers={selectedPlayers}
          multiSelectMode={false}
          onPlayerSelect={onSelectPlayerOut}
          onJerseyUpdate={onJerseyUpdate}
        />
      </div>
    </div>
  );
}

