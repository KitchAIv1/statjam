'use client';

import React from 'react';

export const ActionBar: React.FC<{
  lastAction: string | null;
  onCloseGame?: () => Promise<void> | void;
}> = ({ lastAction, onCloseGame }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-orange-600/90 backdrop-blur border-t border-orange-400/50 p-4 z-50">
      <div className="max-w-5xl mx-auto flex items-center gap-3 text-white">
        <div className="w-8 h-8 rounded-full bg-white text-gray-900 font-bold flex items-center justify-center">🏀</div>
        <div className="font-semibold text-sm">{lastAction || 'Ready'}</div>
        <button
          onClick={() => onCloseGame && onCloseGame()}
          className="ml-auto px-3 py-2 rounded-md bg-red-700 text-white font-semibold hover:bg-red-600"
        >
          Close Game
        </button>
      </div>
    </div>
  );
};

