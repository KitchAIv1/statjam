// ============================================================================
// SEASON SKELETON - Loading State Component (<60 lines)
// Purpose: Skeleton loader for season page - smooth UX during data fetch
// Follows .cursorrules: Single responsibility, reusable, <100 lines
// ============================================================================

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SeasonSkeletonProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export function SeasonSkeleton({ variant = 'full', className }: SeasonSkeletonProps) {
  return (
    <div className={cn('space-y-6 animate-pulse', className)}>
      {/* Header skeleton */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-gray-200 rounded w-48" />
            <div className="h-4 bg-gray-100 rounded w-32" />
          </div>
          <div className="flex gap-3">
            <div className="w-14 h-14 rounded-lg bg-gray-100" />
            <div className="w-14 h-14 rounded-lg bg-gray-100" />
          </div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="h-8 bg-gray-200 rounded w-12 mx-auto" />
              <div className="h-3 bg-gray-100 rounded w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex gap-2 p-2 border-b border-gray-100">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-9 bg-gray-100 rounded-lg w-24" />
          ))}
        </div>
        <div className="p-4 space-y-3">
          {[...Array(variant === 'compact' ? 3 : 5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="flex-1 h-4 bg-gray-200 rounded" />
              <div className="w-16 h-6 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

