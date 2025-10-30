/**
 * Coach Player Management Service
 * 
 * Purpose: Coach-specific implementation of IPlayerManagementService
 * Wraps CoachPlayerService to provide generic interface
 * Follows .cursorrules: <200 lines, single responsibility (Coach service only)
 * 
 * @module coachPlayerManagementService
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
import { 
  SearchPlayersRequest, 
  AddPlayerRequest, 
  RemovePlayerRequest 
} from '@/lib/types/coach';

/**
 * Coach Player Management Service Implementation
 * 
 * Maps CoachPlayerService to generic interface for component reusability
 */
export class CoachPlayerManagementService implements IPlayerManagementService {
  async searchAvailablePlayers(request: PlayerSearchRequest): Promise<GenericPlayer[]> {
    const { CoachPlayerService } = await import('./coachPlayerService');
    
    const searchRequest: SearchPlayersRequest = {
      query: request.query,
      exclude_team_id: request.exclude_team_id,
      limit: request.limit || 50
    };
    
    const players = await CoachPlayerService.searchAvailablePlayers(searchRequest);
    
    // Map CoachPlayer to GenericPlayer
    return players.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      jersey_number: p.jersey_number,
      position: p.position,
      is_custom_player: p.is_custom_player,
      premium_status: p.premium_status,
      created_at: p.created_at,
      is_on_team: p.is_on_team,
      team_player_id: p.team_player_id
    }));
  }
  
  async getTeamPlayers(teamId: string): Promise<GenericPlayer[]> {
    const { CoachPlayerService } = await import('./coachPlayerService');
    const players = await CoachPlayerService.getCoachTeamPlayers(teamId);
    
    return players.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      jersey_number: p.jersey_number,
      position: p.position,
      is_custom_player: p.is_custom_player,
      premium_status: p.premium_status,
      created_at: p.created_at,
      is_on_team: p.is_on_team,
      team_player_id: p.team_player_id
    }));
  }
  
  async getTeamPlayerCount(teamId: string): Promise<number> {
    const { CoachPlayerService } = await import('./coachPlayerService');
    return await CoachPlayerService.getTeamPlayerCount(teamId);
  }
  
  async addPlayerToTeam(request: AddPlayerToTeamRequest): Promise<ServiceResponse> {
    const { CoachPlayerService } = await import('./coachPlayerService');
    
    const addRequest: AddPlayerRequest = {
      team_id: request.team_id,
      player_id: request.player_id
    };
    
    return await CoachPlayerService.addPlayerToTeam(addRequest);
  }
  
  async removePlayerFromTeam(request: RemovePlayerFromTeamRequest): Promise<ServiceResponse> {
    const { CoachPlayerService } = await import('./coachPlayerService');
    
    const removeRequest: RemovePlayerRequest = {
      team_id: request.team_id,
      team_player_id: request.team_player_id
    };
    
    return await CoachPlayerService.removePlayerFromTeam(removeRequest);
  }
  
  async createCustomPlayer(request: CreateCustomPlayerRequest): Promise<ServiceResponse<GenericPlayer>> {
    const { CoachPlayerService } = await import('./coachPlayerService');
    
    const response = await CoachPlayerService.createCustomPlayer(request);
    
    if (response.success && response.data) {
      const player = response.data;
      return {
        success: true,
        data: {
          id: player.id,
          name: player.name,
          jersey_number: player.jersey_number,
          position: player.position,
          is_custom_player: true,
          created_at: player.created_at
        },
        message: response.message
      };
    }
    
    return {
      success: false,
      error: response.message || 'Failed to create custom player'
    };
  }
  
  async validateMinimumPlayers(teamId: string, minPlayers: number): Promise<{
    isValid: boolean;
    currentCount: number;
    message?: string;
  }> {
    const { CoachPlayerService } = await import('./coachPlayerService');
    return await CoachPlayerService.validateMinimumPlayers(teamId, minPlayers);
  }
}

