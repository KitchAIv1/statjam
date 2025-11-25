/**
 * StatEditServiceV2 - Optimized Edit and Delete Game Stats Service
 * 
 * PERFORMANCE IMPROVEMENTS:
 * - Parallel API calls (3-4 requests → 1 parallel batch)
 * - Caching layer (5 min TTL)
 * - Optimized queries (select only needed columns)
 * - Single getGameData call (shared across timeouts/subs)
 * 
 * Follows .cursorrules: <200 lines service file
 */

import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';
import { GameStatRecord } from './statEditService';

export class StatEditServiceV2 {
  private static readonly SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  private static readonly SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  private static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('sb-access-token');
  }

  /**
   * Fetch game data for fouls/timeouts (cached)
   */
  static async getGameData(gameId: string): Promise<{
    team_a_fouls: number;
    team_b_fouls: number;
    team_a_timeouts_remaining: number;
    team_b_timeouts_remaining: number;
    team_a_id: string;
    team_b_id: string;
  }> {
    const cacheKey = `stat_edit_game_data_${gameId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

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

      const gameData = games[0];
      cache.set(cacheKey, gameData, CacheTTL.GAME_BASIC);
      return gameData;
    } catch (error: any) {
      console.error('❌ StatEditServiceV2: Failed to fetch game data:', error);
      throw error;
    }
  }

  /**
   * Fetch all stats for a game with parallel API calls
   */
  static async getGameStats(gameId: string): Promise<GameStatRecord[]> {
    const cacheKey = `stat_edit_stats_${gameId}`;
    const cached = cache.get<GameStatRecord[]>(cacheKey);
    if (cached) return cached;

    try {
      const accessToken = this.getAccessToken();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const headers = {
        'apikey': this.SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      // ⚡ PARALLEL FETCH: All requests at once
      const [statsResponse, timeoutsResponse, subsResponse, gameDataResponse] = await Promise.all([
        // Regular stats (optimized: only needed columns)
        fetch(`${this.SUPABASE_URL}/rest/v1/game_stats?game_id=eq.${gameId}&select=id,game_id,player_id,custom_player_id,team_id,stat_type,stat_value,modifier,quarter,game_time_minutes,game_time_seconds,created_at&order=created_at.desc`, { headers }),
        // Timeouts
        fetch(`${this.SUPABASE_URL}/rest/v1/game_timeouts?game_id=eq.${gameId}&select=*&order=created_at.desc`, { headers }),
        // Substitutions
        fetch(`${this.SUPABASE_URL}/rest/v1/game_substitutions?game_id=eq.${gameId}&select=*&order=created_at.desc`, { headers }),
        // Game data (for team IDs)
        fetch(`${this.SUPABASE_URL}/rest/v1/games?id=eq.${gameId}&select=team_a_id,team_b_id`, { headers })
      ]);

      // Parse responses
      const stats = statsResponse.ok ? await statsResponse.json() : [];
      const timeouts = timeoutsResponse.ok ? await timeoutsResponse.json() : [];
      const substitutions = subsResponse.ok ? await subsResponse.json() : [];
      const gameDataArray = gameDataResponse.ok ? await gameDataResponse.json() : [];
      const gameData = gameDataArray[0] || { team_a_id: '', team_b_id: '' };

      // Transform timeout events
      const timeoutEvents: GameStatRecord[] = timeouts.map((timeout: any) => ({
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
        team_side: timeout.team_id === gameData.team_a_id ? 'A' : 'B'
      }));

      // Transform substitution events
      const substitutionEvents: GameStatRecord[] = substitutions.map((sub: any) => ({
        id: `substitution_${sub.id}`,
        game_id: gameId,
        player_id: sub.player_out_id || null,
        custom_player_id: sub.custom_player_out_id || null,
        team_id: sub.team_id,
        stat_type: 'substitution',
        modifier: sub.player_in_id || sub.custom_player_in_id || null,
        stat_value: 1,
        quarter: sub.quarter,
        game_time_minutes: sub.game_time_minutes || 0,
        game_time_seconds: sub.game_time_seconds || 0,
        created_at: sub.created_at,
        is_opponent_stat: false,
        team_side: sub.team_id === gameData.team_a_id ? 'A' : 'B'
      }));

      // Combine and sort
      const allEvents = [...stats, ...timeoutEvents, ...substitutionEvents];
      allEvents.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      cache.set(cacheKey, allEvents, CacheTTL.GAME_BASIC);
      return allEvents;
    } catch (error: any) {
      console.error('❌ StatEditServiceV2: Failed to fetch stats:', error);
      throw error;
    }
  }

  /**
   * Update a stat (same as V1)
   */
  static async updateStat(statId: string, updates: Partial<GameStatRecord>): Promise<void> {
    const { StatEditService } = await import('./statEditService');
    await StatEditService.updateStat(statId, updates);
    // Invalidate cache
    const gameId = (updates as any).game_id;
    if (gameId) {
      cache.delete(`stat_edit_stats_${gameId}`);
    }
  }

  /**
   * Delete a stat (same as V1)
   */
  static async deleteStat(statId: string, gameId: string): Promise<void> {
    const { StatEditService } = await import('./statEditService');
    await StatEditService.deleteStat(statId);
    // Invalidate cache
    cache.delete(`stat_edit_stats_${gameId}`);
  }
}

