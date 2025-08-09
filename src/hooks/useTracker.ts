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
  const startClock = useCallback(async () => {
    setClock(prev => ({ ...prev, isRunning: true }));
    setLastAction('Clock started');
    
    // Sync clock state to database
    try {
      const { GameService } = await import('@/lib/services/gameService');
      await GameService.updateGameClock(gameId, {
        minutes: Math.floor(clock.secondsRemaining / 60),
        seconds: clock.secondsRemaining % 60,
        isRunning: true
      });
    } catch (error) {
      console.error('Error syncing clock start to database:', error);
    }
  }, [gameId, clock.secondsRemaining]);

  const stopClock = useCallback(async () => {
    setClock(prev => ({ ...prev, isRunning: false }));
    setLastAction('Clock stopped');
    
    // Sync clock state to database
    try {
      const { GameService } = await import('@/lib/services/gameService');
      await GameService.updateGameClock(gameId, {
        minutes: Math.floor(clock.secondsRemaining / 60),
        seconds: clock.secondsRemaining % 60,
        isRunning: false
      });
    } catch (error) {
      console.error('Error syncing clock stop to database:', error);
    }
  }, [gameId, clock.secondsRemaining]);

  const resetClock = useCallback(async () => {
    const newSeconds = 12 * 60;
    setClock({ isRunning: false, secondsRemaining: newSeconds });
    setLastAction('Clock reset');
    
    // Sync clock state to database
    try {
      const { GameService } = await import('@/lib/services/gameService');
      await GameService.updateGameClock(gameId, {
        minutes: 12,
        seconds: 0,
        isRunning: false
      });
    } catch (error) {
      console.error('Error syncing clock reset to database:', error);
    }
  }, [gameId]);

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

      console.log('🏀 Recording stat to database:', fullStat);

      // Import GameService dynamically to avoid circular dependencies
      const { GameService } = await import('@/lib/services/gameService');
      
      // Map stat value for database (points for scoring stats, 1 for others)
      let statValue = 1;
      if (stat.statType === 'field_goal' && stat.modifier === 'made') {
        statValue = 2;
      } else if (stat.statType === 'three_pointer' && stat.modifier === 'made') {
        statValue = 3;
      } else if (stat.statType === 'free_throw' && stat.modifier === 'made') {
        statValue = 1;
      } else if (stat.modifier === 'missed') {
        statValue = 0; // Track attempts but no points
      }

      // Record stat in database
      const success = await GameService.recordStat({
        gameId: stat.gameId,
        playerId: stat.playerId,
        teamId: stat.teamId,
        statType: stat.statType,
        statValue: statValue,
        modifier: stat.modifier,
        quarter: quarter,
        gameTimeMinutes: Math.floor(clock.secondsRemaining / 60),
        gameTimeSeconds: clock.secondsRemaining % 60
      });

      if (success) {
        console.log('✅ Stat recorded successfully in database');
        
        // Update local scores for immediate UI feedback
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
      } else {
        console.error('❌ Failed to record stat in database');
        setLastAction('Error recording stat');
      }
      
    } catch (error) {
      console.error('❌ Error recording stat:', error);
      setLastAction('Error recording stat');
    }
  }, [quarter, clock.secondsRemaining]);

  // Substitution
  const substitute = useCallback(async (sub: { gameId: string; teamId: string; playerOutId: string; playerInId: string; quarter: number; gameTimeSeconds: number }): Promise<boolean> => {
    try {
      console.log('🔄 Recording substitution to database:', sub);

      // Import GameService dynamically to avoid circular dependencies
      const { GameService } = await import('@/lib/services/gameService');
      
      // Record substitution in database
      const success = await GameService.recordSubstitution({
        gameId: sub.gameId,
        playerInId: sub.playerInId,
        playerOutId: sub.playerOutId,
        teamId: sub.teamId,
        quarter: sub.quarter,
        gameTimeMinutes: Math.floor(sub.gameTimeSeconds / 60),
        gameTimeSeconds: sub.gameTimeSeconds % 60
      });

      if (success) {
        console.log('✅ Substitution recorded successfully in database');
        setLastAction(`Substitution: Player ${sub.playerOutId} → ${sub.playerInId}`);
        
        // Update rosters locally for immediate UI feedback
        const updateRoster = (roster: RosterState) => {
          const newOnCourt = roster.onCourt.map(p => 
            p.id === sub.playerOutId ? { ...p, id: sub.playerInId } : p
          );
          const newBench = roster.bench.map(p => 
            p.id === sub.playerInId ? { ...p, id: sub.playerOutId } : p
          );
          return { ...roster, onCourt: newOnCourt, bench: newBench };
        };

        if (sub.teamId === teamAId) {
          setRosterA(updateRoster);
        } else if (sub.teamId === teamBId) {
          setRosterB(updateRoster);
        }

        return true;
      } else {
        console.error('❌ Failed to record substitution in database');
        setLastAction('Error recording substitution');
        return false;
      }
    } catch (error) {
      console.error('❌ Error with substitution:', error);
      setLastAction('Error recording substitution');
      return false;
    }
  }, [teamAId, teamBId, setRosterA, setRosterB]);

  // Game Management
  const closeGame = useCallback(async () => {
    try {
      console.log('🏁 Closing game:', gameId);
      
      // Import GameService dynamically to avoid circular dependencies
      const { GameService } = await import('@/lib/services/gameService');
      
      // Stop the clock and update game status to completed
      setClock(prev => ({ ...prev, isRunning: false }));
      
      const success = await GameService.updateGameStatus(gameId, 'completed');
      
      if (success) {
        console.log('✅ Game closed successfully');
        setLastAction('Game ended');
      } else {
        console.error('❌ Failed to close game');
        setLastAction('Error closing game');
      }
    } catch (error) {
      console.error('❌ Error closing game:', error);
      setLastAction('Error closing game');
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