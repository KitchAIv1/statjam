"use client";

import { useMemo, useState } from 'react';
import { PlayerLeader } from '@/lib/services/tournamentLeadersService';
import { LeaderboardRow, SortColumn, PerMode, GamePhase } from './LeaderboardRow';
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
  initialGamePhase?: GamePhase;
  onPlayerClick: (playerId: string, isCustomPlayer: boolean) => void;
  onFilterChange?: (sortColumn: SortColumn, minGames: number) => void;
  onGamePhaseChange?: (phase: GamePhase) => void;
}

const ITEMS_PER_PAGE = 15;
const LABELS: Record<SortColumn | 'player' | 'team', string> = { 
  player: 'Player', team: 'Team', gp: 'GP', pts: 'PTS', reb: 'REB', ast: 'AST', 
  stl: 'STL', blk: 'BLK', tov: 'TOV', fg_pct: 'FG%', '3p_pct': '3P%', ft_pct: 'FT%' 
};

/** LeaderboardTable - NBA-style with sorting/pagination. Mobile: compact, Desktop: full grid. <200 lines */
export function LeaderboardTable({ leaders, loading, initialSortColumn = 'pts', initialPerMode = 'per_game', initialMinGames = 1, initialGamePhase = 'all', onPlayerClick, onFilterChange, onGamePhaseChange }: LeaderboardTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>(initialSortColumn);
  const [perMode, setPerMode] = useState<PerMode>(initialPerMode);
  const [minGames, setMinGames] = useState(initialMinGames);
  const [gamePhase, setGamePhase] = useState<GamePhase>(initialGamePhase);
  const [showAll, setShowAll] = useState(false);

  const sortedLeaders = useMemo(() => {
    return [...leaders].sort((a, b) => {
      const pg = perMode === 'per_game';
      switch (sortColumn) {
        case 'pts': return pg ? b.pointsPerGame - a.pointsPerGame : b.totalPoints - a.totalPoints;
        case 'reb': return pg ? b.reboundsPerGame - a.reboundsPerGame : b.totalRebounds - a.totalRebounds;
        case 'ast': return pg ? b.assistsPerGame - a.assistsPerGame : b.totalAssists - a.totalAssists;
        case 'stl': return pg ? b.stealsPerGame - a.stealsPerGame : b.totalSteals - a.totalSteals;
        case 'blk': return pg ? b.blocksPerGame - a.blocksPerGame : b.totalBlocks - a.totalBlocks;
        case 'tov': return pg ? a.turnoversPerGame - b.turnoversPerGame : a.totalTurnovers - b.totalTurnovers;
        case 'gp': return b.gamesPlayed - a.gamesPlayed;
        case 'fg_pct': return b.fieldGoalPercentage - a.fieldGoalPercentage;
        case '3p_pct': return b.threePointPercentage - a.threePointPercentage;
        case 'ft_pct': return b.freeThrowPercentage - a.freeThrowPercentage;
        default: return 0;
      }
    });
  }, [leaders, sortColumn, perMode]);

  const displayed = showAll ? sortedLeaders : sortedLeaders.slice(0, ITEMS_PER_PAGE);
  const hasMore = sortedLeaders.length > ITEMS_PER_PAGE;
  const handleSort = (col: SortColumn) => { setSortColumn(col); onFilterChange?.(col, minGames); };
  const handleMin = (g: number) => { setMinGames(g); onFilterChange?.(sortColumn, g); };
  const handlePhase = (p: GamePhase) => { setGamePhase(p); onGamePhaseChange?.(p); };

  const ColHead = ({ col, cls }: { col: SortColumn | 'player' | 'team'; cls?: string }) => {
    const sortable = !['player', 'team'].includes(col);
    const active = sortColumn === col;
    return (
      <button onClick={() => sortable && handleSort(col as SortColumn)} disabled={!sortable}
        className={cn("text-[9px] md:text-xs uppercase tracking-wider font-medium whitespace-nowrap", sortable ? "cursor-pointer hover:text-white" : "cursor-default", active ? "text-[#FF3B30]" : "text-white/50", cls)}>
        {LABELS[col]}{active && sortable && <ChevronDown className="inline-block w-3 h-3 ml-0.5" />}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#121212] overflow-hidden sm:rounded-2xl min-h-[500px]">
        <div className="p-4 border-b border-white/10"><div className="h-8 w-48 bg-white/5 rounded animate-pulse" /></div>
        <div className="divide-y divide-white/5">{[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i => <div key={i} className="h-14 bg-white/5 animate-pulse" />)}</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#121212] overflow-hidden sm:rounded-2xl min-h-[500px]">
      {/* Filters */}
      <div className="flex flex-col gap-3 p-3 border-b border-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <h2 className="text-sm font-semibold text-white sm:text-base">Player Leaders</h2>
        <LeaderboardFilters sortColumn={sortColumn} onSortColumnChange={handleSort} perMode={perMode} onPerModeChange={setPerMode} minGames={minGames} onMinGamesChange={handleMin} gamePhase={gamePhase} onGamePhaseChange={onGamePhaseChange ? handlePhase : undefined} />
      </div>
      {/* Mobile Header - Scrollable to match row layout */}
      <div className="flex md:hidden bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-1.5 px-2 py-2 w-[130px] shrink-0 border-r border-white/10 sticky left-0 bg-white/5 z-10">
          <span className="w-5 text-center text-[9px] uppercase text-white/50 font-medium">#</span>
          <span className="text-[9px] uppercase text-white/50 font-medium">Player</span>
        </div>
        <div className="flex items-center overflow-x-auto scrollbar-hide">
          {(['gp','pts','reb','ast','stl','blk','tov','fg_pct','3p_pct','ft_pct'] as SortColumn[]).map(c => (
            <div key={c} className={c === 'gp' ? 'w-7 shrink-0' : c.includes('pct') ? 'w-11 shrink-0' : 'w-9 shrink-0'}>
              <ColHead col={c} cls="text-center text-[9px]" />
            </div>
          ))}
        </div>
      </div>
      {/* Desktop Header - Full NBA-style grid */}
      <div className="hidden md:grid grid-cols-[40px_1fr_120px_45px_55px_55px_55px_55px_55px_55px_60px_60px_60px] items-center gap-1 px-4 py-3 bg-white/5 border-b border-white/10">
        <span className="text-xs uppercase text-white/50 font-medium">#</span>
        <span className="text-xs uppercase text-white/50 font-medium">Player</span>
        <span className="text-xs uppercase text-white/50 font-medium">Team</span>
        {(['gp','pts','reb','ast','stl','blk','tov','fg_pct','3p_pct','ft_pct'] as SortColumn[]).map(c => <ColHead key={c} col={c} cls="text-center" />)}
      </div>
      {/* Body */}
      {sortedLeaders.length === 0 ? (
        <div className="p-8 text-center text-white/50 text-sm">No player stats available yet.</div>
      ) : (
        <>
          <div className="divide-y divide-white/5">
            {displayed.map((player, i) => (
              <LeaderboardRow key={player.playerId} player={player} rank={i + 1} perMode={perMode} sortColumn={sortColumn} onClick={() => onPlayerClick(player.playerId, player.isCustomPlayer || false)} />
            ))}
          </div>
          {hasMore && (
            <div className="p-3 border-t border-white/10 sm:p-4">
              <Button variant="ghost" onClick={() => setShowAll(!showAll)} className="w-full text-white/60 hover:text-white hover:bg-white/10 text-xs sm:text-sm">
                {showAll ? <><ChevronUp className="w-4 h-4 mr-2" />Show Less</> : <><ChevronDown className="w-4 h-4 mr-2" />View All {sortedLeaders.length} Players</>}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

