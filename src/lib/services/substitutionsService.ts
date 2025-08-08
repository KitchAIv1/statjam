'use client';

import { supabase } from '@/lib/supabase';

export interface SubstitutionRow {
  id: string;
  game_id: string;
  team_id: string;
  player_in_id: string;
  player_out_id: string;
  quarter: number | null;
  game_time_minutes: number | null;
  game_time_seconds: number | null;
  created_at: string | null;
}

export const SubstitutionsService = {
  async getByGameId(gameId: string): Promise<SubstitutionRow[]> {
    const { data, error } = await supabase
      .from('game_substitutions')
      .select(
        'id, game_id, team_id, player_in_id, player_out_id, quarter, game_time_minutes, game_time_seconds, created_at'
      )
      .eq('game_id', gameId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('SubstitutionsService.getByGameId error:', error);
      return [];
    }
    return (data || []) as SubstitutionRow[];
  },
};

