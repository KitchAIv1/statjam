/**
 * ClaimService - Player Profile Claim Operations
 * 
 * Handles the flow for custom players to claim their profiles:
 * 1. Generate claim tokens for coaches
 * 2. Validate claim tokens for players
 * 3. Execute claim (transfer all data to user account)
 */

import { supabase } from '@/lib/supabase';

// Helper to ensure supabase is available
function getSupabase() {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  return supabase;
}

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface ClaimTokenResponse {
  success: boolean;
  token?: string;
  claimUrl?: string;
  error?: string;
}

export interface ClaimPreview {
  customPlayerId: string;
  name: string;
  jerseyNumber: number | null;
  position: string | null;
  teamName: string;
  teamId: string;
  profilePhotoUrl: string | null;
  gamesPlayed: number;
  totalPoints: number;
  isExpired: boolean;
  isAlreadyClaimed: boolean;
}

export interface ClaimValidationResponse {
  valid: boolean;
  preview?: ClaimPreview;
  error?: string;
}

export interface ClaimExecutionResponse {
  success: boolean;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const TOKEN_LENGTH = 24;
const TOKEN_EXPIRY_DAYS = 7;
const CLAIM_BASE_URL = '/claim';

// ═══════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════

export class ClaimService {
  /**
   * Generate a secure random token
   */
  private static generateToken(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let token = '';
    for (let i = 0; i < TOKEN_LENGTH; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Generate a claim token for a custom player
   */
  static async generateClaimToken(customPlayerId: string): Promise<ClaimTokenResponse> {
    try {
      const db = getSupabase();
      
      // Verify custom player exists and isn't already claimed
      const { data: player, error: fetchError } = await db
        .from('custom_players')
        .select('id, name, claimed_by_user_id')
        .eq('id', customPlayerId)
        .single();

      if (fetchError || !player) {
        return { success: false, error: 'Custom player not found' };
      }

      if (player.claimed_by_user_id) {
        return { success: false, error: 'This player has already been claimed' };
      }

      // Generate new token
      const token = this.generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

      // Save token to database
      const { error: updateError } = await db
        .from('custom_players')
        .update({
          claim_token: token,
          claim_token_expires_at: expiresAt.toISOString(),
        })
        .eq('id', customPlayerId);

      if (updateError) {
        console.error('❌ ClaimService: Failed to save token:', updateError);
        return { success: false, error: 'Failed to generate claim link' };
      }

      const claimUrl = `${CLAIM_BASE_URL}/${token}`;
      console.log('✅ ClaimService: Claim token generated for:', player.name);

      return { success: true, token, claimUrl };
    } catch (error) {
      console.error('❌ ClaimService: generateClaimToken error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Validate a claim token and return preview data
   * Optimized: Parallel queries for player info and stats
   */
  static async validateClaimToken(token: string): Promise<ClaimValidationResponse> {
    try {
      const db = getSupabase();
      
      // Fetch custom player by token
      const { data: player, error } = await db
        .from('custom_players')
        .select(`
          id,
          name,
          jersey_number,
          position,
          profile_photo_url,
          claim_token_expires_at,
          claimed_by_user_id,
          team_id,
          teams!inner(name)
        `)
        .eq('claim_token', token)
        .single();

      if (error || !player) {
        return { valid: false, error: 'Invalid or expired claim link' };
      }

      // Check if already claimed
      if (player.claimed_by_user_id) {
        return { valid: false, error: 'This profile has already been claimed' };
      }

      // Check expiry
      const isExpired = new Date(player.claim_token_expires_at) < new Date();
      if (isExpired) {
        return { valid: false, error: 'This claim link has expired' };
      }

      // Extract team name from join result
      const teamsData = player.teams as unknown as { name: string } | { name: string }[];
      const teamName = Array.isArray(teamsData) ? teamsData[0]?.name : teamsData?.name;

      // Get stats summary in parallel (non-blocking for core preview)
      const statsSummary = await this.getPlayerStatsSummaryOptimized(player.id);

      const preview: ClaimPreview = {
        customPlayerId: player.id,
        name: player.name,
        jerseyNumber: player.jersey_number,
        position: player.position,
        teamName: teamName || 'Unknown Team',
        teamId: player.team_id,
        profilePhotoUrl: player.profile_photo_url,
        gamesPlayed: statsSummary.gamesPlayed,
        totalPoints: statsSummary.totalPoints,
        isExpired: false,
        isAlreadyClaimed: false,
      };

      return { valid: true, preview };
    } catch (error) {
      console.error('❌ ClaimService: validateClaimToken error:', error);
      return { valid: false, error: 'Failed to validate claim link' };
    }
  }

  /**
   * Get stats summary for preview - OPTIMIZED
   * Uses two parallel lightweight queries instead of fetching all rows
   */
  private static async getPlayerStatsSummaryOptimized(
    customPlayerId: string
  ): Promise<{ gamesPlayed: number; totalPoints: number }> {
    try {
      const db = getSupabase();
      
      // Run both queries in parallel for faster response
      const [gamesResult, pointsResult] = await Promise.all([
        // Query 1: Get unique game IDs (minimal data)
        db
          .from('game_stats')
          .select('game_id')
          .eq('custom_player_id', customPlayerId),
        
        // Query 2: Get only scoring stats for points calculation
        db
          .from('game_stats')
          .select('stat_value')
          .eq('custom_player_id', customPlayerId)
          .in('stat_type', ['free_throw', 'two_pointer', '2_pointer', 'three_pointer', '3_pointer'])
      ]);

      const games = gamesResult.data || [];
      const scoringStats = pointsResult.data || [];

      const uniqueGames = new Set(games.map((s) => s.game_id));
      const totalPoints = scoringStats.reduce((sum, s) => sum + (s.stat_value || 0), 0);

      return { gamesPlayed: uniqueGames.size, totalPoints };
    } catch {
      return { gamesPlayed: 0, totalPoints: 0 };
    }
  }

  /**
   * Execute the claim - transfer all data to user account
   * 
   * Uses server-side API route to bypass RLS restrictions.
   * The API route uses service_role key for admin access.
   */
  static async executeClaim(token: string, userId: string): Promise<ClaimExecutionResponse> {
    try {
      console.log('🔐 ClaimService: Executing claim via API...');
      
      const response = await fetch('/api/claim/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, userId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('❌ ClaimService: API claim failed:', result.error);
        return { success: false, error: result.error || 'Failed to claim profile' };
      }

      console.log('✅ ClaimService: Profile claimed successfully via API');
      return { success: true };
    } catch (error) {
      console.error('❌ ClaimService: executeClaim error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // NOTE: All claim execution logic moved to /api/claim/execute route
  // This ensures proper RLS bypass using service_role key
}

