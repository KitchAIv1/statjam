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
  async searchAvailablePlayers(request: PlayerSearchRequest): Promise<GenericPlayer[]> {
    const { TeamService } = await import('./tournamentService');
    const { supabase } = await import('@/lib/supabase');
    
    // Get all players
    const allPlayers = await TeamService.getAllPlayers();
    
    // ✅ FIX: Get ALL players already assigned to teams in this tournament
    let assignedPlayerIds: Set<string> = new Set();
    let tournamentId: string | null = null;
    
    // Determine tournament ID from either direct tournament_id or team_id
    if (request.tournament_id) {
      // Team creation flow: tournament_id provided directly
      tournamentId = request.tournament_id;
    } else if (request.team_id && request.team_id !== 'temp') {
      // Team management flow: query tournament from team_id
      const isValidTeamId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(request.team_id);
      
      if (isValidTeamId) {
        try {
          const { data: teamData } = await supabase
            .from('teams')
            .select('tournament_id')
            .eq('id', request.team_id)
            .single();
          
          tournamentId = teamData?.tournament_id || null;
        } catch (error) {
          console.error('❌ Error querying team tournament:', error);
        }
      }
    }
    
    // If we have a tournament ID, get all assigned players
    if (tournamentId) {
      try {
        // Get all teams in this tournament
        const { data: tournamentTeams } = await supabase
          .from('teams')
          .select('id')
          .eq('tournament_id', tournamentId);
        
        if (tournamentTeams && tournamentTeams.length > 0) {
          const teamIds = tournamentTeams.map(t => t.id);
          
          // Get all players assigned to ANY team in this tournament
          const { data: teamPlayers } = await supabase
            .from('team_players')
            .select('player_id')
            .in('team_id', teamIds)
            .not('player_id', 'is', null);
          
          if (teamPlayers) {
            assignedPlayerIds = new Set(teamPlayers.map(tp => tp.player_id));
            console.log(`✅ Found ${assignedPlayerIds.size} players already assigned to teams in tournament ${tournamentId}`);
          }
        }
      } catch (error) {
        console.error('❌ Error checking assigned players:', error);
      }
    }
    
    // Filter by query if provided
    let filteredPlayers = allPlayers;
    if (request.query) {
      const query = request.query.toLowerCase();
      filteredPlayers = allPlayers.filter(p => 
        p.name.toLowerCase().includes(query) ||
        (p.email && p.email.toLowerCase().includes(query))
      );
    }
    
    // Apply limit
    if (request.limit) {
      filteredPlayers = filteredPlayers.slice(0, request.limit);
    }
    
    // Map to GenericPlayer with is_on_team flag
    return filteredPlayers.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      jersey_number: p.jerseyNumber,
      position: p.position,
      is_custom_player: false,
      premium_status: p.isPremium,
      created_at: p.createdAt,
      is_on_team: assignedPlayerIds.has(p.id), // ✅ FIX: Set flag if player is on any team
      profile_photo_url: p.profilePhotoUrl // ✅ FIX: Include profile photo URL
    }));
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

