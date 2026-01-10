// ============================================================================
// GAME RESULTS LIST - Reusable (<130 lines)
// Purpose: Display list of game results - works for Seasons AND Tournaments
// Follows .cursorrules: Single responsibility, reusable, smooth animations
// ============================================================================

'use client';

import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Calendar, ChevronRight } from 'lucide-react';
import { SeasonGameEnriched } from '@/lib/types/season';

interface GameResultsListProps {
  games: SeasonGameEnriched[];
  teamName?: string;
  onGameClick?: (gameId: string) => void;
  variant?: 'full' | 'compact';
  className?: string;
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

export const GameResultsList = memo(function GameResultsList({
  games, teamName, onGameClick, variant = 'full', className,
}: GameResultsListProps) {
  const handleClick = useCallback((gameId: string) => {
    onGameClick?.(gameId);
  }, [onGameClick]);

  if (games.length === 0) {
    return (
      <div className={cn('rounded-xl border border-gray-200 bg-white p-8 text-center', className)}>
        <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">No games in this season yet</p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white overflow-hidden', className)}>
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">Game Results ({games.length})</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {games.map((game, index) => {
          const won = game.home_score > game.away_score;
          const isCompleted = game.status === 'completed';
          
          return (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04, duration: 0.25, ease: 'easeOut' }}
              onClick={() => handleClick(game.game_id)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 transition-all duration-200',
                onGameClick && 'cursor-pointer hover:bg-orange-50/50 hover:pl-5',
                !isCompleted && 'opacity-60'
              )}
            >
              {/* Result indicator */}
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 transition-transform',
                isCompleted ? (won ? 'bg-orange-500' : 'bg-gray-400') : 'bg-gray-300'
              )}>
                {isCompleted ? (won ? 'W' : 'L') : '-'}
              </div>

              {/* Game info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {teamName ? `${teamName} vs ` : 'vs '}{game.opponent_name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(game.game_date)}
                  {game.game_notes && <span className="ml-2 italic">• {game.game_notes}</span>}
                </p>
              </div>

              {/* Score */}
              <div className="text-right shrink-0">
                <p className={cn(
                  'font-bold text-lg tabular-nums',
                  isCompleted ? (won ? 'text-orange-600' : 'text-gray-500') : 'text-gray-400'
                )}>
                  {game.home_score}-{game.away_score}
                </p>
                {variant === 'full' && (
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                    {isCompleted ? (won ? 'WIN' : 'LOSS') : game.status}
                  </p>
                )}
              </div>

              {onGameClick && (
                <ChevronRight className="w-4 h-4 text-gray-300 transition-transform group-hover:translate-x-1" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

