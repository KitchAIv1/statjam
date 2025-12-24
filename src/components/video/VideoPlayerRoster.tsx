'use client';

/**
 * VideoPlayerRoster - Player selection roster for video stat tracking
 * 
 * Displays both teams' players with keyboard shortcut indicators.
 * 
 * @module VideoPlayerRoster
 */

import React from 'react';
import { Users } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
}

interface VideoPlayerRosterProps {
  teamAPlayers: Player[];
  teamBPlayers: Player[];
  teamAName: string;
  teamBName: string;
  selectedPlayerId: string | null;
  onPlayerSelect: (playerId: string) => void;
}

export function VideoPlayerRoster({
  teamAPlayers,
  teamBPlayers,
  teamAName,
  teamBName,
  selectedPlayerId,
  onPlayerSelect,
}: VideoPlayerRosterProps) {
  return (
    <div className="border-b p-3">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Select Player</span>
        <span className="text-xs text-gray-400">(1-5 / 6-0)</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {/* Team A */}
        <div>
          <div className="text-xs font-medium text-orange-600 mb-1 truncate">
            {teamAName}
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {teamAPlayers.map((player, idx) => (
              <button
                key={player.id}
                onClick={() => onPlayerSelect(player.id)}
                className={`w-full text-left px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                  selectedPlayerId === player.id
                    ? 'bg-orange-100 text-orange-700 font-medium'
                    : 'hover:bg-gray-100'
                }`}
              >
                <kbd className="bg-gray-200 px-1 rounded text-[10px] font-mono min-w-[18px] text-center">
                  {idx < 5 ? idx + 1 : ''}
                </kbd>
                <span className="font-mono">#{player.jerseyNumber || '-'}</span>
                <span className="truncate">{player.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Team B */}
        <div>
          <div className="text-xs font-medium text-blue-600 mb-1 truncate">
            {teamBName}
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {teamBPlayers.map((player, idx) => (
              <button
                key={player.id}
                onClick={() => onPlayerSelect(player.id)}
                className={`w-full text-left px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                  selectedPlayerId === player.id
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'hover:bg-gray-100'
                }`}
              >
                <kbd className="bg-gray-200 px-1 rounded text-[10px] font-mono min-w-[18px] text-center">
                  {idx < 5 ? (idx + 6 === 10 ? '0' : idx + 6) : ''}
                </kbd>
                <span className="font-mono">#{player.jerseyNumber || '-'}</span>
                <span className="truncate">{player.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

