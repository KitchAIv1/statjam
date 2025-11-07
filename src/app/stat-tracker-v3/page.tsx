'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
import { SubstitutionModalV3 } from '@/components/tracker-v3/SubstitutionModalV3';
import { TimeoutModalV3 } from '@/components/tracker-v3/TimeoutModalV3';
import { PossessionIndicator } from '@/components/tracker-v3/PossessionIndicator';
// ✅ PHASE 4 & 5: Play Sequence Modals
import { AssistPromptModal } from '@/components/tracker-v3/modals/AssistPromptModal';
import { ReboundPromptModal } from '@/components/tracker-v3/modals/ReboundPromptModal';
import { BlockPromptModal } from '@/components/tracker-v3/modals/BlockPromptModal';
import { TurnoverPromptModal } from '@/components/tracker-v3/modals/TurnoverPromptModal';
import { FreeThrowSequenceModal } from '@/components/tracker-v3/modals/FreeThrowSequenceModal';
import { FoulTypeSelectionModal, FoulType } from '@/components/tracker-v3/modals/FoulTypeSelectionModal';
import { VictimPlayerSelectionModal } from '@/components/tracker-v3/modals/VictimPlayerSelectionModal';
import { ShotClockViolationModal } from '@/components/tracker-v3/modals/ShotClockViolationModal';
import { useShotClockViolation } from '@/hooks/useShotClockViolation';
import { notify } from '@/lib/services/notificationService';

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
  const opponentNameParam = params.get('opponentName') || 'Opponent';
  
  // Game State
  const [gameData, setGameData] = useState<GameData | null>(null);
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
  
  // ✅ PHASE 5: Foul Flow State
  const [showFoulTypeModal, setShowFoulTypeModal] = useState(false);
  const [showVictimSelectionModal, setShowVictimSelectionModal] = useState(false);
  const [selectedFoulType, setSelectedFoulType] = useState<string | null>(null);
  const [foulerPlayerId, setFoulerPlayerId] = useState<string | null>(null);
  const [foulerPlayerName, setFoulerPlayerName] = useState<string>('');

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
    isCoachMode: coachMode // ✅ Pass coach mode flag for automation
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
    console.log('🔐 Auth check:', { loading, user: !!user, userRole, coachMode });
    if (!loading && !user) {
      console.log('🔄 Redirecting to auth...');
      router.push('/auth');
      return;
    }
    
    // Stat admin mode: require stat_admin role
    if (!loading && !coachMode && userRole !== 'stat_admin') {
      console.log('🔄 Not a stat admin, redirecting...');
      router.push('/auth');
      return;
    }
    
    // Coach mode: require coach role
    if (!loading && coachMode && userRole !== 'coach') {
      console.log('🔄 Not a coach, redirecting...');
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
        console.log('🔄 Loading LIVE game data for:', gameIdParam);
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

        console.log('✅ Loaded game data:', game);
        setGameData(game);

        // Validate team IDs
        if (!game.team_a_id || !game.team_b_id) {
          setError('Game missing team information');
          setIsLoading(false);
          return;
        }

        console.log('🔄 Loading team players...');
        
        // Load Team A players with individual error handling (including substitutions)
        let teamAPlayersData: Player[] = [];
        try {
          if (coachMode && coachTeamIdParam) {
            // Coach mode: Load coach team players
            console.log('🏀 Coach mode: Loading coach team players for team:', coachTeamIdParam);
            const { CoachPlayerService } = await import('@/lib/services/coachPlayerService');
            const coachPlayers = await CoachPlayerService.getCoachTeamPlayers(coachTeamIdParam);
            
            // Transform coach players to match Player interface
            teamAPlayersData = coachPlayers.map(cp => ({
              id: cp.id, // Always use the id field (works for both StatJam users and custom players)
              name: cp.name,
              jerseyNumber: cp.jersey_number,
              email: cp.email, // Preserve email for regular players
              is_custom_player: cp.is_custom_player // Preserve custom player flag
            }));
            console.log('✅ Coach team players loaded:', teamAPlayersData.length);
          } else {
            // Tournament mode: Load tournament team players
            teamAPlayersData = await TeamServiceV3.getTeamPlayersWithSubstitutions(game.team_a_id, game.id);
            console.log('✅ Team A players loaded (with substitutions):', teamAPlayersData.length);
          }
          setTeamAPlayers(teamAPlayersData);
        } catch (teamAError) {
          console.error('❌ Failed to load Team A players:', teamAError);
          setTeamAPlayers([]);
        }

        // Load Team B players with individual error handling (including substitutions)
        let teamBPlayersData: Player[] = [];
        try {
          // ✅ FIX: In coach mode, don't load team B (it's a dummy opponent team with no players)
          if (!coachMode) {
            teamBPlayersData = await TeamServiceV3.getTeamPlayersWithSubstitutions(game.team_b_id, game.id);
            console.log('✅ Team B players loaded (with substitutions):', teamBPlayersData.length);
          } else {
            console.log('🏀 Coach mode: Skipping Team B player load (opponent team is virtual)');
          }
          setTeamBPlayers(teamBPlayersData);
        } catch (teamBError) {
          console.error('❌ Failed to load Team B players:', teamBError);
          setTeamBPlayers([]);
        }

        // Auto-select first available player from loaded data
        const allPlayers = [...teamAPlayersData, ...teamBPlayersData];
        if (allPlayers.length > 0 && (!selectedPlayer || !allPlayers.find(p => p.id === selectedPlayer))) {
          console.log('🔍 DEBUG: All player IDs:', allPlayers.map(p => ({ id: p.id, name: p.name })));
          console.log('🔍 DEBUG: Team A IDs:', teamAPlayersData.map(p => ({ id: p.id, name: p.name })));
          console.log('🔍 DEBUG: Team B IDs:', teamBPlayersData.map(p => ({ id: p.id, name: p.name })));
          setSelectedPlayer(allPlayers[0].id);
          console.log('✅ Auto-selected first player:', allPlayers[0].name, 'ID:', allPlayers[0].id);
        } else if (allPlayers.length === 0) {
          // Clear selected player if no team data loaded
          setSelectedPlayer(null);
          console.log('⚠️ No team players loaded, clearing selected player');
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
      console.log('🔄 Triggering game data load - Auth ready, user available');
      loadGameData();
    } else if (gameIdParam && loading) {
      console.log('⏳ Waiting for auth to finish before loading game data...');
    } else if (gameIdParam && !user) {
      console.log('❌ Cannot load game data - user not authenticated');
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

  // Stat Recording
  const handleStatRecord = async (statType: string, modifier?: string) => {
    if (!selectedPlayer || !gameData) return;
    
    try {
      // Handle different player types in coach mode
      let actualPlayerId: string | undefined = undefined;
      let actualCustomPlayerId: string | undefined = undefined;
      let actualTeamId = gameData.team_a_id; // Default to coach team
      let isOpponentStat = false;
      
      console.log('🔍 STAT RECORD DEBUG:', { 
        coachMode, 
        selectedPlayer, 
        isOpponentTeamSelected: selectedPlayer === 'opponent-team',
        willSetOpponentFlag: coachMode && selectedPlayer === 'opponent-team'
      });
      
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
    setShowFoulTypeModal(false);
    setSelectedFoulType(foulType);
    
    // Determine if we need victim selection
    const needsVictimSelection = ['shooting_2pt', 'shooting_3pt', 'bonus', 'technical', 'flagrant'].includes(foulType);
    
    if (needsVictimSelection) {
      // Show victim selection modal
      setShowVictimSelectionModal(true);
    } else {
      // Personal or Offensive foul - record immediately
      await recordFoulWithoutVictim(foulType);
    }
  };
  
  // ✅ PHASE 5: Record foul without victim (Personal, Offensive)
  const recordFoulWithoutVictim = async (foulType: FoulType) => {
    if (!foulerPlayerId || !gameData) return;
    
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
      
      await tracker.recordStat({
        gameId: gameData.id,
        teamId: actualTeamId,
        playerId: actualPlayerId,
        customPlayerId: actualCustomPlayerId,
        isOpponentStat: isOpponentStat,
        statType: 'foul',
        modifier: modifier
      });
      
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
      
      // Map foul type to modifier and FT count
      let modifier = 'shooting';
      let ftCount = 2;
      let ftType: '1-and-1' | 'shooting' | 'technical' | 'flagrant' = 'shooting';
      
      switch (selectedFoulType) {
        case 'shooting_2pt':
          modifier = 'shooting';
          ftCount = 2;
          ftType = 'shooting';
          break;
        case 'shooting_3pt':
          modifier = 'shooting';
          ftCount = 3;
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
      
      // ✅ Generate sequence_id to link foul and FTs
      const { v4: uuidv4 } = await import('uuid');
      const sequenceId = uuidv4();
      
      // Record the foul with sequence_id for linking
      await tracker.recordStat({
        gameId: gameData.id,
        teamId: foulerTeamId,
        playerId: foulerActualPlayerId,
        customPlayerId: foulerCustomPlayerId,
        isOpponentStat: foulerIsOpponentStat,
        statType: 'foul',
        modifier: modifier,
        sequenceId: sequenceId // ✅ Link foul to FTs
      });
      
      // Trigger FT modal with same sequence_id
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
      setFoulerPlayerId(null);
      setFoulerPlayerName('');
      setSelectedFoulType(null);
    } catch (error) {
      console.error('❌ Error recording shooting foul:', error);
      notify.error(
        'Failed to record shooting foul',
        error instanceof Error ? error.message : 'Please try again'
      );
      // Reset state even on error
      setFoulerPlayerId(null);
      setFoulerPlayerName('');
      setSelectedFoulType(null);
    }
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



  // Substitution (unified logic for both mobile and desktop)
  const handleSubstitution = (playerOutId: string) => {
    setSubOutPlayer(playerOutId);
    setShowSubModal(true);
  };

  const handleSubConfirm = async (playerInId: string) => {
    if (!subOutPlayer || !gameData) return;

    // Determine which team the player being substituted belongs to
    const isTeamAPlayer = teamAPlayers.some(p => p.id === subOutPlayer);
    const teamId = isTeamAPlayer ? gameData.team_a_id : gameData.team_b_id;
    const currentRoster = isTeamAPlayer ? currentRosterA : currentRosterB;
    const currentBench = isTeamAPlayer ? currentBenchA : currentBenchB;

    // Find the players in current roster and bench
    const subbingOutPlayerData = currentRoster.find(p => p.id === subOutPlayer);
    const subbingInPlayerData = currentBench.find(p => p.id === playerInId);

    if (subbingOutPlayerData && subbingInPlayerData) {
      setIsSubstituting(true);
      
      try {
        // Record substitution to database
        const success = await tracker.substitute({
          gameId: gameData.id,
          teamId,
          playerOutId: subOutPlayer,
          playerInId,
          quarter: tracker.quarter,
          gameTimeSeconds: tracker.clock.secondsRemaining
        });

        if (success) {
          // Swap players between roster and bench
          const newRoster = currentRoster.map(player => 
            player.id === subOutPlayer ? subbingInPlayerData : player
          );
          const newBench = currentBench.map(player => 
            player.id === playerInId ? subbingOutPlayerData : player
          );

          // Update the appropriate team's roster and bench
          if (isTeamAPlayer) {
            setCurrentRosterA(newRoster);
            setCurrentBenchA(newBench);
            
            // Update main state - rebuild teamAPlayers with new order
            const updatedTeamAPlayers = [...newRoster, ...newBench];
            setTeamAPlayers(updatedTeamAPlayers);
          } else {
            setCurrentRosterB(newRoster);
            setCurrentBenchB(newBench);
            
            // Update main state - rebuild teamBPlayers with new order
            const updatedTeamBPlayers = [...newRoster, ...newBench];
            setTeamBPlayers(updatedTeamBPlayers);
          }

          // Update selected player if it was the subbed out player
          if (selectedPlayer === subbingOutPlayerData.id) {
            setSelectedPlayer(subbingInPlayerData.id);
          }

          // Force roster refresh
          setRosterRefreshKey(Date.now());

          setShowSubModal(false);
          setSubOutPlayer(null);
        }
      } catch (error) {
        console.error('❌ Substitution failed:', error);
      } finally {
        setIsSubstituting(false);
      }
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--dashboard-bg)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p style={{ color: 'var(--dashboard-text-primary)' }}>Loading game data...</p>
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
            <Button onClick={() => router.push('/dashboard')} variant="outline">
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
            <Button onClick={() => router.push('/dashboard')} variant="outline">
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
      <SubstitutionModalV3
        isOpen={showSubModal}
        onClose={() => {
          setShowSubModal(false);
          setSubOutPlayer(null);
        }}
        playerOutId={subOutPlayer}
        playerOutData={(() => {
          if (!subOutPlayer) return null;
          return [...teamAPlayers, ...teamBPlayers].find(p => p.id === subOutPlayer) || null;
        })()}
        benchPlayers={(() => {
          if (!subOutPlayer) return [];
          const isTeamAPlayer = teamAPlayers.some(p => p.id === subOutPlayer);
          return isTeamAPlayer ? currentBenchA : currentBenchB;
        })()}
        onConfirm={handleSubConfirm}
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
            try {
              // Record assist stat linked to the shot
              // ✅ PHASE 5 FIX: Assists must have modifier IS NULL per database constraint
              
              // ✅ FIX: Check if assisting player is custom player (TWO CHECKS)
              const assistingPlayer = [...teamAPlayers, ...teamBPlayers].find(p => p.id === playerId);
              const isCustomPlayer = playerId.startsWith('custom-') || 
                                    (assistingPlayer && assistingPlayer.is_custom_player === true);
              const primaryEventId = tracker.playPrompt.primaryEventId;
              
              const isTeamAPlayer = teamAPlayers.some(p => p.id === playerId);
              const teamId = isTeamAPlayer ? gameData.team_a_id : gameData.team_b_id;
              
              await tracker.recordStat({
                gameId: gameData.id,
                playerId: isCustomPlayer ? undefined : playerId, // ✅ Only for real players
                customPlayerId: isCustomPlayer ? playerId : undefined, // ✅ Only for custom players
                teamId,
                statType: 'assist',
                modifier: null, // ✅ NULL modifier for assists
                metadata: primaryEventId ? { primaryEventId } : undefined
              });
              
              tracker.clearPlayPrompt();
            } catch (error) {
              console.error('❌ Error recording assist:', error);
              notify.error(
                'Failed to record assist',
                error instanceof Error ? error.message : 'Please try again'
              );
              tracker.clearPlayPrompt();
            }
          }}
          onSkip={() => {
            console.log('⏭️ Skipping assist prompt');
            tracker.clearPlayPrompt();
          }}
          players={(() => {
            // Get players from the SCORING team (not shooter's team, but their teammates)
            const shooterTeamId = tracker.playPrompt.metadata?.shooterTeamId;
            if (shooterTeamId === gameData.team_a_id) {
              return teamAPlayers;
            } else {
              return teamBPlayers;
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
            try {
              // ✅ FIX: Handle custom players properly
              const isTeamAPlayer = teamAPlayers.some(p => p.id === playerId);
              const teamId = isTeamAPlayer ? gameData.team_a_id : gameData.team_b_id;
              const primaryEventId = tracker.playPrompt.primaryEventId;
              
              // Check if rebounder is a custom player
              const rebounderData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === playerId);
              const isCustomPlayer = playerId.startsWith('custom-') || 
                                    (rebounderData && rebounderData.is_custom_player === true);
              
              await tracker.recordStat({
                gameId: gameData.id,
                playerId: isCustomPlayer ? undefined : playerId, // ✅ Only for real players
                customPlayerId: isCustomPlayer ? playerId : undefined, // ✅ Only for custom players
                teamId,
                statType: 'rebound',
                modifier: reboundType,
                metadata: primaryEventId ? { primaryEventId } : undefined
              });
              
              tracker.clearPlayPrompt();
            } catch (error) {
              console.error('❌ Error recording rebound:', error);
              notify.error(
                'Failed to record rebound',
                error instanceof Error ? error.message : 'Please try again'
              );
              tracker.clearPlayPrompt();
            }
          }}
          onSkip={() => {
            console.log('⏭️ Skipping rebound prompt');
            tracker.clearPlayPrompt();
          }}
          teamAPlayers={teamAPlayers}
          teamBPlayers={teamBPlayers}
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
            const shooterTeamId = tracker.playPrompt.metadata?.shooterTeamId;
            if (shooterTeamId === gameData.team_a_id) {
              return teamBPlayers; // Shooter from Team A → defenders from Team B
            } else {
              return teamAPlayers; // Shooter from Team B → defenders from Team A
            }
          })()}
          shooterName={tracker.playPrompt.metadata?.shooterName || 'Unknown'}
          shotType={tracker.playPrompt.metadata?.shotType || 'shot'}
        />
      )}

      {/* Turnover Prompt Modal - After steals */}
      {tracker.playPrompt.isOpen && tracker.playPrompt.type === 'turnover' && (
        <TurnoverPromptModal
          isOpen={true}
          onClose={tracker.clearPlayPrompt}
          onSelectPlayer={async (playerId) => {
            try {
              // Record turnover stat linked to the steal
              const isTeamAPlayer = teamAPlayers.some(p => p.id === playerId);
              const teamId = isTeamAPlayer ? gameData.team_a_id : gameData.team_b_id;
              const primaryEventId = tracker.playPrompt.primaryEventId;
              
              // ✅ FIX: Check if player is a custom player (TWO CHECKS)
              const playerData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === playerId);
              const isCustomPlayer = playerId.startsWith('custom-') || 
                                    (playerData && playerData.is_custom_player === true);
              
              await tracker.recordStat({
                gameId: gameData.id,
                playerId: isCustomPlayer ? undefined : playerId, // ✅ Only for real players
                customPlayerId: isCustomPlayer ? playerId : undefined, // ✅ Only for custom players
                teamId,
                statType: 'turnover',
                modifier: 'steal',
                metadata: primaryEventId ? { primaryEventId } : undefined
              });
              
              tracker.clearPlayPrompt();
            } catch (error) {
              console.error('❌ Error recording turnover:', error);
              notify.error(
                'Failed to record turnover',
                error instanceof Error ? error.message : 'Please try again'
              );
              tracker.clearPlayPrompt();
            }
          }}
          onSkip={() => {
            console.log('⏭️ Skipping turnover prompt');
            tracker.clearPlayPrompt();
          }}
          homePlayers={(() => {
            // Get players from the OPPOSITE team (who lost the ball)
            const stealerTeamId = tracker.playPrompt.metadata?.stealerTeamId;
            if (stealerTeamId === gameData.team_a_id) {
              return teamBPlayers; // Stealer from Team A → turnover by Team B
            } else {
              return teamAPlayers; // Stealer from Team B → turnover by Team A
            }
          })()}
          stealerName={tracker.playPrompt.metadata?.stealerName || 'Unknown'}
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
        onSelectFoulType={(foulType) => {
          setSelectedFoulType(foulType);
          setShowFoulTypeModal(false);
          
          // If shooting foul, open victim selection modal
          if (foulType === 'shooting_2pt' || foulType === 'shooting_3pt' || foulType === 'bonus' || foulType === 'technical' || foulType === 'flagrant') {
            setShowVictimSelectionModal(true);
          }
        }}
        foulerName={foulerPlayerName}
      />

      {/* Victim Player Selection Modal */}
      {showVictimSelectionModal && selectedFoulType && (
        <VictimPlayerSelectionModal
          isOpen={showVictimSelectionModal}
          onClose={() => {
            setShowVictimSelectionModal(false);
            setSelectedFoulType(null);
            setFoulerPlayerId(null);
            setFoulerPlayerName('');
          }}
          onSelectPlayer={async (victimPlayerId) => {
            // Open Free Throw Sequence Modal
            console.log('🎯 Opening FT sequence for victim:', victimPlayerId, 'foul type:', selectedFoulType);
            setShowVictimSelectionModal(false);
            
            // Set up free throw sequence based on foul type
            const shotCount = selectedFoulType === 'shooting_2pt' || selectedFoulType === 'bonus' ? 2 : 
                              selectedFoulType === 'shooting_3pt' ? 3 : 
                              selectedFoulType === 'technical' || selectedFoulType === 'flagrant' ? 1 : 2;
            
            // Open FT sequence modal via play prompt
            tracker.setPlayPrompt({
              isOpen: true,
              type: 'free_throw',
              sequenceId: `ft-${Date.now()}`,
              primaryEventId: null,
              metadata: {
                victimPlayerId,
                victimName: [...teamAPlayers, ...teamBPlayers].find(p => p.id === victimPlayerId)?.name || 'Unknown',
                shotCount,
                foulType: selectedFoulType,
                foulerId: foulerPlayerId
              }
            });
            
            // Reset foul flow state
            setFoulerPlayerId(null);
            setFoulerPlayerName('');
            setSelectedFoulType(null);
          }}
          players={(() => {
            // Get players from OPPOSITE team (victim team)
            if (!foulerPlayerId) return [];
            const isFoulerTeamA = teamAPlayers.some(p => p.id === foulerPlayerId);
            return isFoulerTeamA ? teamBPlayers : teamAPlayers;
          })()}
          teamName={(() => {
            if (!foulerPlayerId) return 'Unknown';
            const isFoulerTeamA = teamAPlayers.some(p => p.id === foulerPlayerId);
            return isFoulerTeamA ? (gameData.team_b?.name || 'Team B') : (gameData.team_a?.name || 'Team A');
          })()}
          foulType={selectedFoulType}
        />
      )}

      {/* Free Throw Sequence Modal */}
      {tracker.playPrompt.isOpen && tracker.playPrompt.type === 'free_throw' && (
        <FreeThrowSequenceModal
          isOpen={true}
          onClose={tracker.clearPlayPrompt}
          onComplete={async (results) => {
            try {
              // Record all FT results
              const victimPlayerId = tracker.playPrompt.metadata?.victimPlayerId;
              const isTeamAPlayer = teamAPlayers.some(p => p.id === victimPlayerId);
              const teamId = isTeamAPlayer ? gameData.team_a_id : gameData.team_b_id;
              
              // ✅ FIX: Check if victim is a custom player (TWO CHECKS)
              const victimData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === victimPlayerId);
              const isCustomPlayer = victimPlayerId?.startsWith('custom-') || 
                                    (victimData && victimData.is_custom_player === true);
              
              for (const result of results) {
                await tracker.recordStat({
                  gameId: gameData.id,
                  playerId: isCustomPlayer ? undefined : victimPlayerId, // ✅ Only for real players
                  customPlayerId: isCustomPlayer ? victimPlayerId : undefined, // ✅ Only for custom players
                  teamId,
                  statType: 'free_throw',
                  modifier: result.made ? 'made' : 'missed'
                });
              }
              
              tracker.clearPlayPrompt();
            } catch (error) {
              console.error('❌ Error recording free throws:', error);
              notify.error(
                'Failed to record free throws',
                error instanceof Error ? error.message : 'Please try again'
              );
              tracker.clearPlayPrompt();
            }
          }}
          playerName={tracker.playPrompt.metadata?.victimName || 'Unknown'}
          shotCount={tracker.playPrompt.metadata?.shotCount || 2}
          foulType={tracker.playPrompt.metadata?.foulType || 'shooting_2pt'}
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
          onPossessionChange={tracker.manualSetPossession}
          gameStatus={tracker.gameStatus}
          onStatRecord={handleStatRecord} // ✅ USE DESKTOP LOGIC
          onFoulRecord={handleFoulRecord} // ✅ USE DESKTOP LOGIC
        />
        {/* ✅ MOBILE: Render shared modals */}
        {sharedModals}
      </>
    );
  }

  // Desktop Layout - Responsive with Optional Scrolling
  return (
    <ErrorBoundary>
      <div className="min-h-screen overflow-y-auto" style={{ background: 'linear-gradient(135deg, #1f2937, #111827)' }}>
        <div className="container mx-auto px-3 py-3 max-w-7xl min-h-screen flex flex-col">
        {/* Top Scoreboard & Clock with Integrated Shot Clock */}
        <TopScoreboardV3
          onBack={() => router.push('/dashboard')}
          teamAName={gameData.team_a?.name || 'Team A'}
          teamBName={coachMode ? (opponentNameParam || 'Opponent Team') : (gameData.team_b?.name || 'Team B')}
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
          // NBA Standard: Team fouls and timeouts (placeholder values for now)
          teamAFouls={tracker.teamFouls[gameData.team_a_id] || 0}
          teamBFouls={tracker.teamFouls[gameData.team_b_id] || 0}
          teamATimeouts={tracker.teamTimeouts[gameData.team_a_id] ?? 7}
          teamBTimeouts={tracker.teamTimeouts[gameData.team_b_id] ?? 7}
          // Shot Clock Props
          shotClockSeconds={tracker.shotClock.secondsRemaining ?? 24}
          shotClockIsRunning={tracker.shotClock.isRunning}
          shotClockIsVisible={tracker.shotClock.isVisible}
          onShotClockStart={tracker.startShotClock}
          onShotClockStop={tracker.stopShotClock}
          onShotClockReset={tracker.resetShotClock}
          onShotClockSetTime={tracker.setShotClockTime}
          gameStatus={tracker.gameStatus}
        />

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
                onSubstitution={() => selectedPlayer && handleSubstitution(selectedPlayer)}
                onGameEnd={tracker.closeGame}
                lastAction={tracker.lastAction}
                lastActionPlayerId={tracker.lastActionPlayerId}
                // ✅ REFINEMENT 1: Pass possession indicator props
                possession={tracker.possession}
                teamAId={gameData.team_a_id}
                teamBId={coachMode ? 'opponent-team' : gameData.team_b_id}
                teamAName={gameData.team_a?.name || 'Team A'}
                teamBName={coachMode ? (opponentNameParam || 'Opponent Team') : (gameData.team_b?.name || 'Team B')}
                isCoachMode={coachMode}
                onPossessionChange={tracker.manualSetPossession}
                gameStatus={tracker.gameStatus}
                // ✅ Stat Edit Modal Props
                gameId={gameData.id}
                teamAPlayers={teamAPlayers}
                teamBPlayers={teamBPlayers}
              />
            </div>
          </div>

          {/* Right Column - Team B Roster OR Opponent Panel (Coach Mode) */}
          <div className={isTablet ? "md:col-span-2" : "lg:col-span-2"}>
            <div className="h-full">
              {coachMode ? (
                <OpponentTeamPanel
                  opponentName={opponentNameParam}
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
                  refreshKey={rosterRefreshKey}
                  isCoachMode={coachMode}
                />
              )}
            </div>
          </div>
        </div>

        {/* ✅ DESKTOP: Render shared modals */}
        {sharedModals}

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
