'use client';

import { supabase } from '@/lib/supabase';

export interface SubstitutionRow {
  id: string;
  game_id: string;
  team_id: string;
  player_in_id: string | null; // ✅ Made nullable for custom player support
  player_out_id: string | null; // ✅ Made nullable for custom player support
  custom_player_in_id?: string | null; // ✅ NEW: Custom player coming in
  custom_player_out_id?: string | null; // ✅ NEW: Custom player going out
  quarter: number | null;
  game_time_minutes: number | null;
  game_time_seconds: number | null;
  video_timestamp_ms?: number | null; // ✅ Video tracking: milliseconds in video
  created_at: string | null;
}

export const SubstitutionsService = {
  async getByGameId(gameId: string): Promise<SubstitutionRow[]> {
    if (!supabase) {
      console.warn('SubstitutionsService.getByGameId: Supabase not initialized');
      return [];
    }
    
    const { data, error } = await supabase
      .from('game_substitutions')
      .select(
        'id, game_id, team_id, player_in_id, player_out_id, custom_player_in_id, custom_player_out_id, quarter, game_time_minutes, game_time_seconds, video_timestamp_ms, created_at'
      )
      .eq('game_id', gameId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('SubstitutionsService.getByGameId error:', error);
      return [];
    }
    return (data || []) as SubstitutionRow[];
  },
  
  /**
   * Delete a substitution record
   */
  async deleteSubstitution(substitutionId: string): Promise<boolean> {
    if (!supabase) {
      console.error('SubstitutionsService.deleteSubstitution: Supabase not initialized');
      return false;
    }
    
    const { error } = await supabase
      .from('game_substitutions')
      .delete()
      .eq('id', substitutionId);

    if (error) {
      console.error('SubstitutionsService.deleteSubstitution error:', error);
      return false;
    }
    return true;
  },
};

