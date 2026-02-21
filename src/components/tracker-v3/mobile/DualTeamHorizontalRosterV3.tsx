'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { OpponentTeamPanel } from '../OpponentTeamPanel';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  photo_url?: string;
}

interface DualTeamHorizontalRosterV3Props {
  teamAPlayers: Player[];
  teamBPlayers: Player[];
  teamAName: string;
  teamBName: string;
  selectedPlayer: string | null;
  onPlayerSelect: (playerId: string) => void;
  onSubstitution?: (playerId: string) => void;
  isCoachMode?: boolean; // Add coach mode flag
  // ✅ Coach mode props for OpponentTeamPanel
  gameId?: string;
  teamId?: string;
  opponentName?: string;
  playerFoulCounts?: Record<string, number>;
}

export function DualTeamHorizontalRosterV3({
  teamAPlayers,
  teamBPlayers,
  teamAName,
  teamBName,
  selectedPlayer,
  onPlayerSelect,
  onSubstitution,
  isCoachMode = false,
  gameId,
  teamId,
  opponentName,
  playerFoulCounts = {}
}: DualTeamHorizontalRosterV3Props) {
  
  // Get first 5 players for each team (tournament mode) or all players (coach mode)
  // Always show only first 5 players (on-court)
  // Bench players accessible via substitution modal
  const teamADisplay = teamAPlayers.slice(0, 5);
  const teamBDisplay = teamBPlayers.slice(0, 5);
  
  // Check which team the selected player belongs to
  const selectedPlayerTeam = teamADisplay.find(p => p.id === selectedPlayer) ? 'A' : 
                            teamBDisplay.find(p => p.id === selectedPlayer) ? 'B' : null;

  // Generate player initials with proper fallback handling
  const getPlayerInitials = (name: string) => {
    if (name.startsWith('Player ') || name.startsWith('player ')) {
      return 'PL';
    }
    
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return words.map(w => w[0]).join('').substring(0, 2).toUpperCase();
  };

  // Extract family name (last name) from full name
  const getFamilyName = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : name.toUpperCase();
  };

  // Generate consistent colors based on team
  const getPlayerColor = (team: 'A' | 'B', name: string) => {
    if (team === 'A') {
      // Orange/red colors for Team A
      const colorsA = ['#f97316', '#ea580c', '#dc2626', '#ef4444', '#f59e0b'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colorsA[Math.abs(hash) % colorsA.length];
    } else {
      // Blue/teal colors for Team B
      const colorsB = ['#3b82f6', '#2563eb', '#1d4ed8', '#06b6d4', '#0891b2'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colorsB[Math.abs(hash) % colorsB.length];
    }
  };

  // Fill empty spots with placeholders if less than 5 players
  const fillEmptySpots = (players: Player[], teamLetter: string) => {
    const displayPlayers = [...players];
    while (displayPlayers.length < 5) {
      displayPlayers.push({
        id: `empty-${teamLetter}-${displayPlayers.length}`,
        name: 'Empty',
        jerseyNumber: undefined
      });
    }
    return displayPlayers;
  };

  const displayTeamA = fillEmptySpots(teamADisplay, 'A');
  const displayTeamB = fillEmptySpots(teamBDisplay, 'B');

  const renderPlayerRow = (players: Player[], team: 'A' | 'B', teamName: string) => {
    const isTeamSelected = selectedPlayerTeam === team;
    
    return (
      <div className="flex items-center gap-2">
        {/* Vertical Team Name on Left */}
        <div 
          className={`flex items-center justify-center px-2 py-3 rounded-lg ${
            isTeamSelected
              ? team === 'A'
                ? 'bg-orange-500 text-white'
                : 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          <span className="text-xs font-bold tracking-wider">
            {teamName.toUpperCase()}
          </span>
        </div>

        {/* Player Roster Container */}
        <div 
          className={`flex-1 rounded-lg p-2 transition-all border-2 ${
            isTeamSelected
              ? team === 'A' 
                ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-red-50 shadow-lg'
                : 'border-blue-500 bg-gradient-to-r from-blue-50 to-teal-50 shadow-lg'
              : 'border-gray-200 bg-white'
          }`}
        >
          {/* Horizontal Player Row */}
          <div className="flex justify-between gap-1">
          {players.map((player, index) => {
            const isEmpty = player.name === 'Empty';
            const isSelected = selectedPlayer === player.id;
            const playerColor = getPlayerColor(team, player.name);
            
            return (
              <div key={`${team}-${player.id}-${index}`} className="flex flex-col items-center gap-1">
                {/* Family Name Above Avatar */}
                {!isEmpty && (
                  <div className={`text-[10px] font-bold tracking-tight ${
                    isTeamSelected
                      ? team === 'A' ? 'text-orange-700' : 'text-blue-700'
                      : 'text-gray-600'
                  }`}>
                    {getFamilyName(player.name)}
                  </div>
                )}
                
                {/* Player Avatar with Jersey Overlay */}
                <div className="relative w-[68px] h-[68px]">
                  <Button
                    onClick={() => {
                      if (!isEmpty) {
                        onPlayerSelect(player.id);
                      }
                    }}
                    disabled={isEmpty}
                    className={`w-full h-full rounded-lg p-0 flex items-center justify-center text-sm font-bold transition-all overflow-hidden ${
                      isEmpty 
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed border border-dashed border-gray-300'
                        : isSelected
                          ? 'border-2 border-orange-500 shadow-md transform scale-105'
                          : 'border border-transparent hover:border-orange-400 hover:scale-105'
                    }`}
                    style={!isEmpty ? {
                      background: `linear-gradient(135deg, ${playerColor}, ${playerColor}dd)`,
                      color: '#ffffff'
                    } : {}}
                  >
                    {isEmpty ? (
                      '+'
                    ) : player.photo_url ? (
                      <img 
                        src={player.photo_url} 
                        alt={player.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getPlayerInitials(player.name)
                    )}
                  </Button>

                  {/* Jersey Number Overlay at Bottom */}
                  {!isEmpty && (
                    <div 
                      className={`absolute bottom-0 left-0 right-0 text-center text-xs font-bold px-1 py-0.5 ${
                        isSelected 
                          ? 'bg-orange-600/90 text-white' 
                          : team === 'A'
                            ? 'bg-orange-600/90 text-white'
                            : 'bg-blue-600/90 text-white'
                      }`}
                    >
                      #{player.jerseyNumber ?? '?'}
                    </div>
                  )}
                  {/* Foul Dots Overlay — sits just above jersey bar, inside 68×68 */}
                  {!isEmpty && !isCoachMode && (
                    <div className="absolute bottom-[20px] left-0 right-0 flex justify-center gap-0.5 pointer-events-none">
                      {[1, 2, 3, 4, 5].map((dot) => {
                        const foulKey = player.id;
                        const count = playerFoulCounts[foulKey] ?? 0;
                        const filled = dot <= count;
                        return (
                          <div
                            key={dot}
                            className={`w-[5px] h-[5px] rounded-full border ${
                              filled
                                ? 'bg-red-500 border-white'
                                : 'bg-transparent border-white/60'
                            }`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-2">
      {/* Team A Row */}
      {renderPlayerRow(displayTeamA, 'A', teamAName)}
      
      {/* ✅ REFINEMENT 2: Team B Row OR Opponent Panel (Coach Mode) */}
      {isCoachMode ? (
        // Coach Mode: Full OpponentTeamPanel Component (matches expanded view)
        gameId && teamId && opponentName ? (
          <div className="w-full">
            <OpponentTeamPanel
              opponentName={opponentName}
              selectedPlayer={selectedPlayer}
              onPlayerSelect={onPlayerSelect}
              gameId={gameId}
              teamId={teamId}
              teamName={teamAName}
              mobileMode={true}
            />
          </div>
        ) : (
          // Fallback if props missing
          <div 
            className="w-full rounded-lg p-4 text-center"
            style={{ 
              background: '#fee2e2',
              borderColor: '#fca5a5',
              borderWidth: '1px'
            }}
          >
            <span className="text-sm text-red-600">
              Missing opponent data
            </span>
          </div>
        )
      ) : (
        // Regular Mode: Team B Player Roster
        renderPlayerRow(displayTeamB, 'B', teamBName)
      )}
    </div>
  );
}
