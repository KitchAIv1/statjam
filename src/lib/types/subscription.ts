/**
 * Subscription Types for StatJam Monetization System
 * 
 * Defines all types for pricing tiers, entitlements, usage limits,
 * and verification badges across Organizer, Coach, and Player roles.
 */

// =============================================================================
// CORE ENUMS & TYPES
// =============================================================================

export type UserRole = 'organizer' | 'coach' | 'player' | 'stat_admin';

export type SubscriptionTier = 
  | 'free' 
  | 'pro'           // Organizer $40/mo, Coach $12/mo
  | 'seasonal_pass' // Organizer $150/season, Coach $40/season, Player $25/season
  | 'annual'        // Coach $99/year, Player $49/year
  | 'family';       // Player $99/year (multiple profiles)

export type BillingPeriod = 'monthly' | 'seasonal' | 'annual';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'trial';

export type ResourceType = 'season' | 'team' | 'game' | 'video_game';

// =============================================================================
// SUBSCRIPTION ENTITY
// =============================================================================

export interface Subscription {
  id: string;
  userId: string;
  role: UserRole;
  tier: SubscriptionTier;
  billingPeriod: BillingPeriod | null;
  status: SubscriptionStatus;
  expiresAt: string | null;
  videoCredits: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// USAGE TRACKING
// =============================================================================

export interface UsageLimit {
  resourceType: ResourceType;
  currentCount: number;
  maxAllowed: number;
  periodStart: string;
  periodEnd: string;
}

export interface UsageCheckResult {
  allowed: boolean;
  currentCount: number;
  maxAllowed: number;
  remainingCount: number;
}

// =============================================================================
// TIER LIMITS & ENTITLEMENTS
// =============================================================================

export interface TierLimits {
  seasons: number | 'unlimited';
  teams: number | 'unlimited';
  games: number | 'unlimited';
  hasAnalytics: boolean;
  hasAdvancedAnalytics: boolean;
  hasStatAdminAccess: boolean;
  hasVideoAccess: boolean;
  hasVideoAnalyticsAccess: boolean;
  hasExportStats: boolean;
  hasHistoricalTrends: boolean;
  hasPrioritySupport: boolean;
  isVerified: boolean;
}

// =============================================================================
// PRICING TIER DISPLAY
// =============================================================================

export interface PricingTier {
  id: SubscriptionTier;
  name: string;
  price: number;
  billingPeriod: BillingPeriod;
  durationMonths: number;
  limits: TierLimits;
  features: string[];
  bestFor: string;
  isPopular?: boolean;
  stripePriceId?: string; // Stripe price ID for checkout
}

// =============================================================================
// FEATURE GATING
// =============================================================================

export type GatedFeature = 
  | 'analytics'
  | 'advanced_analytics'
  | 'stat_admin'
  | 'video_tracking'
  | 'video_analytics'
  | 'export_stats'
  | 'historical_trends'
  | 'shot_charts'
  | 'verified_badge'
  | 'unlimited_teams'
  | 'unlimited_games'
  | 'unlimited_seasons';

export interface FeatureGateResult {
  allowed: boolean;
  reason: 'allowed' | 'upgrade_required' | 'limit_reached' | 'loading';
  requiredTier: SubscriptionTier | null;
  upgradeMessage: string | null;
}

// =============================================================================
// VIDEO TRACKING
// =============================================================================

export type VideoTrackingType = 
  | 'organizer_full'   // $40-45/game
  | 'coach_tracking'   // $25/game
  | 'player_only';     // $15/game

export interface VideoTrackingPricing {
  type: VideoTrackingType;
  priceMin: number;
  priceMax: number;
  description: string;
  scope: string[];
}

// =============================================================================
// VIDEO CREDIT PACKAGES
// =============================================================================

export type VideoCreditPackageId = 'single' | 'starter' | 'season' | 'pro_season';

export interface VideoCreditPackage {
  id: VideoCreditPackageId;
  name: string;
  games: number;
  price: number;
  pricePerGame: number;
  savings: number; // percentage
  description: string;
  isPopular?: boolean;
  stripePriceId?: string;
}

// =============================================================================
// VERIFIED BADGES
// =============================================================================

export type VerifiedBadgeType = 
  | 'verified_organizer'
  | 'verified_coach'
  | 'verified_player'
  | 'video_verified_game';

export interface VerifiedBadgeRequirement {
  badgeType: VerifiedBadgeType;
  requirements: string[];
}



