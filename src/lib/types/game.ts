export interface Game {
  id: string;
  tournament_id: string;
  team_a_id: string;
  team_b_id: string;
  stat_admin_id: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  start_time: string;
  end_time?: string;
  quarter: number;
  game_clock_minutes: number;
  game_clock_seconds: number;
  is_clock_running: boolean;
  home_score: number;
  away_score: number;
  created_at: string;
  updated_at: string;
}

export interface GameStat {
  id: string;
  game_id: string;
  player_id: string;
  team_id: string;
  stat_type: 'points' | 'assist' | 'rebound' | 'steal' | 'block' | 'turnover' | 'foul' | 'freethrow';
  stat_value: number;
  modifier?: 'made' | 'missed' | 'offensive' | 'defensive' | 'personal' | 'technical';
  quarter: number;
  game_time_minutes: number;
  game_time_seconds: number;
  created_at: string;
}

export interface PlayerGameStats {
  id: string;
  game_id: string;
  player_id: string;
  team_id: string;
  minutes_played: number;
  points: number;
  assists: number;
  rebounds: number;
  offensive_rebounds: number;
  defensive_rebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  personal_fouls: number;
  technical_fouls: number;
  free_throws_made: number;
  free_throws_attempted: number;
  field_goals_2pt_made: number;
  field_goals_2pt_attempted: number;
  field_goals_3pt_made: number;
  field_goals_3pt_attempted: number;
  created_at: string;
  updated_at: string;
}

export interface GameSubstitution {
  id: string;
  game_id: string;
  player_in_id: string;
  player_out_id: string;
  team_id: string;
  quarter: number;
  game_time_minutes: number;
  game_time_seconds: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  game_id: string;
  user_id: string;
  action: 'stat_recorded' | 'substitution' | 'clock_start' | 'clock_stop' | 'quarter_change' | 'game_start' | 'game_end';
  details: any;
  created_at: string;
} 