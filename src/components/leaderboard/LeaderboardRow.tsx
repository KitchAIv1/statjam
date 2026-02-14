"use client";

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { PlayerLeader } from '@/lib/services/tournamentLeadersService';
import { cn } from '@/lib/utils';
import { prefetchPlayerProfile } from '@/lib/services/prefetchService';
import { useTournamentTheme } from '@/contexts/TournamentThemeContext';
import { getTournamentThemeClass } from '@/lib/utils/tournamentThemeClasses';

export type PerMode = 'per_game' | 'totals';
export type SortColumn = 'pts' | 'reb' | 'ast' | 'stl' | 'blk' | 'tov' | 'gp' | 'fg_pct' | '3p_pct' | 'ft_pct';
export type GamePhase = 'all' | 'regular' | 'playoffs' | 'finals';

interface LeaderboardRowProps {
  player: PlayerLeader;
  rank: number;
  perMode: PerMode;
  sortColumn: SortColumn;
  onClick: () => void;
}

/** LeaderboardRow - NBA-style full stats. Mobile: scrollable, Desktop: full grid. <150 lines */
export function LeaderboardRow({ player, rank, perMode, sortColumn, onClick }: LeaderboardRowProps) {
  const { theme } = useTournamentTheme();
  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const getStat = (pg: number, tot: number) => perMode === 'per_game' ? pg.toFixed(1) : String(tot);
  const getPct = (pct: number) => pct > 0 ? pct.toFixed(1) : '-';
  const statInactiveClass = getTournamentThemeClass('cardText', theme);
  const sc = (col: SortColumn) => cn("text-center tabular-nums", sortColumn === col ? "text-[#FF3B30] font-bold" : statInactiveClass);
  const rc = rank === 1 ? "text-yellow-500 font-bold" : rank === 2 ? "text-gray-400 font-bold" : rank === 3 ? "text-amber-600 font-bold" : getTournamentThemeClass('cardTextDim', theme);
  const team3 = player.teamName.slice(0, 3).toUpperCase();
  const p = player;

  const handleHover = () => !p.isCustomPlayer && prefetchPlayerProfile(p.playerId);
  const rowHoverClass = getTournamentThemeClass('rowHover', theme);
  const borderClass = getTournamentThemeClass('borderLight', theme);
  const cardBorderClass = getTournamentThemeClass('cardBorder', theme);
  const cardBgClass = getTournamentThemeClass('cardBgSubtle', theme);
  const cardTextClass = getTournamentThemeClass('cardText', theme);
  const cardTextDimClass = getTournamentThemeClass('cardTextDim', theme);

  return (
    <>
      {/* Mobile (<md) - Horizontal scroll for stats */}
      <div onClick={onClick} onMouseEnter={handleHover} className={cn("flex md:hidden cursor-pointer transition-colors border-b", rowHoverClass, borderClass)}>
        {/* Fixed player info */}
        <div className={cn("flex items-center gap-1.5 px-2 py-2.5 w-[130px] shrink-0 border-r sticky left-0 z-10", cardBgClass, cardBorderClass)}>
          <div className={cn("w-5 text-center text-xs shrink-0", rc)}>{rank}</div>
          <Avatar className={cn("h-8 w-8 shrink-0 border", cardBorderClass)}>
            {p.profilePhotoUrl && <AvatarImage src={p.profilePhotoUrl} alt={p.playerName} />}
            <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10 text-[9px] text-white">
              {getInitials(p.playerName) || <User className="h-3.5 w-3.5" />}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className={cn("text-[10px] font-medium truncate", cardTextClass)}>{p.playerName}</div>
            <div className={cn("text-[9px]", cardTextDimClass)}>{team3}</div>
          </div>
        </div>
        {/* Scrollable stats */}
        <div className="flex items-center overflow-x-auto scrollbar-hide">
          <div className={cn("w-7 shrink-0 text-center text-[10px]", sc('gp'))}>{p.gamesPlayed}</div>
          <div className={cn("w-9 shrink-0 text-center text-[10px]", sc('pts'))}>{getStat(p.pointsPerGame, p.totalPoints)}</div>
          <div className={cn("w-9 shrink-0 text-center text-[10px]", sc('reb'))}>{getStat(p.reboundsPerGame, p.totalRebounds)}</div>
          <div className={cn("w-9 shrink-0 text-center text-[10px]", sc('ast'))}>{getStat(p.assistsPerGame, p.totalAssists)}</div>
          <div className={cn("w-9 shrink-0 text-center text-[10px]", sc('stl'))}>{getStat(p.stealsPerGame, p.totalSteals)}</div>
          <div className={cn("w-9 shrink-0 text-center text-[10px]", sc('blk'))}>{getStat(p.blocksPerGame, p.totalBlocks)}</div>
          <div className={cn("w-9 shrink-0 text-center text-[10px]", sc('tov'))}>{getStat(p.turnoversPerGame, p.totalTurnovers)}</div>
          <div className={cn("w-11 shrink-0 text-center text-[10px]", sc('fg_pct'))}>{getPct(p.fieldGoalPercentage)}</div>
          <div className={cn("w-11 shrink-0 text-center text-[10px]", sc('3p_pct'))}>{getPct(p.threePointPercentage)}</div>
          <div className={cn("w-11 shrink-0 text-center text-[10px]", sc('ft_pct'))}>{getPct(p.freeThrowPercentage)}</div>
        </div>
      </div>
      {/* Desktop (md+) - Full NBA-style grid */}
      <div onClick={onClick} onMouseEnter={handleHover} className={cn("hidden md:grid grid-cols-[40px_1fr_120px_45px_55px_55px_55px_55px_55px_55px_60px_60px_60px] items-center gap-1 px-4 py-3 cursor-pointer transition-colors border-b", rowHoverClass, borderClass)}>
        <div className={cn("text-sm", rc)}>{rank}</div>
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className={cn("h-10 w-10 shrink-0 border", cardBorderClass)}>
            {p.profilePhotoUrl && <AvatarImage src={p.profilePhotoUrl} alt={p.playerName} />}
            <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10 text-sm text-white">
              {getInitials(p.playerName) || <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <span className={cn("text-sm font-medium truncate", cardTextClass)}>{p.playerName}</span>
        </div>
        <div className={cn("text-xs truncate", cardTextDimClass)}>{p.teamName}</div>
        <div className={cn("text-xs", sc('gp'))}>{p.gamesPlayed}</div>
        <div className={cn("text-xs", sc('pts'))}>{getStat(p.pointsPerGame, p.totalPoints)}</div>
        <div className={cn("text-xs", sc('reb'))}>{getStat(p.reboundsPerGame, p.totalRebounds)}</div>
        <div className={cn("text-xs", sc('ast'))}>{getStat(p.assistsPerGame, p.totalAssists)}</div>
        <div className={cn("text-xs", sc('stl'))}>{getStat(p.stealsPerGame, p.totalSteals)}</div>
        <div className={cn("text-xs", sc('blk'))}>{getStat(p.blocksPerGame, p.totalBlocks)}</div>
        <div className={cn("text-xs", sc('tov'))}>{getStat(p.turnoversPerGame, p.totalTurnovers)}</div>
        <div className={cn("text-xs", sc('fg_pct'))}>{getPct(p.fieldGoalPercentage)}</div>
        <div className={cn("text-xs", sc('3p_pct'))}>{getPct(p.threePointPercentage)}</div>
        <div className={cn("text-xs", sc('ft_pct'))}>{getPct(p.freeThrowPercentage)}</div>
      </div>
    </>
  );
}
