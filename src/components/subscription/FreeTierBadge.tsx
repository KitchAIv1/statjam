'use client';

/**
 * FreeTierBadge Component
 * 
 * Visual indicator showing that a feature is available in free tier.
 * Used to highlight free features vs paid features throughout the app.
 */

import { Check, Sparkles } from 'lucide-react';

interface FreeTierBadgeProps {
  variant?: 'inline' | 'pill' | 'card';
  showIcon?: boolean;
  text?: string;
}

export function FreeTierBadge({ 
  variant = 'pill', 
  showIcon = true,
  text = 'Free'
}: FreeTierBadgeProps) {
  if (variant === 'inline') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600">
        {showIcon && <Check className="w-3 h-3" />}
        {text}
      </span>
    );
  }

  if (variant === 'card') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
        <div className="p-1 bg-green-100 rounded-full">
          <Sparkles className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-green-700">{text}</p>
          <p className="text-xs text-green-600">Included in all plans</p>
        </div>
      </div>
    );
  }

  // Default: pill variant
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
      {showIcon && <Check className="w-3 h-3" />}
      {text}
    </span>
  );
}

/**
 * ProFeatureBadge Component
 * 
 * Visual indicator showing that a feature requires upgrade.
 */

import { Crown, Lock } from 'lucide-react';

interface ProFeatureBadgeProps {
  variant?: 'inline' | 'pill' | 'card';
  showIcon?: boolean;
  text?: string;
  tierRequired?: string;
}

export function ProFeatureBadge({ 
  variant = 'pill', 
  showIcon = true,
  text = 'Pro',
  tierRequired
}: ProFeatureBadgeProps) {
  if (variant === 'inline') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-orange-600">
        {showIcon && <Crown className="w-3 h-3" />}
        {text}
      </span>
    );
  }

  if (variant === 'card') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="p-1 bg-orange-100 rounded-full">
          <Crown className="w-4 h-4 text-orange-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-orange-700">{text}</p>
          <p className="text-xs text-orange-600">
            {tierRequired ? `Requires ${tierRequired}` : 'Upgrade required'}
          </p>
        </div>
      </div>
    );
  }

  // Default: pill variant
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
      {showIcon && <Crown className="w-3 h-3" />}
      {text}
    </span>
  );
}

/**
 * LockedFeatureBadge Component
 * 
 * Visual indicator for locked/unavailable features.
 */

interface LockedFeatureBadgeProps {
  variant?: 'inline' | 'pill';
  text?: string;
}

export function LockedFeatureBadge({ 
  variant = 'pill', 
  text = 'Locked'
}: LockedFeatureBadgeProps) {
  if (variant === 'inline') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
        <Lock className="w-3 h-3" />
        {text}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
      <Lock className="w-3 h-3" />
      {text}
    </span>
  );
}
