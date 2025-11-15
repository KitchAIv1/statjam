/**
 * GameServiceV3 - Raw HTTP Enterprise Service for Stat Admin Dashboard
 * 
 * APPROACH: Direct HTTP requests to Supabase REST API (bypasses broken client)
 * - Uses same raw HTTP approach as authServiceV2 (which works)
 * - No Supabase client dependency
 * - Direct authentication with access tokens
 * - Reliable, fast, enterprise-grade
 * 
 * WHY V3: V1 and V2 both use the broken Supabase client that can't authenticate
 * properly with authServiceV2 tokens. This bypasses that entirely.
 */
export class GameServiceV3 {
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
        return 'The requested game was not found. It may have been deleted.';
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
        // Check for network errors
        if (errorText.includes('fetch') || errorText.includes('network')) {
          return 'No internet connection. Please check your network.';
        }
        return `An error occurred (${status}). Please try again.`;
    }
  }

  /**
   * Make authenticated HTTP request to Supabase REST API with automatic token refresh
   */
  private static async makeRequest<T>(
    table: string, 
    params: Record<string, string> = {},
    retryCount: number = 0
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

    console.log(`🌐 GameServiceV3: Raw HTTP request to ${table}`, { url, params });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': this.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    // Handle authentication errors with automatic token refresh
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ GameServiceV3: HTTP ${response.status}:`, errorText);
      
      // Check if it's an authentication error and we haven't retried yet
      if ((response.status === 401 || response.status === 403) && retryCount === 0) {
        console.log('🔐 GameServiceV3: Authentication error detected, attempting token refresh...');
        
        try {
          // Import authServiceV2 dynamically to avoid circular dependencies
          const { authServiceV2 } = await import('@/lib/services/authServiceV2');
          const session = authServiceV2.getSession();
          
          if (session.refreshToken) {
            const { data, error } = await authServiceV2.refreshToken(session.refreshToken);
            
            if (data && !error) {
              console.log('✅ GameServiceV3: Token refreshed, retrying request...');
              // Retry the request with the new token
              return this.makeRequest(table, params, retryCount + 1);
            } else {
              console.error('❌ GameServiceV3: Token refresh failed:', error);
            }
          } else {
            console.error('❌ GameServiceV3: No refresh token available');
          }
        } catch (refreshError) {
          console.error('❌ GameServiceV3: Error during token refresh:', refreshError);
        }
      }
      
      // Throw user-friendly error message based on status code
      const userMessage = this.getUserFriendlyError(response.status, errorText);
      throw new Error(userMessage);
    }

    const data = await response.json();
    console.log(`✅ GameServiceV3: ${table} query successful:`, data.length, 'records');
    return data;
  }

  /**
   * Get all games assigned to a stat admin using raw HTTP requests
   */
  static async getAssignedGames(statAdminId: string): Promise<any[]> {
    try {
      console.log('🚀 GameServiceV3: Fetching assigned games with raw HTTP for:', statAdminId);

      // ✅ STEP 1: Get games (raw HTTP, no client issues)
      console.log('📊 Step 1: Fetching games via raw HTTP...');
      const games = await this.makeRequest<any>('games', {
        'select': 'id,tournament_id,team_a_id,team_b_id,start_time,status,created_at',
        'stat_admin_id': `eq.${statAdminId}`
      });

      if (!games || games.length === 0) {
        console.log('📝 GameServiceV3: No games found for stat admin:', statAdminId);
        return [];
      }

      console.log('✅ Step 1 complete: Found', games.length, 'games');

      // ✅ STEP 2: Get unique tournament IDs and fetch tournaments
      const tournamentIds = [...new Set(games.map(g => g.tournament_id))];
      console.log('📊 Step 2: Fetching', tournamentIds.length, 'tournaments via raw HTTP...');
      
      const tournaments = await this.makeRequest<any>('tournaments', {
        'select': 'id,name,venue,organizer_id',
        'id': `in.(${tournamentIds.join(',')})`
      });

      // ✅ STEP 3: Get unique organizer IDs and fetch organizers
      const organizerIds = [...new Set(tournaments.map(t => t.organizer_id))];
      console.log('📊 Step 3: Fetching', organizerIds.length, 'organizers via raw HTTP...');
      
      const organizers = await this.makeRequest<any>('users', {
        'select': 'id,email',
        'id': `in.(${organizerIds.join(',')})`
      });

      // ✅ STEP 4: Get unique team IDs and fetch teams
      const teamIds = [...new Set(games.flatMap(g => [g.team_a_id, g.team_b_id]).filter(Boolean))];
      console.log('📊 Step 4: Fetching', teamIds.length, 'teams via raw HTTP...');
      
      const teams = await this.makeRequest<any>('teams', {
        'select': 'id,name',
        'id': `in.(${teamIds.join(',')})`
      });

      console.log('✅ GameServiceV3: All data fetched successfully via raw HTTP');

      // ✅ STEP 5: Create lookup maps for fast access
      const tournamentMap = new Map(tournaments.map(t => [t.id, t]));
      const organizerMap = new Map(organizers.map(o => [o.id, o]));
      const teamMap = new Map(teams.map(t => [t.id, t]));

      // ✅ STEP 6: Transform data to match expected format
      const transformedGames = games.map((game: any) => {
        const tournament = tournamentMap.get(game.tournament_id);
        const organizer = tournament ? organizerMap.get(tournament.organizer_id) : null;
        const teamA = teamMap.get(game.team_a_id);
        const teamB = teamMap.get(game.team_b_id);

        return {
          id: game.id,
          tournamentName: tournament?.name || 'Unknown Tournament',
          teamA: teamA?.name || 'Team A',
          teamB: teamB?.name || 'Team B',
          teamAId: game.team_a_id,
          teamBId: game.team_b_id,
          scheduledDate: game.start_time,
          venue: tournament?.venue || 'TBD',
          status: game.status,
          tournamentId: game.tournament_id,
          createdAt: game.created_at,
          organizer: organizer ? {
            id: organizer.id,
            name: organizer.email, // Using email as display name
            email: organizer.email
          } : null
        };
      });

      // Sort by creation date (newest first)
      const sortedGames = transformedGames.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.scheduledDate);
        const dateB = new Date(b.createdAt || b.scheduledDate);
        return dateB.getTime() - dateA.getTime();
      });

      // Group by organizer
      const groupedByOrganizer = sortedGames.reduce((groups: any, game: any) => {
        const organizerKey = game.organizer?.id || 'unknown';
        const organizerName = game.organizer?.name || 'Unknown Organizer';

        if (!groups[organizerKey]) {
          groups[organizerKey] = {
            organizerId: organizerKey,
            organizerName: organizerName,
            organizerEmail: game.organizer?.email || '',
            games: []
          };
        }

        groups[organizerKey].games.push(game);
        return groups;
      }, {} as Record<string, { organizerId: string; organizerName: string; organizerEmail: string; games: any[] }>);

      // Convert to array and sort organizer groups by most recent game
      const organizedGames = Object.values(groupedByOrganizer).sort((a: any, b: any) => {
        const latestA = new Date(a.games[0]?.createdAt || a.games[0]?.scheduledDate || 0);
        const latestB = new Date(b.games[0]?.createdAt || b.games[0]?.scheduledDate || 0);
        return latestB.getTime() - latestA.getTime();
      });

      console.log('🎯 GameServiceV3: Successfully organized', organizedGames.length, 'organizer groups');
      return organizedGames;

    } catch (error: any) {
      console.error('❌ GameServiceV3: Raw HTTP request failed:', error);
      throw new Error(`Failed to load assigned games: ${error.message}`);
    }
  }

  /**
   * Get a single game by ID using raw HTTP requests
   */
  static async getGame(gameId: string): Promise<any> {
    try {
      console.log('🚀 GameServiceV3: Fetching single game via raw HTTP for:', gameId);

      const games = await this.makeRequest<any>('games', {
        'select': 'id,tournament_id,team_a_id,team_b_id,start_time,status,created_at,quarter,game_clock_minutes,game_clock_seconds,is_clock_running,home_score,away_score,team_a_fouls,team_b_fouls,team_a_timeouts_remaining,team_b_timeouts_remaining,automation_settings,opponent_name',
        'id': `eq.${gameId}`
      });

      if (!games || games.length === 0) {
        console.log('📝 GameServiceV3: No game found for ID:', gameId);
        return null;
      }

      const game = games[0];
      console.log('✅ GameServiceV3: Single game loaded successfully');

      // Get team names if we have team IDs
      if (game.team_a_id && game.team_b_id) {
        try {
          const teams = await this.makeRequest<any>('teams', {
            'select': 'id,name',
            'id': `in.(${game.team_a_id},${game.team_b_id})`
          });

          const teamMap = new Map(teams.map(t => [t.id, t]));
          const teamA = teamMap.get(game.team_a_id);
          const teamB = teamMap.get(game.team_b_id);

          // Add team data to game
          game.team_a = teamA ? { name: teamA.name } : null;
          game.team_b = teamB ? { name: teamB.name } : null;
          game.team_a_name = teamA?.name || null;
          game.team_b_name = teamB?.name || null;

          console.log('✅ GameServiceV3: Team names added to game');
        } catch (teamError) {
          console.warn('⚠️ GameServiceV3: Failed to load team names:', teamError);
          // Continue without team names
        }
      }

      return game;

    } catch (error: any) {
      console.error('❌ GameServiceV3: Failed to get game:', error);
      throw new Error(`Failed to load game: ${error.message}`);
    }
  }

  /**
   * Get game stats for score calculation using raw HTTP requests
   */
  static async getGameStats(gameId: string): Promise<any[]> {
    try {
      console.log('🚀 GameServiceV3: Fetching game stats via raw HTTP for:', gameId);

      const stats = await this.makeRequest<any>('game_stats', {
        'select': 'team_id,stat_type,stat_value,modifier,is_opponent_stat',
        'game_id': `eq.${gameId}`,
        'order': 'created_at.asc'
      });

      console.log('✅ GameServiceV3: Game stats loaded successfully:', stats.length, 'records');
      return stats || [];

    } catch (error: any) {
      console.error('❌ GameServiceV3: Failed to get game stats:', error);
      // Don't throw - return empty array so tracker can still work
      return [];
    }
  }

  /**
   * Update game status using raw HTTP requests
   */
  static async updateGameStatus(gameId: string, status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overtime'): Promise<boolean> {
    try {
      console.log('🎯 GameServiceV3: Updating game status via raw HTTP:', { gameId, status });

      const accessToken = this.getAccessToken();
      if (!accessToken) {
        throw new Error('No access token found - user not authenticated');
      }

      const url = `${this.SUPABASE_URL}/rest/v1/games?id=eq.${gameId}`;
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'apikey': this.SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          status: status,
          updated_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ GameServiceV3: Failed to update status - HTTP ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ GameServiceV3: Game status updated successfully to:', status);
      return true;

    } catch (error: any) {
      console.error('❌ GameServiceV3: Failed to update game status:', error);
      return false;
    }
  }

  /**
   * ✅ PRE-FLIGHT CHECK: Update game automation settings
   * Used by Pre-Flight Check Modal to save per-game automation configuration
   */
  static async updateGameAutomation(
    gameId: string,
    settings: any // AutomationFlags type
  ): Promise<boolean> {
    try {
      console.log('⚙️ GameServiceV3: Updating game automation settings via raw HTTP:', { gameId, settings });

      const accessToken = this.getAccessToken();
      if (!accessToken) {
        throw new Error('No access token found - user not authenticated');
      }

      const url = `${this.SUPABASE_URL}/rest/v1/games?id=eq.${gameId}`;
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'apikey': this.SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          automation_settings: settings
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ GameServiceV3: Failed to update automation settings - HTTP ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      console.log('✅ GameServiceV3: Game automation settings updated successfully');
      return true;

    } catch (error: any) {
      console.error('❌ GameServiceV3: Failed to update game automation settings:', error);
      return false;
    }
  }

  /**
   * Record a stat using raw HTTP requests
   */
  static async recordStat(statData: {
    gameId: string;
    playerId?: string; // Optional for custom players
    customPlayerId?: string; // For custom players
    isOpponentStat?: boolean; // For coach mode opponent stats
    teamId: string;
    statType: string;
    modifier: string | null; // ✅ FIXED: Allow null modifier
    quarter: number;
    gameTimeMinutes: number;
    gameTimeSeconds: number;
    statValue?: number;
    // ✅ PHASE 4: Event linking
    sequenceId?: string; // Links related events (assist→shot, rebound→miss)
    linkedEventId?: string; // Points to primary event (e.g., assist points to shot)
    eventMetadata?: Record<string, any>; // Additional context
  }): Promise<any> {
    try {
      console.log('🚀 GameServiceV3: Recording stat via raw HTTP:', statData);

      const accessToken = this.getAccessToken();
      if (!accessToken) {
        throw new Error('No access token found - user not authenticated');
      }

      console.log('🔐 GameServiceV3: Using access token for INSERT:', accessToken.substring(0, 20) + '...');

      const url = `${this.SUPABASE_URL}/rest/v1/game_stats`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': this.SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          game_id: statData.gameId,
          player_id: statData.playerId || null,
          custom_player_id: statData.customPlayerId || null,
          is_opponent_stat: statData.isOpponentStat || false,
          team_id: statData.teamId,
          stat_type: statData.statType,
          modifier: statData.modifier,
          quarter: statData.quarter,
          game_time_minutes: statData.gameTimeMinutes,
          game_time_seconds: statData.gameTimeSeconds,
          stat_value: statData.statValue || 1,
          // ✅ PHASE 4: Event linking fields
          sequence_id: statData.sequenceId || null,
          linked_event_id: statData.linkedEventId || null,
          event_metadata: statData.eventMetadata || null
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ GameServiceV3: Failed to record stat - HTTP ${response.status}:`, errorText);
        
        // ✅ DEBUG: Log foul-specific errors
        if (statData.statType === 'foul') {
          console.error('🔍 GameServiceV3: Foul recording failed - StatType:', statData.statType, 'Modifier:', statData.modifier, 'Error:', errorText);
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ GameServiceV3: Stat recorded successfully via raw HTTP');
      
      // ✅ DEBUG: Log foul details for troubleshooting
      if (statData.statType === 'foul') {
        console.log('🔍 GameServiceV3: Foul recorded - Type:', statData.statType, 'Modifier:', statData.modifier, 'Result:', result);
      }
      
      return result;

    } catch (error: any) {
      console.error('❌ GameServiceV3: Failed to record stat:', error);
      throw new Error(`Failed to record stat: ${error.message}`);
    }
  }

  /**
   * Record a timeout using raw HTTP requests
   */
  static async recordTimeout(data: {
    gameId: string;
    teamId: string;
    quarter: number;
    gameClockMinutes: number;
    gameClockSeconds: number;
    timeoutType: 'full' | '30_second';
  }): Promise<boolean> {
    try {
      const accessToken = this.getAccessToken();
      if (!accessToken) {
        throw new Error('No access token found - user not authenticated');
      }

      console.log('⏰ GameServiceV3: Recording timeout via raw HTTP:', data);

      // Insert into game_timeouts table
      const timeoutUrl = `${this.SUPABASE_URL}/rest/v1/game_timeouts`;
      const timeoutResponse = await fetch(timeoutUrl, {
        method: 'POST',
        headers: {
          'apikey': this.SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          game_id: data.gameId,
          team_id: data.teamId,
          quarter: data.quarter,
          game_clock_minutes: data.gameClockMinutes,
          game_clock_seconds: data.gameClockSeconds,
          timeout_type: data.timeoutType,
          duration_seconds: data.timeoutType === 'full' ? 60 : 30
        })
      });

      if (!timeoutResponse.ok) {
        const errorText = await timeoutResponse.text();
        console.error(`❌ GameServiceV3: Failed to record timeout - HTTP ${timeoutResponse.status}:`, errorText);
        throw new Error(`Failed to record timeout: HTTP ${timeoutResponse.status}`);
      }

      console.log('✅ GameServiceV3: Timeout recorded to game_timeouts table');

      // Decrement timeout count in games table
      const currentGame = await this.getGame(data.gameId);
      if (!currentGame) {
        throw new Error('Game not found');
      }

      const isTeamA = currentGame.team_a_id === data.teamId;
      const timeoutField = isTeamA ? 'team_a_timeouts_remaining' : 'team_b_timeouts_remaining';
      // ✅ FIX: Use nullish coalescing (??) instead of || to preserve 0 values
      const currentCount = isTeamA ? (currentGame.team_a_timeouts_remaining ?? 5) : (currentGame.team_b_timeouts_remaining ?? 5);
      // ✅ IMPORTANT: Always decrement by exactly 1, regardless of timeout type (60s or 30s)
      // Both timeout types count as ONE timeout deduction
      const newCount = Math.max(0, currentCount - 1);

      console.log(`⏰ GameServiceV3: Updating timeout count for ${isTeamA ? 'Team A' : 'Team B'}:`, {
        gameId: data.gameId,
        teamId: data.teamId,
        timeoutField,
        currentCount,
        newCount,
        timeoutType: data.timeoutType
      });

      const gameUrl = `${this.SUPABASE_URL}/rest/v1/games?id=eq.${data.gameId}`;
      const updateBody = {
        [timeoutField]: newCount
      };

      console.log(`⏰ GameServiceV3: PATCH request to ${gameUrl}`, { body: updateBody });

      const gameResponse = await fetch(gameUrl, {
        method: 'PATCH',
        headers: {
          'apikey': this.SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(updateBody)
      });

      if (!gameResponse.ok) {
        const errorText = await gameResponse.text();
        console.error(`❌ GameServiceV3: Failed to update timeout count - HTTP ${gameResponse.status}:`, errorText);
        console.error(`❌ GameServiceV3: Request details:`, { url: gameUrl, body: updateBody });
        throw new Error(`Failed to update timeout count: HTTP ${gameResponse.status} - ${errorText}`);
      }

      // Verify the update worked by fetching the game again
      const verifyGame = await this.getGame(data.gameId);
      const verifiedCount = isTeamA ? (verifyGame?.team_a_timeouts_remaining ?? null) : (verifyGame?.team_b_timeouts_remaining ?? null);
      
      console.log(`✅ GameServiceV3: Timeout count updated. Verified:`, {
        expected: newCount,
        actual: verifiedCount,
        match: verifiedCount === newCount
      });

      if (verifiedCount !== newCount) {
        console.warn(`⚠️ GameServiceV3: Timeout count mismatch! Expected ${newCount}, got ${verifiedCount}`);
      }

      return true;

    } catch (error: any) {
      console.error('❌ GameServiceV3: Failed to record timeout:', error);
      return false;
    }
  }

  /**
   * ✅ PHASE 3: Update current possession in games table
   */
  static async updateCurrentPossession(gameId: string, teamId: string): Promise<boolean> {
    try {
      const accessToken = this.getAccessToken();
      if (!accessToken) {
        console.error('❌ GameServiceV3: No access token for possession update');
        return false;
      }

      if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase configuration');
      }

      const url = `${this.SUPABASE_URL}/rest/v1/games?id=eq.${gameId}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'apikey': this.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          current_possession_team_id: teamId,
          possession_changed_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ GameServiceV3: Failed to update possession - HTTP ${response.status}:`, errorText);
        return false;
      }

      console.log('✅ GameServiceV3: Possession updated successfully');
      return true;

    } catch (error: any) {
      console.error('❌ GameServiceV3: Failed to update possession:', error);
      return false;
    }
  }

  /**
   * ✅ PHASE 3: Record possession change in game_possessions table
   */
  static async recordPossessionChange(data: {
    gameId: string;
    teamId: string;
    startQuarter: number;
    startTimeMinutes: number;
    startTimeSeconds: number;
    endQuarter?: number;
    endTimeMinutes?: number;
    endTimeSeconds?: number;
    endReason?: string;
  }): Promise<boolean> {
    try {
      const accessToken = this.getAccessToken();
      if (!accessToken) {
        console.error('❌ GameServiceV3: No access token for possession record');
        return false;
      }

      if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase configuration');
      }

      const url = `${this.SUPABASE_URL}/rest/v1/game_possessions`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': this.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          game_id: data.gameId,
          team_id: data.teamId,
          start_quarter: data.startQuarter,
          start_time_minutes: data.startTimeMinutes,
          start_time_seconds: data.startTimeSeconds,
          end_quarter: data.endQuarter,
          end_time_minutes: data.endTimeMinutes,
          end_time_seconds: data.endTimeSeconds,
          end_reason: data.endReason
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ GameServiceV3: Failed to record possession - HTTP ${response.status}:`, errorText);
        return false;
      }

      console.log('✅ GameServiceV3: Possession change recorded successfully');
      return true;

    } catch (error: any) {
      console.error('❌ GameServiceV3: Failed to record possession change:', error);
      return false;
    }
  }

  /**
   * ✅ PHASE 6: Update possession manually (for edge cases)
   * Used when user manually overrides possession
   * 
   * NOTE: This updates the games table directly, not game_possessions
   * The game_possessions table is for historical tracking only
   */
  static async updatePossession(
    gameId: string,
    teamId: string,
    reason: string
  ): Promise<boolean> {
    try {
      console.log(`🔄 GameServiceV3: Updating possession manually for game ${gameId} to team ${teamId}`);

      if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase configuration');
      }

      const accessToken = this.getAccessToken();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Update the games table with current possession
      const response = await fetch(`${this.SUPABASE_URL}/rest/v1/games?id=eq.${gameId}`, {
        method: 'PATCH',
        headers: {
          'apikey': this.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          current_possession_team_id: teamId,
          updated_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ GameServiceV3: Failed to update possession - HTTP ${response.status}:`, errorText);
        return false;
      }

      console.log('✅ GameServiceV3: Possession updated successfully');
      return true;

    } catch (error: any) {
      console.error('❌ GameServiceV3: Failed to update possession:', error);
      return false;
    }
  }
}
