/**
 * Player Management Types
 * 
 * Purpose: Shared types for player management across Coach and Organizer dashboards
 * Follows .cursorrules: <100 lines, single responsibility (types only)
 * 
 * @module playerManagement
 */

/**
 * Generic player type that works for both Coach and Organizer contexts
 */
export interface GenericPlayer {
  id: string;
  name: string;
  email?: string;
  jersey_number?: number;
  position?: string;
  is_custom_player?: boolean;
  premium_status?: boolean;
  created_at?: string;
  
  // UI-specific fields
  is_on_team?: boolean;
  team_player_id?: string;
}

/**
 * Generic team type
 */
export interface GenericTeam {
  id: string;
  name: string;
  player_count?: number;
}

/**
 * Search request parameters
 */
export interface PlayerSearchRequest {
  query?: string;
  exclude_team_id?: string;
  limit?: number;
}

/**
 * Add player request
 */
export interface AddPlayerToTeamRequest {
  team_id: string;
  player_id: string;
  position?: string;
  jersey_number?: number;
}

/**
 * Remove player request
 */
export interface RemovePlayerFromTeamRequest {
  team_id: string;
  team_player_id: string;
}

/**
 * Create custom player request
 */
export interface CreateCustomPlayerRequest {
  team_id: string;
  name: string;
  jersey_number?: number;
  position?: string;
  notes?: string;
}

/**
 * Service response
 */
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Player Management Service Interface
 * 
 * All player management operations must implement this interface
 */
export interface IPlayerManagementService {
  searchAvailablePlayers(request: PlayerSearchRequest): Promise<GenericPlayer[]>;
  getTeamPlayers(teamId: string): Promise<GenericPlayer[]>;
  getTeamPlayerCount(teamId: string): Promise<number>;
  addPlayerToTeam(request: AddPlayerToTeamRequest): Promise<ServiceResponse>;
  removePlayerFromTeam(request: RemovePlayerFromTeamRequest): Promise<ServiceResponse>;
  createCustomPlayer(request: CreateCustomPlayerRequest): Promise<ServiceResponse<GenericPlayer>>;
  validateMinimumPlayers(teamId: string, minPlayers: number): Promise<{
    isValid: boolean;
    currentCount: number;
    message?: string;
  }>;
}

