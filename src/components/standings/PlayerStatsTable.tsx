// ============================================================================
// PLAYER STATS TABLE - Reusable (<200 lines)
// Purpose: Display aggregated player stats with filters - Seasons AND Tournaments
// Follows .cursorrules: Single responsibility, reusable, <200 lines, optimized
// ============================================================================

'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface PlayerSeasonStats {
  playerId: string;
  playerName: string;
  jerseyNumber?: number;
  profilePhotoUrl?: string;
  gamesPlayed: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fgMade: number;
  fgAttempts: number;
  threePtMade: number;
  threePtAttempts: number;
  ftMade: number;
  ftAttempts: number;
}

interface PlayerStatsTableProps {
  players: PlayerSeasonStats[];
  variant?: 'full' | 'compact';
  showAverages?: boolean;
  className?: string;
}

type SortKey = keyof PlayerSeasonStats;
type SortDir = 'asc' | 'desc';

export const PlayerStatsTable = memo(function PlayerStatsTable({
  players,
  variant = 'full',
  showAverages = true,
  className,
}: PlayerStatsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('points');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');

  const handleSort = useCallback((key: SortKey) => {
    setSortKey(prev => {
      if (prev === key) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        return prev;
      }
      setSortDir('desc');
      return key;
    });
  }, []);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  const sortedPlayers = useMemo(() => {
    const searchLower = search.toLowerCase();
    const filtered = players.filter(p =>
      p.playerName.toLowerCase().includes(searchLower)
    );

    return filtered.sort((a, b) => {
      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [players, sortKey, sortDir, search]);

  const avg = useCallback((val: number, games: number) => 
    games > 0 ? (val / games).toFixed(1) : '0.0', []);
  const pct = useCallback((made: number, att: number) => 
    att > 0 ? `${Math.round((made / att) * 100)}%` : '-', []);

  const columns = variant === 'compact'
    ? ['Player', 'GP', 'PTS', 'REB', 'AST', 'STL']
    : ['Player', 'GP', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'TO', 'FG%', '3P%', 'FT%'];

  const SortIcon = ({ col }: { col: string }) => {
    const key = colToKey(col);
    if (sortKey !== key) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  return (
    <div className={cn('rounded-xl border border-gray-200 overflow-hidden', className)}>
      {/* Search */}
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              {columns.map(col => (
                <th
                  key={col}
                  onClick={() => handleSort(colToKey(col))}
                  className={cn(
                    'px-2 py-2 cursor-pointer hover:bg-gray-200 transition-colors',
                    col === 'Player' ? 'text-left' : 'text-center'
                  )}
                >
                  <span className="flex items-center gap-1 justify-center">
                    {col} <SortIcon col={col} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <AnimatePresence mode="popLayout">
              {sortedPlayers.map((p, idx) => (
                <motion.tr
                  key={p.playerId}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(idx % 2 === 0 ? 'bg-white' : 'bg-gray-50', 'hover:bg-orange-50/50 transition-colors')}
                >
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      {p.profilePhotoUrl ? (
                        <img src={p.profilePhotoUrl} className="w-6 h-6 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                          {p.jerseyNumber || p.playerName[0]}
                        </div>
                      )}
                      <span className="font-medium truncate max-w-[120px]">{p.playerName}</span>
                    </div>
                  </td>
                  <td className="text-center text-gray-600 tabular-nums">{p.gamesPlayed}</td>
                  <td className="text-center font-semibold tabular-nums">{showAverages ? avg(p.points, p.gamesPlayed) : p.points}</td>
                  <td className="text-center tabular-nums">{showAverages ? avg(p.rebounds, p.gamesPlayed) : p.rebounds}</td>
                  <td className="text-center tabular-nums">{showAverages ? avg(p.assists, p.gamesPlayed) : p.assists}</td>
                  <td className="text-center tabular-nums">{showAverages ? avg(p.steals, p.gamesPlayed) : p.steals}</td>
                  {variant === 'full' && (
                    <>
                      <td className="text-center tabular-nums">{showAverages ? avg(p.blocks, p.gamesPlayed) : p.blocks}</td>
                      <td className="text-center text-gray-500 tabular-nums">{showAverages ? avg(p.turnovers, p.gamesPlayed) : p.turnovers}</td>
                      <td className="text-center tabular-nums">{pct(p.fgMade, p.fgAttempts)}</td>
                      <td className="text-center tabular-nums">{pct(p.threePtMade, p.threePtAttempts)}</td>
                      <td className="text-center tabular-nums">{pct(p.ftMade, p.ftAttempts)}</td>
                    </>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
            {sortedPlayers.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-gray-400">
                  No players found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

function colToKey(col: string): SortKey {
  const map: Record<string, SortKey> = {
    'Player': 'playerName', 'GP': 'gamesPlayed', 'PTS': 'points', 'REB': 'rebounds',
    'AST': 'assists', 'STL': 'steals', 'BLK': 'blocks', 'TO': 'turnovers',
    'FG%': 'fgMade', '3P%': 'threePtMade', 'FT%': 'ftMade',
  };
  return map[col] || 'points';
}

