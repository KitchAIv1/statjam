/**
 * StatJam Pricing Configuration
 * 
 * Central source of truth for all subscription tiers, limits, and pricing.
 * Based on the Feature Requirements Document (FRD).
 */

import type { 
  PricingTier, 
  UserRole, 
  TierLimits,
  VideoTrackingPricing,
  SubscriptionTier 
} from '@/lib/types/subscription';

// =============================================================================
// TIER LIMITS BY ROLE
// =============================================================================

const FREE_ORGANIZER_LIMITS: TierLimits = {
  seasons: 1,
  teams: 6,
  games: 'unlimited',
  hasAnalytics: false,
  hasAdvancedAnalytics: false,
  hasStatAdminAccess: true,
  hasVideoAccess: false,
  hasVideoAnalyticsAccess: false,
  hasExportStats: false,
  hasHistoricalTrends: false,
  hasPrioritySupport: false,
  isVerified: false,
};

const PRO_ORGANIZER_LIMITS: TierLimits = {
  seasons: 'unlimited',
  teams: 'unlimited',
  games: 'unlimited',
  hasAnalytics: true,
  hasAdvancedAnalytics: true,
  hasStatAdminAccess: true,
  hasVideoAccess: true,
  hasVideoAnalyticsAccess: true,
  hasExportStats: true,
  hasHistoricalTrends: true,
  hasPrioritySupport: false,
  isVerified: true,
};

const FREE_COACH_LIMITS: TierLimits = {
  seasons: 1,
  teams: 1,
  games: 6,
  hasAnalytics: true,
  hasAdvancedAnalytics: false,
  hasStatAdminAccess: true,
  hasVideoAccess: false,
  hasVideoAnalyticsAccess: false,
  hasExportStats: false,
  hasHistoricalTrends: false,
  hasPrioritySupport: false,
  isVerified: false,
};

const PAID_COACH_LIMITS: TierLimits = {
  seasons: 'unlimited',
  teams: 'unlimited',
  games: 'unlimited',
  hasAnalytics: true,
  hasAdvancedAnalytics: true,
  hasStatAdminAccess: true,
  hasVideoAccess: true,
  hasVideoAnalyticsAccess: true,
  hasExportStats: true,
  hasHistoricalTrends: true,
  hasPrioritySupport: false,
  isVerified: true,
};

const FREE_PLAYER_LIMITS: TierLimits = {
  seasons: 'unlimited',
  teams: 'unlimited',
  games: 'unlimited',
  hasAnalytics: false,
  hasAdvancedAnalytics: false,
  hasStatAdminAccess: false,
  hasVideoAccess: false,
  hasVideoAnalyticsAccess: false,
  hasExportStats: false,
  hasHistoricalTrends: false,
  hasPrioritySupport: false,
  isVerified: false,
};

const PAID_PLAYER_LIMITS: TierLimits = {
  seasons: 'unlimited',
  teams: 'unlimited',
  games: 'unlimited',
  hasAnalytics: true,
  hasAdvancedAnalytics: true,
  hasStatAdminAccess: false,
  hasVideoAccess: false,
  hasVideoAnalyticsAccess: true,
  hasExportStats: true,
  hasHistoricalTrends: true,
  hasPrioritySupport: false,
  isVerified: true,
};

// =============================================================================
// PRICING TIERS BY ROLE
// =============================================================================

export const ORGANIZER_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    billingPeriod: 'monthly',
    durationMonths: 0,
    limits: FREE_ORGANIZER_LIMITS,
    features: [
      '1 season',
      'Up to 6 teams',
      'Manual stat tracking (STATADMIN)',
      'Basic box scores',
      'Public season/team pages',
    ],
    bestFor: 'Testing StatJam or small grassroots leagues',
  },
  {
    id: 'pro',
    name: 'Organizer Pro',
    price: 40,
    billingPeriod: 'monthly',
    durationMonths: 1,
    limits: PRO_ORGANIZER_LIMITS,
    features: [
      'Unlimited seasons',
      'Unlimited teams',
      'Live stat tracking',
      'Real-time play-by-play',
      'Team & player analytics',
      'StatJam Verified badge',
      'Video Tracking access (add-on)',
    ],
    bestFor: 'Serious leagues and circuits',
    isPopular: true,
  },
  {
    id: 'seasonal_pass',
    name: 'Seasonal Pass',
    price: 150,
    billingPeriod: 'seasonal',
    durationMonths: 4,
    limits: { ...PRO_ORGANIZER_LIMITS },
    features: [
      'Everything in Pro',
      'One full season coverage',
      '3 video-tracked games included',
      'Discounted video rates',
    ],
    bestFor: 'Leagues running a defined season',
  },
];

