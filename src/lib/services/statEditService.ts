/**
 * StatEditService - Edit and Delete Game Stats
 * 
 * PURPOSE:
 * - Fetch all stats for a game for editing
 * - Update existing stats (player, type, modifier, time)
 * - Delete incorrect stats
 * - Uses raw HTTP like GameServiceV3 for reliability
 * 
 * REAL-TIME SYNC:
 * - Updates trigger Supabase subscriptions automatically
 * - Live viewers receive changes via gameSubscriptionManager
 * - Scores recalculate from fresh data via transformStatsToPlay
 * 
 * Follows .cursorrules: <100 lines service file
 */

export interface GameStatRecord {
  id: string;
  game_id: string;
  player_id: string | null;
  custom_player_id: string | null;
  team_id: string;
  stat_type: string;
  modifier: string | null;
  stat_value: number;
  quarter: number;
  game_time_minutes: number;
  game_time_seconds: number;
  created_at: string;
  is_opponent_stat: boolean;
  // Joined data
  player_name?: string;
  // Synthetic entries for game-level stats (fouls/timeouts)
  is_game_level_stat?: boolean;
  game_level_type?: 'team_fouls' | 'team_timeouts';
  team_side?: 'A' | 'B';
}

export class StatEditService {
  private static readonly SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  private static readonly SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  private static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('sb-access-token');
  }

  /**
   * Fetch game data for fouls/timeouts
   */
  static async getGameData(gameId: string): Promise<{
    team_a_fouls: number;
    team_b_fouls: number;
    team_a_timeouts_remaining: number;
    team_b_timeouts_remaining: number;
    team_a_id: string;
    team_b_id: string;
  }> {
    try {
      const accessToken = this.getAccessToken();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const url = `${this.SUPABASE_URL}/rest/v1/games?id=eq.${gameId}&select=team_a_fouls,team_b_fouls,team_a_timeouts_remaining,team_b_timeouts_remaining,team_a_id,team_b_id`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch game data: ${response.status}`);
      }

      const games = await response.json();
      if (games.length === 0) {
        throw new Error('Game not found');
      }

      return games[0];
    } catch (error: any) {
      console.error('❌ StatEditService: Failed to fetch game data:', error);
      throw error;
    }
  }

  /**
   * Fetch timeout events from game_timeouts table
   */
  static async getTimeoutEvents(gameId: string): Promise<GameStatRecord[]> {
    try {
      const accessToken = this.getAccessToken();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const url = `${this.SUPABASE_URL}/rest/v1/game_timeouts?game_id=eq.${gameId}&select=*&order=created_at.desc`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch timeout events: ${response.status}`);
      }

      const timeouts = await response.json();
      
      // Fetch game data to get team IDs
      const gameData = await this.getGameData(gameId);

      // Convert timeout events to GameStatRecord format
      return timeouts.map((timeout: any) => ({
        id: `timeout_${timeout.id}`,
        game_id: gameId,
        player_id: null,
        custom_player_id: null,
        team_id: timeout.team_id,
        stat_type: 'timeout',
        modifier: timeout.timeout_type || 'full',
        stat_value: 1,
        quarter: timeout.quarter,
        game_time_minutes: timeout.game_clock_minutes || 0,
        game_time_seconds: timeout.game_clock_seconds || 0,
        created_at: timeout.created_at,
        is_opponent_stat: false,
        is_game_level_stat: false, // These are actual events, not synthetic
        team_side: timeout.team_id === gameData.team_a_id ? 'A' : 'B'
      }));
    } catch (error: any) {
      console.error('❌ StatEditService: Failed to fetch timeout events:', error);
      return []; // Return empty array on error, don't break the whole list
    }
  }

  /**
   * Fetch substitution events from game_substitutions table
   */
  static async getSubstitutionEvents(gameId: string): Promise<GameStatRecord[]> {
    try {
      const accessToken = this.getAccessToken();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const url = `${this.SUPABASE_URL}/rest/v1/game_substitutions?game_id=eq.${gameId}&select=*&order=created_at.desc`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch substitution events: ${response.status}`);
      }

      const substitutions = await response.json();
      
      // Fetch game data to get team IDs
      const gameData = await this.getGameData(gameId);

      // Convert substitution events to GameStatRecord format
      return substitutions.map((sub: any) => ({
        id: `substitution_${sub.id}`,
        game_id: gameId,
        player_id: sub.player_out_id, // Use player_out_id as primary player_id
        custom_player_id: null, // Substitutions don't use custom_player_id
        team_id: sub.team_id,
        stat_type: 'substitution',
        modifier: sub.player_in_id, // Store player_in_id in modifier field
        stat_value: 1,
        quarter: sub.quarter,
        game_time_minutes: sub.game_time_minutes || 0,
        game_time_seconds: sub.game_time_seconds || 0,
        created_at: sub.created_at,
        is_opponent_stat: false,
        is_game_level_stat: false,
        team_side: sub.team_id === gameData.team_a_id ? 'A' : 'B'
      }));
    } catch (error: any) {
      console.error('❌ StatEditService: Failed to fetch substitution events:', error);
      return []; // Return empty array on error, don't break the whole list
    }
  }

  /**
   * Fetch all stats for a game with player names, including actual timeout events and substitutions
   */
  static async getGameStats(gameId: string): Promise<GameStatRecord[]> {
    try {
      const accessToken = this.getAccessToken();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Fetch regular stats (includes fouls as they're already recorded)
      const url = `${this.SUPABASE_URL}/rest/v1/game_stats?game_id=eq.${gameId}&select=*&order=created_at.desc`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }

      const stats = await response.json();
      
      // ✅ DEBUG: Log foul stats for troubleshooting
      const foulStats = stats.filter((s: any) => s.stat_type === 'foul');
      if (foulStats.length > 0) {
        console.log('🔍 StatEditService: Found', foulStats.length, 'foul stats');
        console.log('🔍 StatEditService: Foul modifiers:', foulStats.map((f: any) => f.modifier));
      }

      // Fetch actual timeout events from game_timeouts table
      const timeoutEvents = await this.getTimeoutEvents(gameId);
      
      // ✅ Fetch substitution events from game_substitutions table
      const substitutionEvents = await this.getSubstitutionEvents(gameId);

      // Combine stats, timeout events, and substitution events, sort by created_at (most recent first)
      const allEvents = [...stats, ...timeoutEvents, ...substitutionEvents];
      allEvents.sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return timeB - timeA; // Descending order (most recent first)
      });

      return allEvents;
    } catch (error: any) {
      console.error('❌ StatEditService: Failed to fetch stats:', error);
      throw error;
    }
  }

  /**
   * Update game-level stats (fouls/timeouts)
   */
  static async updateGameLevelStat(gameId: string, updates: {
    team_a_fouls?: number;
    team_b_fouls?: number;
    team_a_timeouts_remaining?: number;
    team_b_timeouts_remaining?: number;
  }): Promise<void> {
    try {
      const { GameService } = await import('@/lib/services/gameService');
      
      // Get current game state (we only need clock/quarter for the update)
      const gameData = await this.getGameData(gameId);
      
      // Update game state with fouls/timeouts
      await GameService.updateGameState(gameId, {
        quarter: 1, // Will be preserved by updateGameState
        game_clock_minutes: 0,
        game_clock_seconds: 0,
        is_clock_running: false,
        home_score: 0,
        away_score: 0,
        ...updates
      });

      console.log('✅ StatEditService: Game-level stat updated successfully');
    } catch (error: any) {
      console.error('❌ StatEditService: Failed to update game-level stat:', error);
      throw error;
    }
  }

  /**
   * Update a stat (player, type, modifier, time, etc.)
   */
  static async updateStat(statId: string, updates: Partial<GameStatRecord>): Promise<void> {
    try {
      const accessToken = this.getAccessToken();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const url = `${this.SUPABASE_URL}/rest/v1/game_stats?id=eq.${statId}`;
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'apikey': this.SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update stat: ${response.status}`);
      }

      console.log('✅ StatEditService: Stat updated successfully');
    } catch (error: any) {
      console.error('❌ StatEditService: Failed to update stat:', error);
      throw error;
    }
  }

  /**
   * Delete a stat entirely
   */
  static async deleteStat(statId: string): Promise<void> {
    try {
      const accessToken = this.getAccessToken();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const url = `${this.SUPABASE_URL}/rest/v1/game_stats?id=eq.${statId}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'apikey': this.SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete stat: ${response.status}`);
      }

      console.log('✅ StatEditService: Stat deleted successfully');
    } catch (error: any) {
      console.error('❌ StatEditService: Failed to delete stat:', error);
      throw error;
    }
  }
}

