// ============================================================================
// COACH PLAYER SERVICE
// ============================================================================
// Purpose: Business logic for coach player management
// Follows .cursorrules: <200 lines, single responsibility
// ============================================================================

import { supabase } from '../supabase';
import { cache } from '../utils/cache';
import {
  CoachPlayer,
  AddPlayerToTeamRequest,
  RemovePlayerFromTeamRequest,
  SearchPlayersRequest,
  CreateCustomPlayerRequest,
  UpdateCustomPlayerRequest,
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
            const playerData = {
              id: tp.users.id,
              name: tp.users.name || 'Unknown Player',
              email: tp.users.email,
              is_custom_player: false,
              profile_player_id: tp.users.id,
              premium_status: tp.users.premium_status,
              created_at: tp.users.created_at,
              team_player_id: tp.id,
              is_on_team: true,
              profile_photo_url: tp.users.profile_photo_url || null, // Use profile_photo_url to match GenericPlayer interface
              photo_url: tp.users.profile_photo_url || null // Keep for backwards compatibility
            };
            players.push(playerData);
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
                created_at,
                profile_photo_url,
                pose_photo_url
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
                position: tp.custom_players.position,
                is_custom_player: true,
                created_at: tp.custom_players.created_at,
                team_player_id: tp.id,
                is_on_team: true,
                profile_photo_url: (tp.custom_players as any).profile_photo_url || null,
                pose_photo_url: (tp.custom_players as any).pose_photo_url || null
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
   * Get coach team players with substitutions applied for a specific game.
   * Returns players ordered: on-court first (0-4), then bench (5+).
   * This is the source of truth for current on-court state.
   */
  static async getCoachTeamPlayersWithSubstitutions(
    teamId: string, 
    gameId: string
  ): Promise<CoachPlayer[]> {
    try {
      console.log('🏀 CoachPlayerService: Fetching players with substitutions for team:', teamId, 'game:', gameId);

      // Get base roster
      const basePlayers = await this.getCoachTeamPlayers(teamId);
      
      if (basePlayers.length === 0) {
        return basePlayers;
      }

      // Get substitutions for this game and team
      const { data: substitutions, error } = await supabase
        .from('game_substitutions')
        .select('player_in_id, player_out_id, custom_player_in_id, custom_player_out_id, created_at')
        .eq('game_id', gameId)
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching substitutions:', error);
        return basePlayers;
      }

      console.log('✅ Found', substitutions?.length || 0, 'substitutions for this game/team');

      if (!substitutions || substitutions.length === 0) {
        return basePlayers;
      }

      // Start with first 5 players as on-court, rest as bench
      const onCourtPlayerIds = new Set(basePlayers.slice(0, 5).map(p => p.id));
      const benchPlayerIds = new Set(basePlayers.slice(5).map(p => p.id));

      // Apply each substitution to update on-court status
      for (const sub of substitutions) {
        // Use either regular or custom player ID
        const playerOutId = sub.player_out_id || sub.custom_player_out_id;
        const playerInId = sub.player_in_id || sub.custom_player_in_id;

        // Move player out from on-court to bench
        if (onCourtPlayerIds.has(playerOutId)) {
          onCourtPlayerIds.delete(playerOutId);
          benchPlayerIds.add(playerOutId);
        }

        // Move player in from bench to on-court
        if (benchPlayerIds.has(playerInId)) {
          benchPlayerIds.delete(playerInId);
          onCourtPlayerIds.add(playerInId);
        }
      }

      // Rebuild roster with on-court players first, then bench players
      const onCourtPlayers = basePlayers.filter(p => onCourtPlayerIds.has(p.id));
      const benchPlayers = basePlayers.filter(p => benchPlayerIds.has(p.id));
      const currentRoster = [...onCourtPlayers, ...benchPlayers];

      console.log('🎯 CoachPlayerService: Final roster state:', {
        totalSubstitutions: substitutions.length,
        onCourtCount: onCourtPlayers.length,
        benchCount: benchPlayers.length,
        firstFive: currentRoster.slice(0, 5).map(p => ({ id: p.id, name: p.name }))
      });

      return currentRoster;

    } catch (error) {
      console.error('❌ Error in getCoachTeamPlayersWithSubstitutions:', error);
      // Fallback to base roster if substitution logic fails
      return this.getCoachTeamPlayers(teamId);
    }
  }

  /**
   * Search available players (StatJam users with player role)
   */
  static async searchAvailablePlayers(request: SearchPlayersRequest): Promise<CoachPlayer[]> {
    try {
      let query = supabase
        .from('users')
        .select('id, name, email, premium_status, created_at, profile_photo_url')
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
        is_on_team: existingPlayerIds.includes(player.id),
        profile_photo_url: player.profile_photo_url || null, // Include profile photo URL
        photo_url: player.profile_photo_url || null // Keep for backwards compatibility
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

      // Step 1: Validate and sanitize input data
      const insertData: Record<string, any> = {
        team_id: request.team_id,
        coach_id: user.id,
        name: request.name,
      };

      // Handle jersey_number: only include if valid number
      if (request.jersey_number !== undefined && request.jersey_number !== null) {
        const jerseyNum = typeof request.jersey_number === 'number' 
          ? request.jersey_number 
          : parseInt(String(request.jersey_number), 10);
        if (!isNaN(jerseyNum) && jerseyNum >= 0 && jerseyNum <= 99) {
          insertData.jersey_number = jerseyNum;
        }
        // If invalid, omit jersey_number (allows NULL in database)
      }

      // Handle position: only include if valid value
      if (request.position && request.position.trim() !== '' && request.position !== 'none') {
        insertData.position = request.position;
      }
      // If undefined/empty, omit position (allows NULL in database)

      // Handle photo URLs
      insertData.profile_photo_url = request.profile_photo_url || null;
      insertData.pose_photo_url = request.pose_photo_url || null;

      console.log('📤 Creating custom player with data:', {
        team_id: insertData.team_id,
        coach_id: insertData.coach_id?.substring(0, 8),
        name: insertData.name,
        jersey_number: insertData.jersey_number,
        position: insertData.position,
        has_profile_photo: !!insertData.profile_photo_url,
        has_pose_photo: !!insertData.pose_photo_url
      });

      // Step 2: Create custom player record
      const { data: customPlayer, error: customPlayerError } = await supabase
        .from('custom_players')
        .insert(insertData)
        .select()
        .single();

      if (customPlayerError) {
        console.error('❌ Custom player creation error:', {
          code: customPlayerError.code,
          message: customPlayerError.message,
          details: customPlayerError.details,
          hint: customPlayerError.hint,
          insertData: insertData
        });
        
        if (customPlayerError.code === '23505') { // Unique constraint violation
          return {
            success: false,
            message: 'Jersey number already taken on this team'
          };
        }
        
        // Provide more detailed error message
        const errorMessage = customPlayerError.details 
          ? `${customPlayerError.message}: ${customPlayerError.details}`
          : customPlayerError.message || 'Unknown database error';
        
        return {
          success: false,
          message: `Database error: ${errorMessage}`
        };
      }

      // Step 3: Add to team_players table
      console.log('📤 Adding custom player to team_players:', {
        team_id: request.team_id,
        custom_player_id: customPlayer.id.substring(0, 8)
      });
      
      const { error: teamPlayerError } = await supabase
        .from('team_players')
        .insert({
          team_id: request.team_id,
          custom_player_id: customPlayer.id
        });

      if (teamPlayerError) {
        console.error('❌ Team player insertion error:', {
          code: teamPlayerError.code,
          message: teamPlayerError.message,
          details: teamPlayerError.details,
          hint: teamPlayerError.hint
        });
        return {
          success: false,
          message: `Failed to add player to team: ${teamPlayerError.message || 'Unknown error'}`
        };
      }
      
      console.log('✅ Custom player added to team_players successfully');

      // Step 3: Return success with player data
      const player: CoachPlayer = {
        id: customPlayer.id,
        name: customPlayer.name,
        jersey_number: customPlayer.jersey_number,
        position: customPlayer.position,
        is_custom_player: true,
        created_at: customPlayer.created_at,
        is_on_team: true,
        profile_photo_url: (customPlayer as any).profile_photo_url || null,
        pose_photo_url: (customPlayer as any).pose_photo_url || null
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
   * Update custom player details and photos
   */
  static async updateCustomPlayer(
    customPlayerId: string,
    updates: UpdateCustomPlayerRequest
  ): Promise<PlayerManagementResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Verify coach owns this custom player
      const { data: customPlayer, error: fetchError } = await supabase
        .from('custom_players')
        .select('coach_id')
        .eq('id', customPlayerId)
        .single();

      if (fetchError || !customPlayer) {
        return {
          success: false,
          message: 'Custom player not found'
        };
      }

      if (customPlayer.coach_id !== user.id) {
        return {
          success: false,
          message: 'Permission denied'
        };
      }

      // Update custom player
      const updateData: Record<string, any> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.jersey_number !== undefined) updateData.jersey_number = updates.jersey_number;
      if (updates.position !== undefined) updateData.position = updates.position;
      if (updates.profile_photo_url !== undefined) updateData.profile_photo_url = updates.profile_photo_url;
      if (updates.pose_photo_url !== undefined) updateData.pose_photo_url = updates.pose_photo_url;

      const { data: updatedPlayer, error: updateError } = await supabase
        .from('custom_players')
        .update(updateData)
        .eq('id', customPlayerId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating custom player:', updateError);
        return {
          success: false,
          message: `Failed to update player: ${updateError.message}`
        };
      }

      const player: CoachPlayer = {
        id: updatedPlayer.id,
        name: updatedPlayer.name,
        jersey_number: updatedPlayer.jersey_number,
        position: updatedPlayer.position,
        is_custom_player: true,
        created_at: updatedPlayer.created_at,
        is_on_team: true,
        profile_photo_url: (updatedPlayer as any).profile_photo_url || null,
        pose_photo_url: (updatedPlayer as any).pose_photo_url || null
      };

      // ✅ FIX: Invalidate cache to ensure fresh data on next fetch
      // This fixes Issue 2: Photos display on cards but not profile modal
      const cacheKey = `custom_player_${customPlayerId}`;
      cache.delete(cacheKey);
      console.log('🔄 Invalidated custom player cache for:', customPlayerId.substring(0, 8));

      return {
        success: true,
        message: 'Custom player updated successfully',
        player
      };
    } catch (error) {
      console.error('❌ Error updating custom player:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update custom player'
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
