/**
 * AI Analysis Types - Type definitions for game analysis
 * 
 * PURPOSE: Define structured types for AI-generated game analysis
 * Follows .cursorrules: <100 lines, single responsibility
 */

export interface PlayerAnalysisData {
  playerId: string;
  name: string;
  jerseyNumber: number | string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fgMade: number;
  fgAttempts: number;
  tpMade: number;
  tpAttempts: number;
  ftMade: number;
  ftAttempts: number;
  twoPtMade: number;
  twoPtAttempts: number;
  impact: number;
  quarterScoring: { q1: number; q2: number; q3: number; q4: number };
}

export interface QuarterData {
  team: number;
  opponent: number;
  differential: number;
}

export interface TeamTotals {
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fgMade: number;
  fgAttempts: number;
  fgPct: number;
  tpMade: number;
  tpAttempts: number;
  tpPct: number;
  ftMade: number;
  ftAttempts: number;
  ftPct: number;
  twoPtMade: number;
  twoPtAttempts: number;
  twoPtPct: number;
}

export interface WinningFactor {
  id: string;
  title: string;
  value: string;
  onCourt: string[];
  coachingTakeaway: string[];
}

export interface GameAnalysisData {
  gameId: string;
  teamName: string;
  opponentName: string;
  teamScore: number;
  opponentScore: number;
  margin: number;
  marginLabel: string;
  quarters: {
    q1: QuarterData;
    q2: QuarterData;
    q3: QuarterData;
    q4: QuarterData;
  };
  teamTotals: TeamTotals;
  players: PlayerAnalysisData[];
  winningFactors: WinningFactor[];
  areasOfConcern: string[];
  gameNarrative: string;
  keyInsight: string;
  bottomLine: string;
  grade: string;
  playerOfGame: PlayerAnalysisData | null;
  hustlePlayer: PlayerAnalysisData | null;
}

export interface AIAnalysisState {
  data: GameAnalysisData | null;
  loading: boolean;
  error: string | null;
}
