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
}

export class StatEditService {
  private static readonly SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  private static readonly SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  private static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('sb-access-token');
  }

  /**
   * Fetch all stats for a game with player names
   */
  static async getGameStats(gameId: string): Promise<GameStatRecord[]> {
    try {
      const accessToken = this.getAccessToken();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

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

      return await response.json();
    } catch (error: any) {
      console.error('❌ StatEditService: Failed to fetch stats:', error);
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

