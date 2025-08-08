'use client';

import React from 'react';

export interface ScoreBoardProps {
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ teamAName, teamBName, teamAScore, teamBScore }) => {
  return (
    <div className="flex items-center justify-center gap-8 text-center">
      <div>
        <div className="text-gray-300 text-sm">{teamAName}</div>
        <div className="text-4xl font-extrabold text-white tabular-nums">{teamAScore}</div>
      </div>
      <div className="text-2xl text-gray-500">-</div>
      <div>
        <div className="text-gray-300 text-sm">{teamBName}</div>
        <div className="text-4xl font-extrabold text-white tabular-nums">{teamBScore}</div>
      </div>
    </div>
  );
};

