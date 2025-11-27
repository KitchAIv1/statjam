'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTracker } from '@/hooks/useTracker';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';

// Mobile Layout
import { MobileLayoutV3 } from '@/components/tracker-v3/mobile/MobileLayoutV3';

// V3 Components
import { TopScoreboardV3 } from '@/components/tracker-v3/TopScoreboardV3';
import { TeamRosterV3 } from '@/components/tracker-v3/TeamRosterV3';
import { OpponentTeamPanel } from '@/components/tracker-v3/OpponentTeamPanel';
import { DesktopStatGridV3 } from '@/components/tracker-v3/DesktopStatGridV3';
import { SubstitutionModalV4 } from '@/components/tracker-v3/SubstitutionModalV4';
import { TimeoutModalV3 } from '@/components/tracker-v3/TimeoutModalV3';
import { PossessionIndicator } from '@/components/tracker-v3/PossessionIndicator';
// ✅ PHASE 4 & 5: Play Sequence Modals
import { AssistPromptModal } from '@/components/tracker-v3/modals/AssistPromptModal';
import { ReboundPromptModal } from '@/components/tracker-v3/modals/ReboundPromptModal';
import { BlockPromptModal } from '@/components/tracker-v3/modals/BlockPromptModal';
import { TurnoverPromptModal } from '@/components/tracker-v3/modals/TurnoverPromptModal';
import { BlockedShotSelectionModal } from '@/components/tracker-v3/modals/BlockedShotSelectionModal';
import { FreeThrowSequenceModal } from '@/components/tracker-v3/modals/FreeThrowSequenceModal';
import { FreeThrowCountModal } from '@/components/tracker-v3/modals/FreeThrowCountModal';
import { FoulTypeSelectionModal, FoulType } from '@/components/tracker-v3/modals/FoulTypeSelectionModal';
import { VictimPlayerSelectionModal } from '@/components/tracker-v3/modals/VictimPlayerSelectionModal';
import { ShotMadeMissedModal } from '@/components/tracker-v3/modals/ShotMadeMissedModal';
import { ShotClockViolationModal } from '@/components/tracker-v3/modals/ShotClockViolationModal';
import { useShotClockViolation } from '@/hooks/useShotClockViolation';
import { notify } from '@/lib/services/notificationService';
import { FeatureTour } from '@/components/onboarding/FeatureTour';
import { CompletionNudge } from '@/components/onboarding/CompletionNudge';
import { coachFeatureTourSteps } from '@/config/onboarding/coachOnboarding';
import { GameCompletionModal } from '@/components/tracker-v3/modals/GameCompletionModal';
import { GameOverModal } from '@/components/tracker-v3/modals/GameOverModal';
import { NetworkStatusIndicator } from '@/components/ui/NetworkStatusIndicator';

interface GameData {
  id: string;
  team_a_id: string;
  team_b_id: string;
  status: string;
  quarter: number;
  game_clock_minutes: number;
  game_clock_seconds: number;
  is_clock_running: boolean;
  home_score: number;
  away_score: number;
  team_a?: { name?: string | null } | null;
  team_b?: { name?: string | null } | null;
  team_a_name?: string | null;
  team_b_name?: string | null;
  opponent_name?: string | null; // ✅ Coach mode: Opponent name from coach input
  is_demo?: boolean; // ✅ Demo game flag
}

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;  // FIXED: Match official Player interface
  is_custom_player?: boolean; // ✅ PHASE 5: Support custom players
}

