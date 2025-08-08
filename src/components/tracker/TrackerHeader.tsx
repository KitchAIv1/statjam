'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export const TrackerHeader: React.FC<{ gameId?: string | null }> = ({ gameId }) => {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between mb-4">
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-gray-300 hover:text-white">
        <span className="px-2 py-1 rounded-md bg-white/10">←</span>
        <span>Back</span>
      </button>
      <div className="text-white font-semibold">Stat Tracker
        {gameId && <div className="text-xs font-normal text-gray-400">Game ID: {gameId}</div>}
      </div>
      <div className="w-10" />
    </div>
  );
};

