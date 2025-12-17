/**
 * Coach Analytics Type Definitions
 * 
 * Types for advanced team and player analytics in coach dashboard
 * 
 * @module coachAnalytics
 */

export interface TeamAnalytics {
  // Basic Info
  teamId: string;
  teamName: string;
  gamesPlayed: number;
  
  // Offensive Efficiency
  offensiveRating: number;        // Points per 100 possessions
  effectiveFGPercentage: number;  // (FGM + 0.5 * 3PM) / FGA
  trueShootingPercentage: number; // PTS / (2 * (FGA + 0.44 * FTA))
  assistToTurnoverRatio: number;  // AST / TO
  assistPercentage: number;       // AST / FGM
  
  // Defensive Efficiency
  defensiveRating: number;        // Opponent points per 100 possessions
  
  // Pace & Style
  pace: number;                   // Possessions per game
  threePointAttemptRate: number;  // 3PA / FGA
  freeThrowRate: number;          // FTA / FGA
  
  // Averages
  pointsPerGame: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  turnoversPerGame: number;
  
  // Shooting
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
}

export interface PlayerAnalytics {
  // Basic Info
  playerId: string;
  playerName: string;
  gamesPlayed: number;
  
  // Per-Game Stats
  pointsPerGame: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  stealsPerGame: number;
  blocksPerGame: number;
  turnoversPerGame: number;
  foulsPerGame: number;
  
  // Efficiency
  playerEfficiencyRating: number;
  trueShootingPercentage: number;
  effectiveFGPercentage: number;
  offensiveRating: number;
  usageRate: number;
  
  // Advanced
  versatilityScore: number;       // VPS
  assistToTurnoverRatio: number;
  
  // Shooting
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
  
  // Strengths & Weaknesses
  strengths: string[];
  weaknesses: string[];
  
  // Trend
  trend: 'improving' | 'declining' | 'stable';
  last5GamesAverage: number;      // Points average
}

export interface PlayerComparison {
  player1: PlayerAnalytics;
  player2: PlayerAnalytics;
  differences: {
    [key: string]: {
      player1Value: number;
      player2Value: number;
      difference: number;
      winner: 'player1' | 'player2' | 'tie';
    };
  };
}

export interface GameBreakdown {
  gameId: string;
  date: string;
  opponent: string;
  result: 'W' | 'L';
  teamScore: number;
  opponentScore: number;
  
  // Team Performance
  teamStats: {
    fieldGoalPercentage: number;
    threePointPercentage: number;
    freeThrowPercentage: number;
    rebounds: number;
    assists: number;
    turnovers: number;
    steals: number;
    blocks: number;
    // ✅ Advanced Stats
    effectiveFGPercentage: number;      // (FGM + 0.5 * 3PM) / FGA
    trueShootingPercentage: number;     // PTS / (2 * (FGA + 0.44 * FTA))
    assistToTurnoverRatio: number;      // AST / TO
    threePointAttemptRate: number;      // 3PA / FGA
    freeThrowRate: number;              // FTA / FGA
    assistPercentage: number;           // AST / FGM
    // Raw counts for calculations
    fgm: number;
    fga: number;
    tpm: number;
    tpa: number;
    ftm: number;
    fta: number;
    points: number;
  };
  
  // Top Performers
  topPerformers: {
    playerId: string;
    playerName: string;
    statLine: string;
    vps: number;
  }[];
}

export interface SeasonOverview {
  teamId: string;
  teamName: string;
  
  // Record
  wins: number;
  losses: number;
  winPercentage: number;
  
  // Trends
  last5Record: string;
  
  // Season Averages
  seasonAverages: {
    pointsPerGame: number;
    reboundsPerGame: number;
    assistsPerGame: number;
    fieldGoalPercentage: number;
    threePointPercentage: number;
  };
  
  // Season Leaders
  seasonLeaders: {
    points: { playerId: string; playerName: string; value: number };
    rebounds: { playerId: string; playerName: string; value: number };
    assists: { playerId: string; playerName: string; value: number };
    vps: { playerId: string; playerName: string; value: number };
  };
}

export interface RadarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

