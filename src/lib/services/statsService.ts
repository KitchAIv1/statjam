'use client';

import { supabase } from '@/lib/supabase';

export interface StatRow {
  id: string;
  game_id: string;
  team_id: string;
  player_id: string;
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
}

export const StatsService = {
  async getByGameId(gameId: string): Promise<StatRow[]> {
    console.log('🔍 StatsService: Fetching stats for game:', gameId);
    
    // Step 1: Get stats without JOINs for better performance
    const { data: stats, error: statsError } = await supabase
      .from('game_stats')
      .select('id, game_id, team_id, player_id, stat_type, stat_value, modifier, quarter, game_time_minutes, game_time_seconds, created_at')
      .eq('game_id', gameId)
      .order('created_at', { ascending: true });

    if (statsError) {
      console.warn('StatsService.getByGameId error:', statsError);
      return [];
    }

    if (!stats || stats.length === 0) {
      console.log('✅ StatsService: No stats found for game:', gameId);
      return [];
    }

    // Step 2: Get unique player IDs and fetch user data separately
    const playerIds = [...new Set(stats.map(s => s.player_id).filter(Boolean))];
    
    if (playerIds.length === 0) {
      console.log('✅ StatsService: Loaded', stats.length, 'stats (no player data needed)');
      return stats.map(stat => ({ ...stat, users: null })) as StatRow[];
    }

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .in('id', playerIds);

    if (usersError) {
      console.warn('StatsService: Error fetching user data:', usersError);
      // Return stats without user data rather than failing completely
      return stats.map(stat => ({ ...stat, users: null })) as StatRow[];
    }

    // Step 3: Create user lookup map and combine data
    const userMap = new Map(users?.map(u => [u.id, u]) || []);
    
    const result = stats.map(stat => ({
      ...stat,
      users: userMap.get(stat.player_id) || null
    })) as StatRow[];
    
    console.log('✅ StatsService: Loaded', result.length, 'stats with user data');
    
    return result;
  },
};

