/**
 * TeamServiceV3 - Raw HTTP Enterprise Service for Team Operations
 * 
 * APPROACH: Direct HTTP requests to Supabase REST API (bypasses broken client)
 * - Uses same raw HTTP approach as GameServiceV3 (which works)
 * - No Supabase client dependency
 * - Direct authentication with access tokens
 * - Reliable, fast, enterprise-grade
 * 
 * WHY V3: TeamService uses broken Supabase client causing stat tracker to hang
 * This bypasses that entirely with proven raw HTTP pattern.
 */
export class TeamServiceV3 {
  private static readonly SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  private static readonly SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  /**
   * Get access token from authServiceV2 localStorage
   */
  private static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('sb-access-token');
  }

  /**
   * Convert HTTP status codes to user-friendly error messages
   */
  private static getUserFriendlyError(status: number, errorText: string): string {
    switch (status) {
      case 401:
        return 'Session expired. Please sign in again.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'Team not found. It may have been deleted.';
      case 409:
        return 'This action conflicts with recent changes. Please refresh and try again.';
      case 422:
        return 'Invalid data provided. Please check your input and try again.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
      case 502:
      case 503:
        return 'Server error. Please try again in a moment.';
      case 504:
        return 'Request timed out. Please check your connection and try again.';
      default:
        if (errorText.includes('fetch') || errorText.includes('network')) {
          return 'No internet connection. Please check your network.';
        }
        return `An error occurred (${status}). Please try again.`;
    }
  }

  /**
   * Make public HTTP request to Supabase REST API (same pattern as Play by Play feed)
   */
  private static async makeRequest<T>(
    table: string, 
    params: Record<string, string> = {}
  ): Promise<T[]> {
    if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    // Build query string
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.SUPABASE_URL}/rest/v1/${table}${queryString ? `?${queryString}` : ''}`;

    console.log(`🌐 TeamServiceV3: Public HTTP request to ${table}`, { url, params });

    // ✅ FIX: Use same public access pattern as Play by Play feed
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': this.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`, // ← PUBLIC ACCESS like Play by Play
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ TeamServiceV3: HTTP ${response.status}:`, errorText);
      const userMessage = this.getUserFriendlyError(response.status, errorText);
      throw new Error(userMessage);
    }

    const data = await response.json();
    console.log(`✅ TeamServiceV3: ${table} query successful:`, data.length, 'records');
    return data;
  }

  /**
   * Get team players using raw HTTP requests
   * This is the method that was hanging in the original TeamService
   */
  static async getTeamPlayers(teamId: string): Promise<any[]> {
    try {
      console.log('🚀 TeamServiceV3: Fetching team players via raw HTTP for team:', teamId);

      // Step 1: Get team_players relationships (only player_id exists in this table)
      const teamPlayers = await this.makeRequest<any>('team_players', {
        'select': 'player_id',
        'team_id': `eq.${teamId}`
      });

      if (!teamPlayers || teamPlayers.length === 0) {
        console.log('📝 TeamServiceV3: No players found for team:', teamId);
        return [];
      }

      console.log('✅ TeamServiceV3: Found', teamPlayers.length, 'team player relationships');

      // Step 2: Get player details (jersey_number and position are in users table)
      const playerIds = teamPlayers.map(tp => tp.player_id);
      const players = await this.makeRequest<any>('users', {
        'select': 'id,name,email,jersey_number,position',
        'id': `in.(${playerIds.join(',')})`
      });

      console.log('✅ TeamServiceV3: Found', players.length, 'player details');

      // Step 3: Map user data to player format
      const enrichedPlayers = players.map(player => {
        return {
          id: player.id,
          name: player.name || player.email || 'Unknown Player',
          email: player.email || '',
          jerseyNumber: player.jersey_number || 0, // From users table
          position: player.position || 'Player' // From users table
        };
      });

      console.log('🎯 TeamServiceV3: Successfully enriched', enrichedPlayers.length, 'players');
      return enrichedPlayers;

    } catch (error: any) {
      console.error('❌ TeamServiceV3: Failed to get team players:', error);
      throw new Error(`Failed to load team players: ${error.message}`);
    }
  }

  /**
   * Get team players with current substitution state for a specific game
   * This method applies substitutions to show who's actually on court vs bench
   */
  static async getTeamPlayersWithSubstitutions(teamId: string, gameId?: string): Promise<any[]> {
    try {
      console.log('🚀 TeamServiceV3: Fetching team players with substitutions for team:', teamId, 'game:', gameId);

      // Get base roster from team_players
      const basePlayers = await this.getTeamPlayers(teamId);
      
      if (!gameId) {
        console.log('📝 TeamServiceV3: No gameId provided, returning base roster');
        return basePlayers;
      }

      // Get substitutions for this game and team
      const substitutions = await this.makeRequest<any>('game_substitutions', {
        'select': 'player_in_id,player_out_id,quarter,game_time_minutes,game_time_seconds,created_at',
        'game_id': `eq.${gameId}`,
        'team_id': `eq.${teamId}`,
        'order': 'created_at.asc' // Apply substitutions in chronological order
      });

      console.log('✅ TeamServiceV3: Found', substitutions.length, 'substitutions for this game/team');

      if (substitutions.length === 0) {
        console.log('📝 TeamServiceV3: No substitutions found, returning base roster');
        return basePlayers;
      }

      // NEW APPROACH: Track current on-court status based on substitutions
      // Instead of swapping positions, determine who should be on court vs bench
      
      console.log('🔍 SUBSTITUTION LOGIC DEBUG:', {
        baseRosterCount: basePlayers.length,
        substitutionsToApply: substitutions.length,
        baseRosterFirstFive: basePlayers.slice(0, 5).map(p => ({ id: p.id, name: p.name }))
      });

      // Start with first 5 players as on-court, rest as bench
      const onCourtPlayerIds = new Set(basePlayers.slice(0, 5).map(p => p.id));
      const benchPlayerIds = new Set(basePlayers.slice(5).map(p => p.id));

      console.log('🏀 Initial state:', {
        onCourt: Array.from(onCourtPlayerIds),
        bench: Array.from(benchPlayerIds)
      });

      // Apply each substitution to update on-court status
      let substitutionCount = 0;
      for (const sub of substitutions) {
        const playerOutId = sub.player_out_id;
        const playerInId = sub.player_in_id;

        console.log(`🔄 Processing substitution ${substitutionCount + 1}: ${playerOutId} → ${playerInId}`);

        // Move player out from on-court to bench
        if (onCourtPlayerIds.has(playerOutId)) {
          onCourtPlayerIds.delete(playerOutId);
          benchPlayerIds.add(playerOutId);
        }

        // Move player in from bench to on-court
        if (benchPlayerIds.has(playerInId)) {
          benchPlayerIds.delete(playerInId);
          onCourtPlayerIds.add(playerInId);
        }

        substitutionCount++;
        console.log(`✅ Applied substitution ${substitutionCount}:`, {
          onCourt: Array.from(onCourtPlayerIds),
          bench: Array.from(benchPlayerIds)
        });
      }

      // Rebuild roster with on-court players first, then bench players
      const onCourtPlayers = basePlayers.filter(p => onCourtPlayerIds.has(p.id));
      const benchPlayers = basePlayers.filter(p => benchPlayerIds.has(p.id));
      const currentRoster = [...onCourtPlayers, ...benchPlayers];

      console.log('🎯 FINAL ROSTER STATE:', {
        totalSubstitutions: substitutionCount,
        finalOnCourtCount: onCourtPlayers.length,
        finalBenchCount: benchPlayers.length,
        finalFirstFive: currentRoster.slice(0, 5).map(p => ({ id: p.id, name: p.name })),
        finalRosterOrder: currentRoster.map(p => ({ id: p.id, name: p.name }))
      });

      return currentRoster;

    } catch (error: any) {
      console.error('❌ TeamServiceV3: Failed to get team players with substitutions:', error);
      // Fallback to base roster if substitution logic fails
      return this.getTeamPlayers(teamId);
    }
  }

  /**
   * Get team details by ID
   */
  static async getTeam(teamId: string): Promise<any> {
    try {
      console.log('🚀 TeamServiceV3: Fetching team details via raw HTTP for:', teamId);

      const teams = await this.makeRequest<any>('teams', {
        'select': 'id,name,tournament_id',
        'id': `eq.${teamId}`
      });

      if (!teams || teams.length === 0) {
        console.log('📝 TeamServiceV3: No team found for ID:', teamId);
        return null;
      }

      const team = teams[0];
      console.log('✅ TeamServiceV3: Team details loaded successfully');
      return team;

    } catch (error: any) {
      console.error('❌ TeamServiceV3: Failed to get team:', error);
      throw new Error(`Failed to load team: ${error.message}`);
    }
  }
}
