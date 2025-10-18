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
   * Make authenticated HTTP request to Supabase REST API
   */
  private static async makeRequest<T>(
    table: string, 
    params: Record<string, string> = {}
  ): Promise<T[]> {
    const accessToken = this.getAccessToken();
    
    if (!accessToken) {
      throw new Error('No access token found - user not authenticated');
    }

    if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    // Build query string
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.SUPABASE_URL}/rest/v1/${table}${queryString ? `?${queryString}` : ''}`;

    console.log(`🌐 TeamServiceV3: Raw HTTP request to ${table}`, { url, params });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': this.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ TeamServiceV3: HTTP ${response.status}:`, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
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
