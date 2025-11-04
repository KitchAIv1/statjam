import { useState, useEffect, useCallback, useRef } from 'react';
import { StatRecord, RosterState, ScoreByTeam } from '@/lib/types/tracker';
import { Ruleset } from '@/lib/types/ruleset';
import { AutomationFlags, DEFAULT_AUTOMATION_FLAGS, COACH_AUTOMATION_FLAGS } from '@/lib/types/automation';
import { RulesetService } from '@/lib/config/rulesetService';

interface UseTrackerProps {
  initialGameId: string;
  teamAId: string;
  teamBId: string;
  isCoachMode?: boolean; // ✅ NEW: Detect coach games for automation
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
  
  // Phase 1: Ruleset & Automation Flags
  ruleset: Ruleset | null;
  automationFlags: AutomationFlags;
  
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
  gameStatus: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overtime'; // ✅ Game status tracking
  
  // Team Fouls & Timeouts
  teamFouls: { [teamId: string]: number };
  teamTimeouts: { [teamId: string]: number };
  timeoutActive: boolean;
  timeoutTeamId: string | null;
  timeoutSecondsRemaining: number;
  timeoutType: 'full' | '30_second';
  startTimeout: (teamId: string, type: 'full' | '30_second') => Promise<boolean>;
  resumeFromTimeout: () => void;
  
  // ✅ PHASE 3: Possession State
  possession: {
    currentTeamId: string;
    possessionArrow: string;
    lastChangeReason: string | null;
    lastChangeTimestamp: string | null;
  };
  
  // ✅ PHASE 6: Manual Possession Control
  manualSetPossession: (teamId: string, reason?: string) => Promise<void>;
  
  // ✅ PHASE 4 & 5: Play Sequence Prompts
  playPrompt: {
    isOpen: boolean;
    type: 'assist' | 'rebound' | 'block' | 'turnover' | 'free_throw' | null;
    sequenceId: string | null;
    primaryEventId: string | null;
    metadata: Record<string, any> | null;
  };
  clearPlayPrompt: () => void;
  setPlayPrompt: (prompt: {
    isOpen: boolean;
    type: 'assist' | 'rebound' | 'block' | 'turnover' | 'free_throw' | null;
    sequenceId: string | null;
    primaryEventId: string | null;
    metadata: Record<string, any> | null;
  }) => void;
}

