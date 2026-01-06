'use client';

/**
 * useUsageLimits Hook
 * 
 * Checks if the user has remaining usage for a specific resource type
 * (seasons, teams, games) based on their subscription tier.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthV2 } from './useAuthV2';
import { SubscriptionService } from '@/lib/services/subscriptionService';
import type { UsageCheckResult, UserRole } from '@/lib/types/subscription';

interface UseUsageLimitsResult extends UsageCheckResult {
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useUsageLimits(
  resourceType: 'season' | 'team' | 'game' | 'video_game',
  roleOverride?: UserRole
): UseUsageLimitsResult {
  const { user, loading: authLoading } = useAuthV2();
  const [result, setResult] = useState<UsageCheckResult>({
    allowed: true,
    currentCount: 0,
    maxAllowed: Infinity,
    remainingCount: Infinity,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const role: UserRole = roleOverride ?? (user?.role as UserRole) ?? 'player';

  const fetchUsage = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const usageResult = await SubscriptionService.checkUsageLimit(user.id, resourceType, role);
      setResult(usageResult);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to check usage'));
    } finally {
      setLoading(false);
    }
  }, [user?.id, resourceType, role]);

  useEffect(() => {
    if (!authLoading) {
      fetchUsage();
    }
  }, [authLoading, fetchUsage]);

  return {
    ...result,
    loading: authLoading || loading,
    error,
    refetch: fetchUsage,
  };
}







