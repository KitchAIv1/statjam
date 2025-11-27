/**
 * QuickSubModal - Compact Bench Player Selection Modal
 * 
 * PURPOSE: Quick single-player substitution from on-court player card
 * - 2-column compact grid of bench players
 * - Shows: profile photo, name, jersey number
 * - Positioned near the team's roster side
 * - Desktop only (not for mobile compact view)
 * 
 * Follows .cursorrules: <200 lines component
 */

'use client';

import React from 'react';
import { X } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  photo_url?: string;
}

interface QuickSubModalProps {
  isOpen: boolean;
  onClose: () => void;
  benchPlayers: Player[];
  teamSide: 'left' | 'right';
  playerOutName: string;
  onPlayerSelect: (playerInId: string) => void;
}

export function QuickSubModal({
  isOpen,
  onClose,
  benchPlayers,
  teamSide,
  playerOutName,
  onPlayerSelect
}: QuickSubModalProps) {
  if (!isOpen) return null;

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
      const colorsLeft = ['#f97316', '#ea580c', '#dc2626', '#ef4444', '#f59e0b'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colorsLeft[Math.abs(hash) % colorsLeft.length];
    } else {
      const colorsRight = ['#3b82f6', '#2563eb', '#1d4ed8', '#06b6d4', '#0891b2'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colorsRight[Math.abs(hash) % colorsRight.length];
    }
  };

  const accentColor = teamSide === 'left' ? 'orange' : 'blue';
  const borderColor = teamSide === 'left' ? '#fb923c' : '#60a5fa';
  const headerBg = teamSide === 'left' ? 'bg-orange-500' : 'bg-blue-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      {/* Modal - Positioned based on team side */}
      <div 
        className={`relative bg-white rounded-xl shadow-2xl w-[320px] max-h-[70vh] flex flex-col ${
          teamSide === 'left' ? 'ml-8' : 'ml-auto mr-8'
        }`}
        style={{ borderColor, borderWidth: '2px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${headerBg} px-4 py-3 rounded-t-lg flex items-center justify-between`}>
          <div>
            <h3 className="text-white font-bold text-sm">Select Replacement</h3>
            <p className="text-white/80 text-xs">for {playerOutName}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Bench Players Grid - 2 Columns */}
        <div className="p-3 overflow-y-auto flex-1">
          {benchPlayers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No bench players available
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {benchPlayers.map((player) => {
                const playerColor = getPlayerColor(player.name);
                
                return (
                  <button
                    key={player.id}
                    onClick={() => onPlayerSelect(player.id)}
                    className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all duration-150 hover:scale-105 ${
                      teamSide === 'left' 
                        ? 'border-orange-200 hover:border-orange-400 hover:bg-orange-50' 
                        : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    {/* Player Avatar */}
                    <div 
                      className="w-14 h-14 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden mb-1"
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
                    
                    {/* Jersey Number */}
                    <div className={`text-xs font-bold ${
                      teamSide === 'left' ? 'text-orange-600' : 'text-blue-600'
                    }`}>
                      #{player.jerseyNumber ?? '?'}
                    </div>
                    
                    {/* Player Name */}
                    <div className="text-xs text-gray-700 font-medium text-center truncate w-full px-1">
                      {player.name.split(' ').slice(-1)[0]}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className={`px-3 py-2 border-t text-xs text-center ${
          teamSide === 'left' ? 'text-orange-600 border-orange-100' : 'text-blue-600 border-blue-100'
        }`}>
          Tap a player to substitute in
        </div>
      </div>
    </div>
  );
}

