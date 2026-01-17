// ============================================================================
// PLAYER GAME BREAKDOWN - Expandable per-game stats for a player
// Follows .cursorrules: Single responsibility, <200 lines, reusable
// ============================================================================

'use client';

import React, { useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { usePlayerGameBreakdown, PlayerGameStat } from '@/hooks/usePlayerGameBreakdown';

interface PlayerGameBreakdownProps {
  playerId: string;
  playerName: string;
  gameIds: string[];
  variant?: 'full' | 'compact';
}

export const PlayerGameBreakdown = memo(function PlayerGameBreakdown({
  playerId,
  gameIds,
  variant = 'full',
}: PlayerGameBreakdownProps) {
  const { games, loading, error, fetchBreakdown } = usePlayerGameBreakdown();

  useEffect(() => {
    fetchBreakdown(playerId, gameIds);
  }, [playerId, gameIds, fetchBreakdown]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate column count for colSpan
  const colCount = variant === 'full' ? 11 : 6;

  if (loading) {
    return (
      <tr className="bg-orange-50/30">
        <td colSpan={colCount} className="text-center py-3 text-gray-400 text-xs">
          <span className="inline-flex items-center">
            <Loader2 className="w-3 h-3 animate-spin mr-2" />
            Loading...
          </span>
        </td>
      </tr>
    );
  }

  if (error) {
    return (
      <tr className="bg-orange-50/30">
        <td colSpan={colCount} className="text-center py-3 text-red-400 text-xs">{error}</td>
      </tr>
    );
  }

  if (!games.length) {
    return (
      <tr className="bg-orange-50/30">
        <td colSpan={colCount} className="text-center py-3 text-gray-400 text-xs">No game data</td>
      </tr>
    );
  }

  // Return actual <tr> elements - 11 cells matching parent table exactly
  return (
    <>
      {games.map((game, idx) => (
        <motion.tr
          key={game.gameId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, delay: idx * 0.03 }}
          className="bg-orange-50/50 text-xs border-b border-orange-100 last:border-b-0 hover:bg-orange-100/50 transition-colors"
        >
          {/* Player column - Date + Opponent */}
          <td className="px-2 py-1.5 text-gray-500">
            <span>{formatDate(game.gameDate)}</span>
            <span className="text-gray-400 mx-1">vs</span>
            <span className="text-gray-600 font-medium">{game.opponentName}</span>
          </td>
          {/* GP - empty */}
          <td className="text-center text-gray-300">-</td>
          {/* PTS */}
          <td className="text-center font-semibold tabular-nums">{game.points}</td>
          {/* REB */}
          <td className="text-center tabular-nums">{game.rebounds}</td>
          {/* AST */}
          <td className="text-center tabular-nums">{game.assists}</td>
          {/* STL */}
          <td className="text-center tabular-nums">{game.steals}</td>
          {variant === 'full' && (
            <>
              {/* BLK */}
              <td className="text-center tabular-nums">{game.blocks}</td>
              {/* TO */}
              <td className="text-center text-gray-500 tabular-nums">{game.turnovers}</td>
              {/* FG */}
              <td className="text-center tabular-nums text-gray-600">{game.fgMade}/{game.fgAttempts}</td>
              {/* 3PT */}
              <td className="text-center tabular-nums text-gray-600">{game.threePtMade}/{game.threePtAttempts}</td>
              {/* FT */}
              <td className="text-center tabular-nums text-gray-600">{game.ftMade}/{game.ftAttempts}</td>
            </>
          )}
        </motion.tr>
      ))}
    </>
  );
});
