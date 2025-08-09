import { useState, useEffect, useCallback } from 'react';
import { StatRecord, RosterState, ScoreByTeam } from '@/lib/types/tracker';

interface UseTrackerProps {
  initialGameId: string;
  teamAId: string;
  teamBId: string;
}

interface UseTrackerReturn {
  // Game State
  gameId: string;
  quarter: number;
  clock: {
    isRunning: boolean;
    secondsRemaining: number;
  };
  scores: ScoreByTeam;
  
  // Rosters
  rosterA: RosterState;
  rosterB: RosterState;
  
  // Actions
  recordStat: (stat: Omit<StatRecord, 'createdAt' | 'quarter' | 'gameTimeSeconds'>) => Promise<void>;
  startClock: () => void;
  stopClock: () => void;
  resetClock: () => void;
  tick: (seconds: number) => void;
  setQuarter: (quarter: number) => void;
  advanceIfNeeded: () => void;
  substitute: (sub: { gameId: string; teamId: string; playerOutId: string; playerInId: string; quarter: number; gameTimeSeconds: number }) => Promise<boolean>;
  closeGame: () => Promise<void>;
  
  // State Setters
  setRosterA: (updater: (prev: RosterState) => RosterState) => void;
  setRosterB: (updater: (prev: RosterState) => RosterState) => void;
  
  // Status
  isLoading: boolean;
  lastAction: string | null;
  playerSeconds: Record<string, number>;
}

export const useTracker = ({ initialGameId, teamAId, teamBId }: UseTrackerProps): UseTrackerReturn => {
  // State
  const [gameId] = useState(initialGameId);
  const [quarter, setQuarterState] = useState(1);
  const [clock, setClock] = useState({
    isRunning: false,
    secondsRemaining: 12 * 60 // 12 minutes
  });
  const [scores, setScores] = useState<ScoreByTeam>({
    [teamAId]: 0,
    [teamBId]: 0
  });
  const [rosterA, setRosterA] = useState<RosterState>({
    teamId: teamAId,
    onCourt: [],
    bench: []
  });
  const [rosterB, setRosterB] = useState<RosterState>({
    teamId: teamBId,
    onCourt: [],
    bench: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [playerSeconds] = useState<Record<string, number>>({});

  // Initialize
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Clock Controls
  const startClock = useCallback(() => {
    setClock(prev => ({ ...prev, isRunning: true }));
    setLastAction('Clock started');
  }, []);

  const stopClock = useCallback(() => {
    setClock(prev => ({ ...prev, isRunning: false }));
    setLastAction('Clock stopped');
  }, []);

  const resetClock = useCallback(() => {
    setClock({ isRunning: false, secondsRemaining: 12 * 60 });
    setLastAction('Clock reset');
  }, []);

  const tick = useCallback((seconds: number) => {
    setClock(prev => ({
      ...prev,
      secondsRemaining: Math.max(0, prev.secondsRemaining - seconds)
    }));
  }, []);

  const setQuarter = useCallback((newQuarter: number) => {
    setQuarterState(newQuarter);
    setLastAction(`Advanced to Quarter ${newQuarter}`);
  }, []);

  const advanceIfNeeded = useCallback(() => {
    if (clock.secondsRemaining <= 0) {
      setQuarter(quarter + 1);
      resetClock();
    }
  }, [clock.secondsRemaining, quarter, setQuarter, resetClock]);

  // Stat Recording
  const recordStat = useCallback(async (stat: Omit<StatRecord, 'createdAt' | 'quarter' | 'gameTimeSeconds'>) => {
    try {
      const fullStat: StatRecord = {
        ...stat,
        quarter: quarter as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        gameTimeSeconds: clock.secondsRemaining,
        createdAt: new Date().toISOString()
      };

      // Update scores for scoring stats
      if (stat.statType === 'field_goal' && stat.modifier === 'made') {
        setScores(prev => ({
          ...prev,
          [stat.teamId]: prev[stat.teamId] + 2
        }));
      } else if (stat.statType === 'three_pointer' && stat.modifier === 'made') {
        setScores(prev => ({
          ...prev,
          [stat.teamId]: prev[stat.teamId] + 3
        }));
      } else if (stat.statType === 'free_throw' && stat.modifier === 'made') {
        setScores(prev => ({
          ...prev,
          [stat.teamId]: prev[stat.teamId] + 1
        }));
      }

      setLastAction(`${stat.statType.replace('_', ' ')} ${stat.modifier || ''} recorded`);
      
      // TODO: Send to backend via GameService
      console.log('Recording stat:', fullStat);
      
    } catch (error) {
      console.error('Error recording stat:', error);
    }
  }, [quarter, clock.secondsRemaining]);

  // Substitution
  const substitute = useCallback(async (sub: { gameId: string; teamId: string; playerOutId: string; playerInId: string; quarter: number; gameTimeSeconds: number }): Promise<boolean> => {
    try {
      // TODO: Implement substitution logic
      setLastAction(`Substitution: Player ${sub.playerOutId} → ${sub.playerInId}`);
      return true;
    } catch (error) {
      console.error('Error with substitution:', error);
      return false;
    }
  }, []);

  // Game Management
  const closeGame = useCallback(async () => {
    try {
      // TODO: Implement game closing logic
      setLastAction('Game ended');
      console.log('Closing game:', gameId);
    } catch (error) {
      console.error('Error closing game:', error);
    }
  }, [gameId]);

  return {
    gameId,
    quarter,
    clock,
    scores,
    rosterA,
    rosterB,
    recordStat,
    startClock,
    stopClock,
    resetClock,
    tick,
    setQuarter,
    advanceIfNeeded,
    substitute,
    closeGame,
    setRosterA,
    setRosterB,
    isLoading,
    lastAction,
    playerSeconds
  };
};