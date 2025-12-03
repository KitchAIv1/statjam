"use client";

import { useMemo, useState } from 'react';
import { PlayerLeader } from '@/lib/services/tournamentLeadersService';
import { LeaderboardRow, SortColumn, PerMode } from './LeaderboardRow';
import { LeaderboardFilters } from './LeaderboardFilters';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface LeaderboardTableProps {
  leaders: PlayerLeader[];
  loading: boolean;
  initialSortColumn?: SortColumn;
  initialPerMode?: PerMode;
  initialMinGames?: number;
  onPlayerClick: (playerId: string, isCustomPlayer: boolean) => void;
  onFilterChange?: (sortColumn: SortColumn, minGames: number) => void;
}

const ITEMS_PER_PAGE = 15;

const COLUMN_LABELS: Record<SortColumn | 'player' | 'team', string> = {
  player: 'Player',
  team: 'Team',
  gp: 'GP',
  pts: 'PTS',
  reb: 'REB',
  ast: 'AST',
  stl: 'STL',
  blk: 'BLK',
  tov: 'TOV',
};

/**
 * LeaderboardTable - NBA-style leaderboard with sorting and pagination
 * Mobile: Fixed player zone + scrollable stats (ESPN-style)
 * Desktop: Full layout
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function LeaderboardTable({
  leaders,
  loading,
  initialSortColumn = 'pts',
  initialPerMode = 'per_game',
  initialMinGames = 1,
  onPlayerClick,
  onFilterChange,
}: LeaderboardTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>(initialSortColumn);
  const [perMode, setPerMode] = useState<PerMode>(initialPerMode);
  const [minGames, setMinGames] = useState(initialMinGames);
  const [showAll, setShowAll] = useState(false);

  const sortedLeaders = useMemo(() => {
    const sorted = [...leaders].sort((a, b) => {
      const isPerGame = perMode === 'per_game';
      switch (sortColumn) {
        case 'pts': return isPerGame ? b.pointsPerGame - a.pointsPerGame : b.totalPoints - a.totalPoints;
        case 'reb': return isPerGame ? b.reboundsPerGame - a.reboundsPerGame : b.totalRebounds - a.totalRebounds;
        case 'ast': return isPerGame ? b.assistsPerGame - a.assistsPerGame : b.totalAssists - a.totalAssists;
        case 'stl': return isPerGame ? b.stealsPerGame - a.stealsPerGame : b.totalSteals - a.totalSteals;
        case 'blk': return isPerGame ? b.blocksPerGame - a.blocksPerGame : b.totalBlocks - a.totalBlocks;
        case 'tov': return isPerGame ? a.turnoversPerGame - b.turnoversPerGame : a.totalTurnovers - b.totalTurnovers;
        case 'gp': return b.gamesPlayed - a.gamesPlayed;
        default: return 0;
      }
    });
    return sorted;
  }, [leaders, sortColumn, perMode]);

  const displayedLeaders = showAll ? sortedLeaders : sortedLeaders.slice(0, ITEMS_PER_PAGE);
  const hasMore = sortedLeaders.length > ITEMS_PER_PAGE;

  const handleSortColumnChange = (column: SortColumn) => {
    setSortColumn(column);
    onFilterChange?.(column, minGames);
  };

  const handleMinGamesChange = (games: number) => {
    setMinGames(games);
    onFilterChange?.(sortColumn, games);
  };

  const ColumnHeader = ({ column, className }: { column: SortColumn | 'player' | 'team'; className?: string }) => {
    const isSortable = !['player', 'team'].includes(column);
    const isActive = sortColumn === column;
    
    return (
      <button
        onClick={() => isSortable && handleSortColumnChange(column as SortColumn)}
        disabled={!isSortable}
        className={cn(
          "text-[9px] sm:text-[10px] uppercase tracking-wider font-medium transition-colors whitespace-nowrap",
          isSortable ? "cursor-pointer hover:text-white" : "cursor-default",
          isActive ? "text-[#FF3B30]" : "text-white/50",
          className
        )}
      >
        {COLUMN_LABELS[column]}
        {isActive && isSortable && <ChevronDown className="inline-block w-3 h-3 ml-0.5" />}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#121212] overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-white/5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#121212] overflow-hidden sm:rounded-2xl">
      {/* Header with Filters */}
      <div className="flex flex-col gap-3 p-3 border-b border-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <h2 className="text-sm font-semibold text-white sm:text-base">Player Leaders</h2>
        <LeaderboardFilters
          sortColumn={sortColumn}
          onSortColumnChange={handleSortColumnChange}
          perMode={perMode}
          onPerModeChange={setPerMode}
          minGames={minGames}
          onMinGamesChange={handleMinGamesChange}
        />
      </div>

      {/* Table Header - Matches row structure with fixed widths */}
      <div className="flex bg-white/5 border-b border-white/10">
        {/* Fixed Zone Header - MUST match row width (140px mobile, 200px desktop) */}
        <div className="flex items-center gap-1.5 px-2 py-2 w-[140px] shrink-0 sm:gap-3 sm:px-4 sm:py-2.5 sm:w-[200px]">
          <span className="w-5 text-center text-[9px] shrink-0 sm:w-6 sm:text-[10px] uppercase tracking-wider text-white/50 font-medium">#</span>
          <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/50 font-medium">Player</span>
        </div>
        {/* Team - Desktop only */}
        <div className="hidden sm:flex items-center w-[100px]">
          <span className="text-[10px] uppercase tracking-wider text-white/50 font-medium">Team</span>
        </div>
        {/* Stats Header - Fixed widths matching row */}
        <div className="flex items-center shrink-0">
          <div className="w-8 sm:w-12"><ColumnHeader column="gp" className="text-center" /></div>
          <div className="w-10 sm:w-12"><ColumnHeader column="pts" className="text-center" /></div>
          <div className="w-10 sm:w-12"><ColumnHeader column="reb" className="text-center" /></div>
          <div className="w-10 sm:w-12"><ColumnHeader column="ast" className="text-center" /></div>
          <div className="w-10 sm:w-12"><ColumnHeader column="stl" className="text-center" /></div>
          <div className="w-10 sm:w-12"><ColumnHeader column="blk" className="text-center" /></div>
          <div className="w-10 sm:w-12"><ColumnHeader column="tov" className="text-center" /></div>
        </div>
      </div>

      {/* Table Body */}
      {sortedLeaders.length === 0 ? (
        <div className="p-8 text-center text-white/50 text-sm">
          No player stats available yet. Leaders will appear as games are tracked.
        </div>
      ) : (
        <>
          <div className="divide-y divide-white/5">
            {displayedLeaders.map((player, index) => (
              <LeaderboardRow
                key={player.playerId}
                player={player}
                rank={index + 1}
                perMode={perMode}
                sortColumn={sortColumn}
                onClick={() => onPlayerClick(player.playerId, player.isCustomPlayer || false)}
              />
            ))}
          </div>

          {hasMore && (
            <div className="p-3 border-t border-white/10 sm:p-4">
              <Button
                variant="ghost"
                onClick={() => setShowAll(!showAll)}
                className="w-full text-white/60 hover:text-white hover:bg-white/10 text-xs sm:text-sm"
              >
                {showAll ? (
                  <><ChevronUp className="w-4 h-4 mr-2" />Show Less</>
                ) : (
                  <><ChevronDown className="w-4 h-4 mr-2" />View All {sortedLeaders.length} Players</>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
