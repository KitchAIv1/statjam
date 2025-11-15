/**
 * AwardSelectionSection - Award Selection UI Component
 * 
 * PURPOSE: Display clickable player list for award selection
 * - Shows players with stats
 * - Highlights selected player
 * - Shows suggested player badge
 * 
 * Follows .cursorrules: <150 lines component
 */

'use client';

import React from 'react';
import { Trophy, Sparkles } from 'lucide-react';
import { PlayerStats } from '@/lib/services/teamStatsService';

export interface AwardSelectionSectionProps {
  awardType: 'player_of_the_game' | 'hustle_player';
  players: PlayerStats[];
  selectedPlayerId: string | null;
  suggestedPlayerId: string | null;
  onSelect: (playerId: string) => void;
  teamName: string;
}

export function AwardSelectionSection({
  awardType,
  players,
  selectedPlayerId,
  suggestedPlayerId,
  onSelect,
  teamName
}: AwardSelectionSectionProps) {
  const awardLabel = awardType === 'player_of_the_game' 
    ? 'Player of the Game' 
    : 'Hustle Player of the Game';
  
  const awardIcon = awardType === 'player_of_the_game' 
    ? Trophy 
    : Sparkles;

  const Icon = awardIcon;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-bold text-gray-900">{awardLabel}</h3>
      </div>
      
      <div className="text-sm text-gray-600 mb-3">
        Select from {teamName}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
        {players.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No players available
          </div>
        ) : (
          players.map((player) => {
            const isSelected = selectedPlayerId === player.playerId;
            const isSuggested = suggestedPlayerId === player.playerId;

            return (
              <button
                key={player.playerId}
                onClick={() => onSelect(player.playerId)}
                className={`w-full text-left p-3 transition-all ${
                  isSelected
                    ? 'bg-purple-100 border-2 border-purple-500'
                    : 'bg-white border-2 border-transparent hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {player.playerName}
                      </span>
                      {isSuggested && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Suggested
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {player.points} PTS • {player.rebounds} REB • {player.assists} AST
                      {player.steals > 0 && ` • ${player.steals} STL`}
                      {player.blocks > 0 && ` • ${player.blocks} BLK`}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="ml-3">
                      <Icon className="w-5 h-5 text-purple-600" />
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

