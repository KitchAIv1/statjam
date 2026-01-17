// ============================================================================
// PLAYER GAME BREAKDOWN - Expandable per-game stats for a player
// Follows .cursorrules: Single responsibility, <200 lines, reusable
// ============================================================================

'use client';

import React, { useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Calendar, Loader2 } from 'lucide-react';
import { usePlayerGameBreakdown, PlayerGameStat } from '@/hooks/usePlayerGameBreakdown';

interface PlayerGameBreakdownProps {
  playerId: string;
  playerName: string;
  gameIds: string[];
  className?: string;
}

export const PlayerGameBreakdown = memo(function PlayerGameBreakdown({
  playerId,
  playerName,
  gameIds,
  className,
}: PlayerGameBreakdownProps) {
  const { games, loading, error, fetchBreakdown } = usePlayerGameBreakdown();

  useEffect(() => {
    fetchBreakdown(playerId, gameIds);
  }, [playerId, gameIds, fetchBreakdown]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const pct = (made: number, att: number) => 
    att > 0 ? `${Math.round((made / att) * 100)}%` : '-';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Loading game breakdown...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-400 text-sm">
        {error}
      </div>
    );
  }

  if (!games.length) {
    return (
      <div className="text-center py-4 text-gray-400 text-sm">
        No game data available
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('bg-gray-50 border-t border-gray-200', className)}
    >
      <div className="px-4 py-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {playerName}&apos;s Game Log
        </h4>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-gray-500 uppercase">
              <tr className="border-b border-gray-200">
                <th className="text-left py-1.5 px-2 font-medium">Date</th>
                <th className="text-left py-1.5 px-2 font-medium">vs</th>
                <th className="text-center py-1.5 px-1 font-medium">PTS</th>
                <th className="text-center py-1.5 px-1 font-medium">REB</th>
                <th className="text-center py-1.5 px-1 font-medium">AST</th>
                <th className="text-center py-1.5 px-1 font-medium">STL</th>
                <th className="text-center py-1.5 px-1 font-medium">BLK</th>
                <th className="text-center py-1.5 px-1 font-medium">TO</th>
                <th className="text-center py-1.5 px-1 font-medium">FG</th>
                <th className="text-center py-1.5 px-1 font-medium">3PT</th>
                <th className="text-center py-1.5 px-1 font-medium">FT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {games.map((game) => (
                <GameRow key={game.gameId} game={game} formatDate={formatDate} pct={pct} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
});

// Extracted row component for performance
const GameRow = memo(function GameRow({
  game,
  formatDate,
  pct,
}: {
  game: PlayerGameStat;
  formatDate: (d: string) => string;
  pct: (m: number, a: number) => string;
}) {
  return (
    <tr className="hover:bg-gray-100/50 transition-colors">
      <td className="py-1.5 px-2 text-gray-600 whitespace-nowrap">
        {formatDate(game.gameDate)}
      </td>
      <td className="py-1.5 px-2 text-gray-700 font-medium truncate max-w-[100px]">
        {game.opponentName}
      </td>
      <td className="text-center py-1.5 px-1 font-semibold tabular-nums">
        {game.points}
      </td>
      <td className="text-center py-1.5 px-1 tabular-nums">{game.rebounds}</td>
      <td className="text-center py-1.5 px-1 tabular-nums">{game.assists}</td>
      <td className="text-center py-1.5 px-1 tabular-nums">{game.steals}</td>
      <td className="text-center py-1.5 px-1 tabular-nums">{game.blocks}</td>
      <td className="text-center py-1.5 px-1 text-gray-500 tabular-nums">{game.turnovers}</td>
      <td className="text-center py-1.5 px-1 tabular-nums text-gray-600">
        {game.fgMade}/{game.fgAttempts}
      </td>
      <td className="text-center py-1.5 px-1 tabular-nums text-gray-600">
        {game.threePtMade}/{game.threePtAttempts}
      </td>
      <td className="text-center py-1.5 px-1 tabular-nums text-gray-600">
        {game.ftMade}/{game.ftAttempts}
      </td>
    </tr>
  );
});
