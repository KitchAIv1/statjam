/**
 * CoachRecentGames - Recent games list component
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */

'use client';

import { Gamepad2, Trophy, Clock, AlertCircle } from 'lucide-react';
import { CoachGame } from '@/lib/services/coachUsageService';

interface CoachRecentGamesProps {
  games: CoachGame[];
}

export function CoachRecentGames({ games }: CoachRecentGamesProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
            <Trophy className="w-3 h-3" />
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            Live
          </span>
        );
      case 'scheduled':
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" />
            Scheduled
          </span>
        );
      default:
        return (
          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-purple-500" />
          Recent Games
        </h3>
      </div>

      {/* Games List */}
      <div className="divide-y divide-gray-100">
        {games.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            No games tracked yet. Start a game in coach mode!
          </div>
        ) : (
          games.map((game) => (
            <div key={game.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 text-sm">
                    {game.teamName}
                  </span>
                  <span className="text-gray-400 text-xs">vs</span>
                  <span className="text-gray-700 text-sm">
                    {game.opponentName}
                  </span>
                </div>
                {getStatusBadge(game.status)}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-900">
                    {game.homeScore} - {game.awayScore}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDate(game.updatedAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

