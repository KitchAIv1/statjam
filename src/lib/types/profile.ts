// ============================================================================
// PROFILE TYPES
// ============================================================================
// Purpose: Type definitions for user profile cards and editing
// Follows .cursorrules: <100 lines, clear naming
// ============================================================================

export type UserRole = 'player' | 'organizer' | 'coach' | 'stat_admin';

// Base profile interface - shared across all roles
export interface BaseProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profilePhotoUrl?: string;
  bio?: string;
  location?: string;
  socialLinks?: SocialLinks;
  createdAt: string;
}

// Social media links
export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  website?: string;
}

// Organizer-specific profile with stats
export interface OrganizerProfile extends BaseProfile {
  role: 'organizer';
  stats: OrganizerStats;
}

export interface OrganizerStats {
  totalTournaments: number;
  activeTournaments: number;
  totalTeams: number;
  totalGames: number;
}

// Coach-specific profile with stats
export interface CoachProfile extends BaseProfile {
  role: 'coach';
  stats: CoachStats;
}

export interface CoachStats {
  totalTeams: number;
  gamesTracked: number;
  totalPlayers: number;
}

// Profile update request
export interface ProfileUpdateRequest {
  name?: string;
  bio?: string;
  location?: string;
  socialLinks?: SocialLinks;
  profilePhotoUrl?: string;
}

// Profile share data
export interface ProfileShareData {
  profileUrl: string;
  shareText: string;
}

