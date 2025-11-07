/**
 * CoachGameStatsModal Component
 * 
 * Purpose: Display completed game box scores for coach games
 * Shows team stats and player performance in a modal
 * 
 * Follows .cursorrules: <200 lines, single responsibility (stats display)
 */

'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TeamStatsTab } from '@/app/game-viewer/[gameId]/components/TeamStatsTab';
import { Loader2, AlertCircle } from 'lucide-react';
import { useTeamStats } from '@/hooks/useTeamStats';

interface CoachGameStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  teamId: string;
  teamName: string;
  opponentName: string;
  finalScore: {
    team: number;
    opponent: number;
  };
}

export function CoachGameStatsModal({
  isOpen,
  onClose,
  gameId,
  teamId,
  teamName,
  opponentName,
  finalScore
}: CoachGameStatsModalProps) {
  
  // Fetch team stats
  const { teamStats, onCourtPlayers, benchPlayers, loading, error } = useTeamStats(gameId, teamId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Game Stats - {teamName}
          </DialogTitle>
          <div className="flex items-center justify-between pt-2 text-sm text-gray-400">
            <span>vs {opponentName}</span>
            <span className="text-lg font-bold text-white">
              {finalScore.team} - {finalScore.opponent}
            </span>
          </div>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-red-400">
              <AlertCircle className="w-12 h-12 mb-3" />
              <p className="text-lg font-semibold">Failed to load stats</p>
              <p className="text-sm text-gray-400 mt-1">{error}</p>
            </div>
          ) : (
            <TeamStatsTab
              gameId={gameId}
              teamId={teamId}
              teamName={teamName}
              prefetchedData={{
                teamStats,
                onCourtPlayers,
                benchPlayers
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

