export interface PlayByPlayEntry {
  id: string;
  gameId: string;
  timestamp: string;
  quarter: number;
  gameTimeMinutes: number;
  gameTimeSeconds: number;
  playType: 'stat_recorded' | 'substitution' | 'quarter_change' | 'game_event';
  teamId: string;
  teamName: string;
  playerId?: string;
  playerName?: string;
  playerPhotoUrl?: string | null;
  statType?: string;
  statValue?: number;
  modifier?: string;
  description: string;
  scoreAfter: {
    home: number;
    away: number;
  };
  createdAt: string;
}

export interface GameViewerData {
  game: {
    id: string;
    tournamentId: string;
    teamAId: string;
    teamBId: string;
    teamAName: string;
    teamBName: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overtime';
    startTime: string;
    endTime?: string;
    quarter: number;
    gameClockMinutes: number;
    gameClockSeconds: number;
    isClockRunning: boolean;
    homeScore: number;
    awayScore: number;
  };
  playByPlay: PlayByPlayEntry[];
  lastUpdated: string;
}

export interface PlayerInfo {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  jerseyNumber?: number;
  position?: string;
}

export interface TeamInfo {
  id: string;
  name: string;
  logo?: string;
  color?: string;
  players: PlayerInfo[];
}