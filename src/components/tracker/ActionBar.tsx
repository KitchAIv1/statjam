'use client';

import React from 'react';

export const ActionBar: React.FC<{
  lastAction: string | null;
  onCloseGame?: () => Promise<void> | void;
}> = ({ lastAction, onCloseGame }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-0 z-50" style={{ background: 'linear-gradient(90deg, #ff6b35, #f7931e)' }}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4 text-white">
        <div className="w-10 h-10 rounded-full bg-white text-black font-bold flex items-center justify-center text-lg">N</div>
        <div className="font-bold text-base flex-1 truncate">{lastAction || 'Team A - # player1 +3 Points'}</div>
        <button 
          onClick={() => onCloseGame && onCloseGame()} 
          className="px-6 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold transition-colors shadow-lg"
        >
          Close Game
        </button>
      </div>
    </div>
  );
};

