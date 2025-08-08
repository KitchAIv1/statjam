'use client';

// Container hook for tracker UI. Coordinates domain logic + services.
import { useCallback, useMemo, useRef, useState } from 'react';
import { GameService } from '@/lib/services/gameService';
import {
  GameRules,
  GameStateSnapshot,
  PlayerId,
  QuarterNumber,
  RosterState,
  StatRecord,
  SubstitutionInput,
  ScoreByTeam
} from '@/lib/types/tracker';
import {
  canRecordStat,
  deriveScoreFromStats,
  shouldAdvanceQuarter,
  validateSubstitution,
  applySubstitutionToRoster,
  tickClock
} from '@/lib/domain/tracker';

interface UseTrackerOptions {
  initialGameId: string;
  teamAId: string;
  teamBId: string;
  rules?: Partial<GameRules>;
}

export function useTracker({ initialGameId, teamAId, teamBId, rules: rulesOverride }: UseTrackerOptions) {
  const rules: GameRules = {
    totalQuarters: 4,
    quarterLengthSeconds: 12 * 60,
    allowStatsWhenClockStopped: false,
    ...rulesOverride
  };

  // Minimal local state managed here; UI components render from this
  const [quarter, setQuarter] = useState<QuarterNumber>(1);
  const [clock, setClock] = useState({ isRunning: false, secondsRemaining: rules.quarterLengthSeconds });
  const [stats, setStats] = useState<StatRecord[]>([]);
  const [rosterA, setRosterA] = useState<RosterState>({ teamId: teamAId, onCourt: [], bench: [] });
  const [rosterB, setRosterB] = useState<RosterState>({ teamId: teamBId, onCourt: [], bench: [] });
  const [error, setError] = useState<string | null>(null);
  const [playerSeconds, setPlayerSeconds] = useState<Record<string, number>>({});
  const [lastAction, setLastAction] = useState<string | null>(null);

  const gameIdRef = useRef(initialGameId);

  const snapshot: GameStateSnapshot = useMemo(() => ({
    gameId: gameIdRef.current,
    quarter,
    clock
  }), [quarter, clock]);

  const scores: ScoreByTeam = useMemo(() => deriveScoreFromStats(stats), [stats]);

  // Clock control
  const startClock = useCallback(() => setClock(c => ({ ...c, isRunning: true })), []);
  const stopClock = useCallback(() => setClock(c => ({ ...c, isRunning: false })), []);
  const resetClock = useCallback(() => setClock({ isRunning: false, secondsRemaining: rules.quarterLengthSeconds }), [rules.quarterLengthSeconds]);
  const tick = useCallback((delta: number) => {
    setClock(c => tickClock(c, delta));
    // accumulate seconds for on-court players when running
    setPlayerSeconds(prev => {
      const next = { ...prev };
      if (clock.isRunning && delta > 0) {
        [...rosterA.onCourt, ...rosterB.onCourt].forEach(pid => {
          next[pid] = (next[pid] || 0) + delta;
        });
      }
      return next;
    });
  }, [clock.isRunning, rosterA.onCourt, rosterB.onCourt]);

  // Record stat
  const recordStat = useCallback(async (input: Omit<StatRecord, 'createdAt' | 'quarter' | 'gameTimeSeconds'> & { modifier?: string }) => {
    setError(null);
    const can = canRecordStat(snapshot, rules);
    if (!can.ok) { setError(can.message); return false; }

    const now = new Date().toISOString();
    const enriched: StatRecord = {
      ...input,
      gameId: snapshot.gameId,
      quarter: snapshot.quarter,
      gameTimeSeconds: clock.secondsRemaining,
      createdAt: now
    };

    // optimistic update
    setStats(prev => [enriched, ...prev]);
    try {
      const success = await GameService.recordStat({
        gameId: enriched.gameId,
        teamId: enriched.teamId,
        playerId: enriched.playerId,
        statType: enriched.statType,
        modifier: enriched.modifier ?? null,
        quarter: enriched.quarter!,
        gameTimeMinutes: Math.floor((enriched.gameTimeSeconds || 0) / 60),
        gameTimeSeconds: (enriched.gameTimeSeconds || 0) % 60
      } as any);
      if (!success) throw new Error('recordStat failed');
      setLastAction('Stat recorded');
      return true;
    } catch (e) {
      // rollback if failed
      setStats(prev => prev.filter(s => s !== enriched));
      setError('Failed to record stat');
      return false;
    }
  }, [snapshot, rules, clock.secondsRemaining]);

  // Substitution
  const substitute = useCallback(async (sub: SubstitutionInput) => {
    setError(null);
    const roster = sub.teamId === rosterA.teamId ? rosterA : rosterB;
    const valid = validateSubstitution(roster, sub);
    if (!valid.ok) { setError(valid.message); return false; }

    // optimistic roster change
    if (sub.teamId === rosterA.teamId) setRosterA(r => applySubstitutionToRoster(r, sub));
    else setRosterB(r => applySubstitutionToRoster(r, sub));

    try {
      const success = await GameService.recordSubstitution({
        gameId: sub.gameId,
        playerInId: sub.playerInId,
        playerOutId: sub.playerOutId,
        teamId: sub.teamId,
        quarter: sub.quarter,
        gameTimeMinutes: Math.floor(sub.gameTimeSeconds / 60),
        gameTimeSeconds: sub.gameTimeSeconds % 60
      });
      if (!success) throw new Error('recordSubstitution failed');
      setLastAction('Substitution applied');
      return true;
    } catch (e) {
      // rollback by flipping back (simple approach: reload roster from previous state could be kept in ref if needed)
      setError('Failed to record substitution');
      return false;
    }
  }, [rosterA, rosterB]);

  // Quarter management
  const advanceIfNeeded = useCallback(() => {
    const next = shouldAdvanceQuarter(snapshot, rules);
    if (next.ok && next.value && next.value !== false) {
      setQuarter(next.value.nextQuarter);
      setClock({ isRunning: false, secondsRemaining: next.value.resetClockTo });
      return true;
    }
    return false;
  }, [snapshot, rules]);

  const closeGame = useCallback(async () => {
    try {
      await GameService.updateGameStatus(gameIdRef.current, 'completed');
      setLastAction('Game closed');
    } catch {}
  }, []);

  return {
    // state
    gameId: snapshot.gameId,
    quarter,
    clock,
    scores,
    rosterA,
    rosterB,
    stats,
    error,
    playerSeconds,
    lastAction,

    // actions
    startClock,
    stopClock,
    resetClock,
    tick,
    recordStat,
    substitute,
    advanceIfNeeded,
    setRosterA,
    setRosterB,
    setQuarter,
    closeGame
  } as const;
}

