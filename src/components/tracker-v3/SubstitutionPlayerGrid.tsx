'use client';

import React from 'react';
import { SubstitutionPlayerSection } from './SubstitutionPlayerSection';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  is_custom_player?: boolean;
}

interface SubstitutionPlayerGridProps {
  onCourtPlayers: Player[];
  benchPlayers: Player[];
  selectedPlayers: Set<string>;
  selectedPlayersOut: Set<string>;
  selectedPlayersIn: Set<string>;
  multiSelectMode: boolean;
  onCourtPlayerSelect: (playerId: string) => void;
  onBenchPlayerSelect: (playerId: string) => void;
  onCourtPlayerDeselect?: (playerId: string) => void;
  onBenchPlayerDeselect?: (playerId: string) => void;
  onJerseyUpdate: (playerId: string, updatedPlayer: Player) => void;
}

export function SubstitutionPlayerGrid({
  onCourtPlayers,
  benchPlayers,
  selectedPlayers,
  selectedPlayersOut,
  selectedPlayersIn,
  multiSelectMode,
  onCourtPlayerSelect,
  onBenchPlayerSelect,
  onCourtPlayerDeselect,
  onBenchPlayerDeselect,
  onJerseyUpdate
}: SubstitutionPlayerGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* On Court Players */}
      <div className="space-y-3">
        <SubstitutionPlayerSection
          title="On Court"
          players={onCourtPlayers}
          isOnCourt={true}
          selectedPlayers={selectedPlayersOut}
          multiSelectMode={multiSelectMode}
          onPlayerSelect={onCourtPlayerSelect}
          onPlayerDeselect={onCourtPlayerDeselect}
          onJerseyUpdate={onJerseyUpdate}
        />
      </div>

      {/* Bench Players */}
      <div className="space-y-3">
        <SubstitutionPlayerSection
          title="Bench"
          players={benchPlayers}
          isOnCourt={false}
          selectedPlayers={selectedPlayersIn}
          multiSelectMode={multiSelectMode}
          onPlayerSelect={onBenchPlayerSelect}
          onPlayerDeselect={onBenchPlayerDeselect}
          onJerseyUpdate={onJerseyUpdate}
        />
      </div>
    </div>
  );
}

