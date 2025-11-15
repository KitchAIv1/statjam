/**
 * PlayerStatsRowLight - Light Theme Player Statistics Row
 * 
 * PURPOSE: Light-theme variant of PlayerStatsRow for StatEditModal
 * - Matches StatEditModal's purple/indigo color scheme
 * - White background with purple accents
 * 
 * Follows .cursorrules: <200 lines component
 */

'use client';

import React, { useState, useEffect } from 'react';

export interface PlayerStatsRowLightProps {
  player: {
    id: string;
    name: string;
    position?: string;
  };
  stats: {
    minutes: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    plusMinus: number;
  };
}

export function PlayerStatsRowLight({ player, stats }: PlayerStatsRowLightProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { name, position } = player;
  const { minutes, points, rebounds, assists, steals, blocks, plusMinus } = stats;

  const formatPlusMinus = (value: number): { text: string; color: string } => {
    if (value > 0) {
      return { text: `+${value}`, color: '#10b981' }; // green-500
    } else if (value < 0) {
      return { text: `${value}`, color: '#ef4444' }; // red-500
    } else {
      return { text: '0', color: '#6b7280' }; // gray-500
    }
  };

  const plusMinusFormatted = formatPlusMinus(plusMinus);

  return (
    <div className={`flex items-center justify-between px-4 py-2.5 border-b border-gray-100 hover:bg-purple-50 transition-colors ${
      isMobile ? 'py-2' : ''
    }`}>
      {/* Left: Player Info */}
      <div className={`flex items-center flex-1 ${isMobile ? 'min-w-[80px]' : 'min-w-[100px]'}`}>
        <div className="text-sm font-semibold text-gray-900 leading-tight">
          {name}
          {position && <span className="text-xs text-gray-500 font-normal ml-1">({position})</span>}
        </div>
      </div>

      {/* Right: Stats Grid */}
      <div className={`grid gap-2 ${isMobile ? 'grid-cols-7 min-w-[240px] gap-1' : 'grid-cols-7 min-w-[280px]'}`}>
        <div className="flex flex-col items-center min-w-[28px]">
          <div className={`text-sm font-semibold text-gray-900 mb-0.5 ${isMobile ? 'text-xs' : ''}`}>
            {minutes}
          </div>
          <div className={`text-[9px] text-gray-500 uppercase tracking-wide ${isMobile ? 'text-[8px]' : ''}`}>
            MIN
          </div>
        </div>
        <div className="flex flex-col items-center min-w-[28px]">
          <div className={`text-sm font-semibold text-gray-900 mb-0.5 ${isMobile ? 'text-xs' : ''}`}>
            {points}
          </div>
          <div className={`text-[9px] text-gray-500 uppercase tracking-wide ${isMobile ? 'text-[8px]' : ''}`}>
            PTS
          </div>
        </div>
        <div className="flex flex-col items-center min-w-[28px]">
          <div className={`text-sm font-semibold text-gray-900 mb-0.5 ${isMobile ? 'text-xs' : ''}`}>
            {rebounds}
          </div>
          <div className={`text-[9px] text-gray-500 uppercase tracking-wide ${isMobile ? 'text-[8px]' : ''}`}>
            REB
          </div>
        </div>
        <div className="flex flex-col items-center min-w-[28px]">
          <div className={`text-sm font-semibold text-gray-900 mb-0.5 ${isMobile ? 'text-xs' : ''}`}>
            {assists}
          </div>
          <div className={`text-[9px] text-gray-500 uppercase tracking-wide ${isMobile ? 'text-[8px]' : ''}`}>
            AST
          </div>
        </div>
        <div className="flex flex-col items-center min-w-[28px]">
          <div className={`text-sm font-semibold text-gray-900 mb-0.5 ${isMobile ? 'text-xs' : ''}`}>
            {steals}
          </div>
          <div className={`text-[9px] text-gray-500 uppercase tracking-wide ${isMobile ? 'text-[8px]' : ''}`}>
            STL
          </div>
        </div>
        <div className="flex flex-col items-center min-w-[28px]">
          <div className={`text-sm font-semibold text-gray-900 mb-0.5 ${isMobile ? 'text-xs' : ''}`}>
            {blocks}
          </div>
          <div className={`text-[9px] text-gray-500 uppercase tracking-wide ${isMobile ? 'text-[8px]' : ''}`}>
            BLK
          </div>
        </div>
        <div className="flex flex-col items-center min-w-[28px]">
          <div 
            className={`text-sm font-semibold mb-0.5 ${isMobile ? 'text-xs' : ''}`}
            style={{ color: plusMinusFormatted.color }}
          >
            {plusMinusFormatted.text}
          </div>
          <div className={`text-[9px] text-gray-500 uppercase tracking-wide ${isMobile ? 'text-[8px]' : ''}`}>
            +/-
          </div>
        </div>
      </div>
    </div>
  );
}

