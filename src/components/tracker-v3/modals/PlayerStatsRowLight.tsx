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

  // ✅ Compact font sizes for mobile/embedded views
  const statFontSize = isMobile ? 'text-[10px]' : 'text-xs';
  const labelFontSize = isMobile ? 'text-[7px]' : 'text-[8px]';
  const colWidth = isMobile ? 'min-w-[24px]' : 'min-w-[28px]';
  const shootingColWidth = isMobile ? 'min-w-[30px]' : 'min-w-[36px]';

  return (
    <div className={`flex items-center border-b border-gray-100 hover:bg-purple-50 transition-colors ${
      isMobile ? 'py-1.5' : 'py-2.5'
    }`}>
      {/* Left: Player Info - STICKY */}
      <div className={`flex items-center bg-white z-10 pl-2 pr-1 ${
        isMobile ? 'min-w-[70px] max-w-[70px]' : 'min-w-[100px]'
      }`}>
        <div className={`font-semibold text-gray-900 leading-tight truncate ${
          isMobile ? 'text-[10px]' : 'text-sm'
        }`}>
          {name}
        </div>
      </div>

      {/* Right: Stats Grid - SCROLLABLE */}
      <div className="overflow-x-auto flex-1 scrollbar-hide">
        <div className={`grid gap-1 ${isMobile ? 'grid-cols-11' : 'grid-cols-11'}`} style={{ minWidth: isMobile ? '300px' : '400px' }}>
          {/* MIN */}
          <div className={`flex flex-col items-center ${colWidth}`}>
            <div className={`${statFontSize} font-semibold text-gray-900 mb-0.5`}>
              {minutes}
            </div>
            <div className={`${labelFontSize} text-gray-500 uppercase`}>
              MIN
            </div>
          </div>
          {/* FG */}
          <div className={`flex flex-col items-center ${shootingColWidth}`}>
            <div className={`${statFontSize} font-semibold text-gray-900 mb-0.5`}>
              {fgDisplay}
            </div>
            <div className={`${labelFontSize} text-gray-500 uppercase`}>
              FG
            </div>
          </div>
          {/* 3P */}
          <div className={`flex flex-col items-center ${shootingColWidth}`}>
            <div className={`${statFontSize} font-semibold text-gray-900 mb-0.5`}>
              {threePtDisplay}
            </div>
            <div className={`${labelFontSize} text-gray-500 uppercase`}>
              3P
            </div>
          </div>
          {/* FT */}
          <div className={`flex flex-col items-center ${shootingColWidth}`}>
            <div className={`${statFontSize} font-semibold text-gray-900 mb-0.5`}>
              {ftDisplay}
            </div>
            <div className={`${labelFontSize} text-gray-500 uppercase`}>
              FT
            </div>
          </div>
          {/* PTS */}
          <div className={`flex flex-col items-center ${colWidth}`}>
            <div className={`${statFontSize} font-semibold text-purple-700 mb-0.5`}>
              {points}
            </div>
            <div className={`${labelFontSize} text-gray-500 uppercase`}>
              PTS
            </div>
          </div>
          {/* REB */}
          <div className={`flex flex-col items-center ${colWidth}`}>
            <div className={`${statFontSize} font-semibold text-gray-900 mb-0.5`}>
              {rebounds}
            </div>
            <div className={`${labelFontSize} text-gray-500 uppercase`}>
              REB
            </div>
          </div>
          {/* AST */}
          <div className={`flex flex-col items-center ${colWidth}`}>
            <div className={`${statFontSize} font-semibold text-gray-900 mb-0.5`}>
              {assists}
            </div>
            <div className={`${labelFontSize} text-gray-500 uppercase`}>
              AST
            </div>
          </div>
          {/* STL */}
          <div className={`flex flex-col items-center ${colWidth}`}>
            <div className={`${statFontSize} font-semibold text-gray-900 mb-0.5`}>
              {steals}
            </div>
            <div className={`${labelFontSize} text-gray-500 uppercase`}>
              STL
            </div>
          </div>
          {/* BLK */}
          <div className={`flex flex-col items-center ${colWidth}`}>
            <div className={`${statFontSize} font-semibold text-gray-900 mb-0.5`}>
              {blocks}
            </div>
            <div className={`${labelFontSize} text-gray-500 uppercase`}>
              BLK
            </div>
          </div>
          {/* FOUL */}
          <div className={`flex flex-col items-center ${colWidth}`}>
            <div className={`${statFontSize} font-semibold text-gray-900 mb-0.5`}>
              {fouls}
            </div>
            <div className={`${labelFontSize} text-gray-500 uppercase`}>
              PF
            </div>
          </div>
          {/* +/- */}
          <div className={`flex flex-col items-center ${colWidth}`}>
            <div 
              className={`${statFontSize} font-semibold mb-0.5`}
              style={{ color: plusMinusFormatted.color }}
            >
              {plusMinusFormatted.text}
            </div>
            <div className={`${labelFontSize} text-gray-500 uppercase`}>
              +/-
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

