/**
 * PlayScoreCard Component
 * 
 * Displays score and lead information after a play
 * Single responsibility: Show game score context
 * Follows .cursorrules: <200 lines, single purpose
 * 
 * @module PlayScoreCard
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface PlayScoreCardProps {
  teamAName: string;
  teamBName: string;
  scoreAfter: {
    home: number;
    away: number;
  };
  isScoring?: boolean;
  animate?: boolean;
}

/**
 * PlayScoreCard - Score display after play
 * 
 * Features:
 * - Current score
 * - Lead indicator
 * - Scoring play highlight
 * - Animation support
 */
export const PlayScoreCard: React.FC<PlayScoreCardProps> = ({ 
  teamAName,
  teamBName,
  scoreAfter,
  isScoring = false,
  animate = true
}) => {
  
  const isTied = scoreAfter.home === scoreAfter.away;
  const leadingTeam = scoreAfter.home > scoreAfter.away ? teamAName : teamBName;
  const leadAmount = Math.abs(scoreAfter.home - scoreAfter.away);
  const leadingTeamAbbr = (leadingTeam === teamAName ? teamAName : teamBName).substring(0, 3).toUpperCase();

  const Component = animate ? motion.div : 'div';
  const animationProps = animate ? {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.1 }
  } : {};

  return (
    <Component
      {...animationProps}
      className={`
        flex items-center gap-2 sm:gap-3 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg
        ${isScoring 
          ? 'bg-green-500/10 border border-green-500/30' 
          : 'bg-slate-800/50 border border-slate-700/50'}
        transition-colors
      `}
    >
      {/* Score - Full format on desktop, abbreviated on mobile */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold whitespace-nowrap">
        {/* Mobile: Compact Score (18-3) */}
        <span className="sm:hidden">
          <span className={`${scoreAfter.home > scoreAfter.away ? 'text-foreground' : 'text-muted-foreground'}`}>
            {scoreAfter.home}
          </span>
          <span className="text-muted-foreground mx-0.5">-</span>
          <span className={`${scoreAfter.away > scoreAfter.home ? 'text-foreground' : 'text-muted-foreground'}`}>
            {scoreAfter.away}
          </span>
        </span>

        {/* Desktop: Full Score (TEAM 18 - TEAM 3) */}
        <span className="hidden sm:flex sm:items-center sm:gap-2">
          <span className={`${scoreAfter.home > scoreAfter.away ? 'text-foreground' : 'text-muted-foreground'}`}>
            {teamAName} {scoreAfter.home}
          </span>
          <span className="text-muted-foreground">-</span>
          <span className={`${scoreAfter.away > scoreAfter.home ? 'text-foreground' : 'text-muted-foreground'}`}>
            {teamBName} {scoreAfter.away}
          </span>
        </span>
      </div>

      {/* Lead Indicator - Responsive */}
      {!isTied && (
        <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-bold text-orange-400">
          <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          <span className="whitespace-nowrap">+{leadAmount} {leadingTeamAbbr}</span>
        </div>
      )}
      
      {/* Tied Indicator - Responsive */}
      {isTied && (
        <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground">
          TIED
        </div>
      )}
    </Component>
  );
};

