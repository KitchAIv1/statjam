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
    
    // Get all players (Organizer uses getAllPlayers, then filters client-side)
    const allPlayers = await TeamService.getAllPlayers();
    
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
    
    // Map to GenericPlayer
    return filteredPlayers.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      jersey_number: p.jerseyNumber,
      position: p.position,
      is_custom_player: false, // Organizer players are all StatJam users
      premium_status: p.isPremium,
      created_at: p.createdAt
    }));
  }
  
  async getTeamPlayers(teamId: string): Promise<GenericPlayer[]> {
    // Note: This requires tournament context which we don't have here
    // For now, return empty array - will be implemented when integrating
    console.warn('⚠️ OrganizerPlayerManagementService.getTeamPlayers not fully implemented yet');
    return [];
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
    // Note: TeamService doesn't have removePlayerFromTeam yet
    // Will be implemented in Phase 3
    return {
      success: false,
      error: 'Remove player not implemented for Organizer yet'
    };
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

