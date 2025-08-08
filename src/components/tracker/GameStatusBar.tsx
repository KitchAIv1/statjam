'use client';

import React from 'react';

export const GameStatusBar: React.FC<{ status: string; note?: string }> = ({ status, note }) => {
  const tone = status === 'in_progress' ? 'bg-green-600' : status === 'completed' ? 'bg-gray-600' : 'bg-yellow-600';
  return (
    <div className="flex items-center justify-center gap-3 text-sm text-gray-300">
      <span className={`px-3 py-1 rounded-full text-white ${tone}`}>{status.replace('_',' ')}</span>
      {note && <span className="text-gray-400">{note}</span>}
    </div>
  );
};

