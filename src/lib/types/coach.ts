// ============================================================================
// COACH TEAM CARD TYPES
// ============================================================================
// Purpose: Type definitions for coach team card functionality
// Aligned with: Database schema and component requirements
// ============================================================================

import { User } from './user';

// ========================================
// CORE COACH TYPES
// ========================================

export interface CoachTeam {
  id: string;
  name: string;
  coach_id: string;
  tournament_id?: string; // Optional - null for independent teams
  visibility: 'private' | 'public';
  level?: string; // e.g., "High School", "College", "Youth"
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  created_at: string;
  updated_at: string;
  
  // Computed fields
  players?: CoachTeamPlayer[];
  player_count?: number;
  games_count?: number;
  recent_games?: CoachGame[];
}

export interface CoachTeamPlayer {
  id: string;
  coach_team_id: string;
  first_name: string;
  last_name: string;
  jersey_number?: string;
  position?: string;
  notes?: string;
  profile_player_id?: string; // Links to users table if player has profile
  created_at: string;
  
  // Computed fields from profile (if linked)
  profile?: {
    email?: string;
    premium_status?: boolean;
  };
}

export interface CoachGame {
  id: string;
  coach_id: string;
  coach_team_id: string;
  opponent_name: string;
  opponent_tournament_name?: string;
  is_coach_game: boolean;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  start_time: string;
  end_time?: string;
  quarter: number;
  game_clock_minutes: number;
  game_clock_seconds: number;
  is_clock_running: boolean;
  home_score: number;
  away_score: number;
  
  // Coach-specific metadata
  meta_json?: {
    venue?: string;
    notes?: string;
    tournament_context?: string;
  };
  
  created_at: string;
  updated_at: string;
}

export interface TeamImportToken {
  id: string;
  token: string;
  coach_team_id: string;
  coach_id: string;
  expires_at: string;
  status: 'active' | 'used' | 'expired';
  created_at: string;
  used_at?: string;
  used_by?: string;
  
  // Computed fields
  is_expired?: boolean;
  hours_remaining?: number;
}

// ========================================
// REQUEST/RESPONSE TYPES
// ========================================

export interface CreateCoachTeamRequest {
  name: string;
  level?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  visibility: 'private' | 'public';
  initial_players?: Omit<CoachTeamPlayer, 'id' | 'coach_team_id' | 'created_at'>[];
}

export interface UpdateCoachTeamRequest {
  name?: string;
  level?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  visibility?: 'private' | 'public';
}

export interface CreateCoachGameRequest {
  coach_team_id: string;
  opponent_name: string;
  opponent_tournament_name?: string;
  start_time: string;
  venue?: string;
  notes?: string;
}

export interface QuickTrackGameRequest {
  coach_team_id: string;
  opponent_name: string;
  opponent_tournament_name?: string;
  game_settings?: {
    quarter_length_minutes?: number;
    shot_clock_seconds?: number;
    venue?: string;
    notes?: string;
  };
}

export interface TournamentSearchRequest {
  query?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  tournament_type?: string;
  status?: string;
  limit?: number;
}

export interface TournamentAttachmentRequest {
  coach_team_id: string;
  tournament_id?: string; // For existing tournament
  tournament_stub?: {
    name: string;
    location: string;
    start_date: string;
    description?: string;
  };
  attachment_type: 'existing' | 'stub';
}

export interface GenerateImportTokenRequest {
  coach_team_id: string;
  expires_hours?: number; // Default 48
}

export interface UseImportTokenRequest {
  token: string;
  organizer_id: string;
  target_tournament_id?: string;
}

// ========================================
// UI STATE TYPES
// ========================================

export interface CoachDashboardState {
  teams: CoachTeam[];
  loading: boolean;
  error: string | null;
  selectedTeam: CoachTeam | null;
  showCreateTeam: boolean;
  showQuickTrack: boolean;
  showTournamentSearch: boolean;
}

export interface CoachTeamCardState {
  team: CoachTeam;
  isExpanded: boolean;
  showActions: boolean;
  loadingAction: string | null;
}

export interface QuickTrackModalState {
  step: 'opponent' | 'settings' | 'confirm';
  opponent_name: string;
  opponent_tournament_name: string;
  game_settings: {
    quarter_length_minutes: number;
    shot_clock_seconds: number;
    venue: string;
    notes: string;
  };
  loading: boolean;
  error: string | null;
}

export interface TournamentSearchModalState {
  query: string;
  location: {
    country: string;
    region: string;
    city: string;
  };
  results: Tournament[];
  loading: boolean;
  error: string | null;
  selectedTournament: Tournament | null;
  attachmentType: 'existing' | 'stub';
}

// ========================================
// ANALYTICS & TELEMETRY TYPES
// ========================================

export interface CoachAnalytics {
  total_teams: number;
  total_games: number;
  games_this_month: number;
  avg_points_per_game: number;
  win_loss_record: {
    wins: number;
    losses: number;
    win_percentage: number;
  };
  most_active_team: CoachTeam | null;
  recent_activity: CoachAnalyticsEvent[];
}

export interface CoachAnalyticsEvent {
  event_type: 'coach_team_created' | 'quick_track_started' | 'quick_track_completed' | 
             'non_tournament_stat_synced' | 'team_visibility_toggled' | 
             'import_token_generated' | 'add_to_tournament_request_sent';
  team_id?: string;
  game_id?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

// ========================================
// INTEGRATION TYPES
// ========================================

// For tournament integration
export interface Tournament {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string;
  venue: string;
  location: {
    country: string;
    region?: string;
    city?: string;
  };
  organizer_id: string;
  organizer_name?: string;
  is_public: boolean;
  current_teams: number;
  max_teams: number;
}

// For player profile integration
export interface PlayerProfile extends User {
  role: 'player';
  premium_status: boolean;
  profile_image?: string;
  stats_summary?: {
    games_played: number;
    avg_points: number;
    avg_rebounds: number;
    avg_assists: number;
  };
}

// ========================================
// ERROR TYPES
// ========================================

export interface CoachServiceError {
  code: 'TEAM_NOT_FOUND' | 'GAME_NOT_FOUND' | 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 
        'PERMISSION_DENIED' | 'VALIDATION_ERROR' | 'DATABASE_ERROR' | 'NETWORK_ERROR';
  message: string;
  details?: Record<string, any>;
}

// ========================================
// UTILITY TYPES
// ========================================

export type CoachTeamVisibility = 'private' | 'public';
export type CoachGameStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type ImportTokenStatus = 'active' | 'used' | 'expired';
export type TournamentAttachmentType = 'existing' | 'stub';

// ========================================
// EXPORT ALL TYPES
// ========================================

export type {
  // Core types
  CoachTeam,
  CoachTeamPlayer,
  CoachGame,
  TeamImportToken,
  
  // Request/Response types
  CreateCoachTeamRequest,
  UpdateCoachTeamRequest,
  CreateCoachGameRequest,
  QuickTrackGameRequest,
  TournamentSearchRequest,
  TournamentAttachmentRequest,
  GenerateImportTokenRequest,
  UseImportTokenRequest,
  
  // UI State types
  CoachDashboardState,
  CoachTeamCardState,
  QuickTrackModalState,
  TournamentSearchModalState,
  
  // Analytics types
  CoachAnalytics,
  CoachAnalyticsEvent,
  
  // Integration types
  Tournament,
  PlayerProfile,
  
  // Error types
  CoachServiceError
};
