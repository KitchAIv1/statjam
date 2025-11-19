'use client';

import React from 'react';
import { Check, CheckSquare, Square, X } from 'lucide-react';
import { EditableJerseyNumber } from './EditableJerseyNumber';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  is_custom_player?: boolean;
}

interface SubstitutionPlayerCardProps {
  player: Player;
  isOnCourt: boolean;
  isSelected: boolean;
  multiSelectMode: boolean;
  onSelect: (playerId: string) => void;
  onDeselect?: (playerId: string) => void;
  onJerseyUpdate: (playerId: string, updatedPlayer: Player) => void;
}

export function SubstitutionPlayerCard({
  player,
  isOnCourt,
  isSelected,
  multiSelectMode,
  onSelect,
  onDeselect,
  onJerseyUpdate
}: SubstitutionPlayerCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    // ✅ Prevent event bubbling to parent elements
    e.stopPropagation();
    
    // ✅ Toggle selection - same behavior for both modes
    if (isSelected && onDeselect) {
      onDeselect(player.id);
    } else {
      onSelect(player.id);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected && onDeselect) {
      onDeselect(player.id);
    } else {
      onSelect(player.id);
    }
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeselect) {
      onDeselect(player.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      onMouseDown={(e) => e.stopPropagation()} // Prevent any parent click handlers
      className={`w-full h-auto p-4 rounded-xl border-2 transition-all duration-200 ${
        isSelected
          ? 'bg-green-500/30 border-green-500 scale-105'
          : multiSelectMode
          ? 'bg-slate-800 border-slate-600 hover:bg-green-500/10 hover:border-green-500 cursor-pointer'
          : 'bg-slate-800 border-slate-600 hover:bg-green-500/20 hover:border-green-500 hover:scale-102 cursor-pointer'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Checkbox (multi-select mode only) */}
        {multiSelectMode && (
          <div className="flex-shrink-0" onClick={handleCheckboxClick}>
            {isSelected ? (
              <CheckSquare className="w-6 h-6 text-green-500 cursor-pointer" />
            ) : (
              <Square className="w-6 h-6 text-gray-400 cursor-pointer" />
            )}
          </div>
        )}

        {/* Jersey Number (editable) */}
        <div onClick={(e) => e.stopPropagation()}>
          <EditableJerseyNumber player={player} onUpdate={onJerseyUpdate} />
        </div>

        {/* Player Info */}
        <div className="flex-1 text-left min-w-0">
          <div className="font-bold text-base mb-1 text-white truncate">
            {player.name}
          </div>
          <div className="text-sm flex items-center gap-2 text-gray-300">
            <span>{isOnCourt ? 'On Court' : 'Available to play'}</span>
            <div className={`w-2 h-2 rounded-full ${isOnCourt ? 'bg-blue-500' : 'bg-green-500'}`}></div>
          </div>
        </div>

        {/* Selection Indicator / Remove Button */}
        {isSelected ? (
          <div className="flex-shrink-0 flex items-center gap-2">
            {multiSelectMode && onDeselect ? (
              <button
                onClick={handleRemoveClick}
                className="w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 flex items-center justify-center transition-all"
                title="Remove selection"
              >
                <X className="w-4 h-4 text-red-400" />
              </button>
            ) : (
              <Check className="w-5 h-5 text-green-500" />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

