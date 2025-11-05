'use client';

import React from 'react';
import { RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;  // FIXED: Changed from jerseyNumber to match Player interface
  photo_url?: string;
}

interface TeamRosterV3Props {
  players: Player[];
  teamName: string;
  teamSide: 'left' | 'right';
  selectedPlayer: string | null;
  onPlayerSelect: (playerId: string) => void;
  onSubstitution?: (playerId: string) => void;
  refreshKey?: string | number; // Add refresh key to force re-render
  isCoachMode?: boolean; // Add coach mode flag
}

export function TeamRosterV3({
  players,
  teamName,
  teamSide,
  selectedPlayer,
  onPlayerSelect,
  onSubstitution,
  refreshKey = 0,
  isCoachMode = false
}: TeamRosterV3Props) {
  
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

  // Generate consistent colors based on team side
  const getPlayerColor = (name: string) => {
    if (teamSide === 'left') {
      // Orange/red colors for left team
      const colorsLeft = ['#f97316', '#ea580c', '#dc2626', '#ef4444', '#f59e0b'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colorsLeft[Math.abs(hash) % colorsLeft.length];
    } else {
      // Blue/teal colors for right team
      const colorsRight = ['#3b82f6', '#2563eb', '#1d4ed8', '#06b6d4', '#0891b2'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colorsRight[Math.abs(hash) % colorsRight.length];
    }
  };

  // Get first 5 players (on court) and rest (bench)
  // For coach teams, show all players since there's no strict on-court limit
  const onCourtPlayers = players.slice(0, 5);
  const benchPlayers = players.slice(5);
  
  // Always display only first 5 players (on-court)
  // Bench players are accessible via substitution modal
  const displayPlayers = onCourtPlayers;

  const teamColor = teamSide === 'left' ? 'orange' : 'blue';
  const gradientClass = teamSide === 'left' 
    ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200' 
    : 'bg-gradient-to-br from-blue-50 to-teal-50 border-blue-200';

  return (
    <div 
      className="w-full h-full rounded-xl p-6 border-2 flex flex-col"
      style={{ 
        background: '#ffffff',
        borderColor: teamSide === 'left' ? '#fb923c' : '#60a5fa',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        minHeight: '650px',
        maxHeight: '650px',
        height: '650px'
      }}
    >
      {/* Team Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            teamSide === 'left' ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-gradient-to-r from-blue-400 to-teal-500'
          }`}></div>
          <h3 
            className={`text-xl font-bold ${
              teamSide === 'left' ? 'text-orange-800' : 'text-blue-800'
            }`}
          >
            {teamName}
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Users className={`w-5 h-5 ${
            teamSide === 'left' ? 'text-orange-600' : 'text-blue-600'
          }`} />
          <span className={`text-sm font-medium ${
            teamSide === 'left' ? 'text-orange-700' : 'text-blue-700'
          }`}>
            {players.length} Players
          </span>
        </div>
      </div>

      {/* Players Section - On Court Only */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <h4 className={`text-lg font-semibold ${
            teamSide === 'left' ? 'text-orange-800' : 'text-blue-800'
          }`}>
            On Court
          </h4>
          <div className={`px-2 py-1 rounded text-xs font-bold text-white ${
            teamSide === 'left' ? 'bg-orange-500' : 'bg-blue-500'
          }`}>
            {onCourtPlayers.length}/5
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
          {displayPlayers.map((player, index) => {
            const isSelected = selectedPlayer === player.id;
            const playerColor = getPlayerColor(player.name);
            
            return (
              <div
                key={`${player.id}-${index}-${refreshKey}`}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? teamSide === 'left'
                      ? 'border-orange-500 bg-orange-100 shadow-md scale-105'
                      : 'border-blue-500 bg-blue-100 shadow-md scale-105'
                    : 'border-transparent bg-white hover:shadow-md hover:scale-102'
                }`}
                onClick={() => onPlayerSelect(player.id)}
              >
                {/* Player Avatar with Jersey Overlay */}
                <div className="flex-shrink-0 relative w-14 h-14">
                  <div
                    className="w-full h-full rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${playerColor}, ${playerColor}dd)`
                    }}
                  >
                    {player.photo_url ? (
                      <img 
                        src={player.photo_url} 
                        alt={player.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getPlayerInitials(player.name)
                    )}
                  </div>
                  {/* Jersey Number Overlay at Bottom */}
                  <div className={`absolute bottom-0 left-0 right-0 px-1 py-0.5 text-center text-xs font-bold text-white ${
                    teamSide === 'left' ? 'bg-orange-600/90' : 'bg-blue-600/90'
                  }`}>
                    #{player.jerseyNumber || '?'}
                  </div>
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="mb-1">
                    <span className="font-semibold text-gray-800 truncate block">
                      {player.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
