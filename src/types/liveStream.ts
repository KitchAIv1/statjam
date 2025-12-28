export interface LiveGame {
  id: string;
  team_a_id: string;
  team_b_id: string;
  team_a_name: string;
  team_b_name: string;
  home_score: number;
  away_score: number;
  quarter: number;
  status: string;
  game_clock_minutes: number;
  game_clock_seconds: number;
  team_a_logo?: string;
  team_b_logo?: string;
  team_a_primary_color?: string;
  team_b_primary_color?: string;
  team_a_fouls?: number;
  team_b_fouls?: number;
  team_a_timeouts?: number;
  team_b_timeouts?: number;
  current_possession_team_id?: string;
  jump_ball_arrow_team_id?: string;
  venue?: string;
}

export interface GameStat {
  id: string;
  game_id: string;
  player_id?: string;
  team_id: string;
  stat_type: string;
  stat_value: number;
  modifier?: string | null;
  is_opponent_stat?: boolean;
}

