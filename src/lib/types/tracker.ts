// Domain types for the stat tracker. Pure data only. No React or DB.

export type GameId = string;
export type TeamId = string;
export type PlayerId = string;

export type QuarterNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // allow OT expansion

export interface GameRules {
  totalQuarters: number; // usually 4
  quarterLengthSeconds: number; // e.g., 12 * 60
  allowStatsWhenClockStopped?: boolean; // default false
}

export interface ClockState {
  isRunning: boolean;
  secondsRemaining: number; // 0..quarterLengthSeconds
}

export interface GameStateSnapshot {
  gameId: GameId;
  quarter: QuarterNumber;
  clock: ClockState;
}

export type StatType =
  | 'three_pointer'
  | 'field_goal'
  | 'free_throw'
  | 'assist'
  | 'rebound'
  | 'steal'
  | 'block'
  | 'turnover'
  | 'foul';

export type StatModifier =
  | 'made'
  | 'missed'
  | 'offensive'
  | 'defensive'
  | 'shooting'
  | 'personal'
  | 'technical'
  | 'flagrant'
  | string
  | null
  | undefined;

export interface StatRecord {
  id?: string;
  gameId: GameId;
  teamId: TeamId;
  playerId: PlayerId;
  statType: StatType;
  modifier?: StatModifier;
  createdAt?: string; // ISO
  quarter?: QuarterNumber;
  gameTimeSeconds?: number; // 0..quarterLengthSeconds
}

export interface SubstitutionInput {
  gameId: GameId;
  teamId: TeamId;
  playerOutId: PlayerId;
  playerInId: PlayerId;
  quarter: QuarterNumber;
  gameTimeSeconds: number;
}

export interface RosterState {
  teamId: TeamId;
  onCourt: PlayerId[]; // exactly 5 ideally, but domain stays flexible
  bench: PlayerId[];
}

export type ValidationOk<T> = { ok: true; value: T };
export type ValidationErr = { ok: false; code: string; message: string };
export type ValidationResult<T = true> = ValidationOk<T> | ValidationErr;

export interface ScoreByTeam {
  [teamId: string]: number;
}

