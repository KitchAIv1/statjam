import { useState, useEffect, useCallback, useRef } from 'react';
import { StatRecord, RosterState, ScoreByTeam } from '@/lib/types/tracker';
import { Ruleset } from '@/lib/types/ruleset';
import { AutomationFlags, DEFAULT_AUTOMATION_FLAGS, COACH_AUTOMATION_FLAGS } from '@/lib/types/automation';
import { RulesetService } from '@/lib/config/rulesetService';
import { gameSubscriptionManager } from '@/lib/subscriptionManager';
import { validateQuarter } from '@/lib/validation/statValidation';

interface UseTrackerProps {
  initialGameId: string;
  teamAId: string;
  teamBId: string;
  isCoachMode?: boolean; // ✅ NEW: Detect coach games for automation
  initialGameData?: any; // ✅ PHASE 3: Optional game data to skip duplicate fetch
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
  originalQuarterLength: number; // ✅ For clock edit UI max validation
  tick: (seconds: number) => void;
  // NEW: Shot Clock Actions
  startShotClock: () => void;
  stopShotClock: () => void;
  resetShotClock: (seconds?: number) => void;
  setShotClockTime: (seconds: number) => void;
  shotClockTick: (seconds: number) => void;
  shotClockJustReset: boolean; // ✅ NBA Sync Fix
  setShotClockJustReset: (value: boolean) => void; // ✅ NBA Sync Fix
  toggleShotClockVisibility: () => void; // ✅ Toggle shot clock display
  setQuarter: (quarter: number) => void;
  advanceIfNeeded: () => void;
  substitute: (sub: { gameId: string; teamId: string; playerOutId: string; playerInId: string; quarter: number; gameTimeSeconds: number }) => Promise<boolean>;
  closeGame: () => Promise<void>;
  completeGameWithAwards: (awards: { playerOfTheGameId: string; hustlePlayerId: string; isPlayerOfGameCustom?: boolean; isHustlePlayerCustom?: boolean; finalOpponentScore?: number }) => Promise<void>; // ✅ Complete game with awards (supports custom players + coach mode)
  saveClockBeforeExit: () => Promise<void>; // ✅ Save clock state before navigation
  showAwardsModal: boolean; // ✅ Awards modal visibility
  setShowAwardsModal: (show: boolean) => void; // ✅ Control awards modal
  showGameOverModal: boolean; // ✅ Game over modal visibility
  setShowGameOverModal: (show: boolean) => void; // ✅ Control game over modal
  
  // State Setters
  setRosterA: (updater: (prev: RosterState) => RosterState) => void;
  setRosterB: (updater: (prev: RosterState) => RosterState) => void;
  
  // Status
  isLoading: boolean;
  lastAction: string | null;
  lastActionPlayerId: string | null;
  playerSeconds: Record<string, number>;
  gameStatus: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overtime'; // ✅ Game status tracking
  
  // ✅ UNDO: Last recorded stat for undo functionality
  lastRecordedStat: {
    id: string;
    statType: string;
    modifier: string | null;
    statValue: number;
    teamId: string;
    playerId: string | null;
    customPlayerId: string | null;
    isOpponentStat: boolean;
  } | null;
  undoLastAction: () => Promise<void>;
  
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
    type: 'assist' | 'rebound' | 'block' | 'turnover' | 'free_throw' | 'missed_shot_type' | null;
    sequenceId: string | null;
    primaryEventId: string | null;
    metadata: Record<string, any> | null;
  };
  clearPlayPrompt: () => void;
  setPlayPrompt: (prompt: {
    isOpen: boolean;
    type: 'assist' | 'rebound' | 'block' | 'turnover' | 'free_throw' | 'missed_shot_type' | null;
    sequenceId: string | null;
    primaryEventId: string | null;
    metadata: Record<string, any> | null;
  }) => void;
}

