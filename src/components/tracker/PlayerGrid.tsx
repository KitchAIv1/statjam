'use client';

import React from 'react';
import { RosterState } from '@/lib/types/tracker';

export const PlayerGrid: React.FC<{
  roster: RosterState;
  playerSeconds: Record<string, number>;
  onSubClick: (playerId: string) => void;
  selectedPlayerId?: string | null;
  onSelectPlayer?: (playerId: string) => void;
}> = ({ roster, playerSeconds, onSubClick, selectedPlayerId, onSelectPlayer }) => {
  const fmt = (s: number) => {
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${mm}:${String(ss).padStart(2,'0')}`;
  };

  return (
    <div className="grid grid-cols-5 gap-3">
      {roster.onCourt.map((pid, idx) => (
        <div
          key={pid}
          className={`flex flex-col items-center p-4 rounded-xl border-2 bg-gray-800 cursor-pointer transition-all duration-200 ${
            selectedPlayerId===pid 
              ? 'border-orange-500 bg-gradient-to-br from-orange-500/10 to-orange-600/5 shadow-lg' 
              : 'border-gray-600 hover:border-gray-500'
          }`}
          onClick={() => onSelectPlayer && onSelectPlayer(pid)}
        >
          <div className="w-12 h-12 rounded-full bg-gray-600 text-white flex items-center justify-center text-lg font-bold mb-2">
            {90 + idx + 8}
          </div>
          <div className="text-xs text-gray-300 font-medium mb-1">player{idx + 1}</div>
          <div className="text-xs text-gray-400 mb-2">{fmt(Math.floor(playerSeconds[pid] || 0))}</div>
          <button 
            onClick={(e) => { e.stopPropagation(); onSubClick(pid); }} 
            className="px-3 py-1 rounded-lg bg-gray-600 text-white text-xs font-bold hover:bg-gray-500 transition-colors"
          >
            SUB
          </button>
        </div>
      ))}
    </div>
  );
};

