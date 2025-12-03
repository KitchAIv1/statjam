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
 * Shows all stats with highlight on sorted column
 * Follows .cursorrules: <100 lines, single responsibility
 */
export function LeaderboardRow({ player, rank, perMode, sortColumn, onClick }: LeaderboardRowProps) {
  const getInitials = (name: string): string => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get stat value based on per mode
  const getStat = (perGame: number, total: number): string => {
    const value = perMode === 'per_game' ? perGame : total;
    return perMode === 'per_game' ? value.toFixed(1) : String(total);
  };

  // Highlight class for sorted column
  const getStatClass = (column: SortColumn) => cn(
    "text-center tabular-nums",
    sortColumn === column ? "text-[#FF3B30] font-bold" : "text-white/80"
  );

  // Rank styling with medals for top 3
  const getRankClass = () => {
    if (rank === 1) return "text-yellow-400 font-bold";
    if (rank === 2) return "text-gray-300 font-bold";
    if (rank === 3) return "text-amber-600 font-bold";
    return "text-white/40 font-medium";
  };

  return (
    <div
      onClick={onClick}
      className="grid grid-cols-[40px_1fr_80px_40px_50px_50px_50px_50px_50px_50px] items-center gap-2 px-3 py-2.5 
                 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-b-0
                 sm:grid-cols-[50px_1fr_100px_50px_60px_60px_60px_60px_60px_60px] sm:px-4 sm:py-3"
    >
      {/* Rank */}
      <div className={cn("text-sm sm:text-base", getRankClass())}>
        {rank}
      </div>

      {/* Player Info */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <Avatar className="h-7 w-7 sm:h-9 sm:w-9 shrink-0 border border-white/10">
          {player.profilePhotoUrl ? (
            <AvatarImage src={player.profilePhotoUrl} alt={player.playerName} />
          ) : null}
          <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10 text-[10px] sm:text-xs text-white">
            {getInitials(player.playerName) || <User className="h-3 w-3 sm:h-4 sm:w-4" />}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs sm:text-sm font-medium text-white truncate">{player.playerName}</span>
      </div>

      {/* Team */}
      <div className="text-[10px] sm:text-xs text-white/50 truncate">{player.teamName}</div>

      {/* GP */}
      <div className={cn("text-[10px] sm:text-xs", getStatClass('gp'))}>{player.gamesPlayed}</div>

      {/* PTS */}
      <div className={cn("text-[10px] sm:text-xs", getStatClass('pts'))}>
        {getStat(player.pointsPerGame, player.totalPoints)}
      </div>

      {/* REB */}
      <div className={cn("text-[10px] sm:text-xs", getStatClass('reb'))}>
        {getStat(player.reboundsPerGame, player.totalRebounds)}
      </div>

      {/* AST */}
      <div className={cn("text-[10px] sm:text-xs", getStatClass('ast'))}>
        {getStat(player.assistsPerGame, player.totalAssists)}
      </div>

      {/* STL */}
      <div className={cn("text-[10px] sm:text-xs", getStatClass('stl'))}>
        {getStat(player.stealsPerGame, player.totalSteals)}
      </div>

      {/* BLK */}
      <div className={cn("text-[10px] sm:text-xs", getStatClass('blk'))}>
        {getStat(player.blocksPerGame, player.totalBlocks)}
      </div>

      {/* TOV */}
      <div className={cn("text-[10px] sm:text-xs", getStatClass('tov'))}>
        {getStat(player.turnoversPerGame, player.totalTurnovers)}
      </div>
    </div>
  );
}

