// Tournament Domain Types
export interface Tournament {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  venue: string;
  maxTeams: number;
  currentTeams: number;
  tournamentType: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  isPublic: boolean;
  entryFee: number;
  prizePool: number;
  country: string;
  organizerId: string;
  logo?: string; // Tournament logo URL from Supabase Storage
  createdAt: string;
  updatedAt: string;
}

export interface TournamentCreateRequest {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  venue: string;
  maxTeams: number;
  tournamentType: Tournament['tournamentType'];
  isPublic: boolean;
  entryFee: number;
  prizePool: number;
  country: string;
  logo?: string; // Tournament logo URL from Supabase Storage
  ruleset?: 'NBA' | 'FIBA' | 'NCAA' | 'CUSTOM'; // ✅ PHASE 1: Ruleset selection
}

export interface TournamentUpdateRequest extends Partial<TournamentCreateRequest> {
  id: string;
}

export interface Player {
  id: string;
  name: string;
  email: string;
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  jerseyNumber: number;
  isPremium: boolean;
  country: string;
  createdAt: string;
  is_custom_player?: boolean; // ✅ FIX: Flag to distinguish custom players from regular players
  profilePhotoUrl?: string; // Player profile photo URL
}

export interface Team {
  id: string;
  name: string;
  logo?: string;
  players: Player[];
  captain: Player;
  coach?: string;
  coach_id?: string; // ID of coach who owns this team (null for organizer-created teams)
  wins: number;
  losses: number;
  tournamentId: string;
  createdAt: string;
  approval_status?: 'pending' | 'approved' | 'rejected'; // Team join approval status
}

export interface TeamCreateRequest {
  name: string;
  logo?: string;
  coach?: string;
  tournamentId: string;
}

export interface Game {
  id: string;
  tournamentId: string;
  teamA: Team;
  teamB: Team;
  scheduledDate: string;
  venue: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  scoreA?: number;
  scoreB?: number;
  winner?: Team;
  createdAt: string;
}

// UI State Types
export interface TournamentListState {
  tournaments: Tournament[];
  loading: boolean;
  error: string | null;
  filter: {
    status: Tournament['status'] | 'all';
    search: string;
  };
}

export interface TournamentFormState {
  data: Partial<TournamentCreateRequest>;
  errors: Record<string, string>;
  loading: boolean;
  currentStep: number;
}