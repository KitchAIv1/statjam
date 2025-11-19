'use client';

import React from 'react';
import { Users } from 'lucide-react';

interface TeamSelectionStepProps {
  teamAName: string;
  teamBName: string;
  onSelectTeam: (teamId: 'teamA' | 'teamB') => void;
}

export function TeamSelectionStep({
  teamAName,
  teamBName,
  onSelectTeam
}: TeamSelectionStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2 text-white">
          Select Team
        </h3>
        <p className="text-sm text-gray-300">
          Choose which team to make substitutions for
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Team A */}
        <button
          onClick={() => onSelectTeam('teamA')}
          className="p-6 rounded-xl border-2 border-blue-500 bg-blue-500/10 hover:bg-blue-500/20 hover:scale-105 transition-all duration-200"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white mb-1">
                {teamAName}
              </div>
              <div className="text-xs text-gray-300">
                Team A
              </div>
            </div>
          </div>
        </button>

        {/* Team B */}
        <button
          onClick={() => onSelectTeam('teamB')}
          className="p-6 rounded-xl border-2 border-green-500 bg-green-500/10 hover:bg-green-500/20 hover:scale-105 transition-all duration-200"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white mb-1">
                {teamBName}
              </div>
              <div className="text-xs text-gray-300">
                Team B
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

