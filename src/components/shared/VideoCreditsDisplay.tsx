'use client';

/**
 * VideoCreditsDisplay - Rich video credits indicator for headers
 * 
 * A more prominent, visually rich display of video credits
 * for use in page headers and key locations.
 * Uses StatJam brand colors (orange/amber).
 * 
 * Also displays daily upload limit status.
 * 
 * @module VideoCreditsDisplay
 */

import React from 'react';
import { Video, CreditCard, Sparkles, AlertTriangle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DailyUploadStatus {
  uploadsToday: number;
  limit: number;
  remaining: number;
  isExempt: boolean;
}

interface VideoCreditsDisplayProps {
  credits: number;
  onBuyCredits?: () => void;
  showBuyButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Daily upload limit status (optional) */
  dailyUploads?: DailyUploadStatus;
}

export function VideoCreditsDisplay({
  credits,
  onBuyCredits,
  showBuyButton = true,
  size = 'md',
  className = '',
  dailyUploads,
}: VideoCreditsDisplayProps) {
  const isLow = credits > 0 && credits <= 2;
  const isEmpty = credits === 0;
  const dailyLimitReached = dailyUploads && !dailyUploads.isExempt && dailyUploads.remaining === 0;
  
  // Size variants
  const sizeClasses = {
    sm: {
      container: 'px-3 py-1.5 gap-2',
      icon: 'w-4 h-4',
      text: 'text-sm',
      button: 'text-xs px-2 py-0.5',
    },
    md: {
      container: 'px-4 py-2 gap-3',
      icon: 'w-5 h-5',
      text: 'text-base',
      button: 'text-sm px-3 py-1',
    },
    lg: {
      container: 'px-5 py-3 gap-4',
      icon: 'w-6 h-6',
      text: 'text-lg',
      button: 'text-sm px-4 py-1.5',
    },
  };
  
  const s = sizeClasses[size];
  
  // Color variants - StatJam brand colors (orange/amber)
  const colorClasses = isEmpty
    ? 'bg-gradient-to-r from-gray-100 to-gray-50 border-gray-300 text-gray-600'
    : isLow
    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-700'
    : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300 text-orange-700';
  
  const iconColorClass = isEmpty
    ? 'text-gray-500'
    : isLow
    ? 'text-amber-500'
    : 'text-orange-500';
  
  return (
    <div
      className={`
        inline-flex items-center rounded-xl border-2 shadow-sm
        ${colorClasses} ${s.container} ${className}
      `}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${iconColorClass}`}>
        {isEmpty ? (
          <AlertTriangle className={s.icon} />
        ) : isLow ? (
          <Video className={s.icon} />
        ) : (
          <Sparkles className={s.icon} />
        )}
      </div>
      
      {/* Credits Info */}
      <div className="flex flex-col">
        <span className={`font-bold ${s.text} leading-tight`}>
          {isEmpty ? 'No Credits' : `${credits} Credit${credits !== 1 ? 's' : ''}`}
        </span>
        <span className="text-xs opacity-75">
          {isEmpty
            ? 'Buy to upload videos'
            : isLow
            ? 'Running low'
            : 'Video tracking ready'}
        </span>
      </div>
      
      {/* Daily Limit Indicator */}
      {dailyUploads && !dailyUploads.isExempt && (
        <div className={`flex items-center gap-1 border-l border-current/20 pl-3 ml-1 ${
          dailyLimitReached ? 'text-red-600' : 'text-blue-600'
        }`}>
          <Calendar className={s.icon} />
          <span className={`text-xs font-medium`}>
            {dailyUploads.remaining > 0 
              ? `${dailyUploads.remaining}/${dailyUploads.limit} today`
              : 'Limit reached'
            }
          </span>
        </div>
      )}
      
      {/* Buy Button */}
      {showBuyButton && onBuyCredits && (
        <Button
          onClick={onBuyCredits}
          size="sm"
          variant={isEmpty ? 'default' : 'outline'}
          className={`
            ml-2 gap-1 ${s.button}
            ${isEmpty 
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0' 
              : 'border-orange-400 text-orange-600 hover:bg-orange-100'
            }
          `}
        >
          <CreditCard className="w-3.5 h-3.5" />
          {isEmpty ? 'Buy Credits' : '+ Add'}
        </Button>
      )}
    </div>
  );
}

