// ============================================================================
// VERIFIED BADGE - Reusable subscription status indicator (<50 lines)
// Purpose: Shows verified/subscribed status for premium users
// Follows .cursorrules: Single responsibility, reusable, <100 lines
// ============================================================================

'use client';

import React from 'react';
import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'pill';
  showLabel?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function VerifiedBadge({ 
  size = 'sm', 
  variant = 'icon',
  showLabel = false,
  className 
}: VerifiedBadgeProps) {
  const iconClass = cn(SIZE_MAP[size], 'text-blue-500');

  if (variant === 'pill') {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide',
        'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm',
        className
      )}>
        <BadgeCheck className="w-3 h-3" />
        Verified
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <BadgeCheck className={iconClass} />
      {showLabel && <span className="text-xs font-medium text-blue-600">Verified</span>}
    </span>
  );
}

