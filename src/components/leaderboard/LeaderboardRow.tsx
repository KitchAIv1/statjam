"use client";

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { PlayerLeader } from '@/lib/services/tournamentLeadersService';
import { cn } from '@/lib/utils';

export type PerMode = 'per_game' | 'totals';
export type SortColumn = 'pts' | 'reb' | 'ast' | 'stl' | 'blk' | 'tov' | 'gp';

interface LeaderboardRowProps {
  player: PlayerLeader;
  rank: number;
  perMode: PerMode;
  sortColumn: SortColumn;
  onClick: () => void;
}

/**
 * LeaderboardRow - Single player row in the leaderboard table
 * Mobile: Fixed player zone + scrollable stats (ESPN-style)
 * Desktop: Full grid layout
 * Follows .cursorrules: <100 lines, single responsibility
 */
export function LeaderboardRow({ player, rank, perMode, sortColumn, onClick }: LeaderboardRowProps) {
  const getInitials = (name: string): string => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStat = (perGame: number, total: number): string => {
    const value = perMode === 'per_game' ? perGame : total;
    return perMode === 'per_game' ? value.toFixed(1) : String(total);
  };

  const getStatClass = (column: SortColumn) => cn(
    "text-center tabular-nums whitespace-nowrap",
    sortColumn === column ? "text-[#FF3B30] font-bold" : "text-white/80"
  );

  const getRankClass = () => {
    if (rank === 1) return "text-yellow-400 font-bold";
    if (rank === 2) return "text-gray-300 font-bold";
    if (rank === 3) return "text-amber-600 font-bold";
    return "text-white/40 font-medium";
  };

  // Get 3-letter team abbreviation
  const getTeamAbbrev = (name: string): string => {
    return name.slice(0, 3).toUpperCase();
  };

  return (
    <div
      onClick={onClick}
      className="flex hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-b-0"
    >
      {/* Fixed Zone: Rank + Player - FIXED WIDTH to ensure stats alignment */}
      <div className="flex items-center gap-1.5 px-2 py-2.5 w-[140px] shrink-0 bg-[#121212] sm:gap-3 sm:px-4 sm:py-3 sm:w-[200px]">
        {/* Rank */}
        <div className={cn("w-5 text-center text-xs shrink-0 sm:w-6 sm:text-sm", getRankClass())}>
          {rank}
        </div>
        {/* Avatar */}
        <Avatar className="h-6 w-6 shrink-0 border border-white/10 sm:h-9 sm:w-9">
          {player.profilePhotoUrl ? (
            <AvatarImage src={player.profilePhotoUrl} alt={player.playerName} />
          ) : null}
          <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10 text-[8px] sm:text-xs text-white">
            {getInitials(player.playerName) || <User className="h-3 w-3" />}
          </AvatarFallback>
        </Avatar>
        {/* Name + Team (stacked on mobile) */}
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-medium text-white truncate sm:text-sm">{player.playerName}</div>
          <div className="text-[9px] text-white/50 sm:hidden">{getTeamAbbrev(player.teamName)}</div>
        </div>
      </div>

      {/* Team - Desktop only */}
      <div className="hidden sm:flex items-center w-[100px] text-xs text-white/50 truncate">
        {player.teamName}
      </div>

      {/* Stats Zone - Fixed widths for alignment */}
      <div className="flex items-center shrink-0">
        <div className={cn("w-8 text-center text-[10px] sm:w-12 sm:text-xs", getStatClass('gp'))}>{player.gamesPlayed}</div>
        <div className={cn("w-10 text-center text-[10px] sm:w-12 sm:text-xs", getStatClass('pts'))}>{getStat(player.pointsPerGame, player.totalPoints)}</div>
        <div className={cn("w-10 text-center text-[10px] sm:w-12 sm:text-xs", getStatClass('reb'))}>{getStat(player.reboundsPerGame, player.totalRebounds)}</div>
        <div className={cn("w-10 text-center text-[10px] sm:w-12 sm:text-xs", getStatClass('ast'))}>{getStat(player.assistsPerGame, player.totalAssists)}</div>
        <div className={cn("w-10 text-center text-[10px] sm:w-12 sm:text-xs", getStatClass('stl'))}>{getStat(player.stealsPerGame, player.totalSteals)}</div>
        <div className={cn("w-10 text-center text-[10px] sm:w-12 sm:text-xs", getStatClass('blk'))}>{getStat(player.blocksPerGame, player.totalBlocks)}</div>
        <div className={cn("w-10 text-center text-[10px] sm:w-12 sm:text-xs", getStatClass('tov'))}>{getStat(player.turnoversPerGame, player.totalTurnovers)}</div>
      </div>
    </div>
  );
}
