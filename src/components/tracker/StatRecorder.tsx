'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
  const [pendingTeam, setPendingTeam] = useState<'A'|'B'|null>(null);
  const [pendingType, setPendingType] = useState<'points2'|'points3'|'ft'|'rebound'|'foul'|null>(null);
  const [showMadeMissed, setShowMadeMissed] = useState(false);
  const [showRebType, setShowRebType] = useState(false);
  const [showFoulType, setShowFoulType] = useState(false);

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

  const fire = async (team: 'A'|'B', playerId: string, statType: 'field_goal'|'three_pointer'|'free_throw'|'assist'|'rebound'|'steal'|'block'|'turnover'|'foul', modifier?: string) => {
    const teamId = team === 'A' ? teamAId : teamBId;
    await onRecord({ teamId, playerId, statType, modifier, gameId: '' } as any);
  };

  const selectedFor = useMemo(() => ({
    A: selectedA,
    B: selectedB
  }), [selectedA, selectedB]);

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

      {/* Full stat grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {/* Team A actions */}
        <Btn label="A +2" tone="primary" onClick={() => selectedA && fire('A', selectedA, 'field_goal', 'made')} />
        <Btn label="A +3" onClick={() => selectedA && fire('A', selectedA, 'three_pointer', 'made')} />
        <Btn label="A FT" onClick={() => selectedA && fire('A', selectedA, 'free_throw', 'made')} />
        <Btn label="A AST" onClick={() => selectedA && fire('A', selectedA, 'assist')} />
        <Btn label="A REB" onClick={() => { setPendingTeam('A'); setPendingType('rebound'); setShowRebType(true); }} />
        <Btn label="A STL" onClick={() => selectedA && fire('A', selectedA, 'steal')} />
        <Btn label="A BLK" onClick={() => selectedA && fire('A', selectedA, 'block')} />
        <Btn label="A FOUL" onClick={() => { setPendingTeam('A'); setPendingType('foul'); setShowFoulType(true); }} />
        <Btn label="A TO" onClick={() => selectedA && fire('A', selectedA, 'turnover')} />

        {/* Team B actions */}
        <Btn label="B +2" tone="primary" onClick={() => selectedB && fire('B', selectedB, 'field_goal', 'made')} />
        <Btn label="B +3" onClick={() => selectedB && fire('B', selectedB, 'three_pointer', 'made')} />
        <Btn label="B FT" onClick={() => selectedB && fire('B', selectedB, 'free_throw', 'made')} />
        <Btn label="B AST" onClick={() => selectedB && fire('B', selectedB, 'assist')} />
        <Btn label="B REB" onClick={() => { setPendingTeam('B'); setPendingType('rebound'); setShowRebType(true); }} />
        <Btn label="B STL" onClick={() => selectedB && fire('B', selectedB, 'steal')} />
        <Btn label="B BLK" onClick={() => selectedB && fire('B', selectedB, 'block')} />
        <Btn label="B FOUL" onClick={() => { setPendingTeam('B'); setPendingType('foul'); setShowFoulType(true); }} />
        <Btn label="B TO" onClick={() => selectedB && fire('B', selectedB, 'turnover')} />
      </div>

      {/* Modals */}
      {showRebType && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-[320px] max-w-[90%]">
            <div className="text-white font-semibold text-center mb-3">Rebound Type?</div>
            <div className="grid grid-cols-2 gap-2">
              <Btn label="Offensive" onClick={async () => { const pid = selectedFor[pendingTeam!]!; await fire(pendingTeam!,'', 'rebound'); if (pid) await fire(pendingTeam!, pid, 'rebound', 'offensive'); setShowRebType(false); }} />
              <Btn label="Defensive" onClick={async () => { const pid = selectedFor[pendingTeam!]!; await fire(pendingTeam!,'', 'rebound'); if (pid) await fire(pendingTeam!, pid, 'rebound', 'defensive'); setShowRebType(false); }} />
            </div>
            <button onClick={() => setShowRebType(false)} className="mt-3 w-full px-3 py-2 rounded-md bg-gray-700 text-white">Cancel</button>
          </div>
        </div>
      )}

      {showFoulType && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-[320px] max-w-[90%]">
            <div className="text-white font-semibold text-center mb-3">Foul Type?</div>
            <div className="grid grid-cols-2 gap-2">
              <Btn label="Personal" onClick={async () => { const pid = selectedFor[pendingTeam!]!; if (pid) await fire(pendingTeam!, pid, 'foul', 'personal'); setShowFoulType(false); }} />
              <Btn label="Technical" onClick={async () => { const pid = selectedFor[pendingTeam!]!; if (pid) await fire(pendingTeam!, pid, 'foul', 'technical'); setShowFoulType(false); }} />
            </div>
            <button onClick={() => setShowFoulType(false)} className="mt-3 w-full px-3 py-2 rounded-md bg-gray-700 text-white">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

