'use client';

import React, { useEffect, useState } from 'react';
import { RosterState, StatRecord } from '@/lib/types/tracker';

export const StatRecorder: React.FC<{
  onRecord: (s: Omit<StatRecord, 'createdAt' | 'quarter' | 'gameTimeSeconds'> & { modifier?: string }) => void;
  teamAId: string;
  teamBId: string;
  rosterA: RosterState;
  rosterB: RosterState;
}> = ({ onRecord, teamAId, teamBId, rosterA, rosterB }) => {
  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedA && rosterA.onCourt.length > 0) setSelectedA(rosterA.onCourt[0]);
  }, [rosterA.onCourt, selectedA]);
  useEffect(() => {
    if (!selectedB && rosterB.onCourt.length > 0) setSelectedB(rosterB.onCourt[0]);
  }, [rosterB.onCourt, selectedB]);
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
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="mb-2 text-gray-300 text-sm">Team A Player</div>
          <select
            value={selectedA || ''}
            onChange={(e) => setSelectedA(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-gray-100"
          >
            {rosterA.onCourt.map(pid => (
              <option key={pid} value={pid}>{pid.slice(0,8)}</option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2 mt-3">
            <Btn label="2PT" tone="primary" onClick={() => selectedA && onRecord({ teamId: teamAId, playerId: selectedA, statType: 'field_goal', modifier: 'made', gameId: '' } as any)} />
            <Btn label="3PT" onClick={() => selectedA && onRecord({ teamId: teamAId, playerId: selectedA, statType: 'three_pointer', modifier: 'made', gameId: '' } as any)} />
            <Btn label="FT" onClick={() => selectedA && onRecord({ teamId: teamAId, playerId: selectedA, statType: 'free_throw', modifier: 'made', gameId: '' } as any)} />
          </div>
        </div>
        <div>
          <div className="mb-2 text-gray-300 text-sm">Team B Player</div>
          <select
            value={selectedB || ''}
            onChange={(e) => setSelectedB(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-gray-100"
          >
            {rosterB.onCourt.map(pid => (
              <option key={pid} value={pid}>{pid.slice(0,8)}</option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2 mt-3">
            <Btn label="2PT" tone="primary" onClick={() => selectedB && onRecord({ teamId: teamBId, playerId: selectedB, statType: 'field_goal', modifier: 'made', gameId: '' } as any)} />
            <Btn label="3PT" onClick={() => selectedB && onRecord({ teamId: teamBId, playerId: selectedB, statType: 'three_pointer', modifier: 'made', gameId: '' } as any)} />
            <Btn label="FT" onClick={() => selectedB && onRecord({ teamId: teamBId, playerId: selectedB, statType: 'free_throw', modifier: 'made', gameId: '' } as any)} />
          </div>
        </div>
      </div>
    </div>
  );
};

