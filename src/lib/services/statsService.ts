'use client';

import { supabase } from '@/lib/supabase';

export interface StatRow {
  id: string;
  game_id: string;
  team_id: string;
  player_id: string;
  custom_player_id?: string; // ✅ FIX: Add custom_player_id field
  stat_type: string;
  stat_value: number | null;
  modifier: string | null;
  quarter: number | null;
  game_time_minutes: number | null;
  game_time_seconds: number | null;
  created_at: string | null;
  users?: {
    id: string;
    email: string;
    name?: string;
  } | null;
  custom_players?: { // ✅ FIX: Add custom_players field
    id: string;
    name: string;
  } | null;
}

export const StatsService = {
  async getByGameId(gameId: string): Promise<StatRow[]> {
    // Step 1: Get stats without JOINs for better performance (include custom_player_id)
    const { data: stats, error: statsError } = await supabase
      .from('game_stats')
      .select('id, game_id, team_id, player_id, custom_player_id, stat_type, stat_value, modifier, quarter, game_time_minutes, game_time_seconds, created_at')
      .eq('game_id', gameId)
      .order('created_at', { ascending: true });

    if (statsError) {
      console.warn('StatsService.getByGameId error:', statsError);
      return [];
    }

    if (!stats || stats.length === 0) {
      return [];
    }

    // Step 2: Get unique player IDs and custom player IDs, fetch both in parallel
    const playerIds = [...new Set(stats.map(s => s.player_id).filter(Boolean))];
    const customPlayerIds = [...new Set(stats.map((s: any) => s.custom_player_id).filter(Boolean))];
    
    // ✅ FIX: Fetch both regular users and custom_players in parallel
    const [usersResult, customPlayersResult] = await Promise.all([
      playerIds.length > 0
        ? supabase.from('users').select('id, email, name').in('id', playerIds)
        : Promise.resolve({ data: [], error: null }),
      customPlayerIds.length > 0
        ? supabase.from('custom_players').select('id, name').in('id', customPlayerIds)
        : Promise.resolve({ data: [], error: null })
    ]);

    if (usersResult.error) {
      console.warn('StatsService: Error fetching user data:', usersResult.error);
    }

    if (customPlayersResult.error) {
      console.warn('StatsService: Error fetching custom player data:', customPlayersResult.error);
    }

    // Step 3: Create lookup maps and combine data
    const userMap = new Map(usersResult.data?.map(u => [u.id, u]) || []);
    const customPlayerMap = new Map(customPlayersResult.data?.map((cp: any) => [cp.id, cp]) || []);
    
    const result = stats.map((stat: any) => ({
      ...stat,
      users: stat.player_id ? userMap.get(stat.player_id) || null : null,
      custom_players: stat.custom_player_id ? customPlayerMap.get(stat.custom_player_id) || null : null
    })) as StatRow[];
    
    return result;
  },
};