export const COACH_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    billingPeriod: 'monthly',
    durationMonths: 0,
    limits: FREE_COACH_LIMITS,
    features: [
      '1 team',
      'Up to 6 tracked games',
      'Manual tracking',
      'Basic analytics',
      'STATADMIN access',
    ],
    bestFor: 'Getting started or casual tracking',
  },
  {
    id: 'pro',
    name: 'Monthly',
    price: 12,
    billingPeriod: 'monthly',
    durationMonths: 1,
    limits: PAID_COACH_LIMITS,
    features: [
      'Unlimited teams',
      'Unlimited games',
      'Advanced analytics',
      'Video tracking access',
      'Team & player dashboards',
      'StatJam Verified badge',
    ],
    bestFor: 'Year-round programs or testing',
  },
  {
    id: 'seasonal_pass',
    name: 'Season',
    price: 40,
    billingPeriod: 'seasonal',
    durationMonths: 4,
    limits: PAID_COACH_LIMITS,
    features: [
      'Everything in Monthly',
      '4-month access',
      'Best for standard seasons',
    ],
    bestFor: 'Standard 4-month seasons',
    isPopular: true,
  },
  {
    id: 'annual',
    name: 'Annual',
    price: 99,
    billingPeriod: 'annual',
    durationMonths: 12,
    limits: { ...PAID_COACH_LIMITS, hasPrioritySupport: true },
    features: [
      'Everything in Monthly',
      '12-month access',
      'Priority support',
      'Save $45 vs monthly',
    ],
    bestFor: 'Year-round coaches',
  },
];

export const PLAYER_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    billingPeriod: 'monthly',
    durationMonths: 0,
    limits: FREE_PLAYER_LIMITS,
    features: [
      'Player profile page',
      'Game history (unverified)',
      'Team & season visibility',
    ],
    bestFor: 'Basic digital profile',
  },
  {
    id: 'seasonal_pass',
    name: 'Season',
    price: 25,
    billingPeriod: 'seasonal',
    durationMonths: 4,
    limits: PAID_PLAYER_LIMITS,
    features: [
      'Full analytics',
      'Verified stat visibility',
      'Performance insights',
      'Stat cards',
    ],
    bestFor: 'Making your season count',
    isPopular: true,
  },
  {
    id: 'annual',
    name: 'Annual',
    price: 49,
    billingPeriod: 'annual',
    durationMonths: 12,
    limits: PAID_PLAYER_LIMITS,
    features: [
      'Everything in Season',
      'Year-round access',
    ],
    bestFor: 'Year-round players',
  },
  {
    id: 'family',
    name: 'Family Plan',
    price: 99,
    billingPeriod: 'annual',
    durationMonths: 12,
    limits: PAID_PLAYER_LIMITS,
    features: [
      'Multiple linked profiles',
      'Full access for all players',
      'Ideal for siblings',
    ],
    bestFor: 'Families with multiple players',
  },
];

// =============================================================================
// VIDEO TRACKING PRICING
// =============================================================================

export const VIDEO_TRACKING_PRICING: VideoTrackingPricing[] = [
  {
    type: 'organizer_full',
    priceMin: 40,
    priceMax: 45,
    description: 'Full Game Video Tracking',
    scope: [
      'Full play-by-play',
      'Both teams tracked',
      'All players tracked',
      'Shot charts & advanced stats',
      'StatJam Video Verified badge',
    ],
  },
  {
    type: 'coach_tracking',
    priceMin: 25,
    priceMax: 25,
    description: 'Coach Team Tracking',
    scope: [
      "Full stats for coach's team",
      'Opponent tracked as single team',
      'Team & player analytics',
      'Verified in Coach Dashboard',
    ],
  },
  {
    type: 'player_only',
    priceMin: 15,
    priceMax: 15,
    description: 'Player-Only Tracking',
    scope: [
      'Individual player stats',
      'Verified performance from video',
      'Appears on player profile',
    ],
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getTiersByRole(role: UserRole): PricingTier[] {
  switch (role) {
    case 'organizer':
      return ORGANIZER_TIERS;
    case 'coach':
      return COACH_TIERS;
    case 'player':
      return PLAYER_TIERS;
    default:
      return [];
  }
}

export function getTierLimits(role: UserRole, tier: SubscriptionTier): TierLimits {
  const tiers = getTiersByRole(role);
  const matchedTier = tiers.find(t => t.id === tier);
  return matchedTier?.limits ?? tiers[0]?.limits ?? FREE_PLAYER_LIMITS;
}

export function getTierByRoleAndId(role: UserRole, tierId: SubscriptionTier): PricingTier | null {
  const tiers = getTiersByRole(role);
  return tiers.find(t => t.id === tierId) ?? null;
}

