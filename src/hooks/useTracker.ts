import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Initialize and load existing game state from database
  useEffect(() => {
    const initializeGameState = async () => {
      try {
        setIsLoading(true);
        
        // Import supabase dynamically
        const { supabase } = await import('@/lib/supabase');
        
        // Load game data to initialize quarter, clock, and other state
        const { data: game, error: gameError } = await supabase
          .from('games')
          .select('status, quarter, game_clock_minutes, game_clock_seconds, is_clock_running')
          .eq('id', gameId)
          .single();
        
        if (!gameError && game) {
          // If the stat admin has entered the tracker and the game is still scheduled,
          // mark it as live to ensure live cards remain visible even when the clock is paused.
          try {
            const normalizedStatus = String(game.status || '').toLowerCase();
            if (normalizedStatus === 'scheduled') {
              const { GameService } = await import('@/lib/services/gameService');
              // Use 'live' status to align with backend and landing filtering
              await GameService.updateGameStatus(gameId, 'in_progress' as any);
            }
          } catch (_e) {
            // Non-blocking if status update fails; viewer will still load
          }
          
          // Initialize quarter from DB (like V1 pattern)
          if (typeof game.quarter === 'number' && game.quarter > 0) {
            setQuarterState(game.quarter);
            console.log('🔁 Initialized quarter from database:', game.quarter);
          }
          
          // Initialize clock from DB
          if (typeof game.game_clock_minutes === 'number' && typeof game.game_clock_seconds === 'number') {
            const totalSeconds = (game.game_clock_minutes * 60) + game.game_clock_seconds;
            setClock(prev => ({
              ...prev,
              secondsRemaining: totalSeconds
            }));
            console.log('🔁 Initialized clock from database:', { 
              minutes: game.game_clock_minutes, 
              seconds: game.game_clock_seconds 
            });
          }
          
          // Initialize clock running state
          if (typeof game.is_clock_running === 'boolean') {
            setClock(prev => ({
              ...prev,
              isRunning: game.is_clock_running
            }));
            console.log('🔁 Initialized clock running state from database:', game.is_clock_running);
          }
        } else {
          console.warn('⚠️ Could not load game state from database:', gameError?.message);
        }
        
        // Load existing stats to calculate current scores (for refresh persistence)
        const { data: stats, error: statsError } = await supabase
          .from('game_stats')
          .select('team_id, stat_type, modifier')
          .eq('game_id', gameId);
        
        if (!statsError && stats) {
          let teamAScore = 0;
          let teamBScore = 0;
          
          for (const stat of stats) {
            if (stat.modifier !== 'made') continue; // Only count made shots
            
            let points = 0;
            if (stat.stat_type === 'three_pointer') points = 3;
            else if (stat.stat_type === 'field_goal') points = 2;
            else if (stat.stat_type === 'free_throw') points = 1;
            
            if (stat.team_id === teamAId) teamAScore += points;
            else if (stat.team_id === teamBId) teamBScore += points;
          }
          
          // Initialize scores with calculated totals
          setScores({
            [teamAId]: teamAScore,
            [teamBId]: teamBScore
          });
          
          console.log('🔁 Initialized scores from database:', { 
            [teamAId]: teamAScore, 
            [teamBId]: teamBScore 
          });
        } else {
          console.warn('⚠️ Could not load stats for score initialization:', statsError?.message);
        }
        
      } catch (error) {
        console.error('❌ Error initializing game state:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (gameId && gameId !== 'unknown') {
      initializeGameState();
    } else {
      setIsLoading(false);
    }
  }, [gameId, teamAId, teamBId]);

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

  const setQuarter = useCallback(async (newQuarter: number) => {
    setQuarterState(newQuarter);
    setLastAction(`Advanced to Quarter ${newQuarter}`);
    
    // Sync quarter change to database
    try {
      const { GameService } = await import('@/lib/services/gameService');
      await GameService.updateGameState(gameId, {
        quarter: newQuarter,
        game_clock_minutes: Math.floor(clock.secondsRemaining / 60),
        game_clock_seconds: clock.secondsRemaining % 60,
        is_clock_running: clock.isRunning,
        home_score: 0, // Scores are managed separately via stats
        away_score: 0  // Scores are managed separately via stats
      });
      console.log('✅ Quarter synced to database:', newQuarter);
    } catch (error) {
      console.error('❌ Error syncing quarter to database:', error);
    }
  }, [gameId, clock]);

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