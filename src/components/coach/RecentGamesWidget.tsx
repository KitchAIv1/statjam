'use client';

/**
 * RecentGamesWidget - Compact recent completed games display
 * 
 * Shows last 4 completed games with scores and quick view action.
 * 
 * Follows .cursorrules: <100 lines, UI only, single responsibility
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Eye, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { CoachGame } from '@/lib/types/coach';

interface RecentGamesWidgetProps {
  games: CoachGame[];
  onViewAll?: () => void;
}

export function RecentGamesWidget({ games, onViewAll }: RecentGamesWidgetProps) {
  const router = useRouter();

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleViewGame = (gameId: string) => {
    router.push(`/dashboard/coach/game/${gameId}`);
  };

  return (
    <Card className="p-4 bg-white border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-orange-500" />
          Recent Games
        </h3>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll} className="h-6 text-xs text-gray-500">
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>

      {games.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-sm">
          No completed games yet
        </div>
      ) : (
        <div className="space-y-2">
          {games.map((game) => {
            const isWin = (game.home_score || 0) > (game.away_score || 0);
            return (
              <div 
                key={game.id}
                className="flex items-center justify-between p-2 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isWin ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                      {isWin ? 'W' : 'L'}
                    </span>
                    <span className="text-sm font-medium text-gray-900 truncate">
                      vs {game.opponent_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{formatDate(game.end_time || game.start_time)}</span>
                    <span className="text-xs font-semibold text-gray-700">
                      {game.home_score}-{game.away_score}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewGame(game.id)}
                  className="h-7 w-7 p-0"
                >
                  <Eye className="w-3.5 h-3.5 text-gray-500" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