function StatTrackerV3Content() {
  const { user, loading } = useAuthContext(); // ✅ NO API CALL - Uses context
  const router = useRouter();
  const userRole = user?.role;
  const params = useSearchParams();
  const { isMobile, isDesktop } = useResponsiveLayout();
  
  // Enhanced device detection for better tablet support
  const [screenWidth, setScreenWidth] = useState(0);
  
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isLargeDesktop = screenWidth >= 1280;
  
  // URL Parameters
  const gameIdParam = params.get('gameId') || '';
  const teamAParam = params.get('teamAId') || '';
  const teamBParam = params.get('teamBId') || '';
  
  // Coach Mode Parameters
  const coachMode = params.get('coachMode') === 'true';
  const coachTeamIdParam = params.get('coachTeamId') || '';
  const opponentNameParamFallback = params.get('opponentName') || 'Opponent';
  
  // Game State
  const [gameData, setGameData] = useState<GameData | null>(null);
  
  // ✅ REFINEMENT: Use opponent_name from database (coach input) instead of URL param
  const opponentName = coachMode ? (gameData?.opponent_name || opponentNameParamFallback) : '';
  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [subOutPlayer, setSubOutPlayer] = useState<string | null>(null);
  const [isSubstituting, setIsSubstituting] = useState(false);
  const [shotClockViolation, setShotClockViolation] = useState(false);
  const [rosterRefreshKey, setRosterRefreshKey] = useState<string | number>(0);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [dismissedCompletionReminder, setDismissedCompletionReminder] = useState(false);
  
  // ✅ STICKY BUTTON FIX: Ref to store clear recording state function from stat grid components
  const clearDesktopRecordingStateRef = useRef<(() => void) | null>(null);
  const clearMobileRecordingStateRef = useRef<(() => void) | null>(null);
  
  // ✅ NEW: FT Made Auto-Sequence State (FULL auto mode only)
  const [showFTCountModal, setShowFTCountModal] = useState(false);
  const [ftAutoSequence, setFtAutoSequence] = useState<{
    isActive: boolean;
    totalShots: number;
    currentShot: number;
    results: { made: boolean; shouldRebound: boolean }[];
    shooterId: string;
    shooterName: string;
    shooterTeamId: string;
  } | null>(null);
  
  // ✅ PHASE 5: Foul Flow State
  const [showFoulTypeModal, setShowFoulTypeModal] = useState(false);
  const [showVictimSelectionModal, setShowVictimSelectionModal] = useState(false);
  const [showShotMadeMissedModal, setShowShotMadeMissedModal] = useState(false);
  const [selectedFoulType, setSelectedFoulType] = useState<string | null>(null);
  const [foulerPlayerId, setFoulerPlayerId] = useState<string | null>(null);
  const [foulerPlayerName, setFoulerPlayerName] = useState<string>('');
  const [victimPlayerId, setVictimPlayerId] = useState<string | null>(null);
  const [victimPlayerName, setVictimPlayerName] = useState<string>('');

  // Roster/Bench State (lifted from MobileLayoutV3 for unified substitution logic)
  const [currentRosterA, setCurrentRosterA] = useState<Player[]>([]);
  const [currentBenchA, setCurrentBenchA] = useState<Player[]>([]);
  const [currentRosterB, setCurrentRosterB] = useState<Player[]>([]);
  const [currentBenchB, setCurrentBenchB] = useState<Player[]>([]);

  // Initialize tracker with game data (only when we have valid team IDs)
  const tracker = useTracker({
    initialGameId: gameIdParam || 'unknown',
    teamAId: gameData?.team_a_id || 'teamA',
    teamBId: gameData?.team_b_id || 'teamB',
    isCoachMode: coachMode, // ✅ Pass coach mode flag for automation
    initialGameData: gameData // ✅ PHASE 3: Pass game data to skip duplicate fetch
  });

  // ✅ Shot Clock Violation Detection
  const {
    showViolationModal,
    setShowViolationModal,
    violationTeamId
  } = useShotClockViolation({
    shotClockSeconds: tracker.shotClock.secondsRemaining,
    shotClockRunning: tracker.shotClock.isRunning,
    shotClockVisible: tracker.shotClock.isVisible,
    possessionTeamId: tracker.possession.currentTeamId,
    onViolationDetected: () => {
      // Auto-pause game clock when violation detected
      console.log('🚨 Auto-pausing game clock due to shot clock violation');
      tracker.stopClock();
      tracker.stopShotClock();
    }
  });

  // Auth Check - Allow both stat_admin and coach roles
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
      return;
    }
    
    // Stat admin mode: require stat_admin role
    if (!loading && !coachMode && userRole !== 'stat_admin') {
      router.push('/auth');
      return;
    }
    
    // Coach mode: require coach role
    if (!loading && coachMode && userRole !== 'coach') {
      router.push('/auth');
      return;
    }
  }, [user, userRole, loading, router, coachMode]);

  // Initialize rosters when team data loads (lifted from MobileLayoutV3)
  useEffect(() => {
    if (teamAPlayers.length > 0) {
      setCurrentRosterA(teamAPlayers.slice(0, 5)); // First 5 on court
      setCurrentBenchA(teamAPlayers.slice(5));     // Rest on bench
    }
    if (teamBPlayers.length > 0) {
      setCurrentRosterB(teamBPlayers.slice(0, 5)); // First 5 on court
      setCurrentBenchB(teamBPlayers.slice(5));     // Rest on bench
    }
  }, [teamAPlayers, teamBPlayers]);

  // Load Game Data Effect - RESTORED LIVE TOURNAMENT FUNCTIONALITY
  useEffect(() => {
    const loadGameData = async () => {
      if (!gameIdParam) {
        setError('No game ID provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Import V3 services (raw HTTP - reliable)
        const { GameServiceV3 } = await import('@/lib/services/gameServiceV3');
        const { TeamServiceV3 } = await import('@/lib/services/teamServiceV3');

        // Load game data
        const game = await GameServiceV3.getGame(gameIdParam);
        if (!game) {
          setError('Game not found');
          setIsLoading(false);
          return;
        }

        setGameData(game);

        // Validate team IDs
        if (!game.team_a_id || !game.team_b_id) {
          setError('Game missing team information');
          setIsLoading(false);
          return;
        }
        
        // ✅ PERFORMANCE: Load both teams in parallel (20% faster)
        const [teamAPlayersData, teamBPlayersData] = await Promise.all([
          // Team A
          (async () => {
            try {
              if (coachMode && coachTeamIdParam) {
                // Coach mode: Load coach team players
                const { CoachPlayerService } = await import('@/lib/services/coachPlayerService');
                const coachPlayers = await CoachPlayerService.getCoachTeamPlayers(coachTeamIdParam);
                
                // Transform coach players to match Player interface
                return coachPlayers.map(cp => ({
                  id: cp.id,
                  name: cp.name,
                  jerseyNumber: cp.jersey_number,
                  email: cp.email,
                  is_custom_player: cp.is_custom_player,
                  photo_url: cp.photo_url // Player avatar from profile
                }));
              } else {
                // Tournament mode: Load tournament team players
                return await TeamServiceV3.getTeamPlayersWithSubstitutions(game.team_a_id, game.id);
              }
            } catch (teamAError) {
              console.error('❌ Failed to load Team A players:', teamAError);
              return [];
            }
          })(),
          
          // Team B
          (async () => {
            try {
              // ✅ FIX: In coach mode, don't load team B (it's a dummy opponent team with no players)
              if (!coachMode) {
                return await TeamServiceV3.getTeamPlayersWithSubstitutions(game.team_b_id, game.id);
              }
              return [];
            } catch (teamBError) {
              console.error('❌ Failed to load Team B players:', teamBError);
              return [];
            }
          })()
        ]);

        setTeamAPlayers(teamAPlayersData);
        setTeamBPlayers(teamBPlayersData);

        // Auto-select first available player from loaded data
        const allPlayers = [...teamAPlayersData, ...teamBPlayersData];
        if (allPlayers.length > 0 && (!selectedPlayer || !allPlayers.find(p => p.id === selectedPlayer))) {
          setSelectedPlayer(allPlayers[0].id);
        } else if (allPlayers.length === 0) {
          // Clear selected player if no team data loaded
          setSelectedPlayer(null);
        }

      } catch (error) {
        console.error('❌ Error loading game data:', error);
        setError('Failed to load game data');
      } finally {
        setIsLoading(false);
      }
    };

    // Only load game data after auth is ready and user is available
    if (gameIdParam && !loading && user) {
      loadGameData();
    }
  }, [gameIdParam, user, loading]);

  // ✅ UNIFIED CLOCK TICK: Single interval for both game clock and shot clock
  // This ensures they tick at the EXACT same moment (synchronized)
  // ✅ PERFORMANCE: Interval only recreates when running state changes, NOT on every tick
  // ✅ NBA SYNC FIX: Shot clock waits 1 full second after reset before ticking (prevents 23s flash)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Start interval if EITHER clock is running
    if (tracker.clock.isRunning || tracker.shotClock.isRunning) {
      interval = setInterval(() => {
        // ✅ Use functional updates to avoid stale closure issues
        // This ensures we always have the latest state without recreating the interval
        
        // Tick game clock if running
        if (tracker.clock.isRunning) {
          tracker.tick(1);
          // Check for quarter advancement (will be handled by tick function's internal state)
        }
        
        // ✅ NBA SYNC FIX: Skip shot clock tick if just reset (aligns with game clock boundary)
        if (tracker.shotClock.isRunning && tracker.shotClock.isVisible) {
          if (!tracker.shotClockJustReset) {
            tracker.shotClockTick(1);
            // Shot clock violation check will be handled by the tick function
          } else {
            // Clear the flag after skipping one tick (shot clock will start next interval)
            tracker.setShotClockJustReset(false);
            console.log('⏱️ Shot clock sync: Skipped first tick after reset (NBA alignment)');
          }
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    // ✅ ONLY depend on running state, NOT time values
    // This prevents interval recreation on every tick or reset
    tracker.clock.isRunning, 
    tracker.shotClock.isRunning, 
    tracker.shotClock.isVisible,
    tracker.shotClockJustReset, // ✅ NBA Sync Fix dependency
    // Functions are stable from useCallback
    tracker.tick, 
    tracker.shotClockTick,
    tracker.setShotClockJustReset // ✅ NBA Sync Fix setter
    // ❌ REMOVED: tracker.advanceIfNeeded (not needed in interval)
    // ❌ REMOVED: tracker.stopShotClock (not needed in interval)
    // ❌ REMOVED: tracker.clock.secondsRemaining (causes unnecessary recreation)
    // ❌ REMOVED: tracker.shotClock.secondsRemaining (causes unnecessary recreation)
  ]);

  // ✅ SEPARATE EFFECT: Handle quarter advancement (doesn't interfere with interval)
  useEffect(() => {
    if (tracker.clock.isRunning && tracker.clock.secondsRemaining <= 0) {
      tracker.advanceIfNeeded();
    }
  }, [tracker.clock.secondsRemaining, tracker.clock.isRunning, tracker.advanceIfNeeded]);

  // ✅ SEPARATE EFFECT: Handle shot clock violation (doesn't interfere with interval)
  useEffect(() => {
    if (tracker.shotClock.isRunning && tracker.shotClock.secondsRemaining <= 0) {
      console.log('🚨 Shot clock violation!');
      tracker.stopShotClock();
      setShotClockViolation(true);
    }
  }, [tracker.shotClock.secondsRemaining, tracker.shotClock.isRunning, tracker.stopShotClock]);

  // NEW: Sync shot clock with game clock
  useEffect(() => {
    // Stop shot clock when game clock stops
    if (!tracker.clock.isRunning && tracker.shotClock.isRunning) {
      tracker.stopShotClock();
    }
    // Auto-start shot clock when game clock starts (if shot clock is enabled and no violation)
    else if (tracker.clock.isRunning && !tracker.shotClock.isRunning && tracker.shotClock.isVisible && !shotClockViolation) {
      tracker.startShotClock();
    }
  }, [tracker.clock.isRunning, tracker.shotClock.isRunning, tracker.shotClock.isVisible, tracker.stopShotClock, tracker.startShotClock, shotClockViolation]);

  // Clear shot clock violation when manually reset
  useEffect(() => {
    if (tracker.shotClock.secondsRemaining > 20) {
      setShotClockViolation(false);
    }
  }, [tracker.shotClock.secondsRemaining]);

  // Sync scores with actual team IDs when game data loads
  useEffect(() => {
    if (gameData && gameData.team_a_id && gameData.team_b_id) {
      // Log the ID mismatch issue for debugging
      console.log('🔄 Team ID mapping:', {
        urlParamA: teamAParam,
        urlParamB: teamBParam,
        dbTeamA: gameData.team_a_id,
        dbTeamB: gameData.team_b_id,
        currentScores: tracker.scores
      });
    }
  }, [gameData, teamAParam, teamBParam, tracker.scores]);

  // ✅ STICKY BUTTON FIX: Clear button recording state when modal opens
  useEffect(() => {
    if (tracker.playPrompt.isOpen) {
      // Clear recording state when modal opens to prevent sticky buttons
      // This ensures buttons re-enable immediately when modal appears
      clearDesktopRecordingStateRef.current?.();
      clearMobileRecordingStateRef.current?.();
    }
  }, [tracker.playPrompt.isOpen]);

  // Stat Recording
  const handleStatRecord = async (statType: string, modifier?: string) => {
    if (!selectedPlayer || !gameData) return;
    
    // ✅ NEW: Intercept FT Made in FULL auto mode - show count modal first
    if (statType === 'free_throw' && modifier === 'made') {
      const isFullAutoMode = tracker.automationFlags?.sequences?.enabled === true;
      
      if (isFullAutoMode) {
        // Get shooter info
        const shooterData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer);
        const shooterName = shooterData?.name || 'Player';
        const isTeamAPlayer = teamAPlayers.some(p => p.id === selectedPlayer);
        const shooterTeamId = isTeamAPlayer ? gameData.team_a_id : gameData.team_b_id;
        
        // Show FT count selection modal
        setShowFTCountModal(true);
        return; // Don't record stat yet - wait for count selection
      }
    }
    
    try {
      // Handle different player types in coach mode
      let actualPlayerId: string | undefined = undefined;
      let actualCustomPlayerId: string | undefined = undefined;
      let actualTeamId = gameData.team_a_id; // Default to coach team
      let isOpponentStat = false;
      
      if (coachMode && selectedPlayer === 'opponent-team') {
        // OPPONENT TEAM STATS: Use coach's user ID as proxy, mark as opponent stat
        actualPlayerId = user?.id || undefined;
        actualTeamId = gameData.team_a_id; // ✅ Use coach's team ID for database (UUID required)
        isOpponentStat = true; // FLAG: This is an opponent stat
        console.log('✅ Recording opponent team stat (flagged as opponent), team_id:', actualTeamId, 'isOpponentStat:', isOpponentStat);
      } else {
        // Determine which team the selected player belongs to
        const isTeamAPlayer = teamAPlayers.some(p => p.id === selectedPlayer);
        actualTeamId = isTeamAPlayer ? gameData.team_a_id : gameData.team_b_id;
        
        // Check if this is a custom player (TWO CHECKS: ID prefix OR flag)
        const selectedPlayerData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer);
        const isCustomPlayer = selectedPlayer.startsWith('custom-') || 
                              (selectedPlayerData && selectedPlayerData.is_custom_player === true);
        
        if (isCustomPlayer) {
          // CUSTOM PLAYER STATS: Use the actual custom player ID
          actualCustomPlayerId = selectedPlayer; // This is the custom_players.id
          actualPlayerId = undefined; // Don't set player_id for custom players
          console.log('🏀 Recording custom player stat for:', selectedPlayerData?.name, 'ID:', selectedPlayer);
        } else {
          // REGULAR PLAYER STATS: Use the user ID
          actualPlayerId = selectedPlayer; // This is the users.id
          actualCustomPlayerId = undefined; // Don't set custom_player_id for regular players
          console.log('🏀 Recording regular player stat for ID:', selectedPlayer);
        }
      }
      
      await tracker.recordStat({
        gameId: gameData.id,
        teamId: actualTeamId,
        playerId: actualPlayerId,
        customPlayerId: actualCustomPlayerId,
        isOpponentStat: isOpponentStat,
        statType: statType as 'field_goal' | 'three_pointer' | 'free_throw' | 'assist' | 'rebound' | 'steal' | 'block' | 'turnover' | 'foul',
        modifier: modifier as 'made' | 'missed' | 'offensive' | 'defensive' | 'shooting' | 'personal' | 'technical' | 'flagrant' | undefined
      });
    } catch (error) {
      console.error('❌ Error recording stat:', error);
      notify.error(
        'Failed to record stat',
        error instanceof Error ? error.message : 'Please try again'
      );
    }
  };
  
  // ✅ NEW: Handle FT count selection - start auto-sequence
  const handleFTCountSelect = (count: 1 | 2 | 3) => {
    if (!selectedPlayer || !gameData) return;
    
    setShowFTCountModal(false);
    
    // Get shooter info
    const shooterData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer);
    const shooterName = shooterData?.name || 'Player';
    const isTeamAPlayer = teamAPlayers.some(p => p.id === selectedPlayer);
    const shooterTeamId = isTeamAPlayer ? gameData.team_a_id : gameData.team_b_id;
    
    // Start auto-sequence
    setFtAutoSequence({
      isActive: true,
      totalShots: count,
      currentShot: 1,
      results: [],
      shooterId: selectedPlayer,
      shooterName,
      shooterTeamId
    });
  };
  
  // ✅ NEW: Handle FT sequence completion - auto-advance or finish
  const handleFTSequenceComplete = async (results: { made: boolean; shouldRebound: boolean }[]) => {
    if (!ftAutoSequence || !gameData) return;
    
    // ✅ FIX: Capture all values BEFORE clearing state to prevent race conditions
    const currentSequence = { ...ftAutoSequence };
    const currentResult = results[results.length - 1]; // Get the last result (current shot)
    const newResults = [...currentSequence.results, currentResult];
    const isLastShot = currentSequence.currentShot >= currentSequence.totalShots;
    const isMissed = !currentResult.made;
    
    // ✅ OPTIMIZATION: Handle sequence continuation BEFORE database write (non-blocking)
    if (!isLastShot) {
      // Continue to next shot - auto-advance (use captured values)
      setFtAutoSequence({
        ...currentSequence,
        currentShot: currentSequence.currentShot + 1,
        results: newResults
      });
      // Modal will automatically reopen with new currentShot value
    } else {
      // ✅ OPTIMIZATION: Clear sequence state IMMEDIATELY (optimistic UI)
      setFtAutoSequence(null);
    }
    
    // Record current shot (using captured values)
    const shooterData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === currentSequence.shooterId);
    const isCustomPlayer = currentSequence.shooterId.startsWith('custom-') || 
                          (shooterData && shooterData.is_custom_player === true);
    
    // ✅ OPTIMIZATION: Write to database in background (non-blocking)
    tracker.recordStat({
      gameId: gameData.id,
      playerId: isCustomPlayer ? undefined : currentSequence.shooterId,
      customPlayerId: isCustomPlayer ? currentSequence.shooterId : undefined,
      teamId: currentSequence.shooterTeamId,
      statType: 'free_throw',
      modifier: currentResult.made ? 'made' : 'missed',
      // ✅ FIX: Use eventMetadata to pass skipRebound flag for non-last missed shots
      eventMetadata: isMissed && !isLastShot ? { skipRebound: true } : undefined
    }).then(() => {
      // Show success notification only after write completes
      if (isLastShot) {
        notify.success('Free Throws Recorded', `${newResults.length} free throw(s) recorded successfully`);
      }
    }).catch(error => {
      console.error('❌ Error recording free throw:', error);
      notify.error(
        'Failed to record free throw',
        error instanceof Error ? error.message : 'Please try again'
      );
      // Clear sequence on error if not already cleared
      if (!isLastShot) {
        setFtAutoSequence(null);
      }
    });
  };
  
  // ✅ NEW: Cancel FT auto-sequence
  const handleFTAutoSequenceCancel = () => {
    setFtAutoSequence(null);
    setShowFTCountModal(false);
  };

  // ✅ PHASE 5: Handle foul recording with new flow
  const handleFoulRecord = async (foulType: 'personal' | 'technical') => {
    if (!selectedPlayer || !gameData) return;
    
    // ✅ FIX: Pause clock IMMEDIATELY when foul button is clicked (NBA rule)
    // Clock should stop the moment the whistle blows, not after the sequence
    if (tracker.clock.isRunning) {
      console.log('🕐 FOUL: Pausing clock immediately (before modals)');
      tracker.stopClock();
    }
    
    // Get fouler player name
    const foulerData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer);
    const foulerName = foulerData?.name || 'Player';
    
    // Store fouler info and show foul type modal
    setFoulerPlayerId(selectedPlayer);
    setFoulerPlayerName(foulerName);
    setShowFoulTypeModal(true);
  };
  
  // ✅ PHASE 5: Handle foul type selection
  const handleFoulTypeSelection = async (foulType: FoulType) => {
    console.log('🔍 handleFoulTypeSelection: Foul type selected:', foulType);
    console.log('🔍 handleFoulTypeSelection: foulerPlayerId:', foulerPlayerId, 'gameData:', !!gameData);
    
    setShowFoulTypeModal(false);
    setSelectedFoulType(foulType);
    
    // ✅ UI IMPROVEMENT: Only shooting fouls need victim selection (bonus, technical, flagrant removed)
    const needsVictimSelection = ['shooting_2pt', 'shooting_3pt'].includes(foulType);
    
    console.log('🔍 handleFoulTypeSelection: needsVictimSelection?', needsVictimSelection, 'foulType:', foulType);
    
    if (needsVictimSelection) {
      // Show victim selection modal
      console.log('🔍 handleFoulTypeSelection: Showing victim selection modal');
      setShowVictimSelectionModal(true);
    } else {
      // Personal or Offensive foul - record immediately
      console.log('🔍 handleFoulTypeSelection: Recording foul without victim - Type:', foulType);
      await recordFoulWithoutVictim(foulType);
    }
  };
  
  // ✅ PHASE 5: Record foul without victim (Personal, Offensive)
  const recordFoulWithoutVictim = async (foulType: FoulType) => {
    console.log('🔍 recordFoulWithoutVictim: Called with foulType:', foulType);
    console.log('🔍 recordFoulWithoutVictim: foulerPlayerId:', foulerPlayerId, 'gameData:', !!gameData);
    
    if (!foulerPlayerId || !gameData) {
      console.error('❌ recordFoulWithoutVictim: Early return - missing foulerPlayerId or gameData');
      return;
    }
    
    try {
      // Determine player type and team
      let actualPlayerId: string | undefined = undefined;
      let actualCustomPlayerId: string | undefined = undefined;
      let actualTeamId = gameData.team_a_id;
      let isOpponentStat = false;
      
      if (coachMode && foulerPlayerId === 'opponent-team') {
        actualPlayerId = user?.id || undefined;
        actualTeamId = gameData.team_a_id;
        isOpponentStat = true;
      } else {
        const isTeamAPlayer = teamAPlayers.some(p => p.id === foulerPlayerId);
        actualTeamId = isTeamAPlayer ? gameData.team_a_id : gameData.team_b_id;
        
        // ✅ FIX: Check if fouler is custom player (TWO CHECKS)
        const foulerData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === foulerPlayerId);
        const isCustomPlayer = foulerPlayerId.startsWith('custom-') || 
                              (foulerData && foulerData.is_custom_player === true);
        
        if (isCustomPlayer) {
          actualCustomPlayerId = foulerPlayerId;
          actualPlayerId = undefined;
        } else {
          actualPlayerId = foulerPlayerId;
          actualCustomPlayerId = undefined;
        }
      }
      
      // Map foul type to modifier
      const modifier = foulType === 'offensive' ? 'offensive' : 'personal';
      
      // ✅ DEBUG: Log personal foul recording
      console.log('🔍 recordFoulWithoutVictim: Recording foul - Type:', foulType, 'Modifier:', modifier, 'PlayerId:', actualPlayerId, 'CustomPlayerId:', actualCustomPlayerId);
      
      await tracker.recordStat({
        gameId: gameData.id,
        teamId: actualTeamId,
        playerId: actualPlayerId,
        customPlayerId: actualCustomPlayerId,
        isOpponentStat: isOpponentStat,
        statType: 'foul',
        modifier: modifier
      });
      
      // ✅ DEBUG: Log after recording
      console.log('✅ recordFoulWithoutVictim: Foul recorded successfully - Modifier:', modifier);
      
      // If offensive foul, also record turnover
      if (foulType === 'offensive') {
        await tracker.recordStat({
          gameId: gameData.id,
          teamId: actualTeamId,
          playerId: actualPlayerId,
          customPlayerId: actualCustomPlayerId,
          isOpponentStat: isOpponentStat,
          statType: 'turnover',
          modifier: 'offensive_foul'
        });
      }
      
      // Reset state
      setFoulerPlayerId(null);
      setFoulerPlayerName('');
      setSelectedFoulType(null);
    } catch (error) {
      console.error('❌ Error recording foul:', error);
      notify.error(
        'Failed to record foul',
        error instanceof Error ? error.message : 'Please try again'
      );
      // Reset state even on error
      setFoulerPlayerId(null);
      setFoulerPlayerName('');
      setSelectedFoulType(null);
    }
  };
  
  // ✅ PHASE 5: Handle victim player selection
  const handleVictimSelection = async (victimId: string, victimName: string) => {
    setShowVictimSelectionModal(false);
    
    if (!foulerPlayerId || !selectedFoulType || !gameData) return;
    
    // Store victim info temporarily
    setVictimPlayerId(victimId);
    setVictimPlayerName(victimName);
    
    // For shooting fouls (2pt/3pt), show shot made/missed modal first
    if (selectedFoulType === 'shooting_2pt' || selectedFoulType === 'shooting_3pt') {
      setShowShotMadeMissedModal(true);
      return;
    }
    
    // For other fouls (bonus, technical, flagrant), proceed directly to free throws
    await recordFoulAndFreeThrows(victimId, victimName, false); // false = not a made shot
  };
  
  // ✅ NEW: Handle shot made/missed selection for shooting fouls
  const handleShotMadeMissed = async (made: boolean) => {
    if (!victimPlayerId || !victimPlayerName || !foulerPlayerId || !selectedFoulType || !gameData) return;
    
    // ✅ FIX: Close shot modal and immediately open FT modal for smooth transition
    setShowShotMadeMissedModal(false);
    
    try {
      // ✅ FIX: Open FT modal FIRST, then record stats in background for smooth UI
      await recordFoulAndFreeThrows(victimPlayerId, victimPlayerName, made, true); // true = open modal immediately
    } catch (error) {
      console.error('❌ Error recording shooting foul:', error);
      notify.error(
        'Failed to record shooting foul',
        error instanceof Error ? error.message : 'Please try again'
      );
      // Reset state even on error
      resetFoulFlowState();
    }
  };
  
  // ✅ NEW: Unified function to record foul and free throws
  const recordFoulAndFreeThrows = async (victimId: string, victimName: string, shotMade: boolean, openModalImmediately: boolean = false) => {
    if (!foulerPlayerId || !selectedFoulType || !gameData) return;
    
    try {
      // Determine fouler details
      let foulerActualPlayerId: string | undefined = undefined;
      let foulerCustomPlayerId: string | undefined = undefined;
      let foulerTeamId = gameData.team_a_id;
      let foulerIsOpponentStat = false;
      
      if (coachMode && foulerPlayerId === 'opponent-team') {
        foulerActualPlayerId = user?.id || undefined;
        foulerTeamId = gameData.team_a_id;
        foulerIsOpponentStat = true;
      } else {
        const isTeamAPlayer = teamAPlayers.some(p => p.id === foulerPlayerId);
        foulerTeamId = isTeamAPlayer ? gameData.team_a_id : gameData.team_b_id;
        
        // ✅ FIX: Check if fouler is custom player (TWO CHECKS)
        const foulerData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === foulerPlayerId);
        const isCustomPlayer = foulerPlayerId.startsWith('custom-') || 
                              (foulerData && foulerData.is_custom_player === true);
        
        if (isCustomPlayer) {
          foulerCustomPlayerId = foulerPlayerId;
        } else {
          foulerActualPlayerId = foulerPlayerId;
        }
      }
      
      // Determine victim team (opposite of fouler)
      const victimTeamId = foulerTeamId === gameData.team_a_id ? gameData.team_b_id : gameData.team_a_id;
      
      // Determine victim player details
      const isVictimTeamAPlayer = teamAPlayers.some(p => p.id === victimId);
      let victimActualPlayerId: string | undefined = undefined;
      let victimCustomPlayerId: string | undefined = undefined;
      
      const victimData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === victimId);
      const isVictimCustomPlayer = victimId.startsWith('custom-') || 
                                  (victimData && victimData.is_custom_player === true);
      
      if (isVictimCustomPlayer) {
        victimCustomPlayerId = victimId;
      } else {
        victimActualPlayerId = victimId;
      }
      
      // Map foul type to modifier and FT count
      let modifier = 'shooting';
      let ftCount = 2;
      let ftType: '1-and-1' | 'shooting' | 'technical' | 'flagrant' = 'shooting';
      const shotType = selectedFoulType === 'shooting_3pt' ? '3pt' : '2pt';
      
      switch (selectedFoulType) {
        case 'shooting_2pt':
          modifier = 'shooting';
          // If shot made: 1 FT (and-1), if missed: 2 FTs
          ftCount = shotMade ? 1 : 2;
          ftType = 'shooting';
          break;
        case 'shooting_3pt':
          modifier = 'shooting';
          // If shot made: 1 FT (and-1), if missed: 3 FTs
          ftCount = shotMade ? 1 : 3;
          ftType = 'shooting';
          break;
        case 'bonus':
          modifier = '1-and-1';
          ftCount = 2;
          ftType = '1-and-1';
          break;
        case 'technical':
          modifier = 'technical';
          ftCount = 1;
          ftType = 'technical';
          break;
        case 'flagrant':
          modifier = 'flagrant';
          ftCount = 2;
          ftType = 'flagrant';
          break;
      }
      
      // ✅ Generate sequence_id to link foul, shot (if made), and FTs
      const { v4: uuidv4 } = await import('uuid');
      const sequenceId = uuidv4();
      
      // ✅ FIX: Open FT modal FIRST for smooth UI transition (before recording stats)
      if (openModalImmediately) {
        tracker.setPlayPrompt({
          isOpen: true,
          type: 'free_throw',
          sequenceId: sequenceId,
          primaryEventId: null,
          metadata: {
            shooterId: victimId,
            shooterName: victimName,
            shooterTeamId: victimTeamId,
            foulType: ftType,
            totalShots: ftCount,
            foulerId: foulerPlayerId
          }
        });
        // Reset state immediately after opening modal
        resetFoulFlowState();
      }
      
      // Record the foul with sequence_id for linking
      await tracker.recordStat({
        gameId: gameData.id,
        teamId: foulerTeamId,
        playerId: foulerActualPlayerId,
        customPlayerId: foulerCustomPlayerId,
        isOpponentStat: foulerIsOpponentStat,
        statType: 'foul',
        modifier: modifier,
        sequenceId: sequenceId // ✅ Link foul to shot and FTs
      });
      
      // ✅ If shot was made, record the made shot first
      if (shotMade && (selectedFoulType === 'shooting_2pt' || selectedFoulType === 'shooting_3pt')) {
        await tracker.recordStat({
          gameId: gameData.id,
          teamId: victimTeamId,
          playerId: victimActualPlayerId,
          customPlayerId: victimCustomPlayerId,
          isOpponentStat: false,
          statType: selectedFoulType === 'shooting_3pt' ? 'three_pointer' : 'field_goal', // ✅ FIX: Use correct stat_type values
          modifier: 'made',
          sequenceId: sequenceId // ✅ Link to foul and FTs
        });
      }
      
      // ✅ Trigger FT modal if not already opened (for non-shooting fouls)
      if (!openModalImmediately) {
        tracker.setPlayPrompt({
          isOpen: true,
          type: 'free_throw',
          sequenceId: sequenceId, // ✅ Use same sequence_id
          primaryEventId: null,
          metadata: {
            shooterId: victimId,
            shooterName: victimName,
            shooterTeamId: victimTeamId,
            foulType: ftType,
            totalShots: ftCount,
            foulerId: foulerPlayerId
          }
        });
        
        // Reset state
        resetFoulFlowState();
      }
    } catch (error) {
      console.error('❌ Error recording foul and free throws:', error);
      throw error; // Re-throw to be handled by caller
    }
  };
  
  // ✅ Helper function to reset foul flow state
  const resetFoulFlowState = () => {
    setFoulerPlayerId(null);
    setFoulerPlayerName('');
    setSelectedFoulType(null);
    setVictimPlayerId(null);
    setVictimPlayerName('');
  };

  // Handle timeout with enhanced modal
  const handleTimeoutClick = () => {
    setShowTimeoutModal(true);
  };

  const handleStartTimeout = async (teamId: string, type: 'full' | '30_second') => {
    await tracker.startTimeout(teamId, type);
  };

  const handleResumePlay = () => {
    tracker.resumeFromTimeout();
    setShowTimeoutModal(false);
  };

  const handleCancelTimeout = () => {
    setShowTimeoutModal(false);
  };



  // ✅ Substitution - Now works without requiring a selected player
  const handleSubstitution = (playerOutId?: string) => {
    // playerOutId is optional - if provided, can be used as hint, but user will select team/player in modal
    setSubOutPlayer(playerOutId || null);
    setShowSubModal(true);
  };

  // ✅ Handle jersey update callback
  const handlePlayerJerseyUpdate = (playerId: string, updatedPlayer: Player) => {
    // Update player in team arrays
    setTeamAPlayers(prev => prev.map(p => p.id === playerId ? updatedPlayer : p));
    setTeamBPlayers(prev => prev.map(p => p.id === playerId ? updatedPlayer : p));
    
    // Update current rosters and benches
    setCurrentRosterA(prev => prev.map(p => p.id === playerId ? updatedPlayer : p));
    setCurrentRosterB(prev => prev.map(p => p.id === playerId ? updatedPlayer : p));
    setCurrentBenchA(prev => prev.map(p => p.id === playerId ? updatedPlayer : p));
    setCurrentBenchB(prev => prev.map(p => p.id === playerId ? updatedPlayer : p));
  };

  // ✅ Handle single or multiple substitutions (new format: array of pairs)
  const handleSubConfirm = async (substitutions: Array<{ playerOutId: string; playerInId: string }>) => {
    if (!gameData || substitutions.length === 0) return;

    setIsSubstituting(true);
    
    try {
      // Group substitutions by team
      const teamASubs: Array<{ playerOutId: string; playerInId: string }> = [];
      const teamBSubs: Array<{ playerOutId: string; playerInId: string }> = [];

      for (const sub of substitutions) {
        const isTeamAPlayer = teamAPlayers.some(p => p.id === sub.playerOutId);
        if (isTeamAPlayer) {
          teamASubs.push(sub);
        } else {
          teamBSubs.push(sub);
        }
      }

      // Process Team A substitutions
      if (teamASubs.length > 0) {
        let currentRoster = [...currentRosterA];
        let currentBench = [...currentBenchA];

        for (const sub of teamASubs) {
          const subbingOutPlayerData = currentRoster.find(p => p.id === sub.playerOutId);
          const subbingInPlayerData = currentBench.find(p => p.id === sub.playerInId);

          if (!subbingOutPlayerData || !subbingInPlayerData) {
            console.warn(`⚠️ Team A substitution skipped: player not found`);
            continue;
          }

          // ✅ CUSTOM PLAYER SUPPORT: Detect if players are custom
          const isCustomPlayerOut = subbingOutPlayerData.is_custom_player === true;
          const isCustomPlayerIn = subbingInPlayerData.is_custom_player === true;

          const success = await tracker.substitute({
            gameId: gameData.id,
            teamId: gameData.team_a_id,
            playerOutId: sub.playerOutId,
            playerInId: sub.playerInId,
            quarter: tracker.quarter,
            gameTimeSeconds: tracker.clock.secondsRemaining,
            playerOutName: subbingOutPlayerData.name,
            playerInName: subbingInPlayerData.name,
            isCustomPlayerOut,
            isCustomPlayerIn
          });

          if (success) {
            currentRoster = currentRoster.map(player => 
              player.id === sub.playerOutId ? subbingInPlayerData : player
            );
            currentBench = currentBench.map(player => 
              player.id === sub.playerInId ? subbingOutPlayerData : player
            );
          }
        }

        setCurrentRosterA(currentRoster);
        setCurrentBenchA(currentBench);
        const updatedTeamAPlayers = [...currentRoster, ...currentBench];
        setTeamAPlayers(updatedTeamAPlayers);
      }

      // Process Team B substitutions
      if (teamBSubs.length > 0) {
        let currentRoster = [...currentRosterB];
        let currentBench = [...currentBenchB];

        for (const sub of teamBSubs) {
          const subbingOutPlayerData = currentRoster.find(p => p.id === sub.playerOutId);
          const subbingInPlayerData = currentBench.find(p => p.id === sub.playerInId);

          if (!subbingOutPlayerData || !subbingInPlayerData) {
            console.warn(`⚠️ Team B substitution skipped: player not found`);
            continue;
          }

          // ✅ CUSTOM PLAYER SUPPORT: Detect if players are custom
          const isCustomPlayerOut = subbingOutPlayerData.is_custom_player === true;
          const isCustomPlayerIn = subbingInPlayerData.is_custom_player === true;

          const success = await tracker.substitute({
            gameId: gameData.id,
            teamId: gameData.team_b_id,
            playerOutId: sub.playerOutId,
            playerInId: sub.playerInId,
            quarter: tracker.quarter,
            gameTimeSeconds: tracker.clock.secondsRemaining,
            playerOutName: subbingOutPlayerData.name,
            playerInName: subbingInPlayerData.name,
            isCustomPlayerOut,
            isCustomPlayerIn
          });

          if (success) {
            currentRoster = currentRoster.map(player => 
              player.id === sub.playerOutId ? subbingInPlayerData : player
            );
            currentBench = currentBench.map(player => 
              player.id === sub.playerInId ? subbingOutPlayerData : player
            );
          }
        }

        setCurrentRosterB(currentRoster);
        setCurrentBenchB(currentBench);
        const updatedTeamBPlayers = [...currentRoster, ...currentBench];
        setTeamBPlayers(updatedTeamBPlayers);
      }

      // ✅ Update selected player if it was subbed out
      const allSubsOut = substitutions.map(s => s.playerOutId);
      if (allSubsOut.includes(selectedPlayer || '')) {
        const firstSub = substitutions.find(s => s.playerOutId === selectedPlayer);
        if (firstSub) {
          const isTeamAPlayer = teamAPlayers.some(p => p.id === firstSub.playerOutId);
          const bench = isTeamAPlayer ? currentBenchA : currentBenchB;
          const newSelected = bench.find(p => p.id === firstSub.playerInId);
          if (newSelected) {
            setSelectedPlayer(newSelected.id);
          }
        }
      }

      // Force roster refresh
      setRosterRefreshKey(Date.now());

      setShowSubModal(false);
      setSubOutPlayer(null);
      notify.success('Substitution Complete', `${substitutions.length} player(s) substituted successfully`);
    } catch (error) {
      console.error('❌ Substitution failed:', error);
      notify.error('Substitution Failed', 'An error occurred during substitution');
    } finally {
      setIsSubstituting(false);
    }
  };

  // ✅ Quick Substitution Handler (single player, immediate execution)
  const handleQuickSubstitution = async (playerOutId: string, playerInId: string) => {
    await handleSubConfirm([{ playerOutId, playerInId }]);
  };

  // Team players update callback for mobile layout
  const handleTeamPlayersUpdate = (updatedTeamAPlayers: Player[], updatedTeamBPlayers: Player[]) => {
    setTeamAPlayers(updatedTeamAPlayers);
    setTeamBPlayers(updatedTeamBPlayers);
    setRosterRefreshKey(Date.now());
  };

  // Loading States
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--dashboard-bg)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p style={{ color: 'var(--dashboard-text-primary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // ✅ FIX: Combined loading check - wait for BOTH game data AND tracker scores
  // This prevents the 0-0 score flash caused by tracker initializing with placeholder team IDs
  if (isLoading || tracker.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--dashboard-bg)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p style={{ color: 'var(--dashboard-text-primary)' }}>
            {isLoading ? 'Loading game data...' : 'Initializing scores...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--dashboard-bg)' }}>
        <Card className="w-full max-w-md" style={{ background: 'var(--dashboard-card)', borderColor: 'var(--dashboard-border)' }}>
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={async () => {
              // ✅ CRITICAL: Save clock state before navigating (if tracker is available)
              if (tracker?.saveClockBeforeExit) {
                await tracker.saveClockBeforeExit();
              }
              
              // ✅ FIX: Role-based dashboard routing
              if (coachMode || userRole === 'coach') {
                router.push('/dashboard/coach');
              } else if (userRole === 'stat_admin') {
                router.push('/dashboard/stat-admin');
              } else {
                router.push('/dashboard');
              }
            }} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--dashboard-bg)' }}>
        <Card className="w-full max-w-md" style={{ background: 'var(--dashboard-card)', borderColor: 'var(--dashboard-border)' }}>
          <CardContent className="p-6 text-center">
            <p style={{ color: 'var(--dashboard-text-primary)' }} className="mb-4">No game data found</p>
            <Button onClick={async () => {
              // ✅ CRITICAL: Save clock state before navigating (if tracker is available)
              if (tracker?.saveClockBeforeExit) {
                await tracker.saveClockBeforeExit();
              }
              
              // ✅ FIX: Role-based dashboard routing
              if (coachMode || userRole === 'coach') {
                router.push('/dashboard/coach');
              } else if (userRole === 'stat_admin') {
                router.push('/dashboard/stat-admin');
              } else {
                router.push('/dashboard');
              }
            }} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get bench players based on which team the substituted player belongs to
  const getBenchPlayers = () => {
    if (!subOutPlayer) return [];
    const isTeamAPlayer = teamAPlayers.some(p => p.id === subOutPlayer);
    const teamPlayers = isTeamAPlayer ? teamAPlayers : teamBPlayers;
    return teamPlayers.slice(5); // Bench players for substitutions
  };
  
  const benchPlayers = getBenchPlayers();

  // ✅ SHARED MODALS: Render modals for BOTH mobile and desktop views
  const sharedModals = (
    <>
      {/* Substitution Modal - Unified for both mobile and desktop */}
      <SubstitutionModalV4
        isOpen={showSubModal}
        onClose={() => {
          setShowSubModal(false);
          setSubOutPlayer(null);
        }}
        teamAName={gameData.team_a?.name || 'Team A'}
        teamBName={gameData.team_b?.name || 'Team B'}
        teamAOnCourt={currentRosterA}
        teamABench={currentBenchA}
        teamBOnCourt={currentRosterB}
        teamBBench={currentBenchB}
        onConfirm={handleSubConfirm}
        onPlayerUpdate={handlePlayerJerseyUpdate}
        initialTeam={(() => {
          // Determine initial team based on subOutPlayer if available
          if (subOutPlayer) {
            return teamAPlayers.some(p => p.id === subOutPlayer) ? 'teamA' : 'teamB';
          }
          return null;
        })()}
      />

      {/* Timeout Modal - Enhanced UX with countdown */}
      <TimeoutModalV3
        isOpen={showTimeoutModal}
        teamAName={gameData.team_a?.name || 'Team A'}
        teamBName={gameData.team_b?.name || 'Team B'}
        teamAId={gameData.team_a_id}
        teamBId={gameData.team_b_id}
        onStartTimeout={handleStartTimeout}
        onResume={handleResumePlay}
        onCancel={handleCancelTimeout}
        timeoutActive={tracker.timeoutActive}
        timeoutSecondsRemaining={tracker.timeoutSecondsRemaining}
        timeoutTeamId={tracker.timeoutTeamId}
      />

      {/* ✅ PHASE 4: Play Sequence Modals */}
      
      {/* Assist Prompt Modal - After made shots */}
      {tracker.playPrompt.isOpen && tracker.playPrompt.type === 'assist' && (
        <AssistPromptModal
          isOpen={true}
          onClose={tracker.clearPlayPrompt}
          onSelectPlayer={async (playerId) => {
            // ✅ FIX: Check if assisting player is custom player (TWO CHECKS)
            const assistingPlayer = [...teamAPlayers, ...teamBPlayers].find(p => p.id === playerId);
            const isCustomPlayer = playerId.startsWith('custom-') || 
                                  (assistingPlayer && assistingPlayer.is_custom_player === true);
            const primaryEventId = tracker.playPrompt.primaryEventId;
            
            const isTeamAPlayer = teamAPlayers.some(p => p.id === playerId);
            const teamId = isTeamAPlayer ? gameData.team_a_id : gameData.team_b_id;
            
            // ✅ OPTIMIZATION: Close modal immediately (optimistic UI)
            tracker.clearPlayPrompt();
            
            // ✅ OPTIMIZATION: Write to database in background (non-blocking)
            // Record assist stat linked to the shot
            // ✅ PHASE 5 FIX: Assists must have modifier IS NULL per database constraint
            tracker.recordStat({
              gameId: gameData.id,
              playerId: isCustomPlayer ? undefined : playerId, // ✅ Only for real players
              customPlayerId: isCustomPlayer ? playerId : undefined, // ✅ Only for custom players
              teamId,
              statType: 'assist',
              modifier: null, // ✅ NULL modifier for assists
              metadata: primaryEventId ? { primaryEventId } : undefined
            }).catch(error => {
              console.error('❌ Error recording assist:', error);
              notify.error(
                'Failed to record assist',
                error instanceof Error ? error.message : 'Please try again'
              );
            });
          }}
          onSkip={() => {
            console.log('⏭️ Skipping assist prompt');
            tracker.clearPlayPrompt();
          }}
          players={(() => {
            // Get players from the SCORING team (not shooter's team, but their teammates)
            // ✅ Only show on-court players (first 5)
            const shooterTeamId = tracker.playPrompt.metadata?.shooterTeamId;
            if (shooterTeamId === gameData.team_a_id) {
              return currentRosterA;
            } else {
              return currentRosterB;
            }
          })()}
          shooterName={tracker.playPrompt.metadata?.shooterName || 'Unknown'}
          shotType={tracker.playPrompt.metadata?.shotType || 'shot'}
          shotValue={tracker.playPrompt.metadata?.shotValue || 2}
        />
      )}

      {/* Rebound Prompt Modal - After missed shots */}
      {tracker.playPrompt.isOpen && tracker.playPrompt.type === 'rebound' && (
        <ReboundPromptModal
          isOpen={true}
          onClose={tracker.clearPlayPrompt}
          onSelectPlayer={async (playerId, reboundType) => {
            // ✅ FIX: Handle custom players properly
            const isTeamAPlayer = teamAPlayers.some(p => p.id === playerId);
            const teamId = isTeamAPlayer ? gameData.team_a_id : gameData.team_b_id;
            const primaryEventId = tracker.playPrompt.primaryEventId;
            
            // Check if rebounder is a custom player
            const rebounderData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === playerId);
            const isCustomPlayer = playerId.startsWith('custom-') || 
                                  (rebounderData && rebounderData.is_custom_player === true);
            
            // 🔍 DEBUG: Verify rebound type before recording
            const shooterTeamId = tracker.playPrompt.metadata?.shooterTeamId;
            const expectedReboundType = teamId === shooterTeamId ? 'offensive' : 'defensive';
            if (reboundType !== expectedReboundType) {
              console.warn('⚠️ [REBOUND TYPE MISMATCH]', {
                recorded: reboundType,
                expected: expectedReboundType,
                rebounderTeamId: teamId,
                shooterTeamId
              });
            }
            
            // ✅ OPTIMIZATION: Close modal immediately (optimistic UI)
            tracker.clearPlayPrompt();
            
            // ✅ OPTIMIZATION: Write to database in background (non-blocking)
            tracker.recordStat({
              gameId: gameData.id,
              playerId: isCustomPlayer ? undefined : playerId, // ✅ Only for real players
              customPlayerId: isCustomPlayer ? playerId : undefined, // ✅ Only for custom players
              teamId,
              statType: 'rebound',
              modifier: reboundType, // ✅ Use the reboundType determined by the modal
              metadata: primaryEventId ? { primaryEventId } : undefined
            }).catch(error => {
              console.error('❌ Error recording rebound:', error);
              notify.error(
                'Failed to record rebound',
                error instanceof Error ? error.message : 'Please try again'
              );
            });
          }}
          onSkip={() => {
            console.log('⏭️ Skipping rebound prompt');
            tracker.clearPlayPrompt();
          }}
          teamAPlayers={currentRosterA} // ✅ Only on-court players (first 5)
          teamBPlayers={currentRosterB} // ✅ Only on-court players (first 5)
          teamAId={gameData.team_a_id} // ✅ FIX: Pass actual team IDs for proper comparison
          teamBId={gameData.team_b_id} // ✅ FIX: Pass actual team IDs for proper comparison
          teamAName={gameData.team_a?.name || gameData.team_a_name || 'Team A'} // ✅ UI FIX: Pass team names
          teamBName={coachMode ? (opponentName || 'Opponent Team') : (gameData.team_b?.name || gameData.team_b_name || 'Team B')} // ✅ UI FIX: Pass team names
          shooterTeamId={tracker.playPrompt.metadata?.shooterTeamId || gameData.team_a_id} // ✅ FIX: Pass shooter team ID
          shooterName={tracker.playPrompt.metadata?.shooterName || 'Unknown'}
          shotType={tracker.playPrompt.metadata?.shotType || 'shot'}
        />
      )}

      {/* Block Prompt Modal - After missed shots */}
      {tracker.playPrompt.isOpen && tracker.playPrompt.type === 'block' && (
        <BlockPromptModal
          isOpen={true}
          onClose={tracker.clearPlayPrompt}
          onSelectPlayer={async (playerId) => {
            try {
              // ✅ FIX: Handle custom players properly
              const isTeamAPlayer = teamAPlayers.some(p => p.id === playerId);
              const teamId = isTeamAPlayer ? gameData.team_a_id : gameData.team_b_id;
              const primaryEventId = tracker.playPrompt.primaryEventId;
              
              // Check if blocker is a custom player
              const blockerData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === playerId);
              const isCustomPlayer = playerId.startsWith('custom-') || 
                                    (blockerData && blockerData.is_custom_player === true);
              
              await tracker.recordStat({
                gameId: gameData.id,
                playerId: isCustomPlayer ? undefined : playerId, // ✅ Only for real players
                customPlayerId: isCustomPlayer ? playerId : undefined, // ✅ Only for custom players
                teamId,
                statType: 'block',
                modifier: null,
                metadata: primaryEventId ? { primaryEventId } : undefined
              });
              
              tracker.clearPlayPrompt();
            } catch (error) {
              console.error('❌ Error recording block:', error);
              notify.error(
                'Failed to record block',
                error instanceof Error ? error.message : 'Please try again'
              );
              tracker.clearPlayPrompt();
            }
          }}
          onSkip={() => {
            console.log('⏭️ Skipping block prompt');
            tracker.clearPlayPrompt();
          }}
          defensivePlayers={(() => {
            // Get DEFENSIVE team players (opposite of shooter's team)
            // ✅ Only show on-court players (first 5)
            const shooterTeamId = tracker.playPrompt.metadata?.shooterTeamId;
            if (shooterTeamId === gameData.team_a_id) {
              return currentRosterB; // Shooter from Team A → defenders from Team B
            } else {
              return currentRosterA; // Shooter from Team B → defenders from Team A
            }
          })()}
          shooterName={tracker.playPrompt.metadata?.shooterName || 'Unknown'}
          shotType={tracker.playPrompt.metadata?.shotType || 'shot'}
        />
      )}

      {/* Blocked Shot Selection Modal - After block */}
      {tracker.playPrompt.isOpen && tracker.playPrompt.type === 'missed_shot_type' && (
        <BlockedShotSelectionModal
          isOpen={true}
          onClose={tracker.clearPlayPrompt}
          onSelect={async (shooterId, shotType) => {
            try {
              // Get blocker info from metadata
              const blockerId = tracker.playPrompt.metadata?.blockerId;
              const blockerTeamId = tracker.playPrompt.metadata?.blockerTeamId;
              
              // Determine shooter team (opposite of blocker)
              const shooterTeamId = blockerTeamId === gameData.team_a_id 
                ? gameData.team_b_id 
                : gameData.team_a_id;
              
              // Find shooter player data (check both full lists for custom player detection)
              const shooterData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === shooterId);
              
              if (!shooterData) {
                console.error('❌ Shooter player not found');
                tracker.clearPlayPrompt();
                return;
              }
              
              // Check if shooter is custom player
              const isShooterCustom = shooterId.startsWith('custom-') || 
                                     (shooterData.is_custom_player === true);
              
              // ✅ BLOCK SEQUENCE: Record missed shot (this will trigger rebound prompt via PlayEngine)
              // Don't pass sequenceId - let PlayEngine create new sequence for rebound (prevents skip logic)
              await tracker.recordStat({
                gameId: gameData.id,
                playerId: isShooterCustom ? undefined : shooterId,
                customPlayerId: isShooterCustom ? shooterId : undefined,
                teamId: shooterTeamId,
                statType: shotType,
                modifier: 'missed'
                // ✅ Note: No sequenceId - PlayEngine will create new sequence for rebound prompt
              });
              
              // ✅ FIX: Don't clear prompt here - PlayEngine sets rebound prompt automatically inside recordStat()
              // The rebound prompt will replace the missed_shot_type prompt via React re-render
              // (BlockedShotSelectionModal closes when type !== 'missed_shot_type', ReboundPromptModal opens when type === 'rebound')
            } catch (error) {
              console.error('❌ Error recording missed shot after block:', error);
              notify.error(
                'Failed to record missed shot',
                error instanceof Error ? error.message : 'Please try again'
              );
              tracker.clearPlayPrompt();
            }
          }}
          shooterTeamPlayers={(() => {
            // Determine shooter team (opposite of blocker)
            const blockerTeamId = tracker.playPrompt.metadata?.blockerTeamId || gameData.team_a_id;
            const shooterTeamId = blockerTeamId === gameData.team_a_id 
              ? gameData.team_b_id 
              : gameData.team_a_id;
            
            // Return only on-court players (first 5) from shooter team
            return shooterTeamId === gameData.team_a_id ? currentRosterA : currentRosterB;
          })()}
          shooterTeamName={(() => {
            // Determine shooter team name
            const blockerTeamId = tracker.playPrompt.metadata?.blockerTeamId || gameData.team_a_id;
            const shooterTeamId = blockerTeamId === gameData.team_a_id 
              ? gameData.team_b_id 
              : gameData.team_a_id;
            
            return shooterTeamId === gameData.team_a_id ? gameData.team_a_name : gameData.team_b_name;
          })()}
          blockerName={(() => {
            const blockerId = tracker.playPrompt.metadata?.blockerId;
            const blockerData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === blockerId);
            return blockerData?.name || 'Unknown';
          })()}
        />
      )}

      {/* Turnover Prompt Modal - After steals */}
      {tracker.playPrompt.isOpen && tracker.playPrompt.type === 'turnover' && (
        <TurnoverPromptModal
          isOpen={true}
          onClose={tracker.clearPlayPrompt}
          onSelectPlayer={async (playerId) => {
            // Record turnover stat linked to the steal
            const isTeamAPlayer = teamAPlayers.some(p => p.id === playerId);
            const teamId = isTeamAPlayer ? gameData.team_a_id : gameData.team_b_id;
            const primaryEventId = tracker.playPrompt.primaryEventId;
            
            // ✅ FIX: Check if player is a custom player (TWO CHECKS)
            const playerData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === playerId);
            const isCustomPlayer = playerId.startsWith('custom-') || 
                                  (playerData && playerData.is_custom_player === true);
            
            // ✅ OPTIMIZATION: Close modal immediately (optimistic UI)
            tracker.clearPlayPrompt();
            
            // ✅ OPTIMIZATION: Write to database in background (non-blocking)
            tracker.recordStat({
              gameId: gameData.id,
              playerId: isCustomPlayer ? undefined : playerId, // ✅ Only for real players
              customPlayerId: isCustomPlayer ? playerId : undefined, // ✅ Only for custom players
              teamId,
              statType: 'turnover',
              modifier: 'steal',
              metadata: primaryEventId ? { primaryEventId } : undefined
            }).catch(error => {
              console.error('❌ Error recording turnover:', error);
              notify.error(
                'Failed to record turnover',
                error instanceof Error ? error.message : 'Please try again'
              );
            });
          }}
          onSkip={() => {
            console.log('⏭️ Skipping turnover prompt');
            tracker.clearPlayPrompt();
          }}
          homePlayers={(() => {
            // Get players from the OPPOSITE team (who lost the ball)
            // ✅ Only show on-court players (first 5)
            const stealerTeamId = tracker.playPrompt.metadata?.stealerTeamId;
            if (stealerTeamId === gameData.team_a_id) {
              return currentRosterB; // Stealer from Team A → turnover by Team B
            } else {
              return currentRosterA; // Stealer from Team B → turnover by Team A
            }
          })()}
          stealerName={(() => {
            // Resolve stealer name from player list
            const stealerId = tracker.playPrompt.metadata?.stealerId;
            if (!stealerId) return 'Unknown';
            
            const stealerData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === stealerId);
            return stealerData?.name || 'Unknown';
          })()}
        />
      )}

      {/* ✅ PHASE 5: Foul Flow Modals */}
      
      {/* Foul Type Selection Modal */}
      <FoulTypeSelectionModal
        isOpen={showFoulTypeModal}
        onClose={() => {
          setShowFoulTypeModal(false);
          setFoulerPlayerId(null);
          setFoulerPlayerName('');
        }}
        onSelectFoulType={async (foulType) => {
          // ✅ FIX: Call handleFoulTypeSelection instead of duplicating logic
          // This ensures personal/offensive fouls are properly recorded
          console.log('🔍 FoulTypeSelectionModal: onSelectFoulType called with:', foulType);
          await handleFoulTypeSelection(foulType);
        }}
        foulerName={foulerPlayerName}
      />

      {/* Victim Player Selection Modal */}
      {showVictimSelectionModal && selectedFoulType && (
        <VictimPlayerSelectionModal
          isOpen={showVictimSelectionModal}
          onClose={() => {
            setShowVictimSelectionModal(false);
            resetFoulFlowState();
          }}
          onSelectPlayer={async (victimPlayerId, victimPlayerName) => {
            await handleVictimSelection(victimPlayerId, victimPlayerName);
          }}
          players={(() => {
            // Get players from OPPOSITE team (victim team)
            // ✅ Only show on-court players (first 5)
            if (!foulerPlayerId) return [];
            const isFoulerTeamA = teamAPlayers.some(p => p.id === foulerPlayerId);
            return isFoulerTeamA ? currentRosterB : currentRosterA;
          })()}
          teamName={(() => {
            if (!foulerPlayerId) return 'Unknown';
            const isFoulerTeamA = teamAPlayers.some(p => p.id === foulerPlayerId);
            return isFoulerTeamA ? (gameData.team_b?.name || 'Team B') : (gameData.team_a?.name || 'Team A');
          })()}
          foulType={selectedFoulType}
        />
      )}

      {/* Shot Made/Missed Modal - For shooting fouls */}
      {showShotMadeMissedModal && selectedFoulType && victimPlayerId && victimPlayerName && (
        <ShotMadeMissedModal
          isOpen={showShotMadeMissedModal}
          onClose={() => {
            setShowShotMadeMissedModal(false);
            resetFoulFlowState();
          }}
          onSelect={handleShotMadeMissed}
          playerName={victimPlayerName}
          shotType={selectedFoulType === 'shooting_3pt' ? '3pt' : '2pt'}
        />
      )}

      {/* ✅ NEW: FT Count Selection Modal (FULL auto mode only) */}
      {showFTCountModal && selectedPlayer && (
        <FreeThrowCountModal
          isOpen={showFTCountModal}
          onClose={handleFTAutoSequenceCancel}
          onSelectCount={handleFTCountSelect}
          shooterName={[...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer)?.name || 'Player'}
        />
      )}

      {/* ✅ NEW: FT Auto-Sequence Modal (FULL auto mode only) */}
      {ftAutoSequence && ftAutoSequence.isActive && ftAutoSequence.currentShot <= ftAutoSequence.totalShots && (
        <FreeThrowSequenceModal
          isOpen={true}
          onClose={handleFTAutoSequenceCancel}
          onComplete={handleFTSequenceComplete}
          shooterName={ftAutoSequence.shooterName}
          totalShots={ftAutoSequence.totalShots}
          foulType="shooting"
          initialCurrentShot={ftAutoSequence.currentShot}
          showProgress={true}
          autoSequenceMode={true}
          previousResults={ftAutoSequence.results}
        />
      )}

      {/* Free Throw Sequence Modal (from foul sequences) */}
      {tracker.playPrompt.isOpen && tracker.playPrompt.type === 'free_throw' && !ftAutoSequence && (
        <FreeThrowSequenceModal
          isOpen={true}
          onClose={tracker.clearPlayPrompt}
          onComplete={async (results) => {
            // Record all FT results
            // ✅ FIX: Use shooterId (not victimPlayerId) to match metadata
            const shooterId = tracker.playPrompt.metadata?.shooterId;
            if (!shooterId) {
              console.error('❌ Shooter ID not found in metadata');
              notify.error('Error', 'Shooter ID not found. Please try again.');
              tracker.clearPlayPrompt();
              return;
            }
            
            const shooterTeamId = tracker.playPrompt.metadata?.shooterTeamId;
            if (!shooterTeamId) {
              console.error('❌ Shooter team ID not found in metadata');
              notify.error('Error', 'Shooter team ID not found. Please try again.');
              tracker.clearPlayPrompt();
              return;
            }
            
            const isTeamAPlayer = teamAPlayers.some(p => p.id === shooterId);
            const teamId = isTeamAPlayer ? gameData.team_a_id : gameData.team_b_id;
            
            // ✅ FIX: Check if shooter is a custom player (TWO CHECKS)
            const shooterData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === shooterId);
            const isCustomPlayer = shooterId?.startsWith('custom-') || 
                                  (shooterData && shooterData.is_custom_player === true);
            
            // ✅ FIX: Get sequenceId from playPrompt to link free throws to foul sequence
            const sequenceId = tracker.playPrompt.sequenceId;
            
            // ✅ OPTIMIZATION: Close modal immediately (optimistic UI)
            tracker.clearPlayPrompt();
            
            // ✅ OPTIMIZATION: Write all FTs to database in background (non-blocking)
            // Record all free throws sequentially using Promise.all for parallel writes
            Promise.all(
              results.map(result =>
                tracker.recordStat({
                  gameId: gameData.id,
                  playerId: isCustomPlayer ? undefined : shooterId, // ✅ Only for real players
                  customPlayerId: isCustomPlayer ? shooterId : undefined, // ✅ Only for custom players
                  teamId,
                  statType: 'free_throw',
                  modifier: result.made ? 'made' : 'missed',
                  sequenceId: sequenceId // ✅ Link free throws to foul sequence
                })
              )
            ).catch(error => {
              console.error('❌ Error recording free throws:', error);
              notify.error(
                'Failed to record free throws',
                error instanceof Error ? error.message : 'Please try again'
              );
            });
          }}
          shooterName={tracker.playPrompt.metadata?.shooterName || 'Unknown'}
          totalShots={tracker.playPrompt.metadata?.totalShots || 2}
          foulType={tracker.playPrompt.metadata?.foulType || 'shooting'}
        />
      )}

      {/* Shot Clock Violation Modal */}
      {showViolationModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border-2 border-red-500 p-6 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🚨</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Shot Clock Violation!</h3>
              <p className="text-gray-300 mb-6">
                Record turnover for {
                  violationTeamId === gameData.team_a_id 
                    ? gameData.team_a?.name || 'Team A'
                    : gameData.team_b?.name || 'Team B'
                }
              </p>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    try {
                      // Record shot clock violation as turnover
                      if (selectedPlayer && violationTeamId) {
                        // ✅ FIX: Check if player is a custom player (TWO CHECKS)
                        const playerData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer);
                        const isCustomPlayer = selectedPlayer.startsWith('custom-') || 
                                              (playerData && playerData.is_custom_player === true);
                        
                        await tracker.recordStat({
                          gameId: gameData.id,
                          playerId: isCustomPlayer ? undefined : selectedPlayer, // ✅ Only for real players
                          customPlayerId: isCustomPlayer ? selectedPlayer : undefined, // ✅ Only for custom players
                          teamId: violationTeamId,
                          statType: 'turnover',
                          modifier: 'shot_clock_violation'
                        });
                      }
                      setShowViolationModal(false);
                    } catch (error) {
                      console.error('❌ Error recording shot clock violation:', error);
                      notify.error(
                        'Failed to record violation',
                        error instanceof Error ? error.message : 'Please try again'
                      );
                      setShowViolationModal(false);
                    }
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Record Violation
                </button>
                <button
                  onClick={() => setShowViolationModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Substitution Loading Overlay */}
      {isSubstituting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-600 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-white font-medium">Processing substitution...</div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const featureTour = (coachMode && !isMobile) ? (
    <FeatureTour
      tourId="coach-tracker"
      steps={coachFeatureTourSteps}
      shouldStart={coachMode && !isMobile}
    />
  ) : null;

  // Mobile Layout
  if (isMobile) {
    return (
      <>
        <MobileLayoutV3
          gameData={gameData}
          tracker={tracker}
          teamAPlayers={teamAPlayers}
          teamBPlayers={teamBPlayers}
          selectedTeam={'A'} // Default for mobile compatibility
          selectedPlayer={selectedPlayer}
          onTeamSelect={() => {}} // No-op for mobile compatibility
          onPlayerSelect={setSelectedPlayer}
          onSubstitution={handleSubstitution}
          onTeamPlayersUpdate={(updatedTeamA, updatedTeamB) => {
            console.log('🔄 Updating main team players state after substitution');
            setTeamAPlayers(updatedTeamA);
            setTeamBPlayers(updatedTeamB);
            // Force re-render with new key
            setRosterRefreshKey(Date.now());
          }}
          onTimeOut={handleTimeoutClick}
          isCoachMode={coachMode}
          userId={user?.id}
          opponentName={opponentName} // ✅ FIX: Pass opponent name from database
          onPossessionChange={tracker.manualSetPossession}
          gameStatus={tracker.gameStatus}
          onStatRecord={handleStatRecord} // ✅ USE DESKTOP LOGIC
          onFoulRecord={handleFoulRecord} // ✅ USE DESKTOP LOGIC
          // ✅ STICKY BUTTON FIX: Pass callback to expose clear recording state function
          onClearRecordingStateRef={(clearFn) => {
            clearMobileRecordingStateRef.current = clearFn;
          }}
        />
        {/* ✅ MOBILE: Render shared modals */}
        {sharedModals}
        {featureTour}
      </>
    );
  }

  // Desktop Layout - Responsive with Optional Scrolling
  return (
    <ErrorBoundary>
      <div className="min-h-screen overflow-y-auto" style={{ background: 'linear-gradient(135deg, #1f2937, #111827)' }}>
        <div className="container mx-auto px-3 py-3 max-w-7xl min-h-screen flex flex-col">
        
        {/* Demo Banner - Only shown for demo games */}
        {gameData?.is_demo && (
          <div className="mb-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white p-3 rounded-lg shadow-lg border-2 border-amber-400">
            <div className="flex items-center justify-center gap-2 font-semibold">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              <span>🎯 DEMO MODE - This is a practice game for training purposes</span>
            </div>
          </div>
        )}
        
        {/* Top Scoreboard & Clock with Integrated Shot Clock */}
        <TopScoreboardV3
          onBack={async () => {
            // ✅ CRITICAL: Save clock state before navigating
            await tracker.saveClockBeforeExit();
            
            // ✅ FIX: Role-based dashboard routing
            if (coachMode || userRole === 'coach') {
              router.push('/dashboard/coach');
            } else if (userRole === 'stat_admin') {
              router.push('/dashboard/stat-admin');
            } else {
              router.push('/dashboard');
            }
          }}
          teamAName={gameData.team_a?.name || 'Team A'}
          teamBName={coachMode ? (opponentName || 'Opponent Team') : (gameData.team_b?.name || 'Team B')}
          teamAScore={tracker.scores[gameData.team_a_id] || 0}
          teamBScore={coachMode ? (tracker.scores.opponent || 0) : (tracker.scores[gameData.team_b_id] || 0)}
          quarter={tracker.quarter}
          minutes={Math.floor(tracker.clock.secondsRemaining / 60)}
          seconds={tracker.clock.secondsRemaining % 60}
          isRunning={tracker.clock.isRunning}
          onStart={tracker.startClock}
          onStop={tracker.stopClock}
          onReset={tracker.resetClock}
          onSetCustomTime={tracker.setCustomTime} // NEW: Manual clock editing
          onSetQuarter={tracker.setQuarter} // ✅ NEW: Manual quarter editing
          // NBA Standard: Team fouls and timeouts (placeholder values for now)
          teamAFouls={tracker.teamFouls[gameData.team_a_id] || 0}
          teamBFouls={tracker.teamFouls[gameData.team_b_id] || 0}
          teamATimeouts={tracker.teamTimeouts[gameData.team_a_id] ?? 5}
          teamBTimeouts={tracker.teamTimeouts[gameData.team_b_id] ?? 5}
          // Shot Clock Props
          shotClockSeconds={tracker.shotClock.secondsRemaining ?? 24}
          shotClockIsRunning={tracker.shotClock.isRunning}
          shotClockIsVisible={tracker.shotClock.isVisible}
          onShotClockStart={tracker.startShotClock}
          onShotClockStop={tracker.stopShotClock}
          onShotClockReset={tracker.resetShotClock}
          onShotClockSetTime={tracker.setShotClockTime}
          onToggleShotClockVisibility={tracker.toggleShotClockVisibility}
          gameStatus={tracker.gameStatus}
          isDemo={gameData.is_demo}
          gameId={gameData.id}
          teamAId={gameData.team_a_id}
          teamBId={gameData.team_b_id}
        />

        {coachMode && tracker.gameStatus === 'in_progress' && !dismissedCompletionReminder && (
          <CompletionNudge
            className="mb-4"
            message="End the game when you're finished to unlock full coach analytics."
            primaryAction={{
              label: 'End Game',
              onClick: () => {
                try {
                  tracker.closeGame();
                } catch (error) {
                  console.error('❌ Error closing game from nudge:', error);
                }
              }
            }}
            secondaryAction={{
              label: 'Dismiss',
              onClick: () => setDismissedCompletionReminder(true)
            }}
          />
        )}

        {/* ✅ REFINEMENT: Possession Indicator moved to Last Action section (saves space) */}

        {/* Main Content Grid - Responsive Layout: Mobile/Tablet/Desktop */}
        <div className={`grid gap-3 items-start flex-1 min-h-0 ${
          isTablet 
            ? 'grid-cols-1 md:grid-cols-5' 
            : 'grid-cols-1 lg:grid-cols-7'
        }`}>
          {/* Left Column - Team A Roster */}
          <div className={isTablet ? "md:col-span-2" : "lg:col-span-2"}>
            <div className="h-full">
              <TeamRosterV3
                key={`teamA-${rosterRefreshKey}`}
                players={teamAPlayers}
                teamName={gameData.team_a?.name || 'Team A'}
                teamSide="left"
                selectedPlayer={selectedPlayer}
                onPlayerSelect={setSelectedPlayer}
                onSubstitution={handleSubstitution}
                onQuickSubstitution={handleQuickSubstitution}
                refreshKey={rosterRefreshKey}
                isCoachMode={coachMode}
              />
            </div>
          </div>

          {/* Center Column - Stat Interface */}
          <div className={isTablet ? "md:col-span-1" : "lg:col-span-3"}>
            <div className="h-full">
              <DesktopStatGridV3
                selectedPlayer={selectedPlayer}
                selectedPlayerData={[...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer)}
                isClockRunning={tracker.clock.isRunning && !tracker.timeoutActive}
                onStatRecord={handleStatRecord}
                onFoulRecord={handleFoulRecord}
                onTimeOut={handleTimeoutClick}
                onSubstitution={() => handleSubstitution()}
                onGameEnd={tracker.closeGame}
                lastAction={tracker.lastAction}
                lastActionPlayerId={tracker.lastActionPlayerId}
                onUndoLastAction={tracker.undoLastAction}
                canUndo={!!tracker.lastRecordedStat}
                // ✅ REFINEMENT 1: Pass possession indicator props
                possession={tracker.possession}
                teamAId={gameData.team_a_id}
                teamBId={coachMode ? 'opponent-team' : gameData.team_b_id}
                teamAName={gameData.team_a?.name || 'Team A'}
                teamBName={coachMode ? (opponentName || 'Opponent Team') : (gameData.team_b?.name || 'Team B')}
                isCoachMode={coachMode}
                onPossessionChange={tracker.manualSetPossession}
                gameStatus={tracker.gameStatus}
                // ✅ Stat Edit Modal Props
                gameId={gameData.id}
                teamAPlayers={teamAPlayers}
                teamBPlayers={teamBPlayers}
                // ✅ STICKY BUTTON FIX: Pass callback to expose clear recording state function
                onClearRecordingStateRef={(clearFn) => {
                  clearDesktopRecordingStateRef.current = clearFn;
                }}
              />
            </div>
          </div>

          {/* Right Column - Team B Roster OR Opponent Panel (Coach Mode) */}
          <div className={isTablet ? "md:col-span-2" : "lg:col-span-2"}>
            <div className="h-full">
              {coachMode ? (
                <OpponentTeamPanel
                  opponentName={opponentName}
                  selectedPlayer={selectedPlayer}
                  onPlayerSelect={setSelectedPlayer}
                  gameId={gameData.id}
                  teamId={gameData.team_a_id}
                  teamName={gameData.team_a?.name || 'My Team'}
                />
              ) : (
                <TeamRosterV3
                  key={`teamB-${rosterRefreshKey}`}
                  players={teamBPlayers}
                  teamName={gameData.team_b?.name || 'Team B'}
                  teamSide="right"
                  selectedPlayer={selectedPlayer}
                  onPlayerSelect={setSelectedPlayer}
                  onSubstitution={handleSubstitution}
                  onQuickSubstitution={handleQuickSubstitution}
                  refreshKey={rosterRefreshKey}
                  isCoachMode={coachMode}
                />
              )}
            </div>
          </div>
        </div>

        {/* ✅ DESKTOP: Render shared modals */}
        {sharedModals}
        {featureTour}

        {/* Game Over Modal - Auto shown when clock reaches 0 with a winner */}
        {gameData && (
          <GameOverModal
            isOpen={tracker.showGameOverModal}
            teamAName={gameData.team_a?.name || 'Team A'}
            teamBName={gameData.team_b?.name || 'Team B'}
            teamAScore={tracker.scores[gameData.team_a_id] || 0}
            teamBScore={tracker.scores[gameData.team_b_id] || 0}
            isOvertime={tracker.quarter > 4}
            overtimeNumber={tracker.quarter > 4 ? tracker.quarter - 4 : undefined}
            onEditStats={() => {
              // Close modal to let user edit stats using existing UI
              tracker.setShowGameOverModal(false);
            }}
            onCompleteGame={() => {
              // Close this modal and trigger the standard closeGame flow
              tracker.setShowGameOverModal(false);
              tracker.closeGame();
            }}
          />
        )}

        {/* Game Completion Modal with Awards */}
        {!coachMode && gameData && (
          <GameCompletionModal
            isOpen={tracker.showAwardsModal}
            onClose={() => tracker.setShowAwardsModal(false)}
            onComplete={tracker.completeGameWithAwards}
            gameId={gameData.id}
            teamAId={gameData.team_a_id}
            teamBId={gameData.team_b_id}
            teamAName={gameData.team_a?.name || 'Team A'}
            teamBName={gameData.team_b?.name || 'Team B'}
            teamAScore={tracker.scores[gameData.team_a_id] || 0}
            teamBScore={tracker.scores[gameData.team_b_id] || 0}
          />
        )}

        {/* ✅ RELIABILITY: Network Status Indicator */}
        <NetworkStatusIndicator position="top-right" autoHide={true} autoHideDelay={3000} />
      </div>
      </div>
    </ErrorBoundary>
  );
}

export default function StatTrackerV3() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading stat tracker...</div>
      </div>
    }>
      <StatTrackerV3Content />
    </Suspense>
  );
}
