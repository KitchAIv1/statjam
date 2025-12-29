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
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('role', role)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle to return null when no rows (free tier users)

    // Handle errors gracefully - user is on free tier
    if (error || !data) {
      return null;
    }

    return transformSubscription(data);
  } catch {
    // Network error - treat as free tier
    return null;
  }
}

export async function getAllSubscriptions(userId: string): Promise<Subscription[]> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error || !data) return [];

    return data.map(transformSubscription);
  } catch {
    // Table doesn't exist yet - return empty array
    return [];
  }
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
  try {
    const periodStart = getMonthStart();
    
    const { data } = await supabase
      .from('subscription_usage')
      .select('current_count')
      .eq('user_id', userId)
      .eq('resource_type', resourceType)
      .eq('period_start', periodStart)
      .maybeSingle(); // Use maybeSingle to return null when no usage record exists

    return data?.current_count ?? 0;
  } catch {
    // Table doesn't exist yet - return 0
    return 0;
  }
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
  try {
    const { data } = await supabase
      .from('users')
      .select('is_verified')
      .eq('id', userId)
      .maybeSingle();

    return data?.is_verified ?? false;
  } catch {
    return false;
  }
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
// COACH-SPECIFIC USAGE COUNTING
// =============================================================================

/**
 * Count actual games tracked by a coach (across all their teams)
 */
export async function getCoachGameCount(userId: string): Promise<number> {
  try {
    // Get all teams owned by this coach
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id')
      .eq('coach_id', userId);

    console.log('🔍 getCoachGameCount: teams for user', userId, teams, teamsError);

    if (teamsError || !teams || teams.length === 0) {
      console.log('🔍 getCoachGameCount: No teams found, returning 0');
      return 0;
    }

    const teamIds = teams.map(t => t.id);
    console.log('🔍 getCoachGameCount: teamIds', teamIds);

    // Count games by fetching IDs and counting (more reliable)
    // Note: games table uses team_a_id and team_b_id, not home_team_id/away_team_id
    const countedGameIds = new Set<string>();
    
    for (const teamId of teamIds) {
      // Get games where this team is team_a
      const { data: teamAGames, error: teamAError } = await supabase
        .from('games')
        .select('id')
        .eq('team_a_id', teamId);
      
      if (!teamAError && teamAGames) {
        teamAGames.forEach(g => countedGameIds.add(g.id));
      }
      
      // Get games where this team is team_b
      const { data: teamBGames, error: teamBError } = await supabase
        .from('games')
        .select('id')
        .eq('team_b_id', teamId);
      
      if (!teamBError && teamBGames) {
        teamBGames.forEach(g => countedGameIds.add(g.id));
      }
    }

    const totalCount = countedGameIds.size;
    console.log('🔍 getCoachGameCount: totalCount', totalCount, 'unique games');
    return totalCount;
  } catch (err) {
    console.error('❌ getCoachGameCount error:', err);
    return 0;
  }
}

/**
 * Check if coach can create more games based on subscription
 */
export async function checkCoachGameLimit(
  userId: string
): Promise<UsageCheckResult> {
  const limits = await getUserLimits(userId, 'coach');
  const maxAllowed = limits.games;

  // If unlimited, always allow
  if (maxAllowed === 'unlimited') {
    return { allowed: true, currentCount: 0, maxAllowed: Infinity, remainingCount: Infinity };
  }

  // Get actual game count
  const currentCount = await getCoachGameCount(userId);
  const allowed = currentCount < maxAllowed;

  return {
    allowed,
    currentCount,
    maxAllowed,
    remainingCount: Math.max(0, maxAllowed - currentCount),
  };
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
// VIDEO CREDITS
// =============================================================================

/**
 * Get current video credits for a user
 */
export async function getVideoCredits(userId: string, role: UserRole): Promise<number> {
  const subscription = await getSubscription(userId, role);
  return subscription?.videoCredits ?? 0;
}

/**
 * Consume one video credit (for video upload)
 * Returns true if successful, false if no credits available
 */
export async function consumeVideoCredit(userId: string, role: UserRole): Promise<boolean> {
  try {
    const currentCredits = await getVideoCredits(userId, role);
    
    if (currentCredits <= 0) {
      console.log(`❌ No video credits available for user ${userId}`);
      return false;
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({ 
        video_credits: currentCredits - 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('role', role);

    if (error) {
      console.error('Error consuming video credit:', error);
      return false;
    }

    console.log(`✅ Video credit consumed for user ${userId}: ${currentCredits} → ${currentCredits - 1}`);
    return true;
  } catch (err) {
    console.error('Error consuming video credit:', err);
    return false;
  }
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
  checkCoachGameLimit,
  getCoachGameCount,
  isUserVerified,
  updateVerifiedStatus,
  getVideoCredits,
  consumeVideoCredit,
};


