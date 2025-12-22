'use client';

/**
 * useSubscription Hook
 * 
 * Provides subscription state for the current user.
 * Fetches and caches subscription data for the active role.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthV2 } from './useAuthV2';
import { SubscriptionService } from '@/lib/services/subscriptionService';
import type { 
  Subscription, 
  UserRole, 
  SubscriptionTier, 
  TierLimits 
} from '@/lib/types/subscription';
import { getTierLimits } from '@/config/pricing';

interface UseSubscriptionResult {
  subscription: Subscription | null;
  tier: SubscriptionTier;
  limits: TierLimits;
  isVerified: boolean;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSubscription(roleOverride?: UserRole): UseSubscriptionResult {
  const { user, loading: authLoading } = useAuthV2();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Determine role from user or override
  const role: UserRole = roleOverride ?? (user?.role as UserRole) ?? 'player';

  const fetchSubscription = useCallback(async () => {
    if (!user?.id) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [sub, verified] = await Promise.all([
        SubscriptionService.getSubscription(user.id, role),
        SubscriptionService.isUserVerified(user.id),
      ]);

      setSubscription(sub);
      setIsVerified(verified);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch subscription'));
    } finally {
      setLoading(false);
    }
  }, [user?.id, role]);

  useEffect(() => {
    if (!authLoading) {
      fetchSubscription();
    }
  }, [authLoading, fetchSubscription]);

  // Derive tier and limits from subscription
  const tier: SubscriptionTier = subscription?.tier ?? 'free';
  const limits = getTierLimits(role, tier);

  return {
    subscription,
    tier,
    limits,
    isVerified,
    loading: authLoading || loading,
    error,
    refetch: fetchSubscription,
  };
}


