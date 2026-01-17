// ============================================================================
// PLAYER STATS TABLE - Reusable (<200 lines)
// Purpose: Display aggregated player stats with filters - Seasons AND Tournaments
// Follows .cursorrules: Single responsibility, reusable, <200 lines, optimized
// ============================================================================

'use client';

import React, { useState, useMemo, useCallback, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PlayerGameBreakdown } from './PlayerGameBreakdown';
import { useBreakdownCache } from '@/hooks/useBreakdownCache';
import { PlayerGameStat } from '@/hooks/usePlayerGameBreakdown';

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
  totalGames?: number; // ✅ Actual season game count for Total row
  gameIds?: string[]; // ✅ For expandable game breakdown
  enableBreakdown?: boolean; // ✅ Enable click-to-expand feature
}

type SortKey = keyof PlayerSeasonStats;
type SortDir = 'asc' | 'desc';

export const PlayerStatsTable = memo(function PlayerStatsTable({
  players,
  variant = 'full',
  showAverages = true,
  className,
  totalGames,
  gameIds = [],
  enableBreakdown = false,
}: PlayerStatsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('points');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [cachedData, setCachedData] = useState<Map<string, PlayerGameStat[]>>(new Map());
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);

  // Get top 3 player IDs for automatic prefetch
  const topPlayerIds = useMemo(() => {
    if (!enableBreakdown) return [];
    return [...players].sort((a, b) => b.points - a.points).slice(0, 3).map(p => p.playerId);
  }, [enableBreakdown, players]);

  // Breakdown cache with auto-prefetch of top players
  const { getBreakdown, prefetch, isCached } = useBreakdownCache(gameIds, topPlayerIds);

  const toggleExpand = useCallback(async (playerId: string) => {
    if (expandedPlayerId === playerId) { setExpandedPlayerId(null); return; }
    if (!cachedData.has(playerId)) {
      const data = await getBreakdown(playerId);
      setCachedData(prev => new Map(prev).set(playerId, data));
    }
    setExpandedPlayerId(playerId);
  }, [expandedPlayerId, cachedData, getBreakdown]);

  // Prefetch on hover (150ms delay)
  const handleMouseEnter = useCallback((playerId: string) => {
    if (!enableBreakdown || isCached(playerId)) return;
    hoverTimer.current = setTimeout(() => prefetch(playerId), 150);
  }, [enableBreakdown, isCached, prefetch]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null; }
  }, []);

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

  // ✅ Calculate team totals
  const totals = useMemo(() => {
    return players.reduce((acc, p) => ({
      gamesPlayed: acc.gamesPlayed + p.gamesPlayed,
      points: acc.points + p.points,
      rebounds: acc.rebounds + p.rebounds,
      assists: acc.assists + p.assists,
      steals: acc.steals + p.steals,
      blocks: acc.blocks + p.blocks,
      turnovers: acc.turnovers + p.turnovers,
      fgMade: acc.fgMade + p.fgMade,
      fgAttempts: acc.fgAttempts + p.fgAttempts,
      threePtMade: acc.threePtMade + p.threePtMade,
      threePtAttempts: acc.threePtAttempts + p.threePtAttempts,
      ftMade: acc.ftMade + p.ftMade,
      ftAttempts: acc.ftAttempts + p.ftAttempts,
    }), {
      gamesPlayed: 0, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0,
      turnovers: 0, fgMade: 0, fgAttempts: 0, threePtMade: 0, threePtAttempts: 0, ftMade: 0, ftAttempts: 0
    });
  }, [players]);

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
            {sortedPlayers.map((p, idx) => {
              const isExpanded = expandedPlayerId === p.playerId;
              return (
                <React.Fragment key={p.playerId}>
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15, delay: idx * 0.02 }}
                    onClick={() => enableBreakdown && toggleExpand(p.playerId)}
                    onMouseEnter={() => handleMouseEnter(p.playerId)}
                    onMouseLeave={handleMouseLeave}
                    className={cn(
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                      'hover:bg-orange-50/50 transition-colors',
                      enableBreakdown && 'cursor-pointer',
                      isExpanded && 'bg-orange-50'
                    )}
                  >
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          {enableBreakdown && (
                            <ChevronRight className={cn(
                              'w-4 h-4 text-gray-400 transition-transform flex-shrink-0',
                              isExpanded && 'rotate-90 text-orange-500'
                            )} />
                          )}
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
                    {/* Expandable Game Breakdown - renders <tr> elements directly */}
                    {enableBreakdown && isExpanded && gameIds.length > 0 && (
                      <PlayerGameBreakdown
                        playerId={p.playerId}
                        gameIds={gameIds}
                        variant={variant}
                        preloadedData={cachedData.get(p.playerId)}
                        fetchFn={getBreakdown}
                      />
                    )}
                </React.Fragment>
              );
            })}
            {/* ✅ Total Row */}
            {sortedPlayers.length > 0 && (
              <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                <td className="px-2 py-2 text-gray-700">Total</td>
                <td className="text-center text-gray-600 tabular-nums">{totalGames ?? '-'}</td>
                <td className="text-center tabular-nums">{totals.points}</td>
                <td className="text-center tabular-nums">{totals.rebounds}</td>
                <td className="text-center tabular-nums">{totals.assists}</td>
                <td className="text-center tabular-nums">{totals.steals}</td>
                {variant === 'full' && (
                  <>
                    <td className="text-center tabular-nums">{totals.blocks}</td>
                    <td className="text-center text-gray-500 tabular-nums">{totals.turnovers}</td>
                    <td className="text-center tabular-nums">{pct(totals.fgMade, totals.fgAttempts)}</td>
                    <td className="text-center tabular-nums">{pct(totals.threePtMade, totals.threePtAttempts)}</td>
                    <td className="text-center tabular-nums">{pct(totals.ftMade, totals.ftAttempts)}</td>
                  </>
                )}
              </tr>
            )}
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

