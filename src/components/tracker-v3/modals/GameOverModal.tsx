/**
 * GameOverModal - Auto Game Completion Prompt
 * 
 * PURPOSE: Shown when clock reaches 0 with a winner
 * - Prompts admin to complete game or edit stats first
 * - Reuses existing StatEditModalV2 for corrections
 * 
 * Follows .cursorrules: <150 lines component
 */

'use client';

import React from 'react';
import { Trophy, Edit, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface GameOverModalProps {
  isOpen: boolean;
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  isOvertime: boolean;
  overtimeNumber?: number;
  onEditStats: () => void;
  onCompleteGame: () => void;
}

export function GameOverModal({
  isOpen,
  teamAName,
  teamBName,
  teamAScore,
  teamBScore,
  isOvertime,
  overtimeNumber,
  onEditStats,
  onCompleteGame
}: GameOverModalProps) {
  if (!isOpen) return null;

  const winner = teamAScore > teamBScore ? teamAName : teamBName;
  const winnerScore = Math.max(teamAScore, teamBScore);
  const loserScore = Math.min(teamAScore, teamBScore);
  const periodLabel = isOvertime ? `OT${overtimeNumber}` : 'Regulation';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 rounded-2xl shadow-2xl border border-purple-500/30 w-full max-w-md mx-4 overflow-hidden">
        {/* Header with Trophy Icon */}
        <div className="text-center pt-8 pb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 mb-4">
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Game Over!</h2>
          <p className="text-purple-200 text-sm mt-1">End of {periodLabel}</p>
        </div>

        {/* Score Display */}
        <div className="px-6 pb-6">
          <div className="bg-black/30 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-lg font-semibold ${teamAScore > teamBScore ? 'text-yellow-400' : 'text-white/70'}`}>
                {teamAName}
              </span>
              <span className={`text-3xl font-bold ${teamAScore > teamBScore ? 'text-yellow-400' : 'text-white/70'}`}>
                {teamAScore}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-lg font-semibold ${teamBScore > teamAScore ? 'text-yellow-400' : 'text-white/70'}`}>
                {teamBName}
              </span>
              <span className={`text-3xl font-bold ${teamBScore > teamAScore ? 'text-yellow-400' : 'text-white/70'}`}>
                {teamBScore}
              </span>
            </div>
          </div>

          {/* Winner Announcement */}
          <div className="text-center mb-6">
            <p className="text-purple-200 text-sm">Winner</p>
            <p className="text-xl font-bold text-yellow-400">{winner}</p>
            <p className="text-white/60 text-sm">{winnerScore} - {loserScore}</p>
          </div>

          {/* Info Text */}
          <p className="text-center text-purple-200 text-sm mb-6">
            You can edit stats before finalizing, or complete the game now.
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onEditStats}
              variant="outline"
              className="flex-1 border-purple-400/50 text-purple-200 hover:bg-purple-800/50"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Stats
            </Button>
            <Button
              onClick={onCompleteGame}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-semibold hover:opacity-90"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Game
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

