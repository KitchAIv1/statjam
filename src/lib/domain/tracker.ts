// Pure game-domain logic for the stat tracker. No React, no DB.
import {
  ClockState,
  GameRules,
  GameStateSnapshot,
  PlayerId,
  QuarterNumber,
  RosterState,
  StatRecord,
  StatType,
  SubstitutionInput,
  ValidationResult,
  ValidationOk,
  ValidationErr,
  ScoreByTeam
} from '@/lib/types/tracker';

// Utilities
const ok = <T>(value: T): ValidationOk<T> => ({ ok: true, value });
const err = (code: string, message: string): ValidationErr => ({ ok: false, code, message });

// Points mapping
export function getPointsForStat(statType: StatType, modifier?: string | null): number {
  if (modifier !== 'made') return 0;
  switch (statType) {
    case 'three_pointer':
      return 3;
    case 'field_goal':
      return 2;
    case 'free_throw':
      return 1;
    default:
      return 0;
  }
}

// 1) Can record stat
export function canRecordStat(
  snapshot: GameStateSnapshot,
  rules: GameRules
): ValidationResult {
  if (!rules.allowStatsWhenClockStopped && !snapshot.clock.isRunning) {
    return err('CLOCK_STOPPED', 'Clock must be running to record stats.');
  }
  if (snapshot.quarter < 1) return err('INVALID_QUARTER', 'Quarter is invalid.');
  return ok(true);
}

// 2) Apply stat (pure accumulation). Returns new scores per team.
export function deriveScoreFromStats(stats: StatRecord[]): ScoreByTeam {
  const scores: ScoreByTeam = {};
  for (const s of stats) {
    const pts = getPointsForStat(s.statType, s.modifier ?? undefined);
    if (pts > 0) {
      scores[s.teamId] = (scores[s.teamId] || 0) + pts;
    }
  }
  return scores;
}

// 3) Quarter advancement rule
export function shouldAdvanceQuarter(
  snapshot: GameStateSnapshot,
  rules: GameRules
): ValidationResult<{ nextQuarter: QuarterNumber; resetClockTo: number } | false> {
  if (snapshot.clock.secondsRemaining > 0) return ok(false);
  const next = (snapshot.quarter + 1) as QuarterNumber;
  if (next <= Math.max(1, rules.totalQuarters)) {
    return ok({ nextQuarter: next, resetClockTo: rules.quarterLengthSeconds });
  }
  // Regulation ended; caller decides overtime policy
  return ok(false);
}

// 4) Substitution validation
export function validateSubstitution(
  roster: RosterState,
  sub: SubstitutionInput
): ValidationResult {
  if (roster.teamId !== sub.teamId) return err('TEAM_MISMATCH', 'Substitution team mismatch.');
  const onCourtSet = new Set(roster.onCourt);
  if (!onCourtSet.has(sub.playerOutId)) return err('PLAYER_OUT_NOT_ON_COURT', 'Player out is not currently on court.');
  const maxOnCourt = 5; // domain rule
  // If playerIn already on court, no-op
  if (onCourtSet.has(sub.playerInId)) return err('PLAYER_IN_ALREADY_ON_COURT', 'Player in is already on court.');
  // If bench doesn’t include playerIn, still allow (domain stays flexible), but flag as warning in UI layer if needed
  if (roster.onCourt.length > maxOnCourt) return err('TOO_MANY_ON_COURT', 'More than 5 players on court.');
  return ok(true);
}

// 5) Stateless helpers to manipulate roster purely
export function applySubstitutionToRoster(
  roster: RosterState,
  sub: SubstitutionInput
): RosterState {
  const newOn = roster.onCourt.filter((p) => p !== sub.playerOutId);
  newOn.push(sub.playerInId);
  const newBench = Array.from(new Set([ ...roster.bench.filter((p) => p !== sub.playerInId), sub.playerOutId ]));
  return { teamId: roster.teamId, onCourt: newOn, bench: newBench };
}

// 6) Clock helpers
export function tickClock(clock: ClockState, deltaSeconds: number): ClockState {
  if (!clock.isRunning || deltaSeconds <= 0) return clock;
  const next = Math.max(0, clock.secondsRemaining - deltaSeconds);
  return { ...clock, secondsRemaining: next };
}

export function formatClock(seconds: number): { mm: number; ss: number; label: string } {
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return { mm, ss, label: `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}` };
}

