/**
 * PlayerStatsRow Component - Reusable Player Statistics Display
 * 
 * PURPOSE: Display individual player statistics in a consistent row format
 * for both on-court and bench players in the Team Stats Tab.
 * 
 * LAYOUT: Photo + name on left, stats grid on right
 * STATS: MIN, FG, 3P, FT, PTS, REB, AST, STL, BLK, PF, +/-
 * 
 * Follows .cursorrules: <200 lines, single responsibility, Tailwind styling
 */

import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { ShotChartButton } from '@/components/shot-chart';

export interface PlayerStatsRowProps {
  player: {
    id: string;
    name: string;
    position?: string;
    isCustomPlayer?: boolean;
    profilePhotoUrl?: string;
  };
  stats: {
    minutes: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    fouls: number;
    plusMinus: number;
    fieldGoalsMade?: number;
    fieldGoalsAttempted?: number;
    threePointersMade?: number;
    threePointersAttempted?: number;
    freeThrowsMade?: number;
    freeThrowsAttempted?: number;
  };
  onPlayerClick?: (playerId: string, isCustomPlayer: boolean) => void;
  isDark?: boolean;
  /** Game ID for shot chart - enables shot chart button */
  gameId?: string;
}

export function PlayerStatsRow({ player, stats, onPlayerClick, isDark = true, gameId }: PlayerStatsRowProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { id, name, isCustomPlayer = false, profilePhotoUrl } = player;
  const { 
    minutes, points, rebounds, assists, steals, blocks, fouls, plusMinus,
    fieldGoalsMade = 0, fieldGoalsAttempted = 0,
    threePointersMade = 0, threePointersAttempted = 0,
    freeThrowsMade = 0, freeThrowsAttempted = 0
  } = stats;

  const handleClick = () => onPlayerClick?.(id, isCustomPlayer);

  // Get initials for fallback avatar
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Format shooting stats
  const fgDisplay = `${fieldGoalsMade}/${fieldGoalsAttempted}`;
  const threePtDisplay = `${threePointersMade}/${threePointersAttempted}`;
  const ftDisplay = `${freeThrowsMade}/${freeThrowsAttempted}`;

  // Plus/minus color coding
  const pmColor = plusMinus > 0 ? 'text-green-500' : plusMinus < 0 ? 'text-red-500' : (isDark ? 'text-slate-500' : 'text-gray-400');
  const pmText = plusMinus > 0 ? `+${plusMinus}` : `${plusMinus}`;

  // Theme classes
  const rowTheme = isDark 
    ? 'bg-slate-900 border-slate-700/50 hover:bg-slate-800' 
    : 'bg-white border-orange-100 hover:bg-orange-50/50';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-gray-500';

  return (
    <div 
      className={`flex items-stretch border-b transition-colors duration-150 ${onPlayerClick ? 'cursor-pointer' : ''} ${rowTheme} ${isMobile ? 'py-1 px-2 min-h-[48px]' : 'py-1.5 px-3 min-h-[56px]'}`}
      onClick={handleClick}
    >
      {/* Player Photo + Name */}
      <div className={`flex items-center gap-2.5 shrink-0 ${isMobile ? 'w-[120px] mr-3' : 'w-[200px] mr-6'}`}>
        {/* Avatar - Square with rounded corners */}
        <div className={`shrink-0 rounded-md overflow-hidden border ${isDark ? 'border-slate-600 bg-slate-700' : 'border-orange-200 bg-orange-100'} ${isMobile ? 'w-10 h-10' : 'w-11 h-11'}`}>
          {profilePhotoUrl ? (
            <img src={profilePhotoUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${isDark ? 'text-slate-400' : 'text-orange-400'}`}>
              {initials ? (
                <span className={`font-bold ${isMobile ? 'text-xs' : 'text-sm'}`}>{initials}</span>
              ) : (
                <User className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
              )}
            </div>
          )}
        </div>
        {/* Name */}
        <div className={`${textPrimary} font-semibold leading-tight truncate flex-1 ${isMobile ? 'text-[11px]' : 'text-sm'}`}>
          {name}
        </div>
        {/* Shot Chart Button - only shown if gameId provided */}
        {gameId && (
          <div onClick={(e) => e.stopPropagation()}>
            <ShotChartButton
              gameId={gameId}
              playerId={id}
              playerName={name}
              variant="icon"
              className={isDark ? 'hover:bg-slate-700' : ''}
              hideIfNoData={false}
            />
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className={`flex items-center ${isMobile ? 'flex-1 overflow-x-auto scrollbar-hide' : 'flex-1'}`}>
        <div className={`grid grid-cols-11 items-center ${isMobile ? 'gap-0.5 min-w-[280px]' : 'gap-1.5 min-w-[440px]'}`}>
          <StatCell label="MIN" value={minutes} isMobile={isMobile} textPrimary={textPrimary} textSecondary={textSecondary} />
          <StatCell label="FG" value={fgDisplay} isMobile={isMobile} textPrimary={textPrimary} textSecondary={textSecondary} wide />
          <StatCell label="3P" value={threePtDisplay} isMobile={isMobile} textPrimary={textPrimary} textSecondary={textSecondary} wide />
          <StatCell label="FT" value={ftDisplay} isMobile={isMobile} textPrimary={textPrimary} textSecondary={textSecondary} wide />
          <StatCell label="PTS" value={points} isMobile={isMobile} textPrimary="text-orange-400" textSecondary={textSecondary} />
          <StatCell label="REB" value={rebounds} isMobile={isMobile} textPrimary={textPrimary} textSecondary={textSecondary} />
          <StatCell label="AST" value={assists} isMobile={isMobile} textPrimary={textPrimary} textSecondary={textSecondary} />
          <StatCell label="STL" value={steals} isMobile={isMobile} textPrimary={textPrimary} textSecondary={textSecondary} />
          <StatCell label="BLK" value={blocks} isMobile={isMobile} textPrimary={textPrimary} textSecondary={textSecondary} />
          <StatCell label="PF" value={fouls} isMobile={isMobile} textPrimary={textPrimary} textSecondary={textSecondary} />
          <StatCell label="+/-" value={pmText} isMobile={isMobile} textPrimary={pmColor} textSecondary={textSecondary} />
        </div>
      </div>
    </div>
  );
}

/** Reusable stat cell component */
function StatCell({ 
  label, 
  value, 
  isMobile, 
  textPrimary, 
  textSecondary,
  wide = false 
}: { 
  label: string; 
  value: string | number; 
  isMobile: boolean; 
  textPrimary: string; 
  textSecondary: string;
  wide?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center text-center ${wide ? (isMobile ? 'min-w-[28px]' : 'min-w-[36px]') : (isMobile ? 'min-w-[22px]' : 'min-w-[28px]')}`}>
      <div className={`${textPrimary} font-semibold ${isMobile ? 'text-[10px] leading-tight mb-0.5' : 'text-[13px] leading-tight mb-0.5'}`}>
        {value}
      </div>
      <div className={`${textSecondary} uppercase tracking-wide ${isMobile ? 'text-[7px]' : 'text-[9px]'}`}>
        {label}
      </div>
    </div>
  );
}
