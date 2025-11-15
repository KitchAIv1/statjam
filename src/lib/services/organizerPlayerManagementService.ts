/**
 * Organizer Player Management Service
 * 
 * Purpose: Organizer-specific implementation of IPlayerManagementService
 * Wraps TeamService to provide generic interface for tournament team management
 * Follows .cursorrules: <200 lines, single responsibility (Organizer service only)
 * 
 * @module organizerPlayerManagementService
 */

import {
  IPlayerManagementService,
  GenericPlayer,
  PlayerSearchRequest,
  PlayerSearchResponse,
  AddPlayerToTeamRequest,
  RemovePlayerFromTeamRequest,
  CreateCustomPlayerRequest,
  ServiceResponse
} from '@/lib/types/playerManagement';

/**
 * Organizer Player Management Service Implementation
 * 
 * Maps TeamService to generic interface for component reusability
 * Used for tournament team management
 */
export class OrganizerPlayerManagementService implements IPlayerManagementService {
  async searchAvailablePlayers(request: PlayerSearchRequest): Promise<PlayerSearchResponse> {
    const { supabase } = await import('@/lib/supabase');
    
    try {
      // ✅ FIX: Query database directly with search filters (removes 100-player limit)
      // Build query with database-level filtering for better performance
      const limit = request.limit || 50; // Default page size
      const offset = request.offset || 0;
      
      let query = supabase
        .from('users')
        .select('id, name, email, premium_status, country, created_at, profile_photo_url', { count: 'exact' })
        .eq('role', 'player')
        .order('premium_status', { ascending: false }) // Premium players first
        .order('created_at', { ascending: false }); // Newest first
      
      // Add text search at database level if provided
      if (request.query) {
        query = query.or(`name.ilike.%${request.query}%,email.ilike.%${request.query}%`);
      }
      
      // Apply pagination
      query = query.range(offset, offset + limit - 1);
      
      const { data: playerUsers, error: playersError, count } = await query;
      
      if (playersError) {
        console.error('❌ Error searching players:', playersError);
        return { players: [], hasMore: false };
      }
      
      if (!playerUsers || playerUsers.length === 0) {
        return { players: [], hasMore: false };
      }
      
      // Determine if there are more results
      const hasMore = count !== null ? (offset + limit < count) : playerUsers.length === limit;
      
      // ✅ FIX: Only exclude players already on the SPECIFIC team being managed
      // NOT all teams in the tournament (allows players on multiple teams)
      let assignedPlayerIds: Set<string> = new Set();
      
      // Only check if we have a real team_id (not 'temp' for team creation)
      if (request.team_id && request.team_id !== 'temp') {
        const isValidTeamId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(request.team_id);
        
        if (isValidTeamId) {
          try {
            // ✅ FIX: Only get players on THIS specific team (not all teams in tournament)
            const { data: teamPlayers } = await supabase
              .from('team_players')
              .select('player_id')
              .eq('team_id', request.team_id)
              .not('player_id', 'is', null);
            
            if (teamPlayers) {
              assignedPlayerIds = new Set(teamPlayers.map(tp => tp.player_id));
              console.log(`✅ Found ${assignedPlayerIds.size} players already on team ${request.team_id}`);
            }
          } catch (error) {
            console.error('❌ Error checking assigned players:', error);
          }
        }
      }
      // ✅ NOTE: For team creation (team_id === 'temp'), show ALL players
      // They can be added to the new team even if they're on other teams
      
      // Map to GenericPlayer with is_on_team flag
      const players = playerUsers.map((user, index) => ({
        id: user.id,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        jersey_number: offset + index + 1, // Sequential jersey numbers (for display)
        position: 'PG' as const, // Default position
        is_custom_player: false,
        premium_status: user.premium_status || false,
        created_at: user.created_at || new Date().toISOString(),
        is_on_team: assignedPlayerIds.has(user.id), // Set flag if player is on any team
        profile_photo_url: user.profile_photo_url || undefined
      }));
      
      return {
        players,
        hasMore,
        totalCount: count || undefined
      };
    } catch (error) {
      console.error('❌ Error in searchAvailablePlayers:', error);
      return { players: [], hasMore: false };
    }
  }
  
  async getTeamPlayers(teamId: string): Promise<GenericPlayer[]> {
    // ✅ FIX #2: Implement getTeamPlayers using existing TeamService method
    const { TeamService } = await import('./tournamentService');
    const { supabase } = await import('@/lib/supabase');
    
    try {
      // Get players from TeamService
      const players = await TeamService.getTeamPlayers(teamId);
      
      // Get team_player IDs for the relationship mapping
      const { data: teamPlayerRelations } = await supabase
        .from('team_players')
        .select('id, player_id')
        .eq('team_id', teamId);
      
      // Create a map of player_id -> team_player_id
      const teamPlayerMap = new Map(
        (teamPlayerRelations || []).map(tp => [tp.player_id, tp.id])
      );
      
      // Map to GenericPlayer format with team_player_id
      return players.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        jersey_number: p.jerseyNumber,
        position: p.position,
        is_custom_player: false,
        premium_status: p.isPremium,
        created_at: p.createdAt,
        is_on_team: true,
        team_player_id: teamPlayerMap.get(p.id), // ✅ Include team_player_id for removal
        profile_photo_url: p.profilePhotoUrl // ✅ FIX: Include profile photo URL
      }));
    } catch (error) {
      console.error('❌ Error getting team players:', error);
      return [];
    }
  }
  
  async getTeamPlayerCount(teamId: string): Promise<number> {
    const players = await this.getTeamPlayers(teamId);
    return players.length;
  }
  
  async addPlayerToTeam(request: AddPlayerToTeamRequest): Promise<ServiceResponse> {
    try {
      const { TeamService } = await import('./tournamentService');
      
      await TeamService.addPlayerToTeam(
        request.team_id,
        request.player_id,
        request.position,
        request.jersey_number
      );
      
      return {
        success: true,
        message: 'Player added successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add player'
      };
    }
  }
  
  async removePlayerFromTeam(request: RemovePlayerFromTeamRequest): Promise<ServiceResponse> {
    // ✅ FIX #2B: Implement removePlayerFromTeam using existing TeamService method
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // Remove from team_players table using team_player_id
      const { error } = await supabase
        .from('team_players')
        .delete()
        .eq('id', request.team_player_id);
      
      if (error) {
        console.error('❌ Error removing player from team:', error);
        return {
          success: false,
          error: error.message || 'Failed to remove player from team'
        };
      }
      
      console.log('✅ Successfully removed player from team');
      return {
        success: true,
        message: 'Player removed successfully'
      };
    } catch (error) {
      console.error('❌ Error in removePlayerFromTeam:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove player'
      };
    }
  }
  
  async createCustomPlayer(request: CreateCustomPlayerRequest): Promise<ServiceResponse<GenericPlayer>> {
    // Organizer doesn't support custom players (tournament teams use StatJam users only)
    return {
      success: false,
      error: 'Custom players not supported for tournament teams'
    };
  }
  
  async validateMinimumPlayers(teamId: string, minPlayers: number): Promise<{
    isValid: boolean;
    currentCount: number;
    message?: string;
  }> {
    const count = await this.getTeamPlayerCount(teamId);
    const isValid = count >= minPlayers;
    
    return {
      isValid,
      currentCount: count,
      message: isValid 
        ? undefined 
        : `Need ${minPlayers - count} more player${minPlayers - count !== 1 ? 's' : ''} (minimum ${minPlayers})`
    };
  }
}

