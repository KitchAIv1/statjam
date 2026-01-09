// ============================================================================
// SEASON TYPES - Type definitions only (<100 lines)
// Purpose: Define all Season-related types for coach season tracking
// Follows .cursorrules: Types only, no logic, <100 lines
// ============================================================================

// ========================================
// CORE SEASON TYPES
// ========================================

export type SeasonType = 'regular' | 'playoffs' | 'preseason' | 'summer' | 'tournament';
export type SeasonStatus = 'draft' | 'active' | 'completed';

export interface Season {
  id: string;
  coach_id: string;
  team_id: string;
  
  // Basic Info
  name: string;
  description?: string;
  logo?: string;
  
  // ESPN-like Context
  league_name?: string;
  season_type: SeasonType;
  season_year?: string;
  conference?: string;
  home_venue?: string;
  
  // Branding
  primary_color?: string;
  secondary_color?: string;
  
  // Dates & Status
  start_date?: string;
  end_date?: string;
  status: SeasonStatus;
  is_public: boolean;
  
  // Cached Stats (for performance)
  total_games: number;
  wins: number;
  losses: number;
  points_for: number;
  points_against: number;
  
  created_at: string;
  updated_at: string;
}

// ========================================
// SEASON GAME JUNCTION
// ========================================

export interface SeasonGame {
  id: string;
  season_id: string;
  game_id: string;
  is_home_game: boolean;
  game_notes?: string;
  added_at: string;
}

// ========================================
// REQUEST/RESPONSE TYPES
// ========================================

export interface SeasonCreateRequest {
  name: string;
  team_id: string;
  description?: string;
  logo?: string;
  league_name?: string;
  season_type: SeasonType;
  season_year?: string;
  conference?: string;
  home_venue?: string;
  primary_color?: string;
  secondary_color?: string;
  start_date?: string;
  end_date?: string;
  is_public: boolean;
  game_ids: string[];
}

export interface SeasonUpdateRequest extends Partial<SeasonCreateRequest> {
  id: string;
}

// ========================================
// FORM STATE TYPES
// ========================================

export interface SeasonFormState {
  data: Partial<SeasonCreateRequest>;
  errors: Record<string, string>;
  loading: boolean;
  currentStep: number;
}

// ========================================
// ENRICHED TYPES FOR UI
// ========================================

export interface SeasonWithGames extends Season {
  games: SeasonGameEnriched[];
}

export interface SeasonGameEnriched extends SeasonGame {
  opponent_name: string;
  home_score: number;
  away_score: number;
  game_date: string;
  status: string;
}

