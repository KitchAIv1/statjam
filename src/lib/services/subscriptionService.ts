/**
 * Subscription Service
 * 
 * Business logic for subscription management, tier checking, and usage limits.
 * All subscription-related database operations go through this service.
 */

import { supabase } from '@/lib/supabase';
import type { 
  Subscription, 
  UserRole, 
  SubscriptionTier,
  UsageCheckResult,
  TierLimits 
} from '@/lib/types/subscription';
import { getTierLimits } from '@/config/pricing';

// =============================================================================
// SUBSCRIPTION FETCHING
// =============================================================================

export async function getSubscription(
  userId: string, 
  role: UserRole
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('role', role)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return transformSubscription(data);
}

export async function getAllSubscriptions(userId: string): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error || !data) return [];

  return data.map(transformSubscription);
}

// =============================================================================
// TIER & LIMITS
// =============================================================================

export async function getUserTier(userId: string, role: UserRole): Promise<SubscriptionTier> {
  const subscription = await getSubscription(userId, role);
  return subscription?.tier ?? 'free';
}

export async function getUserLimits(userId: string, role: UserRole): Promise<TierLimits> {
  const tier = await getUserTier(userId, role);
  return getTierLimits(role, tier);
}

export function isWithinLimit(
  currentCount: number, 
  limit: number | 'unlimited'
): boolean {
  if (limit === 'unlimited') return true;
  return currentCount < limit;
}

// =============================================================================
// USAGE TRACKING
// =============================================================================

export async function checkUsageLimit(
  userId: string,
  resourceType: 'season' | 'team' | 'game' | 'video_game',
  role: UserRole
): Promise<UsageCheckResult> {
  const limits = await getUserLimits(userId, role);
  const maxAllowed = getMaxForResource(limits, resourceType);

  // If unlimited, always allow
  if (maxAllowed === 'unlimited') {
    return { allowed: true, currentCount: 0, maxAllowed: Infinity, remainingCount: Infinity };
  }

  // Get current usage
  const currentCount = await getCurrentUsage(userId, resourceType);
  const allowed = currentCount < maxAllowed;

  return {
    allowed,
    currentCount,
    maxAllowed,
    remainingCount: Math.max(0, maxAllowed - currentCount),
  };
}

async function getCurrentUsage(
  userId: string, 
  resourceType: string
): Promise<number> {
  const periodStart = getMonthStart();
  
  const { data } = await supabase
    .from('subscription_usage')
    .select('current_count')
    .eq('user_id', userId)
    .eq('resource_type', resourceType)
    .eq('period_start', periodStart)
    .single();

  return data?.current_count ?? 0;
}

function getMaxForResource(
  limits: TierLimits, 
  resourceType: string
): number | 'unlimited' {
  switch (resourceType) {
    case 'season': return limits.seasons;
    case 'team': return limits.teams;
    case 'game': return limits.games;
    case 'video_game': return 0; // Video games use credits, not limits
    default: return 0;
  }
}

// =============================================================================
// VERIFICATION
// =============================================================================

export async function isUserVerified(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('is_verified')
    .eq('id', userId)
    .single();

  return data?.is_verified ?? false;
}

export async function updateVerifiedStatus(
  userId: string, 
  isVerified: boolean
): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .update({ is_verified: isVerified })
    .eq('id', userId);

  return !error;
}

// =============================================================================
// HELPERS
// =============================================================================

function transformSubscription(dbRecord: Record<string, unknown>): Subscription {
  return {
    id: dbRecord.id as string,
    userId: dbRecord.user_id as string,
    role: dbRecord.role as UserRole,
    tier: (dbRecord.tier as SubscriptionTier) ?? 'free',
    billingPeriod: dbRecord.billing_period as Subscription['billingPeriod'],
    status: dbRecord.status as Subscription['status'],
    expiresAt: dbRecord.expires_at as string | null,
    videoCredits: (dbRecord.video_credits as number) ?? 0,
    stripeCustomerId: dbRecord.stripe_customer_id as string | null,
    stripeSubscriptionId: dbRecord.stripe_subscription_id as string | null,
    createdAt: dbRecord.created_at as string,
    updatedAt: dbRecord.updated_at as string,
  };
}

function getMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

// =============================================================================
// EXPORT SERVICE OBJECT
// =============================================================================

export const SubscriptionService = {
  getSubscription,
  getAllSubscriptions,
  getUserTier,
  getUserLimits,
  isWithinLimit,
  checkUsageLimit,
  isUserVerified,
  updateVerifiedStatus,
};

