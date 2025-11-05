'use client';

import React from 'react';
import { RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  photo_url?: string;
}

interface HorizontalRosterV3Props {
  players: Player[];
  selectedPlayer: string | null;
  onPlayerSelect: (playerId: string) => void;
  onSubstitution?: (playerId: string) => void;
  teamName: string;
  teamColor?: string;
}

export function HorizontalRosterV3({
  players,
  selectedPlayer,
  onPlayerSelect,
  onSubstitution,
  teamName,
  teamColor = '#f97316'
}: HorizontalRosterV3Props) {
  
  // FIXED: Generate player initials with proper fallback handling
  const getPlayerInitials = (name: string) => {
    // Debug logging to see what names we're getting
    console.log('🔍 getPlayerInitials called with name:', name);
    
    // Handle fallback names (like "Player 550e8400")
    if (name.startsWith('Player ') || name.startsWith('player ')) {
      console.log('⚠️ Detected fallback player name, using "PL" initials');
      return 'PL'; // Better fallback than "P5" 
    }
    
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      const initials = words[0].substring(0, 2).toUpperCase();
      console.log('✅ Single word initials:', initials);
      return initials;
    }
    const initials = words.map(w => w[0]).join('').substring(0, 2).toUpperCase();
    console.log('✅ Multi-word initials:', initials);
    return initials;
  };

  // Generate consistent colors based on player name
  const getPlayerColor = (name: string) => {
    const colors = [
      '#f97316', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', 
      '#f59e0b', '#06b6d4', '#84cc16', '#ec4899', '#64748b'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // FIXED: Debug player data and handle on-court players (max 5)
  console.log('🔍 HorizontalRosterV3 received players:', players.map(p => ({ id: p.id, name: p.name, jersey: p.jerseyNumber })));
  
  const onCourtPlayers = players.slice(0, 5);
  
  // Fill empty spots with placeholders if less than 5 players
  const displayPlayers = [...onCourtPlayers];
  while (displayPlayers.length < 5) {
    displayPlayers.push({
      id: `empty-${displayPlayers.length}`,
      name: 'Empty',
      jerseyNumber: undefined
    });
  }

  return (
    <div 
      className="w-full rounded-lg p-2"
      style={{ 
        background: '#ffffff', 
        borderColor: '#e5e7eb',
        borderWidth: '1px'
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-4 h-4 text-orange-500" />
        <span 
          className="text-sm font-medium"
          style={{ color: 'var(--dashboard-text-primary)' }}
        >
          {teamName} - On Court
        </span>
      </div>

      {/* Horizontal Player Row */}
      <div className="flex justify-between gap-2">
        {displayPlayers.map((player, index) => {
          const isEmpty = player.name === 'Empty';
          const isSelected = selectedPlayer === player.id;
          const playerColor = getPlayerColor(player.name);
          
          return (
            <div key={player.id} className="flex flex-col items-center gap-2">
              {/* Player Avatar with Jersey Overlay */}
              <div className="relative w-28 h-28">
                <Button
                  onClick={() => !isEmpty && onPlayerSelect(player.id)}
                  disabled={isEmpty}
                  className={`w-full h-full rounded-lg p-0 flex items-center justify-center text-xl font-bold transition-all overflow-hidden ${
                    isEmpty 
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed border-2 border-dashed border-gray-300 dark:border-gray-600'
                      : isSelected
                        ? 'border-2 border-orange-500 shadow-lg transform scale-105'
                        : 'border-2 border-transparent hover:border-orange-400 hover:scale-105'
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
                    className="absolute bottom-0 left-0 right-0 text-center text-sm font-bold py-1 px-2"
                    style={{ 
                      background: isSelected ? 'rgba(249, 115, 22, 0.9)' : 'rgba(107, 114, 128, 0.9)',
                      color: '#ffffff'
                    }}
                  >
                    #{player.jerseyNumber || '?'}
                  </div>
                )}
              </div>

              {/* Player Name (truncated) */}
              {!isEmpty && (
                <div 
                  className="text-base text-center max-w-[80px] truncate"
                  style={{ 
                    color: isSelected ? 'var(--dashboard-primary)' : 'var(--dashboard-text-secondary)',
                    fontWeight: isSelected ? '600' : '400'
                  }}
                  title={player.name}
                >
                  {player.name.split(' ')[0]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Player Info */}
      {selectedPlayer && !selectedPlayer.startsWith('empty-') && (
        <div 
          className="mt-3 pt-3 border-t text-center"
          style={{ borderColor: 'var(--dashboard-border)' }}
        >
          <div 
            className="text-sm font-medium"
            style={{ color: 'var(--dashboard-text-primary)' }}
          >
            Selected: #{players.find(p => p.id === selectedPlayer)?.jerseyNumber || '?'} {players.find(p => p.id === selectedPlayer)?.name}
          </div>
        </div>
      )}
    </div>
  );
}