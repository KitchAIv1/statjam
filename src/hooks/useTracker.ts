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
  // NEW: Shot Clock State
  shotClock: {
    isRunning: boolean;
    secondsRemaining: number;
    isVisible: boolean;
  };
  scores: ScoreByTeam;
  
  // Rosters
  rosterA: RosterState;
  rosterB: RosterState;
  
  // Actions
  recordStat: (stat: Omit<StatRecord, 'createdAt' | 'quarter' | 'gameTimeSeconds'>) => Promise<void>;
  startClock: () => void;
  stopClock: () => void;
  resetClock: (forQuarter?: number) => void;
  setCustomTime: (minutes: number, seconds: number) => Promise<void>; // NEW: Manual clock editing
  tick: (seconds: number) => void;
  // NEW: Shot Clock Actions
  startShotClock: () => void;
  stopShotClock: () => void;
  resetShotClock: (seconds?: number) => void;
  setShotClockTime: (seconds: number) => void;
  shotClockTick: (seconds: number) => void;
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
  lastActionPlayerId: string | null;
  playerSeconds: Record<string, number>;
}

export const useTracker = ({ initialGameId, teamAId, teamBId }: UseTrackerProps): UseTrackerReturn => {
  // State
  const [gameId] = useState(initialGameId);
  const [quarter, setQuarterState] = useState(1);
  const [clock, setClock] = useState({
    isRunning: false,
    secondsRemaining: 12 * 60 // 12 minutes (will be adjusted based on quarter)
  });
  // NEW: Shot Clock State
  const [shotClock, setShotClock] = useState({
    isRunning: false,
    secondsRemaining: 24, // Default NBA shot clock
    isVisible: true // Can be disabled per tournament settings
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
  const [lastActionPlayerId, setLastActionPlayerId] = useState<string | null>(null);
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
        
        // FIXED: Load existing stats to calculate current scores (for refresh persistence)
        console.log('🔍 Loading existing stats for score calculation...');
        const { data: stats, error: statsError } = await supabase
          .from('game_stats')
          .select('team_id, stat_type, stat_value, modifier')
          .eq('game_id', gameId)
          .order('created_at', { ascending: true });
        
        if (!statsError && stats) {
          let teamAScore = 0;
          let teamBScore = 0;
          
          console.log('🔍 Found', stats.length, 'existing stats for score calculation');
          
          for (const stat of stats) {
            // FIXED: Use stat_value directly and only count made shots
            if (stat.modifier !== 'made') continue;
            
            // Use stat_value from database (already contains correct points)
            const points = stat.stat_value || 0;
            
            if (stat.team_id === teamAId) {
              teamAScore += points;
              console.log('🔍 Added', points, 'points to Team A:', stat.stat_type);
            } else if (stat.team_id === teamBId) {
              teamBScore += points;
              console.log('🔍 Added', points, 'points to Team B:', stat.stat_type);
            }
          }
          
          // Initialize scores with calculated totals
          setScores({
            [teamAId]: teamAScore,
            [teamBId]: teamBScore
          });
          
          console.log('✅ STAT INTERFACE: Initialized scores from database:', { 
            teamA: teamAScore, 
            teamB: teamBScore,
            totalStats: stats.length
          });
        } else {
          console.warn('⚠️ Could not load stats for score initialization:', statsError?.message);
          // Ensure scores start at 0 if no stats found
          setScores({
            [teamAId]: 0,
            [teamBId]: 0
          });
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

  const resetClock = useCallback(async (forQuarter?: number) => {
    // Use provided quarter or current quarter
    const targetQuarter = forQuarter || quarter;
    
    // Determine clock duration based on quarter
    // Regular quarters (1-4): 12 minutes
    // Overtime periods (5+): 5 minutes
    const isOvertimePeriod = targetQuarter >= 5;
    const clockMinutes = isOvertimePeriod ? 5 : 12;
    const newSeconds = clockMinutes * 60;
    
    console.log(`🕐 Resetting clock for quarter ${targetQuarter}: ${clockMinutes} minutes (${newSeconds} seconds)`);
    
    setClock({ isRunning: false, secondsRemaining: newSeconds });
    
    if (isOvertimePeriod) {
      const otPeriod = targetQuarter - 4;
      setLastAction(`OT${otPeriod} clock reset (5 minutes)`);
    } else {
      setLastAction(`Q${targetQuarter} clock reset (12 minutes)`);
    }
    
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

  // NEW: Set custom time (for manual editing)
  const setCustomTime = useCallback(async (minutes: number, seconds: number) => {
    // Validate input ranges
    const validMinutes = Math.max(0, Math.min(15, Math.floor(minutes))); // 0-15 minutes max
    const validSeconds = Math.max(0, Math.min(59, Math.floor(seconds))); // 0-59 seconds
    
    const totalSeconds = validMinutes * 60 + validSeconds;
    
    // Stop clock when setting custom time
    setClock({ isRunning: false, secondsRemaining: totalSeconds });
    setLastAction(`Clock set to ${validMinutes}:${validSeconds.toString().padStart(2, '0')}`);
    
    console.log(`🕐 Manual clock set: ${validMinutes}:${validSeconds.toString().padStart(2, '0')} (${totalSeconds} seconds)`);
    
    // Sync to database using existing updateGameClock method
    try {
      const { GameService } = await import('@/lib/services/gameService');
      await GameService.updateGameClock(gameId, {
        minutes: validMinutes,
        seconds: validSeconds,
        isRunning: false
      });
      console.log('✅ Custom clock time synced to database');
    } catch (error) {
      console.error('❌ Error syncing custom clock time to database:', error);
    }
  }, [gameId]);

  // NEW: Shot Clock Controls
  const startShotClock = useCallback(() => {
    setShotClock(prev => ({ ...prev, isRunning: true }));
    setLastAction('Shot clock started');
    console.log('🏀 Shot clock started');
  }, []);

  const stopShotClock = useCallback(() => {
    setShotClock(prev => ({ ...prev, isRunning: false }));
    setLastAction('Shot clock stopped');
    console.log('🏀 Shot clock stopped');
  }, []);

  const resetShotClock = useCallback((seconds: number = 24) => {
    setShotClock(prev => ({ 
      ...prev, 
      isRunning: false, 
      secondsRemaining: seconds 
    }));
    setLastAction(`Shot clock reset to ${seconds}s`);
    console.log(`🏀 Shot clock reset to ${seconds} seconds`);
  }, []);

  const setShotClockTime = useCallback((seconds: number) => {
    const validSeconds = Math.max(0, Math.min(35, Math.floor(seconds))); // 0-35 seconds max
    setShotClock(prev => ({ 
      ...prev, 
      isRunning: false, 
      secondsRemaining: validSeconds 
    }));
    setLastAction(`Shot clock set to ${validSeconds}s`);
    console.log(`🏀 Shot clock set to ${validSeconds} seconds`);
  }, []);

  const tick = useCallback((seconds: number) => {
    setClock(prev => ({
      ...prev,
      secondsRemaining: Math.max(0, prev.secondsRemaining - seconds)
    }));
  }, []);

  // NEW: Shot Clock Tick
  const shotClockTick = useCallback((seconds: number) => {
    setShotClock(prev => ({
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
      if (quarter < 4) {
        // Regular quarters 1-4
        const nextQuarter = quarter + 1;
        setQuarter(nextQuarter);
        resetClock(nextQuarter); // Pass the new quarter explicitly
      } else if (quarter === 4) {
        // End of 4th quarter - check if game should go to overtime
        const teamAScore = scores.teamA;
        const teamBScore = scores.teamB;
        
        if (teamAScore === teamBScore) {
          // Tied game - go to overtime
          console.log(`🏀 End of regulation - TIED GAME (${teamAScore}-${teamBScore}) - advancing to overtime`);
          setQuarter(5); // Overtime starts at quarter 5
          resetClock(5); // Explicitly reset for OT1 (5 minutes)
        } else {
          // Game has a winner - end the game
          const winner = teamAScore > teamBScore ? 'Team A' : 'Team B';
          console.log(`🏀 End of regulation - GAME OVER! Winner: ${winner} (${teamAScore}-${teamBScore})`);
          setLastAction(`Game Over! ${winner} wins ${teamAScore}-${teamBScore}`);
          // Don't advance quarter - game is complete
        }
      } else {
        // Already in overtime (quarter >= 5) - check for tie again
        const teamAScore = scores.teamA;
        const teamBScore = scores.teamB;
        
        if (teamAScore === teamBScore) {
          // Still tied - continue to next OT period
          const currentOT = quarter - 4;
          const nextOT = currentOT + 1;
          const nextQuarter = quarter + 1;
          console.log(`🏀 End of OT${currentOT} - STILL TIED (${teamAScore}-${teamBScore}) - advancing to OT${nextOT}`);
          setQuarter(nextQuarter);
          resetClock(nextQuarter); // Pass the new OT quarter explicitly
        } else {
          // Overtime has a winner - end the game
          const winner = teamAScore > teamBScore ? 'Team A' : 'Team B';
          const currentOT = quarter - 4;
          console.log(`🏀 End of OT${currentOT} - GAME OVER! Winner: ${winner} (${teamAScore}-${teamBScore})`);
          setLastAction(`Game Over in OT${currentOT}! ${winner} wins ${teamAScore}-${teamBScore}`);
          // Don't advance quarter - game is complete
        }
      }
    }
  }, [clock.secondsRemaining, quarter, setQuarter, resetClock, scores]);

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
        modifier: stat.modifier || undefined,
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
        setLastActionPlayerId(stat.playerId);
      } else {
        console.error('❌ Failed to record stat in database');
        setLastAction('Error recording stat');
        setLastActionPlayerId(stat.playerId);
      }
      
    } catch (error) {
      console.error('❌ Error recording stat:', error);
      setLastAction('Error recording stat');
      setLastActionPlayerId(stat.playerId);
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
          const newOnCourt = roster.onCourt.map(playerId => 
            playerId === sub.playerOutId ? sub.playerInId : playerId
          );
          const newBench = roster.bench.map(playerId => 
            playerId === sub.playerInId ? sub.playerOutId : playerId
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
    shotClock, // NEW: Shot Clock State
    scores,
    rosterA,
    rosterB,
    recordStat,
    startClock,
    stopClock,
    resetClock,
    setCustomTime, // NEW: Manual clock editing
    tick,
    // NEW: Shot Clock Actions
    startShotClock,
    stopShotClock,
    resetShotClock,
    setShotClockTime,
    shotClockTick,
    setQuarter,
    advanceIfNeeded,
    substitute,
    closeGame,
    setRosterA,
    setRosterB,
    isLoading,
    lastAction,
    lastActionPlayerId,
    playerSeconds
  };
};