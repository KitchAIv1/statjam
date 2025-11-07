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
   * Get players for a coach team (both StatJam users and custom players)
   */
  static async getCoachTeamPlayers(teamId: string): Promise<CoachPlayer[]> {
    try {
      console.log('🔍 CoachPlayerService: Fetching players for team:', teamId);
      
      const players: CoachPlayer[] = [];

      // Get regular StatJam users (this should always work)
      try {
        const regularPlayersResult = await supabase
          .from('team_players')
          .select(`
            id,
            player_id,
            users!inner (
              id,
              name,
              email,
              premium_status,
              created_at,
              profile_photo_url
            )
          `)
          .eq('team_id', teamId)
          .not('player_id', 'is', null);

        if (regularPlayersResult.error) {
          console.error('❌ Error fetching regular players:', regularPlayersResult.error);
        } else {
          // Add regular players
          (regularPlayersResult.data || []).forEach(tp => {
            players.push({
              id: tp.users.id,
              name: tp.users.name || 'Unknown Player',
              email: tp.users.email,
              is_custom_player: false,
              profile_player_id: tp.users.id,
              premium_status: tp.users.premium_status,
              created_at: tp.users.created_at,
              team_player_id: tp.id,
              is_on_team: true,
              photo_url: tp.users.profile_photo_url || null // Map profile_photo_url to photo_url for UI
            });
          });
          console.log('✅ Loaded', regularPlayersResult.data?.length || 0, 'regular players');
        }
      } catch (error) {
        console.error('❌ Error in regular players query:', error);
      }

      // Try to get custom players - this will fail gracefully if migration not applied
      try {
        // Check if custom_player_id column exists by trying a simple query
        const testResult = await supabase
          .from('team_players')
          .select('custom_player_id')
          .limit(1);

        if (!testResult.error) {
          console.log('✅ custom_player_id column exists, trying to fetch custom players');
          
          const customPlayersResult = await supabase
            .from('team_players')
            .select(`
              id,
              custom_player_id,
              custom_players!inner (
                id,
                name,
                jersey_number,
                position,
                created_at
              )
            `)
            .eq('team_id', teamId)
            .not('custom_player_id', 'is', null);

          if (customPlayersResult.error) {
            console.log('⚠️ Custom players query failed (expected if no custom players exist):', customPlayersResult.error.message);
          } else {
            // Add custom players
            (customPlayersResult.data || []).forEach(tp => {
              players.push({
                id: tp.custom_players.id,
                name: tp.custom_players.name,
                jersey_number: tp.custom_players.jersey_number,
                is_custom_player: true,
                created_at: tp.custom_players.created_at,
                team_player_id: tp.id,
                is_on_team: true
              });
            });
            console.log('✅ Loaded', customPlayersResult.data?.length || 0, 'custom players');
          }
        } else {
          console.log('⚠️ custom_player_id column does not exist yet - migration not applied');
        }
      } catch (error) {
        console.log('⚠️ Custom players not available - migration not applied:', error);
      }

      console.log('✅ Total players loaded:', players.length);
      return players;
    } catch (error) {
      console.error('❌ Error fetching coach team players:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
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
        // Create custom player and add to team
        return await this.createCustomPlayer({
          team_id: request.team_id,
          name: request.custom_player.name,
          jersey_number: request.custom_player.jersey_number,
          position: request.custom_player.position
        });
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
   * Create custom player for a team
   */
  static async createCustomPlayer(request: CreateCustomPlayerRequest): Promise<PlayerManagementResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if custom_players table and custom_player_id column exist
      try {
        // Test both table and column existence
        await supabase.from('custom_players').select('id').limit(1);
        const columnTest = await supabase.from('team_players').select('custom_player_id').limit(1);
        
        if (columnTest.error) {
          return {
            success: false,
            message: 'Database migration incomplete. The custom_player_id column is missing from team_players table.'
          };
        }
      } catch (error) {
        return {
          success: false,
          message: 'Custom players feature not available. Please apply the database migration (005_custom_players_schema.sql) first.'
        };
      }

      // Step 1: Create custom player record
      const { data: customPlayer, error: customPlayerError } = await supabase
        .from('custom_players')
        .insert({
          team_id: request.team_id,
          coach_id: user.id,
          name: request.name,
          jersey_number: request.jersey_number,
          position: request.position
        })
        .select()
        .single();

      if (customPlayerError) {
        if (customPlayerError.code === '23505') { // Unique constraint violation
          return {
            success: false,
            message: 'Jersey number already taken on this team'
          };
        }
        console.error('❌ Custom player creation error:', customPlayerError);
        return {
          success: false,
          message: `Database error: ${customPlayerError.message}`
        };
      }

      // Step 2: Add to team_players table
      const { error: teamPlayerError } = await supabase
        .from('team_players')
        .insert({
          team_id: request.team_id,
          custom_player_id: customPlayer.id
        });

      if (teamPlayerError) {
        console.error('❌ Team player insertion error:', teamPlayerError);
        return {
          success: false,
          message: `Failed to add player to team: ${teamPlayerError.message}`
        };
      }

      // Step 3: Return success with player data
      const player: CoachPlayer = {
        id: customPlayer.id,
        name: customPlayer.name,
        jersey_number: customPlayer.jersey_number,
        is_custom_player: true,
        created_at: customPlayer.created_at,
        is_on_team: true
      };

      return {
        success: true,
        message: 'Custom player created successfully',
        player
      };
    } catch (error) {
      console.error('❌ Error creating custom player:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create custom player'
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
