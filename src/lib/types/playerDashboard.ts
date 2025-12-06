export interface PlayerIdentity {
  playerId: string;
  name: string;
  jerseyNumber?: number | string;
  position?: string;
  teamId?: string;
  teamName?: string;
  age?: number;
  height?: string | number;
  weight?: string | number;
  location?: string;  // Country code
  profilePhotoUrl?: string;
  posePhotoUrl?: string;
  bio?: string;  // ✅ Player bio/about text
  isPublicProfile?: boolean;  // ✅ Public profile visibility toggle
}

export interface SeasonAverages {
  pointsPerGame?: number;
  reboundsPerGame?: number;
  assistsPerGame?: number;
  fieldGoalPct?: number;
  threePointPct?: number;
  freeThrowPct?: number;
  minutesPerGame?: number;
}

export interface CareerHighs {
  points?: number;
  rebounds?: number;
  assists?: number;
  blocks?: number;
  steals?: number;
  threes?: number;
  ftm?: number;
}

export interface PerformanceKpis {
  trendVsLastMonthPercent?: number;
  seasonHighPoints?: number;
  overallRating?: number;
}

export interface PerformanceSeriesEntry {
  date: string;
  opponentTeamName?: string;
  points?: number;
  rebounds?: number;
  assists?: number;
  fgm?: number;
  fga?: number;
  threePm?: number;
  threePa?: number;
  ftm?: number;
  fta?: number;
  minutes?: number;
}

export interface UpcomingGame {
  gameId: string;
  tournamentId?: string;
  tournamentName?: string;
  opponentTeamId?: string;
  opponentTeamName?: string;
  opponentLogoUrl?: string;
  scheduledAt?: string;
  status?: string;
  location?: string;
}

export interface AchievementItem {
  id: string;
  type: string;
  label?: string;
  value?: number | string;
  unlockedAt?: string | null;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  type: string;
}

export interface TrialState {
  isTrialActive: boolean;
  trialStart?: string | null;
}

export interface PlayerDashboardData {
  identity: PlayerIdentity | null;
  season: SeasonAverages | null;
  careerHighs: CareerHighs | null;
  kpis: PerformanceKpis | null;
  series: PerformanceSeriesEntry[];
  upcomingGames: UpcomingGame[];
  achievements: AchievementItem[];
  notifications: NotificationItem[];
  trial: TrialState;
}


