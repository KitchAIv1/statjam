/**
 * PhaseBadge Component
 * 
 * Premium badge for game phases with championship treatment for FINALS
 * Uses metallic gold shimmer and distinct animations per phase
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */

'use client';

import React from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GamePhase = 'regular' | 'playoffs' | 'finals';

interface PhaseBadgeProps {
  phase?: GamePhase | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  className?: string;
}

/**
 * PhaseBadge - Premium game phase display
 * 
 * FINALS: Metallic gold with championship glow, wide letter-spacing
 * PLAYOFFS: Orange-to-red gradient with intensity animation
 * REGULAR: Hidden (default state)
 */
export function PhaseBadge({ 
  phase, 
  size = 'md', 
  showIcon = true,
  className 
}: PhaseBadgeProps) {
  if (!phase || phase === 'regular') return null;

  const isFinals = phase === 'finals';

  // Size configuration
  const sizes = {
    sm: { container: 'px-2 py-0.5 gap-1', icon: 'w-3 h-3', text: 'text-[10px]', tracking: 'tracking-wide' },
    md: { container: 'px-3 py-1 gap-1.5', icon: 'w-3.5 h-3.5', text: 'text-xs', tracking: 'tracking-wider' },
    lg: { container: 'px-4 py-1.5 gap-2', icon: 'w-4 h-4', text: 'text-sm', tracking: 'tracking-wider' },
    xl: { container: 'px-5 py-2 gap-2', icon: 'w-5 h-5', text: 'text-base', tracking: 'tracking-widest' }
  };
  const s = sizes[size];

  // FINALS: Championship treatment
  if (isFinals) {
    return (
      <div className={cn(
        'inline-flex items-center justify-center',
        'bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600',
        'text-amber-950 font-black uppercase',
        'rounded-md border-2 border-amber-500',
        'animate-championship-glow',
        s.container, s.tracking,
        className
      )}>
        {showIcon && <Trophy className={cn(s.icon, 'text-amber-900 drop-shadow-sm')} />}
        <span className={cn(s.text, 'font-black drop-shadow-sm')}>FINALS</span>
      </div>
    );
  }

  // PLAYOFFS: Intensity treatment
  return (
    <div className={cn(
      'inline-flex items-center justify-center',
      'bg-gradient-to-r from-orange-500 via-orange-600 to-red-500',
      'text-white font-bold uppercase',
      'rounded-md border border-orange-400',
      'animate-playoffs-intensity',
      s.container, s.tracking,
      className
    )}>
      {showIcon && <Trophy className={cn(s.icon, 'text-white/90')} />}
      <span className={cn(s.text, 'font-bold')}>PLAYOFFS</span>
    </div>
  );
}
