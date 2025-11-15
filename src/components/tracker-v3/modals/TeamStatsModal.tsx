/**
 * TeamStatsModal - Display Team Statistics
 * 
 * PURPOSE:
 * - Show team stats when clicking team name/score in scoreboard
 * - Reuses TeamStatsTabLight component for consistency
 * 
 * Follows .cursorrules: <200 lines component
 */

'use client';

import React from 'react';
import { X } from 'lucide-react';
import { TeamStatsTabLight } from './TeamStatsTabLight';

interface TeamStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  teamId: string;
  teamName: string;
}

export function TeamStatsModal({
  isOpen,
  onClose,
  gameId,
  teamId,
  teamName
}: TeamStatsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">📊</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{teamName} Statistics</h2>
              <p className="text-sm text-gray-600">Team performance and player stats</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <TeamStatsTabLight
            gameId={gameId}
            teamId={teamId}
            teamName={teamName}
            useRealTime={true} // ✅ FIX: Enable real-time updates for Score section modal
          />
        </div>
      </div>
    </div>
  );
}

