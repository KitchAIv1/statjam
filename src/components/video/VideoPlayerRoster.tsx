'use client';

/**
 * VideoPlayerRoster - Player selection roster for video stat tracking
 * 
 * Displays on-court players prominently with bench players secondary.
 * Includes substitution button for managing rosters.
 * 
 * @module VideoPlayerRoster
 */

import React from 'react';
import { Users, RefreshCw } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  is_custom_player?: boolean;
}

// Special ID for opponent team selection in coach mode
const OPPONENT_TEAM_ID = 'opponent-team';

interface VideoPlayerRosterProps {
  teamAPlayers: Player[]; // Legacy: all players (for backwards compat)
  teamBPlayers: Player[]; // Legacy: all players (for backwards compat)
  teamAName: string;
  teamBName: string;
  selectedPlayerId: string | null;
  onPlayerSelect: (playerId: string) => void;
  // Coach mode props
  isCoachMode?: boolean;
  opponentName?: string;
  // New: on-court/bench state for substitution support
  onCourtA?: Player[];
  benchA?: Player[];
  onCourtB?: Player[];
  benchB?: Player[];
  onSubstitutionClick?: () => void;
}

export function VideoPlayerRoster({
  teamAPlayers,
  teamBPlayers,
  teamAName,
  teamBName,
  selectedPlayerId,
  onPlayerSelect,
  isCoachMode = false,
  opponentName,
  onCourtA,
  benchA,
  onCourtB,
  benchB,
  onSubstitutionClick,
}: VideoPlayerRosterProps) {
  const isOpponentSelected = selectedPlayerId === OPPONENT_TEAM_ID;
  
  // Use on-court players if provided, otherwise fallback to all players (legacy)
  const displayOnCourtA = onCourtA || teamAPlayers.slice(0, 5);
  const displayBenchA = benchA || teamAPlayers.slice(5);
  const displayOnCourtB = onCourtB || teamBPlayers.slice(0, 5);
  const displayBenchB = benchB || teamBPlayers.slice(5);
  const hasSubstitution = !!onSubstitutionClick && (displayBenchA.length > 0 || displayBenchB.length > 0);
  
  return (
    <div className="border-b p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">On Court</span>
          <span className="text-xs text-gray-400">
            {isCoachMode ? '(1-5, 0=opponent)' : '(1-5 / 6-0)'}
          </span>
        </div>
        {hasSubstitution && (
          <button
            onClick={onSubstitutionClick}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
            title="Substitution (U)"
          >
            <RefreshCw className="w-3 h-3" />
            <span>SUB</span>
            <kbd className="bg-purple-200 px-1 rounded text-[10px] font-mono">U</kbd>
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {/* Team A On-Court */}
        <div>
          <div className="text-xs font-medium text-orange-600 mb-1 truncate flex items-center gap-1">
            {teamAName}
            <span className="text-gray-400 font-normal">({displayOnCourtA.length})</span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {displayOnCourtA.map((player, idx) => (
              <button
                key={player.id}
                onClick={() => onPlayerSelect(player.id)}
                className={`w-full text-left px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                  selectedPlayerId === player.id
                    ? 'bg-orange-100 text-orange-700 font-medium border border-orange-300'
                    : 'hover:bg-gray-100 border border-transparent'
                }`}
              >
                <kbd className="bg-gray-200 px-1 rounded text-[10px] font-mono min-w-[18px] text-center">
                  {idx < 5 ? idx + 1 : ''}
                </kbd>
                <span className="font-mono text-gray-500">#{player.jerseyNumber || '-'}</span>
                <span className="truncate">{player.name}</span>
              </button>
            ))}
          </div>
          {/* Bench indicator */}
          {displayBenchA.length > 0 && (
            <div className="mt-1 text-[10px] text-gray-400">
              +{displayBenchA.length} on bench
            </div>
          )}
        </div>
        
        {/* Team B or Opponent Panel */}
        <div>
          {isCoachMode ? (
            /* Coach Mode: Opponent Team Panel */
            <>
              <div className="text-xs font-medium text-red-600 mb-1 truncate">
                Opponent
              </div>
              <button
                onClick={() => onPlayerSelect(OPPONENT_TEAM_ID)}
                className={`w-full text-left px-3 py-3 rounded text-sm transition-colors ${
                  isOpponentSelected
                    ? 'bg-red-100 text-red-700 border-2 border-red-400 font-medium'
                    : 'bg-red-50 hover:bg-red-100 border border-red-200 text-red-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <kbd className="bg-red-200 px-1.5 rounded text-[10px] font-mono">0</kbd>
                  <span className="font-medium">{opponentName || 'Opponent Team'}</span>
                </div>
                <p className="text-[10px] text-red-500 mt-1">
                  Track opponent points, fouls, turnovers
                </p>
              </button>
            </>
          ) : (
            /* Regular Mode: Team B On-Court */
            <>
              <div className="text-xs font-medium text-blue-600 mb-1 truncate flex items-center gap-1">
                {teamBName}
                <span className="text-gray-400 font-normal">({displayOnCourtB.length})</span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {displayOnCourtB.map((player, idx) => (
                  <button
                    key={player.id}
                    onClick={() => onPlayerSelect(player.id)}
                    className={`w-full text-left px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                      selectedPlayerId === player.id
                        ? 'bg-blue-100 text-blue-700 font-medium border border-blue-300'
                        : 'hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <kbd className="bg-gray-200 px-1 rounded text-[10px] font-mono min-w-[18px] text-center">
                      {idx < 5 ? (idx + 6 === 10 ? '0' : idx + 6) : ''}
                    </kbd>
                    <span className="font-mono text-gray-500">#{player.jerseyNumber || '-'}</span>
                    <span className="truncate">{player.name}</span>
                  </button>
                ))}
              </div>
              {/* Bench indicator */}
              {displayBenchB.length > 0 && (
                <div className="mt-1 text-[10px] text-gray-400">
                  +{displayBenchB.length} on bench
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

