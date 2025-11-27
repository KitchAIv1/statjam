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
    fouls: number;
    plusMinus: number;
    // ✅ NBA-style shooting stats
    fieldGoalsMade?: number;
    fieldGoalsAttempted?: number;
    fieldGoalPercentage?: number;
    threePointersMade?: number;
    threePointersAttempted?: number;
    threePointPercentage?: number;
    freeThrowsMade?: number;
    freeThrowsAttempted?: number;
    freeThrowPercentage?: number;
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
  const { 
    minutes, points, rebounds, assists, steals, blocks, fouls, plusMinus,
    fieldGoalsMade = 0, fieldGoalsAttempted = 0,
    threePointersMade = 0, threePointersAttempted = 0,
    freeThrowsMade = 0, freeThrowsAttempted = 0
  } = stats;

  // Format shooting stats as "made/attempted"
  const fgDisplay = `${fieldGoalsMade}/${fieldGoalsAttempted}`;
  const threePtDisplay = `${threePointersMade}/${threePointersAttempted}`;
  const ftDisplay = `${freeThrowsMade}/${freeThrowsAttempted}`;

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

      {/* Right: Stats Grid - NBA box score order */}
      <div className={`grid gap-1.5 ${isMobile ? 'grid-cols-11 min-w-[360px]' : 'grid-cols-11 min-w-[440px]'}`}>
        {/* MIN */}
        <div className="flex flex-col items-center min-w-[28px]">
          <div className={`text-sm font-semibold text-gray-900 mb-0.5 ${isMobile ? 'text-xs' : ''}`}>
            {minutes}
          </div>
          <div className={`text-[9px] text-gray-500 uppercase tracking-wide ${isMobile ? 'text-[8px]' : ''}`}>
            MIN
          </div>
        </div>
        {/* FG (made/attempted) */}
        <div className="flex flex-col items-center min-w-[36px]">
          <div className={`text-sm font-semibold text-gray-900 mb-0.5 ${isMobile ? 'text-xs' : ''}`}>
            {fgDisplay}
          </div>
          <div className={`text-[9px] text-gray-500 uppercase tracking-wide ${isMobile ? 'text-[8px]' : ''}`}>
            FG
          </div>
        </div>
        {/* 3P (made/attempted) */}
        <div className="flex flex-col items-center min-w-[36px]">
          <div className={`text-sm font-semibold text-gray-900 mb-0.5 ${isMobile ? 'text-xs' : ''}`}>
            {threePtDisplay}
          </div>
          <div className={`text-[9px] text-gray-500 uppercase tracking-wide ${isMobile ? 'text-[8px]' : ''}`}>
            3P
          </div>
        </div>
        {/* FT (made/attempted) */}
        <div className="flex flex-col items-center min-w-[36px]">
          <div className={`text-sm font-semibold text-gray-900 mb-0.5 ${isMobile ? 'text-xs' : ''}`}>
            {ftDisplay}
          </div>
          <div className={`text-[9px] text-gray-500 uppercase tracking-wide ${isMobile ? 'text-[8px]' : ''}`}>
            FT
          </div>
        </div>
        {/* PTS */}
        <div className="flex flex-col items-center min-w-[28px]">
          <div className={`text-sm font-semibold text-purple-700 mb-0.5 ${isMobile ? 'text-xs' : ''}`}>
            {points}
          </div>
          <div className={`text-[9px] text-gray-500 uppercase tracking-wide ${isMobile ? 'text-[8px]' : ''}`}>
            PTS
          </div>
        </div>
        {/* REB */}
        <div className="flex flex-col items-center min-w-[28px]">
          <div className={`text-sm font-semibold text-gray-900 mb-0.5 ${isMobile ? 'text-xs' : ''}`}>
            {rebounds}
          </div>
          <div className={`text-[9px] text-gray-500 uppercase tracking-wide ${isMobile ? 'text-[8px]' : ''}`}>
            REB
          </div>
        </div>
        {/* AST */}
        <div className="flex flex-col items-center min-w-[28px]">
          <div className={`text-sm font-semibold text-gray-900 mb-0.5 ${isMobile ? 'text-xs' : ''}`}>
            {assists}
          </div>
          <div className={`text-[9px] text-gray-500 uppercase tracking-wide ${isMobile ? 'text-[8px]' : ''}`}>
            AST
          </div>
        </div>
        {/* STL */}
        <div className="flex flex-col items-center min-w-[28px]">
          <div className={`text-sm font-semibold text-gray-900 mb-0.5 ${isMobile ? 'text-xs' : ''}`}>
            {steals}
          </div>
          <div className={`text-[9px] text-gray-500 uppercase tracking-wide ${isMobile ? 'text-[8px]' : ''}`}>
            STL
          </div>
        </div>
        {/* BLK */}
        <div className="flex flex-col items-center min-w-[28px]">
          <div className={`text-sm font-semibold text-gray-900 mb-0.5 ${isMobile ? 'text-xs' : ''}`}>
            {blocks}
          </div>
          <div className={`text-[9px] text-gray-500 uppercase tracking-wide ${isMobile ? 'text-[8px]' : ''}`}>
            BLK
          </div>
        </div>
        {/* FOUL */}
        <div className="flex flex-col items-center min-w-[28px]">
          <div className={`text-sm font-semibold text-gray-900 mb-0.5 ${isMobile ? 'text-xs' : ''}`}>
            {fouls}
          </div>
          <div className={`text-[9px] text-gray-500 uppercase tracking-wide ${isMobile ? 'text-[8px]' : ''}`}>
            FOUL
          </div>
        </div>
        {/* +/- */}
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

