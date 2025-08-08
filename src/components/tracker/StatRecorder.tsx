'use client';

import React from 'react';
import { StatRecord } from '@/lib/types/tracker';

export const StatRecorder: React.FC<{
  onRecord: (s: Omit<StatRecord, 'createdAt' | 'quarter' | 'gameTimeSeconds'> & { modifier?: string }) => void;
  teamAId: string;
  teamBId: string;
}> = ({ onRecord, teamAId, teamBId }) => {
  const Btn: React.FC<{ label: string; onClick: () => void; tone?: 'default'|'primary' }>
    = ({ label, onClick, tone = 'default' }) => (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-md text-sm font-semibold border ${tone==='primary' ? 'bg-yellow-400 text-gray-900 border-yellow-300' : 'bg-gray-800 text-gray-100 border-gray-700'} hover:opacity-90`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="text-gray-300 text-sm">Quick Stats (Team A)</div>
      <div className="flex flex-wrap gap-2">
        <Btn label="2PT" tone="primary" onClick={() => onRecord({ teamId: teamAId, playerId: teamAId, statType: 'field_goal', modifier: 'made', gameId: '' } as any)} />
        <Btn label="3PT" onClick={() => onRecord({ teamId: teamAId, playerId: teamAId, statType: 'three_pointer', modifier: 'made', gameId: '' } as any)} />
        <Btn label="FT" onClick={() => onRecord({ teamId: teamAId, playerId: teamAId, statType: 'free_throw', modifier: 'made', gameId: '' } as any)} />
      </div>
      <div className="text-gray-300 text-sm mt-3">Quick Stats (Team B)</div>
      <div className="flex flex-wrap gap-2">
        <Btn label="2PT" tone="primary" onClick={() => onRecord({ teamId: teamBId, playerId: teamBId, statType: 'field_goal', modifier: 'made', gameId: '' } as any)} />
        <Btn label="3PT" onClick={() => onRecord({ teamId: teamBId, playerId: teamBId, statType: 'three_pointer', modifier: 'made', gameId: '' } as any)} />
        <Btn label="FT" onClick={() => onRecord({ teamId: teamBId, playerId: teamBId, statType: 'free_throw', modifier: 'made', gameId: '' } as any)} />
      </div>
    </div>
  );
};