export const useTracker = ({ initialGameId, teamAId, teamBId, isCoachMode = false }: UseTrackerProps): UseTrackerReturn => {
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
  
  // ✅ PHASE 1: Ruleset & Automation Flags
  const [ruleset, setRuleset] = useState<Ruleset | null>(null);
  const [automationFlags, setAutomationFlags] = useState<AutomationFlags>(DEFAULT_AUTOMATION_FLAGS);
  const [scores, setScores] = useState<ScoreByTeam>({
    [teamAId]: 0,
    [teamBId]: 0
  });
  const [teamFouls, setTeamFouls] = useState({
    [teamAId]: 0,
    [teamBId]: 0
  });
  const [teamTimeouts, setTeamTimeouts] = useState({
    [teamAId]: 7,
    [teamBId]: 7
  });
  const [timeoutActive, setTimeoutActive] = useState(false);
  const [timeoutTeamId, setTimeoutTeamId] = useState<string | null>(null);
  const [timeoutSecondsRemaining, setTimeoutSecondsRemaining] = useState(60);
  const [timeoutType, setTimeoutType] = useState<'full' | '30_second'>('full');
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
  const [gameStatus, setGameStatus] = useState<'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overtime'>('scheduled'); // ✅ Game status state
  
  // ✅ PHASE 3: Possession State
  const [possession, setPossession] = useState({
    currentTeamId: teamAId, // Default: Team A starts with possession
    possessionArrow: teamAId, // Jump ball arrow (alternating possession)
    lastChangeReason: null as string | null,
    lastChangeTimestamp: null as string | null
  });
  
  // ✅ PHASE 4 & 5: Play Sequence Prompts
  const [playPrompt, setPlayPrompt] = useState<{
    isOpen: boolean;
    type: 'assist' | 'rebound' | 'block' | 'turnover' | 'free_throw' | null;
    sequenceId: string | null;
    primaryEventId: string | null;
    metadata: Record<string, any> | null;
  }>({
    isOpen: false,
    type: null,
    sequenceId: null,
    primaryEventId: null,
    metadata: null
  });
  
  // ✅ SEQUENTIAL PROMPTS: Queue for multiple prompts (Block → Rebound)
  const [promptQueue, setPromptQueue] = useState<Array<{
    type: 'assist' | 'rebound' | 'block' | 'turnover' | 'free_throw';
    sequenceId: string;
    metadata: Record<string, any>;
  }>>([]);

  // Initialize and load existing game state from database
  useEffect(() => {
    const initializeGameState = async () => {
      try {
        setIsLoading(true);
        
        // Import GameServiceV3 (raw HTTP - reliable)
        const { GameServiceV3 } = await import('@/lib/services/gameServiceV3');
        
        // Load game data to initialize quarter, clock, and other state
        console.log('🚀 useTracker: Loading game state via GameServiceV3 for:', gameId);
        const game = await GameServiceV3.getGame(gameId);
        const gameError = !game;
        
        if (!gameError && game) {
          // ✅ Load game status from database
          const normalizedStatus = String(game.status || 'scheduled').toLowerCase();
          let status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overtime' = 'scheduled';
          
          if (normalizedStatus === 'completed' || normalizedStatus === 'ended') {
            status = 'completed';
          } else if (normalizedStatus === 'cancelled') {
            status = 'cancelled';
          } else if (normalizedStatus === 'overtime') {
            status = 'overtime';
          } else if (normalizedStatus === 'in_progress' || normalizedStatus === 'live') {
            status = 'in_progress';
          }
          
          setGameStatus(status);
          console.log('🔁 Initialized game status from database:', status);
          
          // If the stat admin has entered the tracker and the game is still scheduled,
          // mark it as live to ensure live cards remain visible even when the clock is paused.
          try {
            if (normalizedStatus === 'scheduled') {
              console.log('🔄 useTracker: Game status is scheduled, updating to in_progress');
              try {
                await GameServiceV3.updateGameStatus(gameId, 'in_progress');
                setGameStatus('in_progress'); // ✅ Update local state
                console.log('✅ useTracker: Game status updated to in_progress');
              } catch (statusError) {
                console.warn('⚠️ useTracker: Failed to update game status:', statusError);
                // Non-blocking - game will still work with clock running
              }
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
          
          // Load team fouls and timeouts from game data
          if (game.team_a_fouls !== undefined || game.team_b_fouls !== undefined) {
            setTeamFouls({
              [teamAId]: game.team_a_fouls || 0,
              [teamBId]: game.team_b_fouls || 0
            });
            console.log('🔁 Initialized team fouls from database:', { 
              teamA: game.team_a_fouls || 0, 
              teamB: game.team_b_fouls || 0 
            });
          }
          
          if (game.team_a_timeouts_remaining !== undefined || game.team_b_timeouts_remaining !== undefined) {
            // ✅ FIX: Use nullish coalescing (??) instead of || to preserve 0 values
            // || treats 0 as falsy, causing timeouts to reset to 7 when all are used
            setTeamTimeouts({
              [teamAId]: game.team_a_timeouts_remaining ?? 7,
              [teamBId]: game.team_b_timeouts_remaining ?? 7
            });
            console.log('🔁 Initialized timeouts from database:', { 
              teamA: game.team_a_timeouts_remaining ?? 7, 
              teamB: game.team_b_timeouts_remaining ?? 7 
            });
          }
          
          // ✅ PHASE 1: Load ruleset and automation flags from tournament
          try {
            console.log('🎯 Phase 1: Loading ruleset and automation flags...');
            
            // Fetch tournament data to get ruleset and automation settings
            const tournamentId = game.tournament_id;
            console.log('🔍 Phase 1 DEBUG: tournament_id =', tournamentId, 'type:', typeof tournamentId);
            
            if (tournamentId) {
              console.log('✅ Phase 1: Tournament ID found, fetching tournament data...');
              const tournamentResponse = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tournaments?id=eq.${tournamentId}&select=ruleset,ruleset_config,automation_settings`,
                {
                  headers: {
                    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                    'Content-Type': 'application/json'
                  }
                }
              );
              
              if (tournamentResponse.ok) {
                const tournaments = await tournamentResponse.json();
                console.log('🔍 Phase 1 DEBUG: Tournament response:', tournaments);
                
                if (tournaments && tournaments.length > 0) {
                  const tournament = tournaments[0];
                  console.log('🔍 Phase 1 DEBUG: Tournament data:', tournament);
                  
                  // Load ruleset
                  const rulesetId = tournament.ruleset || 'NBA';
                  let loadedRuleset = RulesetService.getRuleset(rulesetId);
                  
                  // Apply custom overrides if CUSTOM ruleset
                  if (rulesetId === 'CUSTOM' && tournament.ruleset_config) {
                    loadedRuleset = RulesetService.applyCustomOverrides(
                      loadedRuleset,
                      tournament.ruleset_config
                    );
                  }
                  
                  setRuleset(loadedRuleset);
                  console.log('✅ Phase 1: Loaded ruleset:', rulesetId);
                  
                  // ✅ PRE-FLIGHT CHECK: Load automation flags with priority hierarchy
                  // 1. Game-specific settings (from Pre-Flight Check Modal)
                  // 2. Tournament defaults
                  // 3. System defaults
                  let flags;
                  if (game.automation_settings) {
                    // Use game-specific settings (saved by Pre-Flight Check)
                    flags = game.automation_settings;
                    console.log('✅ Phase 1: Using GAME-SPECIFIC automation settings (from Pre-Flight Check):', flags);
                  } else if (tournament.automation_settings) {
                    // Fall back to tournament defaults
                    flags = tournament.automation_settings;
                    console.log('✅ Phase 1: Using TOURNAMENT automation settings:', flags);
                  } else {
                    // Fall back to system defaults
                    flags = DEFAULT_AUTOMATION_FLAGS;
                    console.log('✅ Phase 1: Using DEFAULT automation settings:', flags);
                  }
                  
                  setAutomationFlags(flags);
                  console.log('✅ Phase 1: Final automation flags loaded:', flags);
                  
                  // Log if any automation is enabled (should be OFF in Phase 1)
                  const anyEnabled = Object.values(flags).some((category: any) => 
                    category && typeof category === 'object' && category.enabled === true
                  );
                  if (anyEnabled) {
                    console.warn('⚠️ Phase 1: Some automation flags are enabled!', flags);
                  } else {
                    console.log('✅ Phase 1: All automation flags are OFF (expected behavior)');
                  }
                } else {
                  // Tournament ID exists but query returned empty (likely RLS issue or deleted tournament)
                  console.warn('⚠️ Phase 1: Tournament ID exists but query returned empty');
                  setRuleset(RulesetService.getRuleset('NBA'));
                  
                  if (isCoachMode) {
                    console.log('✅ Phase 1: Coach mode detected, using COACH_AUTOMATION_FLAGS');
                    setAutomationFlags(COACH_AUTOMATION_FLAGS);
                    console.log('✅ Phase 1: Clock automation ENABLED for coach game');
                  } else {
                    console.log('✅ Phase 1: Using DEFAULT_AUTOMATION_FLAGS (all OFF)');
                    setAutomationFlags(DEFAULT_AUTOMATION_FLAGS);
                  }
                }
              }
            } else {
              // No tournament_id - use coach defaults if in coach mode
              console.warn('⚠️ Phase 1: No tournament_id found');
              setRuleset(RulesetService.getRuleset('NBA'));
              
              if (isCoachMode) {
                console.log('✅ Phase 1: Coach mode detected, using COACH_AUTOMATION_FLAGS');
                setAutomationFlags(COACH_AUTOMATION_FLAGS);
                console.log('✅ Phase 1: Clock automation ENABLED for coach game');
              } else {
                console.log('✅ Phase 1: Using DEFAULT_AUTOMATION_FLAGS (all OFF)');
                setAutomationFlags(DEFAULT_AUTOMATION_FLAGS);
              }
            }
          } catch (rulesetError) {
            console.error('❌ Phase 1: Error loading ruleset:', rulesetError);
            // Fallback to NBA ruleset
            setRuleset(RulesetService.getRuleset('NBA'));
            
            // Fallback automation flags
            if (isCoachMode) {
              console.log('✅ Phase 1 FALLBACK: Coach mode, using COACH_AUTOMATION_FLAGS');
              setAutomationFlags(COACH_AUTOMATION_FLAGS);
            } else {
              setAutomationFlags(DEFAULT_AUTOMATION_FLAGS);
            }
          }
        } else {
          console.warn('⚠️ Could not load game state from database');
        }
        
        // FIXED: Load existing stats to calculate current scores (for refresh persistence)
        console.log('🔍 Loading existing stats for score calculation...');
        const stats = await GameServiceV3.getGameStats(gameId);
        
        if (stats && stats.length > 0) {
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
            totalStats: stats.length,
            teamAId: teamAId,
            teamBId: teamBId
          });
        } else {
          console.log('🔍 No existing stats found, initializing scores to 0');
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

  // ✅ NEW: Function to refresh scores from database (matches viewer logic exactly)
  const refreshScoresFromDatabase = useCallback(async () => {
    try {
      console.log('🔄 useTracker: Refreshing scores from database...');
      const { GameServiceV3 } = await import('@/lib/services/gameServiceV3');
      const stats = await GameServiceV3.getGameStats(gameId);
      
      if (stats && stats.length > 0) {
        let teamAScore = 0;
        let teamBScore = 0;
        
        for (const stat of stats) {
          // ✅ EXACT SAME LOGIC AS VIEWER: Use stat_value and only count 'made'
          if (stat.modifier !== 'made') continue;
          
          const points = stat.stat_value || 0;
          
          // ✅ NEW: Check is_opponent_stat flag for coach mode
          if (stat.is_opponent_stat) {
            // Opponent stats go to team B score
            teamBScore += points;
          } else if (stat.team_id === teamAId) {
            teamAScore += points;
          } else if (stat.team_id === teamBId) {
            teamBScore += points;
          }
        }
        
        // ✅ CHECK: Compare with current scores before updating
        const currentScores = scores;
        const newScores = { [teamAId]: teamAScore, [teamBId]: teamBScore };
        
        // Update scores to match database exactly
        // Handle coach mode where both team IDs are the same
        if (teamAId === teamBId) {
          // Coach mode: opponent score is now correctly calculated via is_opponent_stat flag
          // Since team A and B IDs are the same, we use the same key but calculate separately
          // For opponent stats, we calculate them but store them separately if needed
          setScores({ [teamAId]: teamAScore, opponent: teamBScore });
        } else {
          // Tournament mode: use both scores
          setScores(newScores);
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing scores:', error);
    }
  }, [gameId, teamAId, teamBId]);

  // ✅ NEW: Periodic score refresh to stay in sync with database/viewer
  useEffect(() => {
    if (!gameId || gameId === 'unknown') return;
    
    // Initial refresh after 5 seconds (for immediate testing)
    const initialRefresh = setTimeout(() => {
      console.log('🔄 useTracker: Initial score refresh (5s delay)...');
      refreshScoresFromDatabase();
    }, 5000);
    
    // Then refresh every 15 seconds to stay in sync with viewer
    const scoreRefreshInterval = setInterval(() => {
      console.log('⏰ useTracker: Periodic score refresh (15s interval)...');
      refreshScoresFromDatabase();
    }, 15000); // 15 seconds
    
    return () => {
      clearTimeout(initialRefresh);
      clearInterval(scoreRefreshInterval);
    };
  }, [gameId, refreshScoresFromDatabase]);

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

  const resetShotClock = useCallback((seconds?: number) => {
    const resetValue = seconds ?? 24; // Default to 24 if undefined
    
    // ✅ SYNC WITH GAME CLOCK: Shot clock inherits game clock's running state
    setShotClock(prev => ({ 
      ...prev, 
      isRunning: clock.isRunning, // ✅ Sync with game clock (source of truth)
      secondsRemaining: resetValue 
    }));
    setLastAction(`Shot clock reset to ${resetValue}s`);
    console.log(`🏀 Shot clock reset to ${resetValue} seconds (synced with game clock: ${clock.isRunning ? 'RUNNING' : 'PAUSED'})`);
  }, [clock.isRunning]);

  const setShotClockTime = useCallback((seconds: number) => {
    const validSeconds = Math.max(0, Math.min(35, Math.floor(seconds))); // 0-35 seconds max
    
    // ✅ SYNC WITH GAME CLOCK: Shot clock inherits game clock's running state
    setShotClock(prev => ({ 
      ...prev, 
      isRunning: clock.isRunning, // ✅ Sync with game clock (source of truth)
      secondsRemaining: validSeconds 
    }));
    setLastAction(`Shot clock set to ${validSeconds}s`);
    console.log(`🏀 Shot clock set to ${validSeconds} seconds (synced with game clock: ${clock.isRunning ? 'RUNNING' : 'PAUSED'})`);
  }, [clock.isRunning]);

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

  // Timeout Countdown Effect
  useEffect(() => {
    if (!timeoutActive) return;
    
    const interval = setInterval(() => {
      setTimeoutSecondsRemaining(prev => {
        if (prev <= 1) {
          // Timeout expired - but don't auto-resume, let admin manually resume
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timeoutActive]);

  // Stat Recording
  const recordStat = useCallback(async (stat: Omit<StatRecord, 'createdAt' | 'quarter' | 'gameTimeSeconds'>) => {
    // ✅ BLOCK: Don't allow stat recording if game is ended
    if (gameStatus === 'completed' || gameStatus === 'cancelled') {
      const { notify } = await import('@/lib/services/notificationService');
      notify.warning('Game Ended', 'This game has ended. No more stats can be recorded.');
      console.warn('⚠️ Attempted to record stat after game ended:', gameStatus);
      return;
    }
    
    try {
      const fullStat: StatRecord = {
        ...stat,
        quarter: quarter as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        gameTimeSeconds: clock.secondsRemaining,
        createdAt: new Date().toISOString()
      };

      console.log('🏀 Recording stat to database:', fullStat);

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
      } else if (!stat.modifier) {
        // ✅ FIXED: Non-scoring stats (assist, rebound, steal, block, turnover) default to 1
        statValue = 1;
      }

      // ✅ OPTIMIZATION 1: Batch all UI updates in a single setState
      // This prevents multiple re-renders and provides instant feedback
      const uiUpdates: {
        scores?: Record<string, number>;
        teamFouls?: Record<string, number>;
        lastAction?: string;
        lastActionPlayerId?: string | null;
        clock?: { secondsRemaining: number; isRunning: boolean };
        shotClock?: { secondsRemaining: number; isRunning: boolean; isVisible: boolean };
      } = {};

      // Prepare score update (optimistic UI)
      if (stat.modifier === 'made' && statValue > 0) {
        if (stat.isOpponentStat) {
          uiUpdates.scores = { opponent: statValue };
        } else {
          uiUpdates.scores = { [stat.teamId]: statValue };
        }
      }

      // Prepare foul update (optimistic UI)
      if (stat.statType === 'foul') {
        uiUpdates.teamFouls = { [stat.teamId]: 1 };
      }

      // Prepare last action message
      // ✅ Format stat type and modifier properly (no extra spaces for stats without modifiers)
      const statTypeFormatted = stat.statType.replace('_', ' ').toUpperCase();
      const modifierFormatted = stat.modifier ? ` (${stat.modifier})` : '';
      
      if (stat.isOpponentStat) {
        uiUpdates.lastAction = `Opponent Team: ${statTypeFormatted}${modifierFormatted}`;
        uiUpdates.lastActionPlayerId = null;
      } else {
        uiUpdates.lastAction = `${statTypeFormatted}${modifierFormatted}`;
        uiUpdates.lastActionPlayerId = stat.playerId || stat.customPlayerId || null;
      }
      
      console.log('📝 Last action prepared:', {
        statType: stat.statType,
        modifier: stat.modifier,
        lastAction: uiUpdates.lastAction,
        lastActionPlayerId: uiUpdates.lastActionPlayerId
      });

      // ✅ OPTIMIZATION 2: Apply ALL UI updates at once (single re-render)
      if (uiUpdates.scores) {
        setScores(prev => ({
          ...prev,
          ...(stat.isOpponentStat 
            ? { opponent: (prev.opponent || 0) + uiUpdates.scores!.opponent }
            : { [stat.teamId]: (prev[stat.teamId] || 0) + uiUpdates.scores![stat.teamId] }
          )
        }));
      }
      if (uiUpdates.teamFouls) {
        setTeamFouls(prev => ({
          ...prev,
          [stat.teamId]: (prev[stat.teamId] || 0) + 1
        }));
      }
      if (uiUpdates.lastAction) {
        setLastAction(uiUpdates.lastAction);
        setLastActionPlayerId(uiUpdates.lastActionPlayerId || null);
      }

      // ✅ OPTIMIZATION 3: Process clock automation BEFORE database write (non-blocking)
      // This provides instant visual feedback while the network request is in flight
      if (ruleset && automationFlags.clock.enabled) {
        const { ClockEngine } = await import('@/lib/engines/clockEngine');
        
        // Map stat types to ClockEngine event types
        let eventType: 'foul' | 'made_shot' | 'missed_shot' | 'turnover' | 'timeout' | 'free_throw' | 'substitution' | 'steal';
        let reboundType: 'offensive' | 'defensive' | undefined = undefined;
        
        if (stat.statType === 'field_goal' || stat.statType === 'three_pointer') {
          eventType = stat.modifier === 'made' ? 'made_shot' : 'missed_shot';
        } else if (stat.statType === 'rebound') {
          eventType = 'missed_shot';
          reboundType = stat.modifier as 'offensive' | 'defensive';
        } else if (stat.statType === 'steal') {
          eventType = 'steal';
        } else {
          eventType = stat.statType as 'foul' | 'turnover' | 'timeout' | 'free_throw' | 'substitution';
        }
        
        const clockEvent = {
          type: eventType,
          modifier: stat.modifier || undefined,
          ballLocation: undefined as 'frontcourt' | 'backcourt' | undefined,
          reboundType: reboundType
        };
        
        const clockResult = ClockEngine.processEvent(
          {
            gameClockMinutes: Math.floor(clock.secondsRemaining / 60),
            gameClockSeconds: clock.secondsRemaining % 60,
            gameClockRunning: clock.isRunning,
            shotClock: shotClock.secondsRemaining,
            shotClockRunning: shotClock.isRunning,
            shotClockDisabled: !shotClock.isVisible,
            quarter: quarter
          },
          clockEvent,
          ruleset,
          automationFlags.clock
        );
        
        // Apply clock state changes immediately
        if (clockResult.actions.length > 0) {
          console.log('🕐 Clock automation:', clockResult.actions);
          
          const newGameClockSeconds = (clockResult.newState.gameClockMinutes * 60) + clockResult.newState.gameClockSeconds;
          
          // ✅ OPTIMIZATION 4: Batch clock updates together
          setClock(prev => ({
            ...prev,
            secondsRemaining: newGameClockSeconds,
            isRunning: clockResult.newState.gameClockRunning
          }));
          
          setShotClock(prev => ({
            ...prev,
            secondsRemaining: clockResult.newState.shotClock,
            isRunning: clockResult.newState.shotClockRunning,
            isVisible: clockResult.newState.shotClockDisabled !== undefined 
              ? !clockResult.newState.shotClockDisabled 
              : prev.isVisible // ✅ PRESERVE isVisible if not explicitly set
          }));
        }
      }

      // ✅ PHASE 3: Process possession automation
      if (ruleset && automationFlags.possession?.enabled) {
        const { PossessionEngine } = await import('@/lib/engines/possessionEngine');
        
        // Map stat types to PossessionEngine event types
        let possessionEventType: 'made_shot' | 'turnover' | 'steal' | 'defensive_rebound' | 'offensive_rebound' | 'violation' | 'jump_ball' | 'foul' | null = null;
        
        if ((stat.statType === 'field_goal' || stat.statType === 'three_pointer' || stat.statType === 'free_throw') && stat.modifier === 'made') {
          possessionEventType = 'made_shot';
        } else if (stat.statType === 'turnover') {
          possessionEventType = 'turnover';
        } else if (stat.statType === 'steal') {
          possessionEventType = 'steal';
        } else if (stat.statType === 'rebound') {
          possessionEventType = stat.modifier === 'offensive' ? 'offensive_rebound' : 'defensive_rebound';
        } else if (stat.statType === 'foul') {
          // ✅ PHASE 6: Add foul possession mapping
          possessionEventType = 'foul';
        }
        
        // Only process if we have a valid possession event
        if (possessionEventType) {
          // ✅ COACH MODE FIX: Use 'opponent-team' identifier for possession tracking
          // For opponent stats, use 'opponent-team' as the teamId for possession logic
          const possessionTeamId = (isCoachMode && stat.isOpponentStat) 
            ? 'opponent-team' 
            : stat.teamId;
          
          const opponentTeamId = isCoachMode 
            ? (stat.isOpponentStat ? teamAId : 'opponent-team')
            : (stat.teamId === teamAId ? teamBId : teamAId);
          
          // ✅ PHASE 6B: Map modifier to foulType for technical/flagrant handling (BEFORE logging!)
          let foulType: 'personal' | 'shooting' | '1-and-1' | 'technical' | 'flagrant' | 'offensive' | undefined = undefined;
          if (possessionEventType === 'foul' && stat.modifier) {
            // Map modifier to foulType
            if (stat.modifier === 'technical') foulType = 'technical';
            else if (stat.modifier === 'flagrant') foulType = 'flagrant';
            else if (stat.modifier === 'offensive') foulType = 'offensive';
            else if (stat.modifier === 'shooting') foulType = 'shooting';
            else if (stat.modifier === '1-and-1') foulType = '1-and-1';
            else if (stat.modifier === 'personal') foulType = 'personal';
          }
          
          console.log('🏀 PHASE 3 DEBUG: Processing possession event', {
            eventType: possessionEventType,
            foulType: foulType, // ✅ PHASE 6B: Log foul type
            modifier: stat.modifier, // ✅ Log raw modifier too
            possessionTeamId: possessionTeamId,
            statTeamId: stat.teamId,
            opponentTeamId: opponentTeamId,
            currentPossession: possession.currentTeamId,
            isCoachMode: isCoachMode,
            isOpponentStat: stat.isOpponentStat
          });
          console.log('🏀 PHASE 3 DEBUG (EXPANDED):', JSON.stringify({
            eventType: possessionEventType,
            foulType: foulType, // ✅ PHASE 6B: Log foul type
            modifier: stat.modifier, // ✅ Log raw modifier too
            possessionTeamId: possessionTeamId,
            statTeamId: stat.teamId,
            opponentTeamId: opponentTeamId,
            currentPossession: possession.currentTeamId,
            isCoachMode: isCoachMode,
            isOpponentStat: stat.isOpponentStat
          }, null, 2));
          
          // ✅ PHASE 6B: Check if this is a technical/flagrant FT (from metadata)
          const isTechnicalOrFlagrantFT = stat.metadata?.isTechnicalOrFlagrantFT === true;
          
          const possessionResult = PossessionEngine.processEvent(
            {
              currentPossession: possession.currentTeamId,
              possessionArrow: possession.possessionArrow
            },
            {
              type: possessionEventType,
              teamId: possessionTeamId,  // ✅ Use possessionTeamId for logic
              opponentTeamId: opponentTeamId,
              foulType: foulType,  // ✅ PHASE 6B: Pass foul type for special handling
              isTechnicalOrFlagrantFT: isTechnicalOrFlagrantFT  // ✅ PHASE 6B: Flag for possession retention
            },
            ruleset,
            automationFlags.possession
          );
          
          // Apply possession state changes immediately
          if (possessionResult.actions.length > 0) {
            console.log('🏀 Possession automation:', possessionResult.actions);
            console.log('🏀 POSSESSION RESULT (EXPANDED):', JSON.stringify({
              newPossession: possessionResult.newState.currentPossession,
              oldPossession: possession.currentTeamId,
              shouldFlip: possessionResult.shouldFlip,
              actions: possessionResult.actions
            }, null, 2));
            
            setPossession({
              currentTeamId: possessionResult.newState.currentPossession,
              possessionArrow: possessionResult.newState.possessionArrow || teamAId,
              lastChangeReason: possessionResult.endReason || null,
              lastChangeTimestamp: new Date().toISOString()
            });
            
            // Store possession data for database persistence (if enabled)
            if (possessionResult.shouldPersist) {
              // Will be persisted in database write section below
              (fullStat as any).possessionData = {
                newPossession: possessionResult.newState.currentPossession,
                endReason: possessionResult.endReason
              };
            }
          }
        }
      }

      // ✅ PHASE 4: Process play sequence automation
      if (ruleset && automationFlags.sequences?.enabled) {
        const { PlayEngine } = await import('@/lib/engines/playEngine');
        
        const gameEvent = {
          id: undefined, // Will be set after database insert
          statType: stat.statType,
          modifier: stat.modifier || undefined,
          playerId: stat.playerId || '',
          customPlayerId: stat.customPlayerId, // ✅ FIX: Pass custom player ID for automation
          teamId: stat.teamId,
          quarter: quarter,
          gameTimeSeconds: clock.secondsRemaining,
          statValue: statValue
        };
        
        const playResult = PlayEngine.analyzeEvent(
          gameEvent,
          automationFlags.sequences
        );
        
        // ✅ SEQUENTIAL PROMPTS: Handle prompt queue (Block → Rebound) + Free Throws
        if (playResult.shouldPrompt && playResult.promptType && 
            (playResult.promptType === 'assist' || playResult.promptType === 'rebound' || playResult.promptType === 'block' || playResult.promptType === 'free_throw')) {
          
          // ✅ COACH MODE FIX: Don't show prompts for opponent actions
          if (isCoachMode && stat.isOpponentStat) {
            console.log('⏭️ Skipping prompt for opponent action in coach mode (no individual players)');
            // Don't show modal - opponent has no individual players to select
          } else {
            console.log('🎯 Play sequence prompt:', playResult.actions);
            
            // Check if we have a queue (multiple prompts)
            if (playResult.promptQueue && playResult.promptQueue.length > 0) {
              console.log('📋 Sequential prompts detected:', playResult.promptQueue.map(p => p.type).join(' → '));
              
              // Store the full queue
              setPromptQueue(playResult.promptQueue);
              
              // Show first prompt in queue
              const firstPrompt = playResult.promptQueue[0];
              setPlayPrompt({
                isOpen: true,
                type: firstPrompt.type,
                sequenceId: firstPrompt.sequenceId,
                primaryEventId: null, // Will be set after database insert
                metadata: firstPrompt.metadata
              });
            } else {
              // Single prompt (legacy behavior)
              setPromptQueue([]);
              setPlayPrompt({
                isOpen: true,
                type: playResult.promptType,
                sequenceId: playResult.sequenceId || null,
                primaryEventId: null, // Will be set after database insert
                metadata: playResult.metadata || null
              });
            }
          }
        }
        
        // ✅ AUTO-GENERATE TURNOVER FOR STEAL
        if (playResult.metadata?.shouldGenerateTurnover && stat.statType === 'steal') {
          console.log('🔄 Processing steal-to-turnover logic');
          
          // ✅ COACH MODE: Show turnover prompt for opponent steals
          if (isCoachMode) {
            if (stat.isOpponentStat) {
              // Opponent stole from home team
              // → Show turnover prompt to select which home player lost possession
              console.log('🎯 Showing turnover prompt for opponent steal');
              
              setPlayPrompt({
                isOpen: true,
                type: 'turnover',
                sequenceId: playResult.sequenceId || null,
                primaryEventId: null,
                metadata: {
                  stealerId: stat.playerId,
                  stealerName: 'Opponent Team',
                  stealerTeamId: stat.teamId,
                  homeTeamId: teamAId
                }
              });
            } else {
              // Home team stole from opponent
              // → Skip turnover generation (opponent has no individual players)
              // → Steal is enough to track the defensive play
              console.log('⏭️ Skipping turnover auto-generation (home steal from opponent)');
              console.log('💡 Opponent turnover implied by steal (no individual player to attribute)');
            }
          } else {
            // ✅ REGULAR MODE: Full auto-generation
            const opponentTeamId = stat.teamId === teamAId ? teamBId : teamAId;
            
            // Generate turnover event
            const turnoverEvent = PlayEngine.generateTurnoverForSteal(
              gameEvent,
              opponentTeamId
            );
            
            // Record turnover immediately (no prompt needed)
            // This will be executed after the steal is recorded in the database
            setTimeout(async () => {
              await recordStat({
                gameId: stat.gameId,
                playerId: turnoverEvent.playerId,
                teamId: turnoverEvent.teamId,
                statType: 'turnover',
                modifier: 'steal', // ✅ FIX: Mark as 'steal' so clock continues (live ball)
                sequenceId: playResult.sequenceId,
                linkedEventId: undefined // Will link to steal after it's recorded
              });
            }, 100); // Small delay to ensure steal is recorded first
          }
        }
      }

      // ✅ OPTIMIZATION 5: Database write happens AFTER UI updates (non-blocking)
      // Use Promise.all to load imports in parallel
      const [
        { GameServiceV3 },
        { validateStatValue, validateQuarter },
        { notify }
      ] = await Promise.all([
        import('@/lib/services/gameServiceV3'),
        import('@/lib/validation/statValidation'),
        import('@/lib/services/notificationService')
      ]);

      // Validate quarter
      const quarterValidation = validateQuarter(quarter);
      if (!quarterValidation.valid) {
        notify.error('Invalid quarter', quarterValidation.error);
        return;
      }

      // Validate stat value (only for made stats)
      if (stat.modifier === 'made' || !stat.modifier) {
        const validation = validateStatValue(stat.statType, statValue);
        if (!validation.valid) {
          notify.error('Invalid stat value', validation.error);
          return;
        }
      }

      // Record stat in database (V3 - raw HTTP, never hangs)
      await GameServiceV3.recordStat({
        gameId: stat.gameId,
        playerId: stat.playerId,
        customPlayerId: stat.customPlayerId,
        isOpponentStat: stat.isOpponentStat,
        teamId: stat.teamId,
        statType: stat.statType,
        statValue: statValue,
        modifier: stat.modifier || null,
        quarter: quarter,
        gameTimeMinutes: Math.floor(clock.secondsRemaining / 60),
        gameTimeSeconds: clock.secondsRemaining % 60
      });

      console.log('✅ Stat recorded successfully in database');
      
    } catch (error) {
      console.error('❌ Error recording stat:', error);
      
      // Import notification service for error display
      const { notify } = await import('@/lib/services/notificationService');
      const errorMessage = error instanceof Error ? error.message : 'Failed to record stat';
      notify.error('Failed to record stat', errorMessage);
      
      setLastAction('Error recording stat');
      setLastActionPlayerId(stat.playerId || null);
    }
  }, [quarter, clock.secondsRemaining, gameStatus]);

  // Substitution
  const substitute = useCallback(async (sub: { gameId: string; teamId: string; playerOutId: string; playerInId: string; quarter: number; gameTimeSeconds: number }): Promise<boolean> => {
    // ✅ BLOCK: Don't allow substitutions if game is ended
    if (gameStatus === 'completed' || gameStatus === 'cancelled') {
      const { notify } = await import('@/lib/services/notificationService');
      notify.warning('Game Ended', 'This game has ended. No more substitutions can be made.');
      return false;
    }
    
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
  }, [teamAId, teamBId, setRosterA, setRosterB, gameStatus]);

  // Enhanced Timeout Management
  const startTimeout = useCallback(async (teamId: string, type: 'full' | '30_second'): Promise<boolean> => {
    // ✅ BLOCK: Don't allow timeouts if game is ended
    if (gameStatus === 'completed' || gameStatus === 'cancelled') {
      const { notify } = await import('@/lib/services/notificationService');
      notify.warning('Game Ended', 'This game has ended. No more timeouts can be called.');
      return false;
    }
    
    try {
      const { GameServiceV3 } = await import('@/lib/services/gameServiceV3');
      const { notify } = await import('@/lib/services/notificationService');
      
      // Check if team has timeouts remaining
      if (teamTimeouts[teamId] <= 0) {
        notify.warning('No timeouts remaining', 'This team has used all timeouts.');
        return false;
      }
      
      console.log('⏰ Starting timeout for team:', teamId, 'Type:', type);
      
      // Stop all clocks immediately
      stopClock();
      stopShotClock();
      
      // Set timeout state
      const duration = type === 'full' ? 60 : 30;
      setTimeoutActive(true);
      setTimeoutTeamId(teamId);
      setTimeoutType(type);
      setTimeoutSecondsRemaining(duration);
      
      // Record timeout to database
      const success = await GameServiceV3.recordTimeout({
        gameId,
        teamId,
        quarter,
        gameClockMinutes: Math.floor(clock.secondsRemaining / 60),
        gameClockSeconds: clock.secondsRemaining % 60,
        timeoutType: type
      });
      
      if (success) {
        // Decrement timeout count locally
        setTeamTimeouts(prev => ({
          ...prev,
          [teamId]: Math.max(0, prev[teamId] - 1)
        }));
        
        console.log('✅ Timeout started successfully');
        notify.success('Timeout started', `${type === 'full' ? '60' : '30'} second timeout`);
        setLastAction(`Timeout - ${type === 'full' ? 'Full' : '30s'}`);
        return true;
      } else {
        console.error('❌ Failed to start timeout');
        notify.error('Timeout failed', 'Could not start timeout.');
        // Revert timeout state
        setTimeoutActive(false);
        setTimeoutTeamId(null);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error starting timeout:', error);
      const { notify } = await import('@/lib/services/notificationService');
      notify.error('Timeout error', 'An error occurred while starting the timeout.');
      setTimeoutActive(false);
      setTimeoutTeamId(null);
      return false;
    }
  }, [gameId, teamTimeouts, quarter, clock.secondsRemaining, stopClock, stopShotClock, gameStatus]);

  const resumeFromTimeout = useCallback(() => {
    console.log('▶️ Resuming play from timeout');
    setTimeoutActive(false);
    setTimeoutTeamId(null);
    setTimeoutSecondsRemaining(60);
    setLastAction('Play resumed');
    // Don't auto-start clocks - let admin start manually
  }, []);
  
  // ✅ PHASE 4: Clear play prompt (with queue support)
  const clearPlayPrompt = useCallback(() => {
    console.log('🔄 clearPlayPrompt called, checking queue...');
    console.log('📋 Current queue:', promptQueue);
    
    // Check if there are more prompts in the queue
    if (promptQueue.length > 1) {
      // Remove first prompt and show next
      const nextQueue = promptQueue.slice(1);
      const nextPrompt = nextQueue[0];
      
      console.log('➡️ Advancing to next prompt in queue:', nextPrompt.type);
      
      setPromptQueue(nextQueue);
      setPlayPrompt({
        isOpen: true,
        type: nextPrompt.type,
        sequenceId: nextPrompt.sequenceId,
        primaryEventId: null,
        metadata: nextPrompt.metadata
      });
    } else {
      // No more prompts, clear everything
      console.log('✅ Queue empty, closing all prompts');
      setPromptQueue([]);
      setPlayPrompt({
        isOpen: false,
        type: null,
        sequenceId: null,
        primaryEventId: null,
        metadata: null
      });
    }
  }, [promptQueue]);

  // Game Management
  const closeGame = useCallback(async () => {
    try {
      console.log('🏁 Closing game:', gameId);
      
      // Import GameService dynamically to avoid circular dependencies
      const { GameService } = await import('@/lib/services/gameService');
      
      // Stop the clock and update game status to completed
      setClock(prev => ({ ...prev, isRunning: false }));
      stopShotClock(); // ✅ Also stop shot clock
      
      const success = await GameService.updateGameStatus(gameId, 'completed');
      
      if (success) {
        setGameStatus('completed'); // ✅ Update local state
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
  }, [gameId, stopShotClock]);

  // ✅ PHASE 6: Manual possession control for edge cases
  const manualSetPossession = useCallback(async (teamId: string, reason: string = 'manual_override') => {
    console.log(`🔄 Manual possession set to ${teamId}, reason: ${reason}`);
    
    setPossession(prev => ({
      ...prev,
      currentTeamId: teamId,
      lastChangeReason: reason,
      lastChangeTimestamp: new Date().toISOString()
    }));
    
    // Persist to database if enabled
    if (automationFlags.possession?.persistState) {
      try {
        const { GameServiceV3 } = await import('@/lib/services/gameServiceV3');
        await GameServiceV3.updatePossession(gameId, teamId, reason);
        console.log('✅ Manual possession persisted to database');
      } catch (error) {
        console.error('❌ Failed to persist manual possession:', error);
      }
    }
    
    setLastAction(`Possession manually set to ${teamId}`);
  }, [gameId, automationFlags.possession, setLastAction]);


  return {
    gameId,
    quarter,
    clock,
    shotClock, // NEW: Shot Clock State
    scores,
    ruleset, // ✅ PHASE 1: Ruleset configuration
    automationFlags, // ✅ PHASE 1: Automation flags (all OFF by default)
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
    playerSeconds,
    gameStatus, // ✅ Game status
    teamFouls,
    teamTimeouts,
    timeoutActive,
    timeoutTeamId,
    timeoutSecondsRemaining,
    timeoutType,
    startTimeout,
    resumeFromTimeout,
    possession, // ✅ PHASE 3: Possession state
    manualSetPossession, // ✅ PHASE 6: Manual possession control
    playPrompt, // ✅ PHASE 4: Play sequence prompts
    clearPlayPrompt, // ✅ PHASE 4: Clear play prompt
    setPlayPrompt // ✅ PHASE 5: Manually set play prompt (for foul flow)
  };
};