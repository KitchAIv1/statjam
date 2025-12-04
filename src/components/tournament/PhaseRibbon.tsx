/**
 * PhaseRibbon Component
 * 
 * Corner ribbon for game cards - preserves card layout while showing phase
 * Used on TeamMatchupCard for non-intrusive phase display
 * 
 * Follows .cursorrules: <100 lines, single responsibility
 */

'use client';

import React from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GamePhase } from './PhaseBadge';

interface PhaseRibbonProps {
  phase?: GamePhase | null;
  position?: 'top-left' | 'top-right';
  className?: string;
}

/**
 * PhaseRibbon - Corner ribbon for championship/playoff games
 * 
 * Positioned absolutely in corner, doesn't disrupt card layout
 * FINALS: Gold ribbon with trophy
 * PLAYOFFS: Orange ribbon
 */
export function PhaseRibbon({ phase, position = 'top-left', className }: PhaseRibbonProps) {
  if (!phase || phase === 'regular') return null;

  const isFinals = phase === 'finals';
  const isLeft = position === 'top-left';

  // Position classes
  const positionClasses = isLeft
    ? 'top-0 left-0 origin-top-left'
    : 'top-0 right-0 origin-top-right';

  // FINALS: Gold championship ribbon
  if (isFinals) {
    return (
      <div className={cn(
        'absolute z-30',
        positionClasses,
        className
      )}>
        <div className={cn(
          'flex items-center gap-1 px-3 py-1',
          'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500',
          'text-amber-950 font-black text-[10px] uppercase tracking-wider',
          'shadow-lg shadow-amber-500/40',
          isLeft ? 'rounded-br-lg' : 'rounded-bl-lg',
          'animate-championship-glow'
        )}>
          <Trophy className="w-3 h-3" />
          <span>FINALS</span>
        </div>
      </div>
    );
  }

  // PLAYOFFS: Orange intensity ribbon
  return (
    <div className={cn(
      'absolute z-30',
      positionClasses,
      className
    )}>
      <div className={cn(
        'flex items-center gap-1 px-3 py-1',
        'bg-gradient-to-r from-orange-500 to-red-500',
        'text-white font-bold text-[10px] uppercase tracking-wide',
        'shadow-md shadow-orange-500/30',
        isLeft ? 'rounded-br-lg' : 'rounded-bl-lg'
      )}>
        <Trophy className="w-3 h-3" />
        <span>PLAYOFFS</span>
      </div>
    </div>
  );
}

