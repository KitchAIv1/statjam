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
    console.log('🔍 StatsService: Fetching stats with user data for game:', gameId);
    
    const { data, error } = await supabase
      .from('game_stats')
      .select(`
        id, game_id, team_id, player_id, stat_type, stat_value, modifier, quarter, game_time_minutes, game_time_seconds, created_at,
        users!player_id (
          id, email, name
        )
      `)
      .eq('game_id', gameId)
      .order('created_at', { ascending: true }); // ascending for cumulative processing

    if (error) {
      console.warn('StatsService.getByGameId error:', error);
      return [];
    }
    
    console.log('✅ StatsService: Loaded', data?.length || 0, 'stats with user data');
    if (data && data.length > 0) {
      console.log('🔍 Sample stat with user:', {
        statType: data[0].stat_type,
        playerId: data[0].player_id,
        userName: data[0].users?.name,
        userEmail: data[0].users?.email
      });
    }
    
    return (data || []) as StatRow[];
  },
};

