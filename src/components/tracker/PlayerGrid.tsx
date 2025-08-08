'use client';

import React from 'react';
import { RosterState } from '@/lib/types/tracker';

export const PlayerGrid: React.FC<{
  roster: RosterState;
  playerSeconds: Record<string, number>;
  onSubClick: (playerId: string) => void;
}> = ({ roster, playerSeconds, onSubClick }) => {
  const fmt = (s: number) => {
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${mm}:${String(ss).padStart(2,'0')}`;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {roster.onCourt.map(pid => (
        <div key={pid} className="flex flex-col items-center p-3 rounded-xl border border-gray-700 bg-gray-900">
          <div className="w-10 h-10 rounded-full bg-gray-700 text-white flex items-center justify-center text-sm font-bold">
            {pid.slice(0,2)}
          </div>
          <div className="mt-2 text-xs text-gray-300">{fmt(Math.floor(playerSeconds[pid] || 0))}</div>
          <button onClick={() => onSubClick(pid)} className="mt-2 px-3 py-1 rounded-md bg-gray-700 text-white text-[11px] font-semibold">SUB</button>
        </div>
      ))}
    </div>
  );
};

