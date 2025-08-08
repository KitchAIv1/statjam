'use client';

import React from 'react';

export const ActionBar: React.FC<{
  lastAction: string | null;
  onCloseGame?: () => Promise<void> | void;
}> = ({ lastAction, onCloseGame }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-0 z-50" style={{ background: 'linear-gradient(90deg, #ff6b35, #f7931e)' }}>
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3 text-white">
        <div className="w-8 h-8 rounded-full bg-white text-gray-900 font-bold flex items-center justify-center">N</div>
        <div className="font-semibold text-sm truncate">{lastAction || 'Ready'}</div>
        <button onClick={() => onCloseGame && onCloseGame()} className="ml-auto px-4 py-2 rounded-md bg-black/30 hover:bg-black/40 border border-white/20 text-white font-semibold">Close Game</button>
      </div>
    </div>
  );
};

