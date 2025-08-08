'use client';

import React from 'react';
import { RosterState } from '@/lib/types/tracker';

export const SubstitutionModal: React.FC<{
  open: boolean;
  onClose: () => void;
  bench: string[];
  onSelect: (playerInId: string) => void;
}> = ({ open, onClose, bench, onSelect }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-[360px] max-w-[90%]">
        <div className="text-center text-white font-semibold mb-3">Select Player In</div>
        <div className="grid grid-cols-3 gap-3">
          {bench.map(pid => (
            <button key={pid} onClick={() => onSelect(pid)} className="p-3 rounded-xl bg-gray-800 border border-gray-700 text-white">
              {pid.slice(0,6)}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 w-full px-3 py-2 rounded-md bg-gray-700 text-white">Cancel</button>
      </div>
    </div>
  );
};

