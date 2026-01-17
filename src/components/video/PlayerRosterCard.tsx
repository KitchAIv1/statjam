'use client';

/**
 * PlayerRosterCard - Reusable roster display with editable jerseys
 * 
 * Single responsibility: Display one team's player roster
 * Used by VideoSetupPanel for both coach (1 team) and organizer (2 teams) modes
 */

import React from 'react';
import { Users } from 'lucide-react';
import { EditableJerseyNumber } from '@/components/tracker-v3/EditableJerseyNumber';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  is_custom_player?: boolean;
}

interface PlayerRosterCardProps {
  teamName: string;
  players: Player[];
  onPlayerUpdate: (playerId: string, updatedPlayer: Player) => void;
  /** Optional color theme - defaults to orange */
  themeColor?: 'orange' | 'blue';
  /** Optional label override */
  label?: string;
}

export function PlayerRosterCard({
  teamName,
  players,
  onPlayerUpdate,
  themeColor = 'orange',
  label,
}: PlayerRosterCardProps) {
  const colors = {
    orange: {
      border: 'border-orange-200',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      hover: 'hover:border-orange-200',
    },
    blue: {
      border: 'border-blue-200',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      hover: 'hover:border-blue-200',
    },
  };

  const theme = colors[themeColor];

  return (
    <div className={`bg-white rounded-xl border ${theme.border} shadow-sm overflow-hidden`}>
      <div className={`${theme.bg} px-4 py-3 border-b ${theme.border}`}>
        <div className={`flex items-center gap-2 ${theme.text}`}>
          <Users className="w-4 h-4" />
          <span className="font-semibold text-sm">
            {label || `${teamName} Roster`} - Click to Edit Jersey
          </span>
        </div>
      </div>
      
      <div className="p-4">
        {players.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">
            No players found for {teamName}.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {players.map((player) => (
              <div
                key={player.id}
                className={`flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg 
                           border border-gray-100 ${theme.hover} transition-colors`}
              >
                <EditableJerseyNumber
                  player={player}
                  onUpdate={onPlayerUpdate}
                />
                <span className="text-foreground text-xs font-medium text-center truncate w-full">
                  {player.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
