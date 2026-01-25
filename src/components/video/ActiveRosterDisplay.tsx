'use client';

/**
 * ActiveRosterDisplay - Compact active roster display for right sidebar
 * 
 * Shows on-court players side-by-side with player selection (1-0 keys).
 * 
 * @module ActiveRosterDisplay
 */

import React from 'react';
import { Users } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  is_custom_player?: boolean;
}

const OPPONENT_TEAM_ID = 'opponent-team';

interface ActiveRosterDisplayProps {
  teamAPlayers: Player[];
  teamBPlayers: Player[];
  teamAName: string;
  teamBName: string;
  selectedPlayerId: string | null;
  onPlayerSelect: (playerId: string) => void;
  isCoachMode?: boolean;
  opponentName?: string;
  onCourtA?: Player[];
  onCourtB?: Player[];
}

export function ActiveRosterDisplay({
  teamAPlayers,
  teamBPlayers,
  teamAName,
  teamBName,
  selectedPlayerId,
  onPlayerSelect,
  isCoachMode = false,
  opponentName,
  onCourtA,
  onCourtB,
}: ActiveRosterDisplayProps) {
  const isOpponentSelected = selectedPlayerId === OPPONENT_TEAM_ID;
  
  // Use on-court players if provided, otherwise fallback to first 5
  const displayOnCourtA = onCourtA || teamAPlayers.slice(0, 5);
  const displayOnCourtB = onCourtB || teamBPlayers.slice(0, 5);
  
  return (
    <div className="flex-shrink-0 border-b bg-white">
      {/* Header: Title + Player Selection Hint */}
      <div className="px-4 py-2.5 border-b bg-gradient-to-r from-orange-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-gray-900">Active Roster</span>
          </div>
          <span className="text-xs text-gray-500">
            Select Player: {isCoachMode ? '1-5, 0' : '1-0'}
          </span>
        </div>
      </div>
      
      {/* Side-by-side Roster */}
      <div className="p-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Team A (On Court) */}
          <div>
            <div className="text-xs font-semibold text-orange-600 mb-2 uppercase tracking-wide">
              {teamAName}
            </div>
            <div className="space-y-1">
              {displayOnCourtA.map((player, idx) => {
                const keyNumber = idx + 1;
                const isSelected = selectedPlayerId === player.id;
                return (
                  <button
                    key={player.id}
                    onClick={() => onPlayerSelect(player.id)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center gap-2 ${
                      isSelected
                        ? 'bg-orange-100 text-orange-700 font-medium border border-orange-300'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono min-w-[20px] text-center ${
                      isSelected ? 'bg-orange-200 text-orange-700' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {keyNumber}
                    </kbd>
                    <span className="font-mono text-gray-500 text-[10px]">#{player.jerseyNumber || '-'}</span>
                    <span className="truncate flex-1">{player.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Team B or Opponent */}
          <div>
            {isCoachMode ? (
              <>
                <div className="text-xs font-semibold text-red-600 mb-2 uppercase tracking-wide">
                  Opponent
                </div>
                <button
                  onClick={() => onPlayerSelect(OPPONENT_TEAM_ID)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center gap-2 ${
                    isOpponentSelected
                      ? 'bg-red-100 text-red-700 font-medium border border-red-300'
                      : 'hover:bg-red-50 border border-transparent'
                  }`}
                >
                  <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono min-w-[20px] text-center ${
                    isOpponentSelected ? 'bg-red-200 text-red-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    0
                  </kbd>
                  <span className="truncate flex-1">{opponentName || 'Opponent Team'}</span>
                </button>
              </>
            ) : (
              <>
                <div className="text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wide">
                  {teamBName}
                </div>
                <div className="space-y-1">
                  {displayOnCourtB.map((player, idx) => {
                    const keyNumber = idx + 6 === 10 ? 0 : idx + 6;
                    const isSelected = selectedPlayerId === player.id;
                    return (
                      <button
                        key={player.id}
                        onClick={() => onPlayerSelect(player.id)}
                        className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center gap-2 ${
                          isSelected
                            ? 'bg-blue-100 text-blue-700 font-medium border border-blue-300'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono min-w-[20px] text-center ${
                          isSelected ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {keyNumber}
                        </kbd>
                        <span className="font-mono text-gray-500 text-[10px]">#{player.jerseyNumber || '-'}</span>
                        <span className="truncate flex-1">{player.name}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
