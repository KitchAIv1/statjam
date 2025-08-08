'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { StatButtonsGrid } from './StatButtonsGrid';
import { RosterState, StatRecord } from '@/lib/types/tracker';

export const StatRecorder: React.FC<{
  onRecord: (s: Omit<StatRecord, 'createdAt' | 'quarter' | 'gameTimeSeconds'> & { modifier?: string }) => void;
  teamAId: string;
  teamBId: string;
  rosterA: RosterState;
  rosterB: RosterState;
  activeTeam: 'A'|'B';
  selectedPlayerId?: string | null;
}> = ({ onRecord, teamAId, teamBId, rosterA, rosterB, activeTeam, selectedPlayerId }) => {
  const [pendingTeam, setPendingTeam] = useState<'A'|'B'|null>(null);
  const [pendingType, setPendingType] = useState<'points2'|'points3'|'ft'|'rebound'|'foul'|null>(null);
  const [showMadeMissed, setShowMadeMissed] = useState(false);
  const [showRebType, setShowRebType] = useState(false);
  const [showFoulType, setShowFoulType] = useState(false);

  const Btn: React.FC<{ label: string; onClick: () => void; tone?: 'default'|'primary' }>
    = ({ label, onClick, tone = 'default' }) => (
    <button
      onClick={onClick}
      className={`px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
        tone==='primary' 
          ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg' 
          : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md'
      }`}
    >
      {label}
    </button>
  );

  const fire = async (playerId: string, statType: 'field_goal'|'three_pointer'|'free_throw'|'assist'|'rebound'|'steal'|'block'|'turnover'|'foul', modifier?: string) => {
    const teamId = activeTeam === 'A' ? teamAId : teamBId;
    await onRecord({ teamId, playerId, statType, modifier, gameId: '' } as any);
  };

  const selectedFor = useMemo(() => ({
    A: selectedPlayerId,
    B: selectedPlayerId
  }), [selectedPlayerId]);

  const requirePlayer = (fn: () => void) => {
    if (!selectedPlayerId) {
      alert('Select a player on the active team first.');
      return;
    }
    fn();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* No dropdowns; selection via player tiles */}

      {/* Full stat grid (V1 layout: 3 columns per row) - single set */}
      <StatButtonsGrid>
        <Btn label="+2" tone="primary" onClick={() => requirePlayer(()=> fire(selectedPlayerId!, 'field_goal', 'made'))} />
        <Btn label="+3" onClick={() => requirePlayer(()=> fire(selectedPlayerId!, 'three_pointer', 'made'))} />
        <Btn label="FT" onClick={() => requirePlayer(()=> fire(selectedPlayerId!, 'free_throw', 'made'))} />
        <Btn label="AST" onClick={() => requirePlayer(()=> fire(selectedPlayerId!, 'assist'))} />
        <Btn label="REB" onClick={() => { if(!selectedPlayerId){alert('Select a player'); return;} setPendingTeam(activeTeam); setPendingType('rebound'); setShowRebType(true); }} />
        <Btn label="STL" onClick={() => requirePlayer(()=> fire(selectedPlayerId!, 'steal'))} />
        <Btn label="BLK" onClick={() => requirePlayer(()=> fire(selectedPlayerId!, 'block'))} />
        <Btn label="FOUL" onClick={() => { if(!selectedPlayerId){alert('Select a player'); return;} setPendingTeam(activeTeam); setPendingType('foul'); setShowFoulType(true); }} />
        <Btn label="TO" onClick={() => requirePlayer(()=> fire(selectedPlayerId!, 'turnover'))} />
      </StatButtonsGrid>

      {/* UNDO Button - full width */}
      <button 
        className="w-full px-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all duration-200 shadow-md flex items-center justify-center gap-2"
        onClick={() => alert('Undo functionality coming soon')}
      >
        <span>↶</span>
        <span>UNDO</span>
      </button>

      {/* Modals */}
      {showRebType && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-[320px] max-w-[90%]">
            <div className="text-white font-semibold text-center mb-3">Rebound Type?</div>
            <div className="grid grid-cols-2 gap-2">
              <Btn label="Offensive" onClick={async () => { const pid = selectedPlayerId!; await fire(pid, 'rebound', 'offensive'); setShowRebType(false); }} />
              <Btn label="Defensive" onClick={async () => { const pid = selectedPlayerId!; await fire(pid, 'rebound', 'defensive'); setShowRebType(false); }} />
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
              <Btn label="Personal" onClick={async () => { const pid = selectedPlayerId!; await fire(pid, 'foul', 'personal'); setShowFoulType(false); }} />
              <Btn label="Technical" onClick={async () => { const pid = selectedPlayerId!; await fire(pid, 'foul', 'technical'); setShowFoulType(false); }} />
            </div>
            <button onClick={() => setShowFoulType(false)} className="mt-3 w-full px-3 py-2 rounded-md bg-gray-700 text-white">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

