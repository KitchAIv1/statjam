'use client';

/**
 * useSubscription Hook
 * 
 * Provides subscription state for the current user.
 * ⚡ Optimized with keepPreviousData pattern - no badge flash on navigation
 * Fetches and caches subscription data for the active role.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthV2 } from './useAuthV2';
import { SubscriptionService } from '@/lib/services/subscriptionService';
import { cache, CacheTTL } from '@/lib/utils/cache';
import type { 
  Subscription, 
  UserRole, 
  SubscriptionTier, 
  TierLimits 
} from '@/lib/types/subscription';
import { getTierLimits } from '@/config/pricing';

// Cache keys for subscription data
const getSubCacheKey = (userId: string, role: UserRole) => `subscription:${userId}:${role}`;
const getVerifiedCacheKey = (userId: string) => `verified:${userId}`;

interface CachedSubData {
  subscription: Subscription | null;
  isVerified: boolean;
}

interface UseSubscriptionResult {
  subscription: Subscription | null;
  tier: SubscriptionTier;
  limits: TierLimits;
  isVerified: boolean;
  videoCredits: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSubscription(roleOverride?: UserRole): UseSubscriptionResult {
  const { user, loading: authLoading } = useAuthV2();
  
  // Determine role from user or override
  const role: UserRole = roleOverride ?? (user?.role as UserRole) ?? 'player';

  // ⚡ Check cache SYNCHRONOUSLY on initial render - prevents badge flash
  const [state, setState] = useState<{
    subscription: Subscription | null;
    isVerified: boolean;
    loading: boolean;
    error: Error | null;
  }>(() => {
    if (user?.id) {
      const cacheKey = getSubCacheKey(user.id, role);
      const cached = cache.get<CachedSubData>(cacheKey);
      if (cached) {
        return { ...cached, loading: false, error: null };
      }
    }
    return { subscription: null, isVerified: false, loading: true, error: null };
  });

  const fetchSubscription = useCallback(async (skipCache = false) => {
    if (!user?.id) {
      setState(prev => ({ ...prev, subscription: null, loading: false }));
      return;
    }

    const cacheKey = getSubCacheKey(user.id, role);
    const cached = cache.get<CachedSubData>(cacheKey);

    // ⚡ Return cached data immediately (unless skipCache)
    if (!skipCache && cached) {
      setState({ ...cached, loading: false, error: null });
      return;
    }

    // ⚡ Only show loading if NO cached data exists
    if (!cached) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      const [sub, verified] = await Promise.all([
        SubscriptionService.getSubscription(user.id, role),
        SubscriptionService.isUserVerified(user.id),
      ]);

      const data: CachedSubData = { subscription: sub, isVerified: verified };
      cache.set(cacheKey, data, CacheTTL.USER_DATA); // 15 min TTL
      setState({ ...data, loading: false, error: null });
    } catch (err) {
      // ⚡ Keep showing cached data on error
      setState(prev => ({
        subscription: cached?.subscription ?? prev.subscription,
        isVerified: cached?.isVerified ?? prev.isVerified,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch subscription'),
      }));
    }
  }, [user?.id, role]);

  useEffect(() => {
    if (!authLoading) {
      fetchSubscription();
    }
  }, [authLoading, fetchSubscription]);

  // Derive tier and limits from subscription
  const tier: SubscriptionTier = state.subscription?.tier ?? 'free';
  const limits = getTierLimits(role, tier);
  const videoCredits = state.subscription?.videoCredits ?? 0;

  return {
    subscription: state.subscription,
    tier,
    limits,
    isVerified: state.isVerified,
    videoCredits,
    loading: authLoading || state.loading,
    error: state.error,
    refetch: () => fetchSubscription(true),
  };
}





