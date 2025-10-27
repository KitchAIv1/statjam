// ============================================================================
// COACH GAME SERVICE
// ============================================================================
// Purpose: Business logic for coach game management
// Follows .cursorrules: <200 lines, single responsibility
// ============================================================================

import { supabase } from '../supabase';
import { CoachGame, QuickTrackGameRequest, CreateCoachGameRequest } from '../types/coach';

export class CoachGameService {
  /**
   * Create a quick track game for coach
   */
  static async createQuickTrackGame(request: QuickTrackGameRequest): Promise<CoachGame> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // TEMPORARY WORKAROUND: Create a dummy tournament for coach games
      // This will be removed once tournament_id is made nullable
      
      // Step 1: Create or get a dummy tournament for coach games
      let dummyTournamentId: string;
      
      try {
        // Try to find existing "Coach Games" tournament
        const { data: existingTournament } = await supabase
          .from('tournaments')
          .select('id')
          .eq('name', 'Coach Games (System)')
          .single();
          
        if (existingTournament) {
          dummyTournamentId = existingTournament.id;
        } else {
          // Create dummy tournament using correct schema
          const { data: newTournament, error: tournamentError } = await supabase
            .from('tournaments')
            .insert({
              name: 'Coach Games (System)',
              description: 'System tournament for coach-tracked games',
              organizer_id: user.id,
              status: 'active',
              tournament_type: 'single_elimination', // Correct column name
              start_date: new Date().toISOString(),
              end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
              venue: 'Various',
              max_teams: 999,
              current_teams: 0,
              is_public: false,
              entry_fee: 0,
              prize_pool: 0,
              country: 'US'
            })
            .select('id')
            .single();
            
          if (tournamentError) throw tournamentError;
          dummyTournamentId = newTournament.id;
        }
      } catch (tournamentErr) {
        console.error('Failed to create dummy tournament:', tournamentErr);
        throw new Error('Unable to create coach game - tournament setup failed');
      }

      // Step 2: Create the game with dummy tournament_id
      const { data, error } = await supabase
        .from('games')
        .insert({
          tournament_id: dummyTournamentId, // TEMPORARY: Use dummy tournament
          team_a_id: request.coach_team_id,
          team_b_id: request.coach_team_id, // Placeholder for coach mode
          stat_admin_id: user.id,
          status: 'scheduled',
          start_time: new Date().toISOString(),
          quarter: 1,
          game_clock_minutes: request.game_settings?.quarter_length_minutes || 12,
          game_clock_seconds: 0,
          is_clock_running: false,
          home_score: 0,
          away_score: 0
          // NOTE: Coach-specific fields will be added after migration
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        coach_id: user.id,
        coach_team_id: request.coach_team_id,
        opponent_name: request.opponent_name, // Store in memory until DB migration
        opponent_tournament_name: request.opponent_tournament_name,
        is_coach_game: true, // Hardcoded until DB migration
        status: data.status,
        start_time: data.start_time,
        quarter: data.quarter,
        game_clock_minutes: data.game_clock_minutes,
        game_clock_seconds: data.game_clock_seconds,
        is_clock_running: data.is_clock_running,
        home_score: data.home_score,
        away_score: data.away_score,
        meta_json: {
          // Store coach data here until proper columns exist
          coach_game: true,
          opponent_name: request.opponent_name,
          opponent_tournament_name: request.opponent_tournament_name,
          dummy_tournament_used: true // Flag for cleanup later
        },
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('❌ Error creating quick track game:', error);
      throw error;
    }
  }

  /**
   * Get coach games
   */
  static async getCoachGames(coachId: string): Promise<CoachGame[]> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_coach_game', true)
        .eq('stat_admin_id', coachId)
        .order('start_time', { ascending: false });

      if (error) throw error;

      return (data || []).map(game => ({
        id: game.id,
        coach_id: coachId,
        coach_team_id: game.team_a_id,
        opponent_name: game.opponent_name,
        opponent_tournament_name: game.meta_json?.opponent_tournament_name,
        is_coach_game: true,
        status: game.status,
        start_time: game.start_time,
        end_time: game.end_time,
        quarter: game.quarter,
        game_clock_minutes: game.game_clock_minutes,
        game_clock_seconds: game.game_clock_seconds,
        is_clock_running: game.is_clock_running,
        home_score: game.home_score,
        away_score: game.away_score,
        meta_json: game.meta_json,
        created_at: game.created_at,
        updated_at: game.updated_at
      }));
    } catch (error) {
      console.error('❌ Error fetching coach games:', error);
      throw error;
    }
  }

  /**
   * Update coach game
   */
  static async updateGame(gameId: string, updates: Partial<CoachGame>): Promise<void> {
    try {
      const { error } = await supabase
        .from('games')
        .update(updates)
        .eq('id', gameId)
        .eq('is_coach_game', true);

      if (error) throw error;
    } catch (error) {
      console.error('❌ Error updating coach game:', error);
      throw error;
    }
  }

  /**
   * Delete coach game
   */
  static async deleteGame(gameId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId)
        .eq('is_coach_game', true);

      if (error) throw error;
    } catch (error) {
      console.error('❌ Error deleting coach game:', error);
      throw error;
    }
  }
}
