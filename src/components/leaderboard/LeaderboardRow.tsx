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

/** LeaderboardRow - Mobile: compact fixed widths, Desktop: full grid. <100 lines */
export function LeaderboardRow({ player, rank, perMode, sortColumn, onClick }: LeaderboardRowProps) {
  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const getStat = (pg: number, tot: number) => perMode === 'per_game' ? pg.toFixed(1) : String(tot);
  const sc = (col: SortColumn) => cn("text-center tabular-nums", sortColumn === col ? "text-[#FF3B30] font-bold" : "text-white/80");
  const rc = rank === 1 ? "text-yellow-400 font-bold" : rank === 2 ? "text-gray-300 font-bold" : rank === 3 ? "text-amber-600 font-bold" : "text-white/40";
  const team3 = player.teamName.slice(0, 3).toUpperCase();
  const p = player;

  return (
    <>
      {/* Mobile (<md) */}
      <div onClick={onClick} className="flex md:hidden hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5">
        <div className="flex items-center gap-1.5 px-2 py-2.5 w-[140px] shrink-0 bg-[#121212]">
          <div className={cn("w-5 text-center text-xs shrink-0", rc)}>{rank}</div>
          <Avatar className="h-6 w-6 shrink-0 border border-white/10">
            {p.profilePhotoUrl && <AvatarImage src={p.profilePhotoUrl} alt={p.playerName} />}
            <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10 text-[8px] text-white">
              {getInitials(p.playerName) || <User className="h-3 w-3" />}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-medium text-white truncate">{p.playerName}</div>
            <div className="text-[9px] text-white/50">{team3}</div>
          </div>
        </div>
        <div className="flex items-center shrink-0">
          <div className={cn("w-8 text-center text-[10px]", sc('gp'))}>{p.gamesPlayed}</div>
          <div className={cn("w-10 text-center text-[10px]", sc('pts'))}>{getStat(p.pointsPerGame, p.totalPoints)}</div>
          <div className={cn("w-10 text-center text-[10px]", sc('reb'))}>{getStat(p.reboundsPerGame, p.totalRebounds)}</div>
          <div className={cn("w-10 text-center text-[10px]", sc('ast'))}>{getStat(p.assistsPerGame, p.totalAssists)}</div>
          <div className={cn("w-10 text-center text-[10px]", sc('stl'))}>{getStat(p.stealsPerGame, p.totalSteals)}</div>
          <div className={cn("w-10 text-center text-[10px]", sc('blk'))}>{getStat(p.blocksPerGame, p.totalBlocks)}</div>
          <div className={cn("w-10 text-center text-[10px]", sc('tov'))}>{getStat(p.turnoversPerGame, p.totalTurnovers)}</div>
        </div>
      </div>
      {/* Desktop (md+) */}
      <div onClick={onClick} className="hidden md:grid grid-cols-[50px_1fr_140px_60px_70px_70px_70px_70px_70px_70px] items-center gap-2 px-5 py-4 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5">
        <div className={cn("text-base", rc)}>{rank}</div>
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10 shrink-0 border border-white/10">
            {p.profilePhotoUrl && <AvatarImage src={p.profilePhotoUrl} alt={p.playerName} />}
            <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10 text-sm text-white">
              {getInitials(p.playerName) || <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-white truncate">{p.playerName}</span>
        </div>
        <div className="text-sm text-white/50 truncate">{p.teamName}</div>
        <div className={cn("text-sm", sc('gp'))}>{p.gamesPlayed}</div>
        <div className={cn("text-sm", sc('pts'))}>{getStat(p.pointsPerGame, p.totalPoints)}</div>
        <div className={cn("text-sm", sc('reb'))}>{getStat(p.reboundsPerGame, p.totalRebounds)}</div>
        <div className={cn("text-sm", sc('ast'))}>{getStat(p.assistsPerGame, p.totalAssists)}</div>
        <div className={cn("text-sm", sc('stl'))}>{getStat(p.stealsPerGame, p.totalSteals)}</div>
        <div className={cn("text-sm", sc('blk'))}>{getStat(p.blocksPerGame, p.totalBlocks)}</div>
        <div className={cn("text-sm", sc('tov'))}>{getStat(p.turnoversPerGame, p.totalTurnovers)}</div>
      </div>
    </>
  );
}
