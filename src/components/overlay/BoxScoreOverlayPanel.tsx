/**
 * BoxScoreOverlayPanel - Live Broadcast Box Score Overlay
 * 
 * Semi-transparent overlay showing both teams' top scorers
 * REUSES PlayerStats from teamStatsService - no duplicate types
 * 
 * @module BoxScoreOverlayPanel
 */

'use client';

import React from 'react';
import { BoxScoreData, BoxScoreTeamData } from '@/hooks/useBoxScoreOverlay';
import { PlayerStats } from '@/lib/services/teamStatsService';
import { Skeleton } from '@/components/ui/skeleton';

interface BoxScoreOverlayPanelProps {
  isVisible: boolean;
  isLoading: boolean;
  data: BoxScoreData | null;
}

export function BoxScoreOverlayPanel({
  isVisible,
  isLoading,
  data,
}: BoxScoreOverlayPanelProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ease-out animate-in fade-in-0">
      {/* Backdrop - higher transparency (lower opacity) for see-through video */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-black/65 transition-opacity duration-500" />
      
      {/* Content - Compact sizing with staggered animation */}
      <div className="relative w-full max-w-2xl mx-4 animate-in slide-in-from-bottom-4 duration-500 ease-out">
        {data ? (
          <div className="grid grid-cols-2 gap-2">
            {/* Team A - Staggered */}
            <div className="animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-100">
              <TeamColumn team={data.teamA} side="left" />
            </div>
            
            {/* Team B - Staggered */}
            <div className="animate-in fade-in-0 slide-in-from-right-4 duration-500 delay-200">
              <TeamColumn team={data.teamB} side="right" />
            </div>
          </div>
        ) : isLoading ? (
          <BoxScoreSkeleton />
        ) : (
          <div className="text-center text-white/60 py-12 animate-in fade-in-0 duration-300">
            Loading stats...
          </div>
        )}
      </div>
    </div>
  );
}

function BoxScoreSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[1, 2].map((i) => (
        <div key={i} className="relative overflow-hidden rounded-lg">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-2">
            <div className="flex items-center gap-2 p-2 border-b border-white/10">
              <Skeleton className="h-8 w-8 rounded bg-white/20" />
              <Skeleton className="h-4 flex-1 max-w-[100px] bg-white/20" />
              <Skeleton className="h-7 w-10 rounded bg-white/20" />
            </div>
            <div className="divide-y divide-white/5 pt-1">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex items-center gap-2 px-2 py-1.5">
                  <Skeleton className="h-5 w-5 rounded-full bg-white/20" />
                  <Skeleton className="h-3 flex-1 max-w-[80px] bg-white/20" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-7 bg-white/20" />
                    <Skeleton className="h-4 w-7 bg-white/20" />
                    <Skeleton className="h-4 w-7 bg-white/20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface TeamColumnProps {
  team: BoxScoreTeamData;
  side: 'left' | 'right';
}

function TeamColumn({ team, side }: TeamColumnProps) {
  const accentColor = team.primaryColor || (side === 'left' ? '#3B82F6' : '#EF4444');
  
  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Team color accent bar */}
      <div 
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ backgroundColor: accentColor }}
      />
      
      {/* Glass background */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10">
        {/* Header - Compact */}
        <div className="flex items-center gap-2 p-2 border-b border-white/10">
          {/* Team logo */}
          {team.logoUrl ? (
            <img 
              src={team.logoUrl} 
              alt={team.name}
              className="w-8 h-8 rounded object-cover bg-white/10"
            />
          ) : (
            <div 
              className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: accentColor + '40' }}
            >
              {team.name.charAt(0)}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="text-white font-semibold text-sm truncate">
              {team.name}
            </div>
          </div>
          
          {/* Score */}
          <div 
            className="text-xl font-black text-white px-2 py-1 rounded"
            style={{ backgroundColor: accentColor + '30' }}
          >
            {team.score}
          </div>
        </div>
        
        {/* Player rows - Compact */}
        <div className="divide-y divide-white/5">
          {team.players.length > 0 ? (
            team.players.map((player, index) => (
              <PlayerRow 
                key={player.playerId} 
                player={player} 
                rank={index + 1}
                accentColor={accentColor}
              />
            ))
          ) : (
            <div className="text-center text-white/40 py-3 text-xs">
              No player stats
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PlayerRowProps {
  player: PlayerStats;
  rank: number;
  accentColor: string;
}

function PlayerRow({ player, rank, accentColor }: PlayerRowProps) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 transition-colors">
      {/* Rank indicator */}
      <div 
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
        style={{ 
          backgroundColor: rank === 1 ? accentColor : 'transparent',
          color: rank === 1 ? 'white' : 'rgba(255,255,255,0.5)',
          border: rank !== 1 ? '1px solid rgba(255,255,255,0.2)' : 'none'
        }}
      >
        {rank}
      </div>
      
      {/* Player name */}
      <div className="flex-1 min-w-0">
        <div className="text-white text-xs font-medium truncate">
          {player.playerName}
        </div>
      </div>
      
      {/* Stats - Compact */}
      <div className="flex items-center gap-2 text-xs">
        <StatBadge label="PTS" value={player.points} highlight />
        <StatBadge label="REB" value={player.rebounds} />
        <StatBadge label="AST" value={player.assists} />
      </div>
    </div>
  );
}

interface StatBadgeProps {
  label: string;
  value: number;
  highlight?: boolean;
}

function StatBadge({ label, value, highlight }: StatBadgeProps) {
  return (
    <div className="text-center min-w-[28px]">
      <div className={`font-bold ${highlight ? 'text-white text-sm' : 'text-white/80 text-xs'}`}>
        {value}
      </div>
      <div className="text-white/40 text-[9px] uppercase">{label}</div>
    </div>
  );
}
