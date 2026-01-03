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
import { CreditCard } from 'lucide-react';

interface VideoCreditsInlineProps {
  credits: number;
  onBuyCredits: () => void;
  showIcon?: boolean;
  className?: string;
}

export function VideoCreditsInline({
  credits,
  onBuyCredits,
  showIcon = false,
  className = '',
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

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      {showIcon && <CreditCard className="w-3.5 h-3.5 text-gray-500" />}
      {getCreditsDisplay()}
      <button
        onClick={onBuyCredits}
        className="text-primary hover:underline font-semibold transition-colors"
      >
        {credits > 0 ? '+ Buy' : 'Buy credits →'}
      </button>
    </div>
  );
}

