// Organizer Dashboard Data Types
export interface OrganizerStats {
  activeTournaments: number;
  totalTournaments: number;
  totalTeams: number;
  totalGames: number;
  completionRate: number;
  trends: {
    tournaments: string;
    teams: string;
    games: string;
    completion: string;
  };
}

export interface RecentTournament {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  teams: number;
  maxTeams: number;
  venue: string;
  prize: string;
  startDate: string;
  endDate: string;
  progress: number;
  nextGame?: string;
}

export interface UpcomingGame {
  id: string;
  team1: string;
  team2: string;
  time: string;
  court: string;
  tournament: string;
  importance: string;
}

export interface OrganizerDashboardData {
  stats: OrganizerStats;
  recentTournaments: RecentTournament[];
  upcomingGames: UpcomingGame[];
}

export interface OrganizerDashboardState {
  data: OrganizerDashboardData;
  loading: boolean;
  error: string | null;
}

// Default empty state
export const defaultOrganizerDashboardData: OrganizerDashboardData = {
  stats: {
    activeTournaments: 0,
    totalTournaments: 0,
    totalTeams: 0,
    totalGames: 0,
    completionRate: 0,
    trends: {
      tournaments: "+0%",
      teams: "+0%",
      games: "+0%",
      completion: "+0%"
    }
  },
  recentTournaments: [],
  upcomingGames: []
};
