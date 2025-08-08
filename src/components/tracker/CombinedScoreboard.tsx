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
      className={`flex-1 rounded-xl p-6 text-center border-2 transition-all duration-200 ${
        selectedTeam === side
          ? 'border-orange-500 bg-gradient-to-br from-orange-500/10 to-orange-600/5'
          : 'border-gray-600 bg-gray-800 hover:border-gray-500'
      }`}
    >
      <div className="text-xs uppercase tracking-wider text-gray-300 mb-2 font-medium">{label}</div>
      <div className="text-6xl font-black text-white tabular-nums mb-2">{score}</div>
      <div className="text-sm text-gray-300 font-medium">{name}</div>
    </button>
  );

  return (
    <div className="flex items-stretch gap-4">
      <TeamCard label="HOME" score={teamAScore} name={teamAName} side="A" />

      <div className="min-w-[240px] rounded-xl bg-gray-800 border-2 border-gray-600 p-4 flex flex-col items-center justify-center gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onPrevQuarter} className="w-8 h-8 rounded-lg bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition-colors">←</button>
          <div className="text-lg font-bold text-white min-w-[60px] text-center">{quarter <= 4 ? `Q${quarter}` : `OT${quarter - 4}`}</div>
          <button onClick={onNextQuarter} className="w-8 h-8 rounded-lg bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition-colors">→</button>
        </div>
        <div className="text-3xl font-black text-white tabular-nums">{clockLabel}</div>
        <div className="text-xs font-bold text-gray-300 uppercase tracking-wider">{isRunning ? 'RUNNING' : 'STOPPED'}</div>
        <div className="flex items-center gap-2">
          {isRunning ? (
            <button onClick={onStop} className="px-4 py-2 rounded-lg bg-gray-600 text-white text-sm font-bold hover:bg-gray-500 transition-colors">STOP</button>
          ) : (
            <button onClick={onStart} className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-500 transition-colors">START</button>
          )}
        </div>
      </div>

      <TeamCard label="AWAY" score={teamBScore} name={teamBName} side="B" />
    </div>
  );
};

