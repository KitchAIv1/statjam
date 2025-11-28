/**
 * Claim Execution API Route
 * Purpose: Execute player profile claim with admin privileges (bypasses RLS)
 * Method: POST /api/claim/execute
 * 
 * This route uses the service_role key to perform updates that
 * client-side code cannot do due to RLS restrictions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

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
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest): Promise<NextResponse<ClaimResponse>> {
  console.log('🔐 ClaimAPI: Received claim execution request');

  try {
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

    console.log('🎉 ClaimAPI: Claim completed successfully!');
    console.log('   - Profile: Copied');
    console.log('   - Stats transferred:', statsResult.transferredCount);
    console.log('   - Team reference: Updated');

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ ClaimAPI: Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

