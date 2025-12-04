/**
 * PhaseBanner Component
 * 
 * Full-width championship banner for GameHeader
 * Premium metallic gold effect with shimmer animation
 * 
 * Follows .cursorrules: <100 lines, single responsibility
 */

'use client';

import React from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GamePhase } from './PhaseBadge';

interface PhaseBannerProps {
  phase?: GamePhase | null;
  isLive?: boolean;
  className?: string;
}

/**
 * PhaseBanner - Premium championship header bar
 * 
 * Used in GameHeader for full-width treatment
 * FINALS: Metallic gold with shimmer, trophy, live indicator
 * PLAYOFFS: Not shown (use PhaseBadge instead)
 */
export function PhaseBanner({ phase, isLive = false, className }: PhaseBannerProps) {
  // Only show for FINALS (playoffs use badge treatment)
  if (!phase || phase !== 'finals') return null;

  return (
    <div className={cn(
      'relative w-full overflow-hidden',
      'bg-gradient-to-r from-amber-600 via-yellow-400 via-amber-500 to-amber-600',
      'py-2 px-4',
      'border-b border-amber-700',
      className
    )}>
      {/* Shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-900" />
        <span className="text-sm sm:text-base font-black text-amber-900 uppercase tracking-[0.2em]">
          Championship Game
        </span>
        {isLive && (
          <div className="flex items-center gap-1 ml-2 px-2 py-0.5 bg-amber-900/20 rounded">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-amber-900 uppercase">Live</span>
          </div>
        )}
      </div>
    </div>
  );
}
