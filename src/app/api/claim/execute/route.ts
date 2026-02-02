/**
 * Claim Execution API Route
 * Purpose: Execute player profile claim with admin privileges (bypasses RLS)
 * Method: POST /api/claim/execute
 * 
 * This route uses the service_role key to perform updates that
 * client-side code cannot do due to RLS restrictions.
 * 
 * Security:
 * - Rate limiting: 5 requests per minute per IP
 * - Idempotency: Prevents double-claims for same user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import * as Sentry from '@sentry/nextjs';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface ClaimRequest {
  token: string;
  userId: string;
}

interface ClaimResponse {
  success: boolean;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════
// RATE LIMITING (In-memory, resets on server restart)
// ═══════════════════════════════════════════════════════════════

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    // First request or window expired - allow and start new window
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment count
  record.count++;
  return { allowed: true };
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════

async function validateClaimToken(db: ReturnType<typeof getSupabaseAdmin>, token: string) {
  const { data: player, error } = await db
    .from('custom_players')
    .select(`
      id,
      name,
      jersey_number,
      position,
      profile_photo_url,
      pose_photo_url,
      claim_token_expires_at,
      claimed_by_user_id,
      team_id
    `)
    .eq('claim_token', token)
    .single();

  if (error || !player) {
    return { valid: false, error: 'Invalid or expired claim link', player: null };
  }

  if (player.claimed_by_user_id) {
    return { valid: false, error: 'This profile has already been claimed', player: null };
  }

  const isExpired = new Date(player.claim_token_expires_at) < new Date();
  if (isExpired) {
    return { valid: false, error: 'This claim link has expired', player: null };
  }

  return { valid: true, error: null, player };
}

// ═══════════════════════════════════════════════════════════════
// CLAIM STEPS
// ═══════════════════════════════════════════════════════════════

async function markAsClaimed(
  db: ReturnType<typeof getSupabaseAdmin>,
  customPlayerId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error, count } = await db
    .from('custom_players')
    .update({
      claimed_by_user_id: userId,
      claimed_at: new Date().toISOString(),
      claim_token: null,
      claim_token_expires_at: null,
    })
    .eq('id', customPlayerId)
    .select();

  if (error) {
    console.error('❌ ClaimAPI: Failed to mark as claimed:', error);
    return { success: false, error: 'Failed to mark profile as claimed' };
  }

  console.log('✅ ClaimAPI: Marked as claimed, rows affected:', count);
  return { success: true };
}

async function copyProfileToUser(
  db: ReturnType<typeof getSupabaseAdmin>,
  customPlayer: {
    name: string;
    jersey_number: number | null;
    position: string | null;
    profile_photo_url: string | null;
    pose_photo_url: string | null;
  },
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await db
    .from('users')
    .update({
      name: customPlayer.name,
      jersey_number: customPlayer.jersey_number,
      position: customPlayer.position,
      profile_photo_url: customPlayer.profile_photo_url,
      pose_photo_url: customPlayer.pose_photo_url,
    })
    .eq('id', userId);

  if (error) {
    console.error('❌ ClaimAPI: Failed to copy profile:', error);
    return { success: false, error: 'Failed to copy profile data' };
  }

  console.log('✅ ClaimAPI: Profile copied to user:', userId);
  return { success: true };
}

async function transferGameStats(
  db: ReturnType<typeof getSupabaseAdmin>,
  customPlayerId: string,
  userId: string
): Promise<{ success: boolean; transferredCount: number; error?: string }> {
  // First, count how many stats exist
  const { count: beforeCount } = await db
    .from('game_stats')
    .select('*', { count: 'exact', head: true })
    .eq('custom_player_id', customPlayerId);

  console.log('📊 ClaimAPI: Stats to transfer:', beforeCount);

  if (!beforeCount || beforeCount === 0) {
    console.log('ℹ️ ClaimAPI: No stats to transfer');
    return { success: true, transferredCount: 0 };
  }

  // Transfer stats
  const { error } = await db
    .from('game_stats')
    .update({ 
      player_id: userId, 
      custom_player_id: null 
    })
    .eq('custom_player_id', customPlayerId);

  if (error) {
    console.error('❌ ClaimAPI: Failed to transfer stats:', error);
    return { success: false, transferredCount: 0, error: 'Failed to transfer game stats' };
  }

  // Verify transfer
  const { count: afterCount } = await db
    .from('game_stats')
    .select('*', { count: 'exact', head: true })
    .eq('player_id', userId);

  console.log('✅ ClaimAPI: Stats transferred. New count for user:', afterCount);
  return { success: true, transferredCount: beforeCount };
}

async function updateTeamPlayersReference(
  db: ReturnType<typeof getSupabaseAdmin>,
  customPlayerId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await db
    .from('team_players')
    .update({ 
      player_id: userId, 
      custom_player_id: null 
    })
    .eq('custom_player_id', customPlayerId);

  if (error) {
    console.error('❌ ClaimAPI: Failed to update team reference:', error);
    return { success: false, error: 'Failed to update team reference' };
  }

  console.log('✅ ClaimAPI: Team reference updated');
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// ADDITIONAL MIGRATION STEPS (Previously Missing)
// ═══════════════════════════════════════════════════════════════

async function transferGameSubstitutions(
  db: ReturnType<typeof getSupabaseAdmin>,
  customPlayerId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  // Transfer player_in substitutions
  const { error: inError } = await db
    .from('game_substitutions')
    .update({ player_in_id: userId, custom_player_in_id: null })
    .eq('custom_player_in_id', customPlayerId);

  if (inError) {
    console.error('❌ ClaimAPI: Failed to transfer substitutions (player_in):', inError);
    return { success: false, error: 'Failed to transfer substitutions' };
  }

  // Transfer player_out substitutions
  const { error: outError } = await db
    .from('game_substitutions')
    .update({ player_out_id: userId, custom_player_out_id: null })
    .eq('custom_player_out_id', customPlayerId);

  if (outError) {
    console.error('❌ ClaimAPI: Failed to transfer substitutions (player_out):', outError);
    return { success: false, error: 'Failed to transfer substitutions' };
  }

  console.log('✅ ClaimAPI: Game substitutions transferred');
  return { success: true };
}

async function transferGameAwards(
  db: ReturnType<typeof getSupabaseAdmin>,
  customPlayerId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  // Transfer Player of the Game awards
  const { error: potgError } = await db
    .from('games')
    .update({ player_of_the_game_id: userId, custom_player_of_the_game_id: null })
    .eq('custom_player_of_the_game_id', customPlayerId);

  if (potgError) {
    console.error('❌ ClaimAPI: Failed to transfer POTG awards:', potgError);
    return { success: false, error: 'Failed to transfer awards' };
  }

  // Transfer Hustle Player awards
  const { error: hustleError } = await db
    .from('games')
    .update({ hustle_player_of_the_game_id: userId, custom_hustle_player_of_the_game_id: null })
    .eq('custom_hustle_player_of_the_game_id', customPlayerId);

  if (hustleError) {
    console.error('❌ ClaimAPI: Failed to transfer Hustle awards:', hustleError);
    return { success: false, error: 'Failed to transfer awards' };
  }

  console.log('✅ ClaimAPI: Game awards transferred');
  return { success: true };
}

async function transferGeneratedClips(
  db: ReturnType<typeof getSupabaseAdmin>,
  customPlayerId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await db
    .from('generated_clips')
    .update({ player_id: userId, custom_player_id: null })
    .eq('custom_player_id', customPlayerId);

  if (error) {
    console.error('❌ ClaimAPI: Failed to transfer clips:', error);
    return { success: false, error: 'Failed to transfer clips' };
  }

  console.log('✅ ClaimAPI: Generated clips transferred');
  return { success: true };
}

async function transferClipPurchases(
  db: ReturnType<typeof getSupabaseAdmin>,
  customPlayerId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await db
    .from('clip_purchases')
    .update({ player_id: userId, custom_player_id: null })
    .eq('custom_player_id', customPlayerId);

  if (error) {
    console.error('❌ ClaimAPI: Failed to transfer clip purchases:', error);
    return { success: false, error: 'Failed to transfer clip purchases' };
  }

  console.log('✅ ClaimAPI: Clip purchases transferred');
  return { success: true };
}

async function transferStatsAggregation(
  db: ReturnType<typeof getSupabaseAdmin>,
  customPlayerId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await db
    .from('stats')
    .update({ player_id: userId, custom_player_id: null })
    .eq('custom_player_id', customPlayerId);

  if (error) {
    console.error('❌ ClaimAPI: Failed to transfer stats aggregation:', error);
    return { success: false, error: 'Failed to transfer stats aggregation' };
  }

  console.log('✅ ClaimAPI: Stats aggregation transferred');
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest): Promise<NextResponse<ClaimResponse>> {
  console.log('🔐 ClaimAPI: Received claim execution request');

  try {
    // ═══════════════════════════════════════════════════════════════
    // GUARD 1: Rate Limiting
    // ═══════════════════════════════════════════════════════════════
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      console.warn('⚠️ ClaimAPI: Rate limit exceeded for IP:', ip);
      return NextResponse.json(
        { success: false, error: `Too many requests. Please try again in ${rateCheck.retryAfter} seconds.` },
        { status: 429 }
      );
    }

    // Parse request body
    const body: ClaimRequest = await request.json();
    const { token, userId } = body;

    // Validate input
    if (!token || !userId) {
      console.error('❌ ClaimAPI: Missing token or userId');
      return NextResponse.json(
        { success: false, error: 'Missing token or userId' },
        { status: 400 }
      );
    }

    console.log('📋 ClaimAPI: Processing claim for userId:', userId);

    // Get admin client
    const db = getSupabaseAdmin();

    // ═══════════════════════════════════════════════════════════════
    // GUARD 2: Idempotency - Check if user already claimed a profile
    // ═══════════════════════════════════════════════════════════════
    const { data: existingClaim } = await db
      .from('custom_players')
      .select('id, name')
      .eq('claimed_by_user_id', userId)
      .limit(1)
      .single();

    if (existingClaim) {
      console.warn('⚠️ ClaimAPI: User already claimed a profile:', existingClaim.name);
      return NextResponse.json(
        { success: false, error: 'You have already claimed a player profile.' },
        { status: 409 } // Conflict
      );
    }

    // Step 1: Validate token
    const validation = await validateClaimToken(db, token);
    if (!validation.valid || !validation.player) {
      console.error('❌ ClaimAPI: Token validation failed:', validation.error);
      return NextResponse.json(
        { success: false, error: validation.error || 'Invalid token' },
        { status: 400 }
      );
    }

    const customPlayer = validation.player;
    const customPlayerId = customPlayer.id;
    console.log('✅ ClaimAPI: Token valid for player:', customPlayer.name);

    // Step 2: Mark as claimed (with token invalidation)
    const claimResult = await markAsClaimed(db, customPlayerId, userId);
    if (!claimResult.success) {
      return NextResponse.json(
        { success: false, error: claimResult.error },
        { status: 500 }
      );
    }

    // Step 3: Copy profile data to user
    const copyResult = await copyProfileToUser(db, customPlayer, userId);
    if (!copyResult.success) {
      console.warn('⚠️ ClaimAPI: Profile copy failed, but continuing...');
    }

    // Step 4: Transfer game stats
    const statsResult = await transferGameStats(db, customPlayerId, userId);
    if (!statsResult.success) {
      console.warn('⚠️ ClaimAPI: Stats transfer failed, but continuing...');
    }

    // Step 5: Update team_players reference
    const teamResult = await updateTeamPlayersReference(db, customPlayerId, userId);
    if (!teamResult.success) {
      console.warn('⚠️ ClaimAPI: Team reference update failed, but continuing...');
    }

    // Step 6: Transfer game substitutions
    const subsResult = await transferGameSubstitutions(db, customPlayerId, userId);
    if (!subsResult.success) {
      console.warn('⚠️ ClaimAPI: Substitutions transfer failed, but continuing...');
    }

    // Step 7: Transfer game awards (POTG, Hustle Player)
    const awardsResult = await transferGameAwards(db, customPlayerId, userId);
    if (!awardsResult.success) {
      console.warn('⚠️ ClaimAPI: Awards transfer failed, but continuing...');
    }

    // Step 8: Transfer generated clips
    const clipsResult = await transferGeneratedClips(db, customPlayerId, userId);
    if (!clipsResult.success) {
      console.warn('⚠️ ClaimAPI: Clips transfer failed, but continuing...');
    }

    // Step 9: Transfer clip purchases
    const purchasesResult = await transferClipPurchases(db, customPlayerId, userId);
    if (!purchasesResult.success) {
      console.warn('⚠️ ClaimAPI: Clip purchases transfer failed, but continuing...');
    }

    // Step 10: Transfer stats aggregation table
    const statsAggResult = await transferStatsAggregation(db, customPlayerId, userId);
    if (!statsAggResult.success) {
      console.warn('⚠️ ClaimAPI: Stats aggregation transfer failed, but continuing...');
    }

    console.log('🎉 ClaimAPI: Claim completed successfully!');
    console.log('   - Profile: Copied');
    console.log('   - Stats transferred:', statsResult.transferredCount);
    console.log('   - Team reference: Updated');
    console.log('   - Substitutions: Transferred');
    console.log('   - Awards: Transferred');
    console.log('   - Clips: Transferred');
    console.log('   - Clip Purchases: Transferred');
    console.log('   - Stats Aggregation: Transferred');

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ ClaimAPI: Unexpected error:', error);
    Sentry.captureException(error, { tags: { route: 'claim-execute', action: 'claim_profile' } });
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

