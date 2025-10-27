// ============================================================================
// COACH PLAYER SERVICE
// ============================================================================
// Purpose: Business logic for coach player management
// Follows .cursorrules: <200 lines, single responsibility
// ============================================================================

import { supabase } from '../supabase';
import {
  CoachPlayer,
  AddPlayerToTeamRequest,
  RemovePlayerFromTeamRequest,
  SearchPlayersRequest,
  CreateCustomPlayerRequest,
  PlayerManagementResponse
} from '../types/coach';

export class CoachPlayerService {
  /**
   * Get players for a coach team
   */
  static async getCoachTeamPlayers(teamId: string): Promise<CoachPlayer[]> {
    try {
      const { data, error } = await supabase
        .from('team_players')
        .select(`
          id,
          player_id,
          users!inner (
            id,
            name,
            email,
            premium_status,
            created_at
          )
        `)
        .eq('team_id', teamId);

      if (error) throw error;

      return (data || []).map(tp => ({
        id: tp.users.id,
        name: tp.users.name || 'Unknown Player',
        email: tp.users.email,
        is_custom_player: false,
        profile_player_id: tp.users.id,
        premium_status: tp.users.premium_status,
        created_at: tp.users.created_at,
        team_player_id: tp.id,
        is_on_team: true
      }));
    } catch (error) {
      console.error('❌ Error fetching coach team players:', error);
      throw error;
    }
  }

  /**
   * Search available players (StatJam users with player role)
   */
  static async searchAvailablePlayers(request: SearchPlayersRequest): Promise<CoachPlayer[]> {
    try {
      let query = supabase
        .from('users')
        .select('id, name, email, premium_status, created_at')
        .eq('role', 'player')
        .order('premium_status', { ascending: false })
        .order('name', { ascending: true });

      // Add text search if provided
      if (request.query) {
        query = query.or(`name.ilike.%${request.query}%,email.ilike.%${request.query}%`);
      }

      // Limit results
      query = query.limit(request.limit || 50);

      const { data: players, error } = await query;
      if (error) throw error;

      // Get players already on the team to mark them
      let existingPlayerIds: string[] = [];
      if (request.exclude_team_id) {
        const { data: teamPlayers } = await supabase
          .from('team_players')
          .select('player_id')
          .eq('team_id', request.exclude_team_id);
        
        existingPlayerIds = (teamPlayers || []).map(tp => tp.player_id);
      }

      return (players || []).map(player => ({
        id: player.id,
        name: player.name || 'Unknown Player',
        email: player.email,
        is_custom_player: false,
        profile_player_id: player.id,
        premium_status: player.premium_status,
        created_at: player.created_at,
        is_on_team: existingPlayerIds.includes(player.id)
      }));
    } catch (error) {
      console.error('❌ Error searching available players:', error);
      throw error;
    }
  }

  /**
   * Add existing StatJam user to coach team
   */
  static async addPlayerToTeam(request: AddPlayerToTeamRequest): Promise<PlayerManagementResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (request.player_id) {
        // Add existing StatJam user
        const { error } = await supabase
          .from('team_players')
          .insert({
            team_id: request.team_id,
            player_id: request.player_id
          });

        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            return {
              success: false,
              message: 'Player is already on this team'
            };
          }
          throw error;
        }

        return {
          success: true,
          message: 'Player added to team successfully'
        };
      } else if (request.custom_player) {
        // Create custom player (not implemented yet - would need custom players table)
        return {
          success: false,
          message: 'Custom players not yet implemented'
        };
      } else {
        throw new Error('Either player_id or custom_player must be provided');
      }
    } catch (error) {
      console.error('❌ Error adding player to team:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add player'
      };
    }
  }

  /**
   * Remove player from coach team
   */
  static async removePlayerFromTeam(request: RemovePlayerFromTeamRequest): Promise<PlayerManagementResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('team_players')
        .delete()
        .eq('id', request.team_player_id)
        .eq('team_id', request.team_id); // Extra security check

      if (error) throw error;

      return {
        success: true,
        message: 'Player removed from team successfully'
      };
    } catch (error) {
      console.error('❌ Error removing player from team:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to remove player'
      };
    }
  }

  /**
   * Get player count for a team
   */
  static async getTeamPlayerCount(teamId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('team_players')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('❌ Error getting team player count:', error);
      return 0;
    }
  }

  /**
   * Validate minimum players for Quick Track
   */
  static async validateMinimumPlayers(teamId: string, minimum: number = 5): Promise<{
    isValid: boolean;
    currentCount: number;
    message?: string;
  }> {
    try {
      const currentCount = await this.getTeamPlayerCount(teamId);
      
      return {
        isValid: currentCount >= minimum,
        currentCount,
        message: currentCount < minimum 
          ? `Need at least ${minimum} players to start tracking. Currently have ${currentCount}.`
          : undefined
      };
    } catch (error) {
      console.error('❌ Error validating minimum players:', error);
      return {
        isValid: false,
        currentCount: 0,
        message: 'Unable to validate player count'
      };
    }
  }
}
