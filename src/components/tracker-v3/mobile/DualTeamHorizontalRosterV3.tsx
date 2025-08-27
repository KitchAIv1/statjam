'use client';

import React from 'react';
import { RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Player {
  id: string;
  name: string;
  jersey_number?: number;
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
}

export function DualTeamHorizontalRosterV3({
  teamAPlayers,
  teamBPlayers,
  teamAName,
  teamBName,
  selectedPlayer,
  onPlayerSelect,
  onSubstitution
}: DualTeamHorizontalRosterV3Props) {
  
  // Get first 5 players for each team
  const teamAOnCourt = teamAPlayers.slice(0, 5);
  const teamBOnCourt = teamBPlayers.slice(0, 5);
  
  // Check which team the selected player belongs to (check on-court players only)
  const selectedPlayerTeam = teamAOnCourt.find(p => p.id === selectedPlayer) ? 'A' : 
                            teamBOnCourt.find(p => p.id === selectedPlayer) ? 'B' : null;

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
        jersey_number: undefined
      });
    }
    return displayPlayers;
  };

  const displayTeamA = fillEmptySpots(teamAOnCourt, 'A');
  const displayTeamB = fillEmptySpots(teamBOnCourt, 'B');

  const renderPlayerRow = (players: Player[], team: 'A' | 'B', teamName: string) => {
    const isTeamSelected = selectedPlayerTeam === team;
    
    return (
      <div 
        className={`rounded-lg p-2 transition-all border-2 ${
          isTeamSelected
            ? team === 'A' 
              ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-red-50 shadow-lg'
              : 'border-blue-500 bg-gradient-to-r from-blue-50 to-teal-50 shadow-lg'
            : team === 'A'
              ? 'border-orange-200 bg-gradient-to-r from-orange-25 to-red-25'
              : 'border-blue-200 bg-gradient-to-r from-blue-25 to-teal-25'
        }`}
      >
        {/* Team Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              team === 'A' ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-gradient-to-r from-blue-400 to-teal-500'
            }`}></div>
            <span 
              className={`text-xs font-semibold ${
                team === 'A' ? 'text-orange-700' : 'text-blue-700'
              }`}
            >
              {teamName}
            </span>
          </div>
          
          {onSubstitution && selectedPlayerTeam === team && (
            <Button
              onClick={() => selectedPlayer && onSubstitution(selectedPlayer)}
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs hover:border-orange-500 hover:text-orange-500"
            >
              <RefreshCw className="w-2 h-2 mr-1" />
              Sub
            </Button>
          )}
        </div>

        {/* Horizontal Player Row */}
        <div className="flex justify-between gap-1">
          {players.map((player, index) => {
            const isEmpty = player.name === 'Empty';
            const isSelected = selectedPlayer === player.id;
            const playerColor = getPlayerColor(team, player.name);
            
            return (
              <div key={`${team}-${player.id}-${index}`} className="flex flex-col items-center gap-1">
                {/* Player Avatar */}
                <Button
                  onClick={() => {
                    if (!isEmpty) {
                      onPlayerSelect(player.id);
                    }
                  }}
                  disabled={isEmpty}
                  className={`w-12 h-12 rounded-full p-0 flex items-center justify-center text-xs font-bold transition-all ${
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
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getPlayerInitials(player.name)
                  )}
                </Button>

                {/* Jersey Number */}
                {!isEmpty && (
                  <div 
                    className={`text-xs font-bold px-1 py-0.5 rounded ${
                      isSelected 
                        ? 'bg-orange-500 text-white' 
                        : team === 'A'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    #{player.jersey_number || 'none'}
                  </div>
                )}


              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-2">
      {/* Team A Row */}
      {renderPlayerRow(displayTeamA, 'A', teamAName)}
      
      {/* Team B Row */}
      {renderPlayerRow(displayTeamB, 'B', teamBName)}


    </div>
  );
}
