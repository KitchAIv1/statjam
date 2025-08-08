'use client';

import React from 'react';

export const CombinedScoreboard: React.FC<{
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  quarter: number;
  clockLabel: string;
  isRunning: boolean;
  onPrevQuarter: () => void;
  onNextQuarter: () => void;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  selectedTeam?: 'A' | 'B';
  onSelectTeam?: (t: 'A' | 'B') => void;
}> = ({
  teamAName,
  teamBName,
  teamAScore,
  teamBScore,
  quarter,
  clockLabel,
  isRunning,
  onPrevQuarter,
  onNextQuarter,
  onStart,
  onStop,
  onReset,
  selectedTeam,
  onSelectTeam
}) => {
  const TeamCard: React.FC<{ label: string; score: number; name: string; side: 'A'|'B' }>
    = ({ label, score, name, side }) => (
    <button
      onClick={() => onSelectTeam && onSelectTeam(side)}
      className={`flex-1 rounded-xl p-4 text-center border transition-colors ${
        selectedTeam === side
          ? 'bg-orange-900/20 border-orange-500'
          : 'bg-white/5 border-white/10 hover:border-white/20'
      }`}
    >
      <div className="text-xs uppercase tracking-widest text-gray-300 mb-1">{label}</div>
      <div className="text-5xl font-extrabold text-white tabular-nums mb-1">{score}</div>
      <div className="text-sm text-gray-400">{name}</div>
    </button>
  );

  return (
    <div className="flex items-stretch gap-4">
      <TeamCard label="HOME" score={teamAScore} name={teamAName} side="A" />

      <div className="min-w-[220px] rounded-xl bg-white/5 border border-white/10 p-3 flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-2">
          <button onClick={onPrevQuarter} className="px-2 py-1 rounded-md bg-yellow-500 text-black font-bold">←</button>
          <div className="text-sm font-bold text-white">{quarter <= 4 ? `Q${quarter}` : `OT${quarter - 4}`}</div>
          <button onClick={onNextQuarter} className="px-2 py-1 rounded-md bg-yellow-500 text-black font-bold">→</button>
        </div>
        <div className="text-2xl font-extrabold text-white tabular-nums">{clockLabel}</div>
        <div className="text-[10px] font-semibold text-gray-400">{isRunning ? 'RUNNING' : 'STOPPED'}</div>
        <div className="flex items-center gap-2">
          {isRunning ? (
            <button onClick={onStop} className="px-3 py-1 rounded-md bg-green-600 text-white text-xs font-bold">STOP</button>
          ) : (
            <button onClick={onStart} className="px-3 py-1 rounded-md bg-green-600 text-white text-xs font-bold">START</button>
          )}
          <button onClick={onReset} className="px-3 py-1 rounded-md bg-gray-700 text-white text-xs font-bold">RESET</button>
        </div>
      </div>

      <TeamCard label="AWAY" score={teamBScore} name={teamBName} side="B" />
    </div>
  );
};

