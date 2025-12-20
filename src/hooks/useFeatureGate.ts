'use client';

/**
 * useFeatureGate Hook
 * 
 * Checks if the current user has access to a specific feature
 * based on their subscription tier and entitlements.
 */

import { useMemo } from 'react';
import { useSubscription } from './useSubscription';
import type { GatedFeature, FeatureGateResult, UserRole } from '@/lib/types/subscription';

const FEATURE_TO_LIMIT_MAP: Record<GatedFeature, string> = {
  analytics: 'hasAnalytics',
  advanced_analytics: 'hasAdvancedAnalytics',
  stat_admin: 'hasStatAdminAccess',
  video_tracking: 'hasVideoAccess',
  video_analytics: 'hasVideoAnalyticsAccess',
  export_stats: 'hasExportStats',
  historical_trends: 'hasHistoricalTrends',
  shot_charts: 'hasAdvancedAnalytics',
  verified_badge: 'isVerified',
  unlimited_teams: 'teams',
  unlimited_games: 'games',
  unlimited_seasons: 'seasons',
};

const UPGRADE_MESSAGES: Record<GatedFeature, string> = {
  analytics: 'Upgrade to unlock analytics',
  advanced_analytics: 'Upgrade to unlock advanced analytics',
  stat_admin: 'Upgrade to access stat admin features',
  video_tracking: 'Upgrade to purchase video tracking',
  video_analytics: 'Upgrade to view video analytics',
  export_stats: 'Upgrade to export stats',
  historical_trends: 'Upgrade to view historical trends',
  shot_charts: 'Upgrade to view shot charts',
  verified_badge: 'Upgrade to get verified',
  unlimited_teams: 'Upgrade for unlimited teams',
  unlimited_games: 'Upgrade for unlimited games',
  unlimited_seasons: 'Upgrade for unlimited seasons',
};

export function useFeatureGate(
  feature: GatedFeature,
  roleOverride?: UserRole
): FeatureGateResult {
  const { limits, loading, tier } = useSubscription(roleOverride);

  return useMemo(() => {
    if (loading) {
      return { allowed: false, reason: 'loading', requiredTier: null, upgradeMessage: null };
    }

    const limitKey = FEATURE_TO_LIMIT_MAP[feature];
    const limitValue = limits[limitKey as keyof typeof limits];

    // Boolean features (e.g., hasAnalytics)
    if (typeof limitValue === 'boolean') {
      return {
        allowed: limitValue,
        reason: limitValue ? 'allowed' : 'upgrade_required',
        requiredTier: limitValue ? null : 'pro',
        upgradeMessage: limitValue ? null : UPGRADE_MESSAGES[feature],
      };
    }

    // Unlimited check (for teams, games, seasons)
    if (limitValue === 'unlimited') {
      return { allowed: true, reason: 'allowed', requiredTier: null, upgradeMessage: null };
    }

    // Numeric limits - assume allowed if any limit exists
    if (typeof limitValue === 'number' && limitValue > 0) {
      return { allowed: true, reason: 'allowed', requiredTier: null, upgradeMessage: null };
    }

    // Default: not allowed
    return {
      allowed: false,
      reason: 'upgrade_required',
      requiredTier: 'pro',
      upgradeMessage: UPGRADE_MESSAGES[feature],
    };
  }, [feature, limits, loading, tier]);
}

