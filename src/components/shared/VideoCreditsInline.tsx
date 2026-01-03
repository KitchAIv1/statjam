'use client';

/**
 * VideoCreditsInline - Compact inline video credits display
 * 
 * Displays current video credits with color-coded status and buy CTA.
 * Designed to integrate seamlessly into headers/footers without containers.
 * 
 * Follows .cursorrules: <50 lines, UI only, single responsibility, reusable
 */

import React from 'react';
import { CreditCard, Calendar } from 'lucide-react';

interface DailyUploadStatus {
  uploadsToday: number;
  limit: number;
  remaining: number;
  isExempt: boolean;
}

interface VideoCreditsInlineProps {
  credits: number;
  onBuyCredits: () => void;
  showIcon?: boolean;
  className?: string;
  /** Daily upload limit status (optional) */
  dailyUploads?: DailyUploadStatus;
}

export function VideoCreditsInline({
  credits,
  onBuyCredits,
  showIcon = false,
  className = '',
  dailyUploads,
}: VideoCreditsInlineProps) {
  const getCreditsDisplay = () => {
    if (credits > 2) {
      return (
        <span className="text-orange-600 font-medium">
          ✓ {credits} credit{credits !== 1 ? 's' : ''}
        </span>
      );
    }
    if (credits > 0) {
      return (
        <span className="text-amber-600 font-medium">
          ⚠ {credits} credit{credits !== 1 ? 's' : ''} left
        </span>
      );
    }
    return <span className="text-gray-500 font-medium">✗ No credits</span>;
  };

  const getDailyLimitDisplay = () => {
    if (!dailyUploads || dailyUploads.isExempt) return null;
    const { remaining, limit } = dailyUploads;
    if (remaining > 0) {
      return (
        <span className="text-blue-600 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {remaining}/{limit}
        </span>
      );
    }
    return (
      <span className="text-red-500 flex items-center gap-1">
        <Calendar className="w-3 h-3" />
        Limit
      </span>
    );
  };

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      {showIcon && <CreditCard className="w-3.5 h-3.5 text-gray-500" />}
      {getCreditsDisplay()}
      {getDailyLimitDisplay()}
      <button
        onClick={onBuyCredits}
        className="text-primary hover:underline font-semibold transition-colors"
      >
        {credits > 0 ? '+ Buy' : 'Buy credits →'}
      </button>
    </div>
  );
}