export const useTracker = ({ initialGameId, teamAId, teamBId, isCoachMode = false, initialGameData }: UseTrackerProps): UseTrackerReturn => {
  // State
  const [gameId] = useState(initialGameId);
  const [quarter, setQuarterState] = useState(1);
  const [clock, setClock] = useState({
    isRunning: false,
    secondsRemaining: 12 * 60 // 12 minutes (will be adjusted based on quarter)
  });
  
  // ✅ Original quarter length (set at game start, used to validate clock edits)
  const [originalQuarterLength, setOriginalQuarterLength] = useState(12);
  
  // ✅ CRITICAL: Ref to store current clock state for exit handlers (prevents stale closure)
  const clockRef = useRef(clock);
  
  // ✅ Keep ref in sync with state
  useEffect(() => {
    const minutes = Math.floor(clock.secondsRemaining / 60);
    console.log(`🔍 DEBUG clockRef sync: ${minutes}:${(clock.secondsRemaining % 60).toString().padStart(2, '0')} (${clock.isRunning ? 'RUNNING' : 'STOPPED'})`);
    clockRef.current = clock;
  }, [clock]);

  // ✅ Throttled DB sync: Track last sync time for clock updates
  const lastClockSyncRef = useRef<number>(0);
  const CLOCK_SYNC_INTERVAL = 5000; // 5 seconds
  
  // ✅ FIX: Guard to prevent subscription from overwriting foul updates during recording
  const foulUpdateInProgressRef = useRef<boolean>(false);
  
  // ✅ FIX: Guard to prevent saving initial hardcoded clock (12 min) before DB data loads
  const gameDataLoadedRef = useRef<boolean>(false);
  // NEW: Shot Clock State
  // ✅ Load visibility preference from localStorage on initialization
  const getInitialShotClockVisibility = () => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`shotClockEnabled_${initialGameId}`);
        if (saved !== null) {
          return JSON.parse(saved);
        }
      } catch (error) {
        console.warn('Failed to load shot clock visibility preference:', error);
      }
    }
    return true; // Default: visible
  };

  const [shotClock, setShotClock] = useState({
    isRunning: false,
    secondsRemaining: 24, // Default NBA shot clock
    isVisible: getInitialShotClockVisibility() // ✅ Load from localStorage or default to true
  });
  
  // ✅ Shot Clock Sync Fix: Prevents immediate tick after reset (aligns with game clock)
  const [shotClockJustReset, setShotClockJustReset] = useState(false);
  
  // ✅ PHASE 1: Ruleset & Automation Flags
  const [ruleset, setRuleset] = useState<Ruleset | null>(null);
  const [automationFlags, setAutomationFlags] = useState<AutomationFlags>(DEFAULT_AUTOMATION_FLAGS);
  const [scores, setScores] = useState<ScoreByTeam>({
    [teamAId]: 0,
    [teamBId]: 0
  });
  
  // ✅ FIX #1: Ref to store current scores state (prevents stale closure in refresh function)
  const scoresRef = useRef<ScoreByTeam>(scores);
  
  // ✅ Keep ref in sync with state (matches clockRef pattern)
  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);

  // ✅ SCORE RECALCULATION: Helper function to calculate scores from game_stats
  // Reused for initialization and WebSocket updates to ensure consistency
  const calculateScoresFromStats = useCallback(async (gameId: string, teamAId: string, teamBId: string, isCoachMode: boolean): Promise<ScoreByTeam | null> => {
    try {
      const { GameServiceV3 } = await import('@/lib/services/gameServiceV3');
      const stats = await GameServiceV3.getGameStats(gameId);
      
      if (!stats || stats.length === 0) {
        return null; // Return null to indicate no stats found (don't default to 0-0)
      }
      
      let teamAScore = 0;
      let teamBScore = 0;
      
      for (const stat of stats) {
        // Only count made shots
        if (stat.modifier !== 'made') continue;
        
        // Use stat_value from database (already contains correct points)
        const points = stat.stat_value || 0;
        
        // ✅ CRITICAL: Check is_opponent_stat flag for coach mode (MUST MATCH INITIALIZATION LOGIC)
        if (stat.is_opponent_stat) {
          // Opponent stats go to team B score
          teamBScore += points;
        } else if (stat.team_id === teamAId) {
          teamAScore += points;
        } else if (stat.team_id === teamBId) {
          teamBScore += points;
        }
      }
      
      // Handle coach mode where both team IDs are the same
      if (teamAId === teamBId) {
        // Coach mode: Store opponent score separately
        return { [teamAId]: teamAScore, opponent: teamBScore };
      } else {
        // Tournament mode: Use both team IDs
        return {
          [teamAId]: teamAScore,
          [teamBId]: teamBScore
        };
      }
    } catch (error) {
      console.error('❌ Error calculating scores from stats:', error);
      return null; // Return null on error (don't update scores)
    }
  }, []);
  const [teamFouls, setTeamFouls] = useState({
    [teamAId]: 0,
    [teamBId]: 0
  });
  const [teamTimeouts, setTeamTimeouts] = useState({
    [teamAId]: 5,
    [teamBId]: 5
  });
  const [timeoutActive, setTimeoutActive] = useState(false);
  const [timeoutTeamId, setTimeoutTeamId] = useState<string | null>(null);
  const [timeoutSecondsRemaining, setTimeoutSecondsRemaining] = useState(60);
  
  // ✅ Awards modal state
  const [showAwardsModal, setShowAwardsModal] = useState(false);
  // ✅ Game over modal state (shown when clock reaches 0 with a winner)
  const [showGameOverModal, setShowGameOverModal] = useState(false);
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
  
  // ✅ UNDO: Track last recorded stat for undo functionality
  const [lastRecordedStat, setLastRecordedStat] = useState<{
    id: string;
    statType: string;
    modifier: string | null;
    statValue: number;
    teamId: string;
    playerId: string | null;
    customPlayerId: string | null;
    isOpponentStat: boolean;
  } | null>(null);
  
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
  
  // ✅ SEQUENTIAL PROMPTS: Queue for multiple prompts (Rebound, Free Throws, etc.)
  // Note: Blocks removed from auto-sequence but can still be recorded manually
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
        
        // ✅ PHASE 3: Use provided game data or fetch from database
        let game = initialGameData;
        if (!game) {
          // Fallback to fetch if not provided (backward compatible)
          game = await GameServiceV3.getGame(gameId);
        }
        
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
          
          // If the stat admin has entered the tracker and the game is still scheduled,
          // mark it as live to ensure live cards remain visible even when the clock is paused.
          try {
            if (normalizedStatus === 'scheduled') {
              try {
                await GameServiceV3.updateGameStatus(gameId, 'in_progress');
                setGameStatus('in_progress'); // ✅ Update local state
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
          }
          
          // ✅ CRITICAL: Initialize clock from DB - ensure exact time is restored
          // Check sessionStorage backup first (more recent than DB if page was just closed)
          let clockMinutes = game.game_clock_minutes;
          let clockSeconds = game.game_clock_seconds;
          let clockIsRunning = game.is_clock_running;
          
          // 🔍 DEBUG: Log DB values
          console.log('🔍 DEBUG Clock Init - DB values:', {
            game_clock_minutes: game.game_clock_minutes,
            game_clock_seconds: game.game_clock_seconds,
            is_clock_running: game.is_clock_running
          });
          
          if (typeof window !== 'undefined') {
            try {
              const backupKey = `clock_backup_${gameId}`;
              const backup = sessionStorage.getItem(backupKey);
              
              // 🔍 DEBUG: Log sessionStorage backup
              console.log('🔍 DEBUG Clock Init - sessionStorage backup:', backup ? JSON.parse(backup) : 'NO BACKUP EXISTS');
              
              if (backup) {
                const backupData = JSON.parse(backup);
                // Use backup if it's more recent (within last 5 minutes)
                const backupAge = Date.now() - (backupData.timestamp || 0);
                console.log('🔍 DEBUG Clock Init - backup age:', Math.round(backupAge / 1000), 'seconds');
                
                if (backupAge < 5 * 60 * 1000) { // 5 minutes
                  console.log('✅ Restoring clock from sessionStorage backup:', backupData);
                  clockMinutes = backupData.minutes;
                  clockSeconds = backupData.seconds;
                  clockIsRunning = backupData.isRunning || false;
                  // Clear backup after use
                  sessionStorage.removeItem(backupKey);
                } else {
                  console.log('🔍 DEBUG Clock Init - backup TOO OLD, using DB value');
                }
              }
            } catch (error) {
              console.warn('⚠️ Failed to read clock backup from sessionStorage:', error);
            }
          }
          
          // ✅ FIX: Check localStorage for authoritative quarter length BEFORE setting clock
          // This handles the case where DB has stale 12 min but pre-flight set 8 min
          const storageKey = `quarterLength_${gameId}`;
          let quarterLen = 12;
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              quarterLen = parseInt(stored, 10) || 12;
              console.log(`🔍 DEBUG Clock Init - localStorage quarterLength: ${quarterLen} min`);
              
              // ✅ CRITICAL FIX: If clock is at full default quarter (12:00) but localStorage 
              // has a different setting, trust localStorage (pre-flight override)
              if (clockSeconds === 0 && clockMinutes === 12 && quarterLen !== 12) {
                console.log(`⚠️ DB has stale 12:00, using localStorage ${quarterLen}:00 instead`);
                clockMinutes = quarterLen;
              }
            }
          }
          
          // 🔍 DEBUG: Log final clock values
          console.log('🔍 DEBUG Clock Init - FINAL values:', {
            clockMinutes,
            clockSeconds,
            clockIsRunning
          });
          
          if (typeof clockMinutes === 'number' && typeof clockSeconds === 'number') {
            const totalSeconds = (clockMinutes * 60) + clockSeconds;
            setClock({
              secondsRemaining: totalSeconds,
              isRunning: clockIsRunning || false // ✅ Always start stopped to preserve exact time
            });
            console.log(`✅ Clock initialized: ${clockMinutes}:${clockSeconds.toString().padStart(2, '0')} (${clockIsRunning ? 'RUNNING' : 'STOPPED'})`);
            
            // ✅ Set original quarter length (already calculated above)
            // If localStorage didn't have a value but clock is valid, save it
            if (typeof window !== 'undefined') {
              const stored = localStorage.getItem(storageKey);
              if (!stored && [5, 6, 8, 10, 12].includes(clockMinutes)) {
                quarterLen = clockMinutes;
                localStorage.setItem(storageKey, String(quarterLen));
              }
            }
            setOriginalQuarterLength(quarterLen);
            console.log(`✅ Original quarter length set: ${quarterLen} min`);
            
            // ✅ Mark game data as loaded - prevents saving hardcoded 12 min during mount
            gameDataLoadedRef.current = true;
          }
          
          // Load team fouls and timeouts from game data
          if (game.team_a_fouls !== undefined || game.team_b_fouls !== undefined) {
            setTeamFouls({
              [teamAId]: game.team_a_fouls || 0,
              [teamBId]: game.team_b_fouls || 0
            });
          }
          
          if (game.team_a_timeouts_remaining !== undefined || game.team_b_timeouts_remaining !== undefined) {
            // ✅ FIX: Use nullish coalescing (??) instead of || to preserve 0 values
            // || treats 0 as falsy, causing timeouts to reset to 7 when all are used
            setTeamTimeouts({
              [teamAId]: game.team_a_timeouts_remaining ?? 5,
              [teamBId]: game.team_b_timeouts_remaining ?? 5
            });
          }
          
          // ✅ PHASE 1: Load ruleset and automation flags from tournament
          try {
            // Fetch tournament data to get ruleset and automation settings
            const tournamentId = game.tournament_id;
            
            if (tournamentId) {
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
                
                if (tournaments && tournaments.length > 0) {
                  const tournament = tournaments[0];
                  
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
                  
                  // ✅ PRE-FLIGHT CHECK: Load automation flags with priority hierarchy
                  // 1. Game-specific settings (from Pre-Flight Check Modal)
                  // 2. Tournament defaults
                  // 3. System defaults
                  let flags;
                  if (game.automation_settings) {
                    flags = game.automation_settings;
                  } else if (tournament.automation_settings) {
                    flags = tournament.automation_settings;
                  } else {
                    flags = DEFAULT_AUTOMATION_FLAGS;
                  }
                  
                  setAutomationFlags(flags);
                  
                  // Warn if any automation is enabled unexpectedly
                  const anyEnabled = Object.values(flags).some((category: any) => 
                    category && typeof category === 'object' && category.enabled === true
                  );
                  if (anyEnabled) {
                    console.warn('⚠️ Phase 1: Some automation flags are enabled!', flags);
                  }
                } else {
                  // Tournament ID exists but query returned empty (likely RLS issue or deleted tournament)
                  console.warn('⚠️ Phase 1: Tournament ID exists but query returned empty');
                  setRuleset(RulesetService.getRuleset('NBA'));
                  
                  if (isCoachMode) {
                    setAutomationFlags(COACH_AUTOMATION_FLAGS);
                  } else {
                    setAutomationFlags(DEFAULT_AUTOMATION_FLAGS);
                  }
                }
              }
            } else {
              // No tournament_id - use coach defaults if in coach mode
              console.warn('⚠️ Phase 1: No tournament_id found');
              setRuleset(RulesetService.getRuleset('NBA'));
              
              if (isCoachMode) {
                setAutomationFlags(COACH_AUTOMATION_FLAGS);
              } else {
                setAutomationFlags(DEFAULT_AUTOMATION_FLAGS);
              }
            }
          } catch (rulesetError) {
            console.error('❌ Phase 1: Error loading ruleset:', rulesetError);
            // Fallback to NBA ruleset
            setRuleset(RulesetService.getRuleset('NBA'));
            
            // Fallback automation flags
            if (isCoachMode) {
              setAutomationFlags(COACH_AUTOMATION_FLAGS);
            } else {
              setAutomationFlags(DEFAULT_AUTOMATION_FLAGS);
            }
          }
        } else {
          console.warn('⚠️ Could not load game state from database');
        }
        
        // ✅ FIXED: Load existing stats to calculate current scores (for refresh persistence)
        // Use extracted helper function for consistency with WebSocket updates
        const calculatedScores = await calculateScoresFromStats(gameId, teamAId, teamBId, isCoachMode);
        
        if (calculatedScores) {
          // Initialize scores with calculated totals
          setScores(calculatedScores);
          } else {
          // Only default to 0-0 if stats fetch completed but returned empty (not if it failed)
          // This prevents race condition where initialization completes before stats load
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
  }, [gameId, teamAId, teamBId, isCoachMode, initialGameData, calculateScoresFromStats]);

  // ✅ Real-time subscription to sync timeout state, fouls, and scores from database
  useEffect(() => {
    if (!gameId || gameId === 'unknown' || !teamAId || !teamBId) return;

    console.log('🔌 useTracker: Setting up real-time subscription for game:', gameId);
    
    // ✅ DEBOUNCING: Debounce score recalculation to batch rapid updates
    // Use ref to persist timeout ID across re-renders and cleanup
    const scoreRecalculationTimeoutRef = { current: null as NodeJS.Timeout | null };
    const DEBOUNCE_DELAY = 300; // 300ms debounce window
    
    const unsubscribe = gameSubscriptionManager.subscribe(gameId, (table: string, payload: any) => {
      if (table === 'games' && payload.new) {
        const updatedGame = payload.new;
        
        // Sync timeout state when games table is updated
        if (updatedGame.team_a_timeouts_remaining !== undefined || updatedGame.team_b_timeouts_remaining !== undefined) {
          console.log('🔄 useTracker: Timeout state updated from database:', {
            team_a: updatedGame.team_a_timeouts_remaining,
            team_b: updatedGame.team_b_timeouts_remaining
          });
          
          setTeamTimeouts({
            [teamAId]: updatedGame.team_a_timeouts_remaining ?? 5,
            [teamBId]: updatedGame.team_b_timeouts_remaining ?? 5
          });
        }
        
        // ✅ Sync team fouls state when games table is updated
        // ✅ FIX: Guard to prevent overwriting local state during foul recording
        if ((updatedGame.team_a_fouls !== undefined || updatedGame.team_b_fouls !== undefined) && !foulUpdateInProgressRef.current) {
          setTeamFouls({
            [teamAId]: updatedGame.team_a_fouls ?? 0,
            [teamBId]: updatedGame.team_b_fouls ?? 0
          });
        }
        
        // ✅ DISABLED: WebSocket score sync from games table - Database scores can be stale/incorrect
        // Scores are calculated from game_stats (source of truth) via game_stats subscription handler below
        // Database triggers update games.home_score/away_score, but these can lag behind
        // Calculated scores from stats are always accurate.
      }
      
      // ✅ CRITICAL FIX: Recalculate scores when game_stats table is updated
      // This ensures scores stay in sync when stats are recorded from other devices/sessions
      if (table === 'game_stats') {
        // Clear existing debounce timer
        if (scoreRecalculationTimeoutRef.current) {
          clearTimeout(scoreRecalculationTimeoutRef.current);
          scoreRecalculationTimeoutRef.current = null;
        }
        
        // Debounce score recalculation to batch rapid updates
        scoreRecalculationTimeoutRef.current = setTimeout(async () => {
          try {
            const calculatedScores = await calculateScoresFromStats(gameId, teamAId, teamBId, isCoachMode);
            
            if (calculatedScores) {
              // ✅ ANTI-FLICKER: Only update if scores actually changed
              const currentScores = scoresRef.current;
          let hasChanges = false;
              
          if (teamAId === teamBId) {
            // Coach mode: compare both team score and opponent score
                hasChanges = (
                  currentScores[teamAId] !== calculatedScores[teamAId] ||
                  currentScores.opponent !== calculatedScores.opponent
                );
          } else {
            // Tournament mode: compare both team scores
                hasChanges = (
                  currentScores[teamAId] !== calculatedScores[teamAId] ||
                  currentScores[teamBId] !== calculatedScores[teamBId]
                );
          }
          
          if (hasChanges) {
                console.log('🔄 useTracker: Scores recalculated from game_stats:', {
                  previous: currentScores,
                  calculated: calculatedScores
                });
                setScores(calculatedScores);
              }
            }
          } catch (error) {
            console.error('❌ Error recalculating scores from game_stats update:', error);
            // Don't update scores on error (keep current state)
          } finally {
            scoreRecalculationTimeoutRef.current = null;
          }
        }, DEBOUNCE_DELAY);
      }
    });

    return () => {
      // Cleanup: Clear debounce timer on unmount
      if (scoreRecalculationTimeoutRef.current) {
        clearTimeout(scoreRecalculationTimeoutRef.current);
        scoreRecalculationTimeoutRef.current = null;
      }
      unsubscribe();
    };
  }, [gameId, teamAId, teamBId, isCoachMode, calculateScoresFromStats]);

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
    // Regular quarters (1-4): Use original quarter length from pre-flight
    // Overtime periods (5+): 5 minutes
    const isOvertimePeriod = targetQuarter >= 5;
    const clockMinutes = isOvertimePeriod ? 5 : originalQuarterLength;
    const newSeconds = clockMinutes * 60;
    
    console.log(`🕐 Resetting clock for quarter ${targetQuarter}: ${clockMinutes} minutes (${newSeconds} seconds)`);
    
    setClock({ isRunning: false, secondsRemaining: newSeconds });
    
    if (isOvertimePeriod) {
      const otPeriod = targetQuarter - 4;
      setLastAction(`OT${otPeriod} clock reset (5 minutes)`);
    } else {
      setLastAction(`Q${targetQuarter} clock reset (12 minutes)`);
    }
    
    // ✅ FIX #3: Sync clock state to database with correct minutes (not always 12)
    try {
      const { GameService } = await import('@/lib/services/gameService');
      await GameService.updateGameClock(gameId, {
        minutes: clockMinutes, // ✅ Use calculated value (12 or 5)
        seconds: 0,
        isRunning: false
      });
    } catch (error) {
      console.error('Error syncing clock reset to database:', error);
    }
  }, [gameId, quarter, originalQuarterLength]);

  // NEW: Set custom time (for manual editing)
  const setCustomTime = useCallback(async (minutes: number, seconds: number) => {
    // ✅ Use original quarter length as max (overtime uses 5 min)
    const isOvertime = quarter >= 5;
    const maxMinutes = isOvertime ? 5 : originalQuarterLength;
    
    // Validate input ranges
    const validMinutes = Math.max(0, Math.min(maxMinutes, Math.floor(minutes)));
    const validSeconds = Math.max(0, Math.min(59, Math.floor(seconds))); // 0-59 seconds
    
    const totalSeconds = validMinutes * 60 + validSeconds;
    
    // Stop clock when setting custom time
    setClock({ isRunning: false, secondsRemaining: totalSeconds });
    setLastAction(`Clock set to ${validMinutes}:${validSeconds.toString().padStart(2, '0')}`);
    
    console.log(`🕐 Manual clock set: ${validMinutes}:${validSeconds.toString().padStart(2, '0')} (max: ${maxMinutes} min)`);
    
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
  }, [gameId, quarter, originalQuarterLength]);

  // NEW: Shot Clock Controls
  const startShotClock = useCallback(() => {
    setShotClock(prev => ({ ...prev, isRunning: true }));
    setLastAction('Shot clock started');
  }, []);

  const stopShotClock = useCallback(() => {
    setShotClock(prev => ({ ...prev, isRunning: false }));
    setLastAction('Shot clock stopped');
  }, []);

  const resetShotClock = useCallback((seconds?: number) => {
    const resetValue = seconds ?? 24; // Default to 24 if undefined
    
    // ✅ SYNC WITH GAME CLOCK: Shot clock inherits game clock's running state
    setShotClock(prev => ({ 
      ...prev, 
      isRunning: clock.isRunning, // ✅ Sync with game clock (source of truth)
      secondsRemaining: resetValue 
    }));
    
    // ✅ NBA SYNC FIX: Delay first tick to align with game clock (prevents 23s flash)
    setShotClockJustReset(true);
    
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
    
    // ✅ NBA SYNC FIX: Delay first tick to align with game clock (prevents 23s flash)
    setShotClockJustReset(true);
    
    setLastAction(`Shot clock set to ${validSeconds}s`);
    console.log(`🏀 Shot clock set to ${validSeconds} seconds (synced with game clock: ${clock.isRunning ? 'RUNNING' : 'PAUSED'})`);
  }, [clock.isRunning]);

  const tick = useCallback(async (seconds: number) => {
    setClock(prev => {
      const newSecondsRemaining = Math.max(0, prev.secondsRemaining - seconds);
      const newClock = {
        ...prev,
        secondsRemaining: newSecondsRemaining
      };
      
      // ✅ Throttled DB sync: Update database every 5 seconds when clock is running
      if (prev.isRunning) {
        const now = Date.now();
        const timeSinceLastSync = now - lastClockSyncRef.current;
        
        if (timeSinceLastSync >= CLOCK_SYNC_INTERVAL) {
          lastClockSyncRef.current = now;
          
          // Sync to database asynchronously (don't block UI)
          const minutes = Math.floor(newSecondsRemaining / 60);
          const secondsRem = newSecondsRemaining % 60;
          
          // Use GameService to sync clock state
          import('@/lib/services/gameService').then(({ GameService }) => {
            GameService.updateGameClock(gameId, {
              minutes,
              seconds: secondsRem,
              isRunning: true
            }).catch((error) => {
              console.error('❌ Error syncing clock tick to database:', error);
            });
          });
        }
      }
      
      return newClock;
    });
  }, [gameId]);

  // NEW: Shot Clock Tick
  const shotClockTick = useCallback((seconds: number) => {
    setShotClock(prev => ({
      ...prev,
      secondsRemaining: Math.max(0, prev.secondsRemaining - seconds)
    }));
  }, []);

  // ✅ Toggle shot clock visibility (UI only - clock state continues internally)
  const toggleShotClockVisibility = useCallback(() => {
    setShotClock(prev => {
      const newVisibility = !prev.isVisible;
      
      // Persist preference to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`shotClockEnabled_${gameId}`, JSON.stringify(newVisibility));
        } catch (error) {
          console.warn('Failed to persist shot clock visibility preference:', error);
        }
      }
      
      setLastAction(`Shot clock ${newVisibility ? 'shown' : 'hidden'}`);
      console.log(`👁️ Shot clock visibility toggled: ${newVisibility ? 'VISIBLE' : 'HIDDEN'}`);
      
      return {
        ...prev,
        isVisible: newVisibility
      };
    });
  }, [gameId]);

  const setQuarter = useCallback(async (newQuarter: number) => {
    // ✅ Validate quarter before changing
    const validation = validateQuarter(newQuarter);
    if (!validation.valid) {
      const { notify } = await import('@/lib/services/notificationService');
      notify.error('Invalid Quarter', validation.error || 'Quarter value is invalid');
      console.error('❌ Invalid quarter:', validation.error);
      return;
    }
    
    // ✅ Show warning if moving to overtime
    if (validation.warning) {
      console.log('⚠️ Quarter change warning:', validation.warning);
    }
    
    // ✅ FIX #2: Calculate new clock time BEFORE resetting (prevents race condition)
    const isOvertime = newQuarter >= 5;
    const newClockMinutes = isOvertime ? 5 : 12;
    const newClockSeconds = 0;
    
    // ✅ Update quarter state
    setQuarterState(newQuarter);
    
    // ✅ Reset clock for the new quarter (handles Q1-4 = 12 min, OT = 5 min)
    resetClock(newQuarter);
    
    // ✅ FIX: Reset team fouls on quarter change (NBA rule: fouls reset each quarter)
    setTeamFouls({
      [teamAId]: 0,
      [teamBId]: 0
    });
    console.log('🏀 Team fouls reset for new quarter');
    
    // ✅ Update last action message
    const quarterDisplay = newQuarter <= 4 ? `Q${newQuarter}` : `OT${newQuarter - 4}`;
    setLastAction(`Changed to ${quarterDisplay}`);
    
    // ✅ FIX #2: Sync quarter change to database with calculated clock time (not stale state)
    // ✅ FIX: Also reset team fouls in database
    try {
      const { GameService } = await import('@/lib/services/gameService');
      await GameService.updateGameState(gameId, {
        quarter: newQuarter,
        game_clock_minutes: newClockMinutes, // ✅ Use calculated value (not stale clock state)
        game_clock_seconds: newClockSeconds,  // ✅ Use calculated value
        is_clock_running: false, // ✅ Stop clock when quarter changes manually
        home_score: 0, // Scores are managed separately via stats
        away_score: 0,  // Scores are managed separately via stats
        team_a_fouls: 0, // ✅ Reset team fouls in database
        team_b_fouls: 0  // ✅ Reset team fouls in database
      });
      console.log('✅ Quarter synced to database:', newQuarter, '(fouls reset)');
    } catch (error) {
      console.error('❌ Error syncing quarter to database:', error);
      const { notify } = await import('@/lib/services/notificationService');
      notify.error('Sync Failed', 'Failed to sync quarter change to database');
    }
  }, [gameId, resetClock, teamAId, teamBId]);

  const advanceIfNeeded = useCallback(() => {
    // ✅ FIX #5: Guard against multiple calls - only advance if clock reaches 0
    // ✅ FIX #6: Ensure clock is stopped before advancing
    if (clock.secondsRemaining <= 0) {
      // Stop clock if still running
      if (clock.isRunning) {
        setClock(prev => ({ ...prev, isRunning: false }));
      }
      
      if (quarter < 4) {
        // Regular quarters 1-4
        const nextQuarter = quarter + 1;
        // ✅ FIX #1: setQuarter already calls resetClock internally - remove duplicate call
        setQuarter(nextQuarter);
      } else if (quarter === 4) {
        // End of 4th quarter - check if game should go to overtime
        // ✅ FIX #4 & #7: Use correct score access (handle coach mode)
        const teamAScore = scores[teamAId] || 0;
        const teamBScore = teamAId === teamBId 
          ? scores.opponent || 0  // Coach mode: opponent score
          : scores[teamBId] || 0; // Tournament mode: team B score
        
        if (teamAScore === teamBScore) {
          // Tied game - go to overtime
          console.log(`🏀 End of regulation - TIED GAME (${teamAScore}-${teamBScore}) - advancing to overtime`);
          // ✅ FIX #1: setQuarter already calls resetClock internally - remove duplicate call
          setQuarter(5); // Overtime starts at quarter 5
        } else {
          // Game has a winner - show game over modal
          const winner = teamAScore > teamBScore ? 'Team A' : 'Team B';
          console.log(`🏀 End of regulation - GAME OVER! Winner: ${winner} (${teamAScore}-${teamBScore})`);
          setLastAction(`Game Over! ${winner} wins ${teamAScore}-${teamBScore}`);
          setShowGameOverModal(true); // ✅ Trigger game over modal
        }
      } else {
        // Already in overtime (quarter >= 5) - check for tie again
        // ✅ FIX #4 & #7: Use correct score access (handle coach mode)
        const teamAScore = scores[teamAId] || 0;
        const teamBScore = teamAId === teamBId 
          ? scores.opponent || 0  // Coach mode: opponent score
          : scores[teamBId] || 0; // Tournament mode: team B score
        
        if (teamAScore === teamBScore) {
          // Still tied - continue to next OT period
          const currentOT = quarter - 4;
          const nextOT = currentOT + 1;
          const nextQuarter = quarter + 1;
          console.log(`🏀 End of OT${currentOT} - STILL TIED (${teamAScore}-${teamBScore}) - advancing to OT${nextOT}`);
          // ✅ FIX #1: setQuarter already calls resetClock internally - remove duplicate call
          setQuarter(nextQuarter);
        } else {
          // Overtime has a winner - show game over modal
          const winner = teamAScore > teamBScore ? 'Team A' : 'Team B';
          const currentOT = quarter - 4;
          console.log(`🏀 End of OT${currentOT} - GAME OVER! Winner: ${winner} (${teamAScore}-${teamBScore})`);
          setLastAction(`Game Over in OT${currentOT}! ${winner} wins ${teamAScore}-${teamBScore}`);
          setShowGameOverModal(true); // ✅ Trigger game over modal
        }
      }
    }
  }, [clock.secondsRemaining, clock.isRunning, quarter, setQuarter, scores, teamAId, teamBId]);

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
    
    
    // ✅ FIX #2: Track optimistic score update for potential rollback
    // ✅ CRITICAL FIX: Declare outside try block so it's accessible in catch block
    let optimisticScoreUpdate: Record<string, number> | null = null;
    
    try {
      const fullStat: StatRecord = {
        ...stat,
        quarter: quarter as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
        gameTimeSeconds: clock.secondsRemaining,
        createdAt: new Date().toISOString()
      };

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
          optimisticScoreUpdate = { opponent: statValue };
          uiUpdates.scores = { opponent: statValue };
        } else {
          optimisticScoreUpdate = { [stat.teamId]: statValue };
          uiUpdates.scores = { [stat.teamId]: statValue };
        }
      }

      // Prepare foul update (optimistic UI)
      if (stat.statType === 'foul') {
        uiUpdates.teamFouls = { [stat.teamId]: 1 };
      }

      // Prepare last action message
      // ✅ Format stat type and modifier properly (match Edit Stats Modal format)
      let statTypeFormatted: string;
      
      // ✅ FIX: Special formatting for fouls to match Edit Stats Modal (PERSONAL FOUL, SHOOTING FOUL, etc.)
      if (stat.statType === 'foul') {
        const foulType = stat.modifier?.toUpperCase() || 'FOUL';
        if (stat.modifier === 'shooting') {
          statTypeFormatted = 'SHOOTING FOUL';
        } else if (stat.modifier === 'personal') {
          statTypeFormatted = 'PERSONAL FOUL';
        } else if (stat.modifier === 'offensive') {
          statTypeFormatted = 'OFFENSIVE FOUL';
        } else if (stat.modifier === 'technical') {
          statTypeFormatted = 'TECHNICAL FOUL';
        } else if (stat.modifier === 'flagrant') {
          statTypeFormatted = 'FLAGRANT FOUL';
        } else {
          statTypeFormatted = `${foulType} FOUL`;
        }
      } else {
        // For other stats, use standard format
        statTypeFormatted = stat.statType.replace('_', ' ').toUpperCase();
        if (stat.modifier) {
          statTypeFormatted += ` (${stat.modifier})`;
        }
      }
      
      if (stat.isOpponentStat) {
        uiUpdates.lastAction = `Opponent Team: ${statTypeFormatted}`;
        uiUpdates.lastActionPlayerId = null;
      } else {
        uiUpdates.lastAction = statTypeFormatted;
        uiUpdates.lastActionPlayerId = stat.playerId || stat.customPlayerId || null;
      }

      // ✅ OPTIMIZATION 2: Apply ALL UI updates at once (single re-render)
      // ✅ FIX #2: Apply optimistic score update (will be rolled back if database write fails)
      if (uiUpdates.scores && optimisticScoreUpdate) {
        setScores(prev => ({
          ...prev,
          ...(stat.isOpponentStat 
            ? { opponent: (prev.opponent || 0) + uiUpdates.scores!.opponent }
            : { [stat.teamId]: (prev[stat.teamId] || 0) + uiUpdates.scores![stat.teamId] }
          )
        }));
      }
      if (uiUpdates.teamFouls) {
        // ✅ FIX: Set guard to prevent subscription from overwriting during update
        foulUpdateInProgressRef.current = true;
        
        const newFoulCount = (teamFouls[stat.teamId] || 0) + 1;
        setTeamFouls(prev => ({
          ...prev,
          [stat.teamId]: newFoulCount
        }));
        
        // ✅ FIX: Persist team fouls to database (async, non-blocking)
        (async () => {
          try {
            const { GameService } = await import('@/lib/services/gameService');
            const isTeamA = stat.teamId === teamAId;
            await GameService.updateGameState(gameId, {
              quarter: quarter,
              game_clock_minutes: Math.floor(clock.secondsRemaining / 60),
              game_clock_seconds: clock.secondsRemaining % 60,
              is_clock_running: clock.isRunning,
              home_score: 0, // Scores managed separately
              away_score: 0,
              ...(isTeamA 
                ? { team_a_fouls: newFoulCount }
                : { team_b_fouls: newFoulCount }
              )
            });
            console.log(`✅ Team fouls persisted to DB: Team ${isTeamA ? 'A' : 'B'} = ${newFoulCount}`);
          } catch (error) {
            console.error('❌ Failed to persist team fouls:', error);
          } finally {
            // ✅ Clear guard after DB update completes (with small delay to handle race conditions)
            setTimeout(() => {
              foulUpdateInProgressRef.current = false;
            }, 500);
          }
        })();
      }
      if (uiUpdates.lastAction) {
        setLastAction(uiUpdates.lastAction);
        setLastActionPlayerId(uiUpdates.lastActionPlayerId || null);
      }

      // ✅ OPTIMIZATION: Skip clock/play sequence processing for follow-up stats (allows modals to close immediately)
      // Note: Possession processing is NOT skipped - rebound/turnover MUST trigger possession changes
      // Only assist truly doesn't affect any engine (the made shot already handled everything)
      const skipClockAndSequences = stat.statType === 'assist';
      
      if (!skipClockAndSequences) {
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
          const newGameClockSeconds = (clockResult.newState.gameClockMinutes * 60) + clockResult.newState.gameClockSeconds;
          
          // ✅ OPTIMIZATION 4: Batch clock updates together
          setClock(prev => ({
            ...prev,
            secondsRemaining: newGameClockSeconds,
            isRunning: clockResult.newState.gameClockRunning
          }));
          
          setShotClock(prev => {
            // ✅ FIX: Preserve user's visibility preference
            // ClockEngine.shotClockDisabled is for FT mode only, not user visibility preference
            // Only hide shot clock if ClockEngine explicitly disabled for FT mode (shotClockDisabled === true)
            // When ClockEngine re-enables (shotClockDisabled = false), preserve user's preference
            const newVisibility = clockResult.newState.shotClockDisabled === true
              ? false // Hide for FT mode only
              : prev.isVisible; // ✅ Preserve user preference (don't re-enable if user hid it)
            
            return {
              ...prev,
              secondsRemaining: clockResult.newState.shotClock,
              isRunning: clockResult.newState.shotClockRunning,
              isVisible: newVisibility
            };
          });
        }
      }
      } // End of skipClockAndSequences block for clock processing

      // ✅ PHASE 3: Process possession automation (ALWAYS runs for rebound/turnover/free_throw)
      // This is OUTSIDE skipClockAndSequences because these stats MUST trigger possession changes
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

      // ✅ PHASE 4: Process play sequence automation (skip for assists - they don't trigger sequences)
      if (!skipClockAndSequences && ruleset && automationFlags.sequences?.enabled) {
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
        
        // ✅ SEQUENTIAL PROMPTS: Handle prompt queue (Rebound, Free Throws, etc.)
        // Note: Blocks removed from auto-sequence but can still be recorded manually
        // ✅ FIX: Skip assist/rebound prompts if this stat is part of a foul sequence (has sequenceId)
        // This prevents assist/rebound modals from appearing during shooting foul sequences
        // When a stat has a sequenceId, it means it's linked to a foul, so skip prompts
        const isPartOfFoulSequence = !!stat.sequenceId;
        // ✅ FIX: Skip rebound prompt if explicitly requested (e.g., non-last FT in auto-sequence)
        const shouldSkipReboundFromMetadata = stat.eventMetadata?.skipRebound === true;
        const shouldSkipAssistPrompt = isPartOfFoulSequence && playResult.promptType === 'assist';
        const shouldSkipReboundPrompt = (isPartOfFoulSequence && playResult.promptType === 'rebound') ||
                                        (shouldSkipReboundFromMetadata && playResult.promptType === 'rebound');
        
        if (playResult.shouldPrompt && playResult.promptType && 
            (playResult.promptType === 'assist' || playResult.promptType === 'rebound' || playResult.promptType === 'block' || playResult.promptType === 'free_throw' || playResult.promptType === 'missed_shot_type') &&
            !shouldSkipAssistPrompt && !shouldSkipReboundPrompt) {
          
          // ✅ COACH MODE FIX: Don't show prompts for opponent actions
          if (isCoachMode && stat.isOpponentStat) {
            console.log('⏭️ Skipping prompt for opponent action in coach mode (no individual players)');
            // Don't show modal - opponent has no individual players to select
          } else {
            // Check if we have a queue (multiple prompts)
            if (playResult.promptQueue && playResult.promptQueue.length > 0) {
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
          // ✅ COACH MODE: Show turnover prompt for opponent steals
          if (isCoachMode) {
            if (stat.isOpponentStat) {
              // Opponent stole from home team
              // → Show turnover prompt to select which home player lost possession
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
            // ✅ REGULAR MODE: Show turnover prompt modal (same as coach mode)
            // This allows tracker to select "who turned the ball over" for accurate team turnover tracking
            setPlayPrompt({
              isOpen: true,
              type: 'turnover',
              sequenceId: playResult.sequenceId || null,
              primaryEventId: null,
              metadata: {
                stealerId: playResult.metadata?.stealerId || stat.playerId || stat.customPlayerId,
                stealerName: 'Unknown', // Will be resolved by page.tsx from player list
                stealerTeamId: stat.teamId
              }
            });
          }
        }
      }
      // ✅ End of play sequence processing

      // ✅ OPTIMIZATION 5: Database write happens AFTER UI updates (non-blocking)
      // Use Promise.all to load imports in parallel
      const [
        { GameServiceV3 },
        { validateStatValue, validateQuarter },
        { notify },
        { statWriteQueueService }
      ] = await Promise.all([
        import('@/lib/services/gameServiceV3'),
        import('@/lib/validation/statValidation'),
        import('@/lib/services/notificationService'),
        import('@/lib/services/statWriteQueueService')
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

      // ✅ DEBUG: Log personal foul recording details
      if (stat.statType === 'foul' && stat.modifier === 'personal') {
        console.log('🔍 useTracker.recordStat: Recording PERSONAL FOUL -', {
          gameId: stat.gameId,
          playerId: stat.playerId,
          customPlayerId: stat.customPlayerId,
          teamId: stat.teamId,
          modifier: stat.modifier,
          quarter,
          gameTimeMinutes: Math.floor(clock.secondsRemaining / 60),
          gameTimeSeconds: clock.secondsRemaining % 60
        });
      }
      
      // ✅ NEW: Queue database write to prevent concurrent writes and lock contention
      // Writes are processed sequentially while UI remains responsive (optimistic updates)
      // ✅ RELIABILITY: Generate idempotency key before write to prevent duplicates
      const { IdempotencyService } = await import('@/lib/services/idempotencyService');
      const idempotencyKey = IdempotencyService.generateKey();
      
      const result = await statWriteQueueService.enqueue(
        () => GameServiceV3.recordStat({
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
          gameTimeSeconds: clock.secondsRemaining % 60,
          // ✅ FIX: Pass sequenceId and event linking fields to database
          sequenceId: stat.sequenceId,
          linkedEventId: stat.linkedEventId,
          eventMetadata: stat.eventMetadata,
          // ✅ RELIABILITY: Include idempotency key to prevent duplicate writes
          idempotencyKey: idempotencyKey
        }),
        stat.statType
      );
      
      // ✅ DEBUG: Log personal foul save result
      if (stat.statType === 'foul' && stat.modifier === 'personal') {
        console.log('✅ useTracker.recordStat: PERSONAL FOUL saved successfully -', result);
      }
      
      // ✅ UNDO: Capture last recorded stat for undo functionality
      // Note: Supabase REST API returns an array, so we need result[0]
      const savedStat = Array.isArray(result) ? result[0] : result;
      if (savedStat && savedStat.id) {
        setLastRecordedStat({
          id: savedStat.id,
          statType: stat.statType,
          modifier: stat.modifier || null,
          statValue: statValue,
          teamId: stat.teamId,
          playerId: stat.playerId || null,
          customPlayerId: stat.customPlayerId || null,
          isOpponentStat: stat.isOpponentStat || false
        });
        console.log('✅ useTracker: Captured stat for undo:', savedStat.id);
      }
      
    } catch (error) {
      console.error('❌ Error recording stat:', error);
      
      // ✅ QUICK WIN: Log error with context
      const { errorLoggingService } = await import('@/lib/services/errorLoggingService');
      errorLoggingService.logError(
        error instanceof Error ? error : new Error(String(error)),
        {
          gameId: stat.gameId,
          action: 'record_stat',
          metadata: {
            statType: stat.statType,
            modifier: stat.modifier,
            playerId: stat.playerId,
            teamId: stat.teamId
          }
        }
      );
      
      // ✅ FIX #2: Rollback optimistic score update on database write failure
      if (optimisticScoreUpdate) {
        setScores(prev => {
          const rolledBack = { ...prev };
          if (stat.isOpponentStat && optimisticScoreUpdate!.opponent) {
            // Rollback opponent score
            rolledBack.opponent = Math.max(0, (prev.opponent || 0) - optimisticScoreUpdate!.opponent);
          } else if (optimisticScoreUpdate![stat.teamId]) {
            // Rollback team score
            rolledBack[stat.teamId] = Math.max(0, (prev[stat.teamId] || 0) - optimisticScoreUpdate![stat.teamId]);
          }
          return rolledBack;
        });
        console.log('🔄 Rolled back optimistic score update due to database write failure');
      }
      
      // ✅ DEBUG: Log foul-specific errors
      if (stat.statType === 'foul') {
        console.error('🔍 useTracker: Foul recording failed - StatType:', stat.statType, 'Modifier:', stat.modifier, 'Error:', error);
      }
      
      // Import notification service for error display
      const { notify } = await import('@/lib/services/notificationService');
      const errorMessage = error instanceof Error ? error.message : 'Failed to record stat';
      notify.error('Failed to record stat', errorMessage);
      
      setLastAction('Error recording stat');
      setLastActionPlayerId(stat.playerId || null);
    }
  }, [quarter, clock.secondsRemaining, gameStatus]);

  // Substitution
  const substitute = useCallback(async (sub: { gameId: string; teamId: string; playerOutId: string; playerInId: string; quarter: number; gameTimeSeconds: number; playerOutName?: string; playerInName?: string; isCustomPlayerOut?: boolean; isCustomPlayerIn?: boolean }): Promise<boolean> => {
    // ✅ BLOCK: Don't allow substitutions if game is ended
    if (gameStatus === 'completed' || gameStatus === 'cancelled') {
      const { notify } = await import('@/lib/services/notificationService');
      notify.warning('Game Ended', 'This game has ended. No more substitutions can be made.');
      return false;
    }
      
      try {
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
        gameTimeSeconds: sub.gameTimeSeconds % 60,
        isCustomPlayerIn: sub.isCustomPlayerIn,
        isCustomPlayerOut: sub.isCustomPlayerOut
      });

      if (success) {
        console.log('✅ Substitution recorded successfully in database');
        // ✅ Use player names if provided, otherwise fallback to IDs
        const playerOutDisplay = sub.playerOutName || `Player ${sub.playerOutId}`;
        const playerInDisplay = sub.playerInName || `Player ${sub.playerInId}`;
        setLastAction(`Substitution: ${playerOutDisplay} → ${playerInDisplay}`);
        setLastActionPlayerId(sub.playerInId); // Set to player coming in
        
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
        const { notify } = await import('@/lib/services/notificationService');
        notify.error('Substitution Failed', 'Could not save substitution to database. Please try again.');
        setLastAction('Error recording substitution');
        return false;
      }
    } catch (error) {
      console.error('❌ Error with substitution:', error);
      const { notify } = await import('@/lib/services/notificationService');
      notify.error('Substitution Error', error instanceof Error ? error.message : 'An unexpected error occurred');
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
      // ✅ FIX: Always decrement by exactly 1, regardless of timeout type (60s or 30s)
      // The real-time subscription will sync the state from the database, so we don't need manual local decrement
      const success = await GameServiceV3.recordTimeout({
        gameId,
        teamId,
        quarter,
        gameClockMinutes: Math.floor(clock.secondsRemaining / 60),
        gameClockSeconds: clock.secondsRemaining % 60,
        timeoutType: type
      });
      
      if (success) {
        // ✅ REMOVED: Manual local decrement - rely on real-time subscription for state sync
        // This ensures single source of truth and prevents double decrement issues
        
        console.log('✅ Timeout started successfully - waiting for real-time sync');
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
      setTimeoutActive(false);
    setTimeoutTeamId(null);
    setTimeoutSecondsRemaining(60);
    setLastAction('Play resumed');
    // Don't auto-start clocks - let admin start manually
  }, []);
  
  // ✅ PHASE 4: Clear play prompt (with queue support)
  const clearPlayPrompt = useCallback(() => {
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

  // ✅ UNDO: Undo last recorded stat
  const undoLastAction = useCallback(async () => {
    if (!lastRecordedStat) {
      const { notify } = await import('@/lib/services/notificationService');
      notify.warning('Nothing to Undo', 'No recent action to undo.');
      return;
    }

    try {
      const { notify } = await import('@/lib/services/notificationService');
      const { StatEditServiceV2 } = await import('@/lib/services/statEditServiceV2');
      
      console.log('🔄 useTracker: Undoing stat:', lastRecordedStat.id);
      
      // Delete the stat from database
      await StatEditServiceV2.deleteStat(lastRecordedStat.id, gameId);
      
      // Reverse score if it was a scoring stat
      if (lastRecordedStat.modifier === 'made' && lastRecordedStat.statValue > 0) {
        setScores(prev => {
          if (lastRecordedStat.isOpponentStat) {
            return { ...prev, opponent: Math.max(0, (prev.opponent || 0) - lastRecordedStat.statValue) };
          } else {
            return { ...prev, [lastRecordedStat.teamId]: Math.max(0, (prev[lastRecordedStat.teamId] || 0) - lastRecordedStat.statValue) };
          }
        });
      }
      
      // Reverse foul count if it was a foul
      if (lastRecordedStat.statType === 'foul') {
        const newFoulCount = Math.max(0, (teamFouls[lastRecordedStat.teamId] || 0) - 1);
        setTeamFouls(prev => ({
          ...prev,
          [lastRecordedStat.teamId]: newFoulCount
        }));
        
        // ✅ FIX: Persist foul decrement to database
        try {
          const { GameService } = await import('@/lib/services/gameService');
          const isTeamA = lastRecordedStat.teamId === teamAId;
          await GameService.updateGameState(gameId, {
            quarter: quarter,
            game_clock_minutes: Math.floor(clock.secondsRemaining / 60),
            game_clock_seconds: clock.secondsRemaining % 60,
            is_clock_running: clock.isRunning,
            home_score: 0,
            away_score: 0,
            ...(isTeamA 
              ? { team_a_fouls: newFoulCount }
              : { team_b_fouls: newFoulCount }
            )
          });
          console.log(`✅ Foul undo persisted to DB: Team ${isTeamA ? 'A' : 'B'} = ${newFoulCount}`);
        } catch (error) {
          console.error('❌ Failed to persist foul undo:', error);
        }
      }
      
      // Clear the last action display and recorded stat
      setLastAction(null);
      setLastActionPlayerId(null);
      setLastRecordedStat(null);
      
      notify.success('Undo Successful', 'Last action has been undone.');
      console.log('✅ useTracker: Stat undone successfully');
      
    } catch (error) {
      console.error('❌ useTracker: Failed to undo stat:', error);
      const { notify } = await import('@/lib/services/notificationService');
      notify.error('Undo Failed', 'Could not undo the last action. Please try again.');
    }
  }, [lastRecordedStat, gameId]);

  // Game Management
  const closeGame = useCallback(async () => {
    try {
      // ✅ CRITICAL: Check if game is tied (require OT) - Skip for coach mode
      // Coach mode: scores may not be tracked in games table, user edits final score in modal
      if (!isCoachMode) {
        const teamAScore = scores[teamAId] || 0;
        const teamBScore = scores[teamBId] || 0;
        
        if (teamAScore === teamBScore && gameStatus !== 'overtime') {
          const { notify } = await import('@/lib/services/notificationService');
          notify.warning('Tied Game', 'Complete overtime before selecting awards.');
          console.warn('⚠️ Cannot complete tied game - overtime required');
          return;
        }
      }

      // ✅ Show awards modal for both regular and coach mode games
      // Coach mode will also allow editing final opponent score
      setClock(prev => ({ ...prev, isRunning: false }));
      stopShotClock();
      setShowAwardsModal(true);
    } catch (error) {
      console.error('❌ Error closing game:', error);
      setLastAction('Error closing game');
    }
  }, [gameId, scores, teamAId, teamBId, gameStatus, isCoachMode, stopShotClock]);

  // ✅ Complete game with awards (called from awards modal)
  // ✅ UPDATED: Supports custom players + coach mode final score (Nov 2025)
  const completeGameWithAwards = useCallback(async (awards: {
    playerOfTheGameId: string;
    hustlePlayerId: string;
    isPlayerOfGameCustom?: boolean;
    isHustlePlayerCustom?: boolean;
    finalOpponentScore?: number;  // ✅ Coach mode: final opponent score
  }) => {
    try {
      const { GameAwardsService } = await import('@/lib/services/gameAwardsService');
      const { GameService } = await import('@/lib/services/gameService');
      
      console.log('🏆 useTracker: Saving awards with custom player support', {
        playerOfTheGameId: awards.playerOfTheGameId,
        isPlayerOfGameCustom: awards.isPlayerOfGameCustom,
        hustlePlayerId: awards.hustlePlayerId,
        isHustlePlayerCustom: awards.isHustlePlayerCustom,
        ...(awards.finalOpponentScore !== undefined && { finalOpponentScore: awards.finalOpponentScore })
      });
      
      // Save awards (with custom player flags)
      await GameAwardsService.saveGameAwards(gameId, {
        playerOfTheGameId: awards.playerOfTheGameId,
        hustlePlayerId: awards.hustlePlayerId,
        isPlayerOfGameCustom: awards.isPlayerOfGameCustom,
        isHustlePlayerCustom: awards.isHustlePlayerCustom
      });

      // ✅ Coach mode: Update opponent final score if provided
      if (awards.finalOpponentScore !== undefined && isCoachMode) {
        console.log('🏀 Coach mode: Updating final opponent score to', awards.finalOpponentScore);
        await GameService.updateGameScore(gameId, {
          away_score: awards.finalOpponentScore
        });
      }

      // Update game status to completed
      const success = await GameService.updateGameStatus(gameId, 'completed');
      
      if (success) {
        setGameStatus('completed');
        setShowAwardsModal(false);
        console.log('✅ Game completed with awards (custom player + coach mode support enabled)');
        setLastAction('Game ended with awards');
      } else {
        throw new Error('Failed to update game status');
      }
    } catch (error) {
      console.error('❌ Error completing game with awards:', error);
      setLastAction('Error completing game');
      throw error;
    }
  }, [gameId, isCoachMode]);

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

  // ✅ Auto-save game clock on page unload/navigation - CRITICAL: Stop clock and save exact time
  useEffect(() => {
    const saveClockState = async (forceStop: boolean = false) => {
      // ✅ GUARD: Don't save if game data hasn't loaded yet (prevents saving hardcoded 12 min)
      if (!gameDataLoadedRef.current) {
        console.log('⏭️ Skipping clock save - game data not loaded yet');
        return;
      }
      
      try {
        const { GameService } = await import('@/lib/services/gameService');
        // ✅ CRITICAL: Use ref to get current clock state (not stale closure)
        const currentClock = clockRef.current;
        const finalIsRunning = forceStop ? false : currentClock.isRunning;
        
        const minutes = Math.floor(currentClock.secondsRemaining / 60);
        const seconds = currentClock.secondsRemaining % 60;
        
        console.log('🔍 DEBUG saveClockState - About to save:', {
          secondsRemaining: currentClock.secondsRemaining,
          minutes,
          seconds,
          forceStop,
          gameDataLoaded: gameDataLoadedRef.current
        });
        
        await GameService.updateGameClock(gameId, {
          minutes,
          seconds,
          isRunning: finalIsRunning
        });
        
        // Also update local state if we're forcing stop
        if (forceStop && currentClock.isRunning) {
          setClock(prev => ({ ...prev, isRunning: false }));
        }
        
        console.log(`✅ Clock state auto-saved: ${Math.floor(currentClock.secondsRemaining / 60)}:${(currentClock.secondsRemaining % 60).toString().padStart(2, '0')} (${finalIsRunning ? 'RUNNING' : 'STOPPED'})`);
      } catch (error) {
        console.error('❌ Error auto-saving clock state:', error);
      }
    };

    // Debounce function to prevent excessive saves
    let saveTimeout: NodeJS.Timeout | null = null;
    const debouncedSave = (forceStop: boolean = false) => {
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        saveClockState(forceStop);
      }, 100); // Reduced debounce for critical saves
    };

    // Save on beforeunload (page close/navigation) - CRITICAL: Stop clock and save exact time
    const handleBeforeUnload = () => {
      // ✅ GUARD: Don't save if game data hasn't loaded yet (prevents saving hardcoded 12 min)
      if (!gameDataLoadedRef.current) {
        console.log('⏭️ Skipping beforeunload save - game data not loaded yet');
        return;
      }
      
      // ✅ CRITICAL: Use ref to get current clock state (not stale closure)
      const currentClock = clockRef.current;
      
      console.log('🔍 DEBUG handleBeforeUnload - Clock ref value:', {
        secondsRemaining: currentClock.secondsRemaining,
        minutes: Math.floor(currentClock.secondsRemaining / 60),
        isRunning: currentClock.isRunning,
        gameDataLoaded: gameDataLoadedRef.current
      });
      
      // Stop clock immediately to preserve exact time
      if (currentClock.isRunning) {
        setClock(prev => ({ ...prev, isRunning: false }));
        // Update ref immediately
        clockRef.current = { ...currentClock, isRunning: false };
      }
      
      // Save to sessionStorage as backup (synchronous) - use ref for current value
      if (typeof window !== 'undefined') {
        try {
          const finalClock = clockRef.current;
          const clockData = {
            minutes: Math.floor(finalClock.secondsRemaining / 60),
            seconds: finalClock.secondsRemaining % 60,
            isRunning: false, // Always stop on exit
            timestamp: Date.now()
          };
          
          sessionStorage.setItem(`clock_backup_${gameId}`, JSON.stringify(clockData));
          console.log(`💾 Clock backup saved to sessionStorage: ${clockData.minutes}:${clockData.seconds.toString().padStart(2, '0')}`);
          
          // ✅ QUICK WIN: Use sendBeacon to attempt database save (guaranteed delivery on page close)
          // Note: sendBeacon can't set auth headers, so this is best-effort
          // The async save below and sessionStorage backup provide redundancy
          if (navigator.sendBeacon && process.env.NEXT_PUBLIC_SUPABASE_URL) {
            try {
              // Attempt to save via sendBeacon (best-effort, may fail without auth)
              // This ensures the request is sent even if page closes immediately
              const beaconUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/games?id=eq.${gameId}`;
              const beaconData = JSON.stringify({
                game_clock_minutes: clockData.minutes,
                game_clock_seconds: clockData.seconds,
                is_clock_running: false
              });
              const blob = new Blob([beaconData], { type: 'application/json' });
              
              // sendBeacon will attempt the request (may fail without auth, but that's OK)
              // The async save below and sessionStorage provide redundancy
              if (navigator.sendBeacon(beaconUrl, blob)) {
                console.log('✅ Clock state sent via sendBeacon (best-effort, may require auth)');
              }
            } catch (beaconError) {
              // Silent fail - async save below will handle it
              console.warn('⚠️ sendBeacon attempt failed (expected without auth), async save will handle');
            }
          }
        } catch (error) {
          console.error('Error saving clock to sessionStorage:', error);
        }
      }
      
      // Attempt async save with forced stop (may not complete, but try anyway)
      // This will handle the database update, sendBeacon above ensures sessionStorage persistence
      saveClockState(true);
    };

    // Save on visibility change (tab switch/minimize) - Stop clock if running
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // ✅ CRITICAL: Use ref to get current clock state
        const currentClock = clockRef.current;
        
        // Tab became hidden - stop clock and save exact time
        if (currentClock.isRunning) {
          setClock(prev => ({ ...prev, isRunning: false }));
          // Update ref immediately
          clockRef.current = { ...currentClock, isRunning: false };
        }
        debouncedSave(true); // Force stop on tab switch
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (saveTimeout) clearTimeout(saveTimeout);
    };
  }, [gameId]); // ✅ CRITICAL: Only depend on gameId, not clock state (ref handles current value)

  // ✅ CRITICAL: Function to save clock state before navigation (called explicitly on "Exit to Dashboard")
  const saveClockBeforeExit = useCallback(async () => {
    try {
      const { GameService } = await import('@/lib/services/gameService');
      // ✅ CRITICAL: Use ref to get current clock state (not stale closure)
      const currentClock = clockRef.current;
      
      // Stop clock immediately to preserve exact time
      if (currentClock.isRunning) {
        setClock(prev => ({ ...prev, isRunning: false }));
        // Update ref immediately
        clockRef.current = { ...currentClock, isRunning: false };
      }
      
      const finalClock = clockRef.current;
      
      // Save to sessionStorage as backup (synchronous)
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(`clock_backup_${gameId}`, JSON.stringify({
            minutes: Math.floor(finalClock.secondsRemaining / 60),
            seconds: finalClock.secondsRemaining % 60,
            isRunning: false, // Always stop on exit
            timestamp: Date.now()
          }));
          console.log(`💾 Clock backup saved to sessionStorage (before exit): ${Math.floor(finalClock.secondsRemaining / 60)}:${(finalClock.secondsRemaining % 60).toString().padStart(2, '0')}`);
        } catch (error) {
          console.error('Error saving clock to sessionStorage:', error);
        }
      }
      
      // Save to database (await to ensure it completes before navigation)
      await GameService.updateGameClock(gameId, {
        minutes: Math.floor(finalClock.secondsRemaining / 60),
        seconds: finalClock.secondsRemaining % 60,
        isRunning: false
      });
      
      console.log(`✅ Clock state saved before exit: ${Math.floor(finalClock.secondsRemaining / 60)}:${(finalClock.secondsRemaining % 60).toString().padStart(2, '0')} (STOPPED)`);
    } catch (error) {
      console.error('❌ Error saving clock state before exit:', error);
      // Don't throw - allow navigation even if save fails
    }
  }, [gameId]);

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
    originalQuarterLength, // ✅ For clock edit UI max validation
    tick,
    // NEW: Shot Clock Actions
    startShotClock,
    stopShotClock,
    resetShotClock,
    setShotClockTime,
    shotClockTick,
    shotClockJustReset, // ✅ NBA Sync Fix: Flag for delayed tick
    setShotClockJustReset, // ✅ NBA Sync Fix: Clear flag after skip
    toggleShotClockVisibility, // ✅ Toggle shot clock display
    setQuarter,
    advanceIfNeeded,
    substitute,
    closeGame,
    completeGameWithAwards,
    saveClockBeforeExit,
    showAwardsModal,
    setShowAwardsModal,
    showGameOverModal,
    setShowGameOverModal,
    setRosterA,
    setRosterB,
    isLoading,
    lastAction,
    lastActionPlayerId,
    playerSeconds,
    gameStatus, // ✅ Game status
    lastRecordedStat, // ✅ UNDO: Last recorded stat
    undoLastAction, // ✅ UNDO: Undo function
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