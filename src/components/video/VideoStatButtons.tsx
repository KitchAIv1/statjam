'use client';

/**
 * VideoStatButtons - Simplified stat buttons for video stat tracking
 * 
 * Clean layout with made/missed shots together, optimized for video review UX.
 * 
 * @module VideoStatButtons
 */

import React from 'react';

interface VideoStatButtonsProps {
  onStatRecord: (statType: string, modifier?: string) => void;
  disabled?: boolean;
}

export function VideoStatButtons({ onStatRecord, disabled }: VideoStatButtonsProps) {
  const handleClick = (statType: string, modifier?: string) => {
    if (disabled) return;
    onStatRecord(statType, modifier);
  };

  return (
    <div className="space-y-3">
      {/* Scoring - Made & Missed Together */}
      <div>
        <div className="text-xs font-medium text-gray-500 uppercase mb-2">Scoring</div>
        <div className="grid grid-cols-2 gap-2">
          {/* 2PT */}
          <button
            onClick={() => handleClick('field_goal', 'made')}
            disabled={disabled}
            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            2PT Made
          </button>
          <button
            onClick={() => handleClick('field_goal', 'missed')}
            disabled={disabled}
            className="px-3 py-2 bg-red-400 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            2PT Miss
          </button>
          
          {/* 3PT */}
          <button
            onClick={() => handleClick('three_pointer', 'made')}
            disabled={disabled}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            3PT Made
          </button>
          <button
            onClick={() => handleClick('three_pointer', 'missed')}
            disabled={disabled}
            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            3PT Miss
          </button>
          
          {/* FT */}
          <button
            onClick={() => handleClick('free_throw', 'made')}
            disabled={disabled}
            className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            FT Made
          </button>
          <button
            onClick={() => handleClick('free_throw', 'missed')}
            disabled={disabled}
            className="px-3 py-2 bg-rose-400 hover:bg-rose-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            FT Miss
          </button>
        </div>
      </div>
      
      {/* Other Stats */}
      <div>
        <div className="text-xs font-medium text-gray-500 uppercase mb-2">Other</div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleClick('assist')}
            disabled={disabled}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            AST
          </button>
          <button
            onClick={() => handleClick('rebound')}
            disabled={disabled}
            className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            REB
          </button>
          <button
            onClick={() => handleClick('steal')}
            disabled={disabled}
            className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            STL
          </button>
          <button
            onClick={() => handleClick('block')}
            disabled={disabled}
            className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            BLK
          </button>
          <button
            onClick={() => handleClick('turnover')}
            disabled={disabled}
            className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            TO
          </button>
          <button
            onClick={() => handleClick('foul')}
            disabled={disabled}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            FOUL
          </button>
        </div>
      </div>
    </div>
  );
}

