'use client';

import React from 'react';
import { User } from 'lucide-react';
import { SubstitutionPlayerCard } from './SubstitutionPlayerCard';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  is_custom_player?: boolean;
}

interface SubstitutionPlayerSectionProps {
  title: string;
  players: Player[];
  isOnCourt: boolean;
  selectedPlayers: Set<string>;
  multiSelectMode: boolean;
  onPlayerSelect: (playerId: string) => void;
  onPlayerDeselect?: (playerId: string) => void;
  onJerseyUpdate: (playerId: string, updatedPlayer: Player) => void;
}

export function SubstitutionPlayerSection({
  title,
  players,
  isOnCourt,
  selectedPlayers,
  multiSelectMode,
  onPlayerSelect,
  onPlayerDeselect,
  onJerseyUpdate
}: SubstitutionPlayerSectionProps) {
  if (players.length === 0 && !isOnCourt) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-green-400 uppercase tracking-wide">
          {title} (0)
        </h4>
        <div className="text-center py-8 text-gray-400">
          <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold mb-2 text-white">No Bench Players</h3>
          <p className="text-sm text-gray-300">
            All available players are currently on the court
          </p>
        </div>
      </div>
    );
  }

  if (players.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className={`text-sm font-semibold uppercase tracking-wide ${
        isOnCourt ? 'text-blue-400' : 'text-green-400'
      }`}>
        {title} ({players.length})
      </h4>
      {players.map((player) => (
        <SubstitutionPlayerCard
          key={player.id}
          player={player}
          isOnCourt={isOnCourt}
          isSelected={selectedPlayers.has(player.id)}
          multiSelectMode={multiSelectMode}
          onSelect={onPlayerSelect}
          onDeselect={onPlayerDeselect}
          onJerseyUpdate={onJerseyUpdate}
        />
      ))}
    </div>
  );
}

