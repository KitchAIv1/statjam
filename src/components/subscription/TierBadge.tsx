'use client';

/**
 * TierBadge Component
 * 
 * Professional tier badges following SaaS best practices.
 * Used to indicate plan types, current status, and recommendations.
 */

import { Crown, Sparkles, Check, Star, Zap } from 'lucide-react';

type BadgeVariant = 
  | 'free' 
  | 'pro' 
  | 'popular' 
  | 'best-value' 
  | 'current' 
  | 'verified'
  | 'new';

interface TierBadgeProps {
  variant: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BADGE_STYLES: Record<BadgeVariant, {
  bg: string;
  text: string;
  border: string;
  icon: React.ReactNode;
  label: string;
}> = {
  free: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    icon: null,
    label: 'Free',
  },
  pro: {
    bg: 'bg-gradient-to-r from-orange-500 to-orange-600',
    text: 'text-white',
    border: 'border-orange-500',
    icon: <Crown className="w-3 h-3" />,
    label: 'Pro',
  },
  popular: {
    bg: 'bg-gradient-to-r from-orange-500 to-pink-500',
    text: 'text-white',
    border: 'border-orange-500',
    icon: <Star className="w-3 h-3" />,
    label: 'Most Popular',
  },
  'best-value': {
    bg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    text: 'text-white',
    border: 'border-emerald-500',
    icon: <Sparkles className="w-3 h-3" />,
    label: 'Best Value',
  },
  current: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
    icon: <Check className="w-3 h-3" />,
    label: 'Current Plan',
  },
  verified: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
    icon: <Check className="w-3 h-3" />,
    label: 'Verified',
  },
  new: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300',
    icon: <Zap className="w-3 h-3" />,
    label: 'New',
  },
};

const SIZE_STYLES = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-2',
};

export function TierBadge({ variant, size = 'md', className = '' }: TierBadgeProps) {
  const style = BADGE_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];

  return (
    <span
      className={`
        inline-flex items-center font-semibold rounded-full border
        ${style.bg} ${style.text} ${style.border} ${sizeStyle} ${className}
      `}
    >
      {style.icon}
      {style.label}
    </span>
  );
}

/**
 * PlanIndicator - Shows Free vs Pro inline
 */
interface PlanIndicatorProps {
  isPro: boolean;
  size?: 'sm' | 'md';
}

export function PlanIndicator({ isPro, size = 'sm' }: PlanIndicatorProps) {
  return <TierBadge variant={isPro ? 'pro' : 'free'} size={size} />;
}








