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
          teamBPlayersData = await TeamServiceV3.getTeamPlayersWithSubstitutions(game.team_b_id, game.id);
          console.log('✅ Team B players loaded (with substitutions):', teamBPlayersData.length);
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

  // Clock Tick Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (tracker.clock.isRunning) {
      interval = setInterval(() => {
        tracker.tick(1);
        if (tracker.clock.secondsRemaining <= 1) {
          tracker.advanceIfNeeded();
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [tracker.clock.isRunning, tracker.tick, tracker.advanceIfNeeded, tracker.clock.secondsRemaining]);

  // NEW: Shot Clock Tick Effect
  // ✅ PERFORMANCE FIX: Removed `tracker` dependency to prevent interval recreation on every shot clock update
  useEffect(() => {
    let shotClockInterval: NodeJS.Timeout;
    
    if (tracker.shotClock.isRunning && tracker.shotClock.isVisible) {
      shotClockInterval = setInterval(() => {
        tracker.shotClockTick(1);
        
        // Shot clock violation at 0 seconds
        if (tracker.shotClock.secondsRemaining <= 1) {
          console.log('🚨 Shot clock violation!');
          tracker.stopShotClock();
          setShotClockViolation(true);
          // TODO: Add shot clock violation handling (buzzer, turnover, etc.)
        }
      }, 1000);
    }

    return () => {
      if (shotClockInterval) clearInterval(shotClockInterval);
    };
  }, [tracker.shotClock.isRunning, tracker.shotClock.isVisible, tracker.shotClockTick, tracker.stopShotClock, tracker.shotClock.secondsRemaining]);

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
    
    // Handle different player types in coach mode
    let actualPlayerId = null;
    let actualCustomPlayerId = null;
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
      actualPlayerId = user?.id || null;
      actualTeamId = gameData.team_a_id; // ✅ Use coach's team ID for database (UUID required)
      isOpponentStat = true; // FLAG: This is an opponent stat
      console.log('✅ Recording opponent team stat (flagged as opponent), team_id:', actualTeamId, 'isOpponentStat:', isOpponentStat);
    } else {
      // Determine which team the selected player belongs to
      const isTeamAPlayer = teamAPlayers.some(p => p.id === selectedPlayer);
      actualTeamId = isTeamAPlayer ? gameData.team_a_id : gameData.team_b_id;
      
      // Check if this is a custom player
      const selectedPlayerData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer);
      const isCustomPlayer = selectedPlayerData && selectedPlayerData.is_custom_player === true;
      
      if (isCustomPlayer) {
        // CUSTOM PLAYER STATS: Use the actual custom player ID
        actualCustomPlayerId = selectedPlayer; // This is the custom_players.id
        actualPlayerId = null; // Don't set player_id for custom players
        console.log('🏀 Recording custom player stat for:', selectedPlayerData?.name, 'ID:', selectedPlayer);
      } else {
        // REGULAR PLAYER STATS: Use the user ID
        actualPlayerId = selectedPlayer; // This is the users.id
        actualCustomPlayerId = null; // Don't set custom_player_id for regular players
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
  };

  // Handle foul recording
  const handleFoulRecord = async (foulType: 'personal' | 'technical') => {
    if (!selectedPlayer || !gameData) return;

    // Use the same logic as handleStatRecord for player type handling
    let actualPlayerId = null;
    let actualCustomPlayerId = null;
    let actualTeamId = gameData.team_a_id;
    let isOpponentStat = false;
    
    console.log('🔍 FOUL RECORD DEBUG:', { 
      coachMode, 
      selectedPlayer, 
      isOpponentTeamSelected: selectedPlayer === 'opponent-team',
      willSetOpponentFlag: coachMode && selectedPlayer === 'opponent-team'
    });
    
    if (coachMode && selectedPlayer === 'opponent-team') {
      actualPlayerId = user?.id || null;
      actualTeamId = gameData.team_a_id;
      isOpponentStat = true; // FLAG: This is an opponent stat
      console.log('✅ Recording opponent foul (flagged as opponent), team_id:', actualTeamId, 'isOpponentStat:', isOpponentStat);
    } else {
      const isTeamAPlayer = teamAPlayers.some(p => p.id === selectedPlayer);
      actualTeamId = isTeamAPlayer ? gameData.team_a_id : gameData.team_b_id;
      
      const selectedPlayerData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer);
      const isCustomPlayer = selectedPlayerData && selectedPlayerData.is_custom_player === true;
      
      if (isCustomPlayer) {
        actualCustomPlayerId = selectedPlayer;
        actualPlayerId = null;
      } else {
        actualPlayerId = selectedPlayer;
        actualCustomPlayerId = null;
      }
    }

    await tracker.recordStat({
      gameId: gameData.id,
      teamId: actualTeamId,
      playerId: actualPlayerId,
      customPlayerId: actualCustomPlayerId,
      isOpponentStat: isOpponentStat,
      statType: 'foul',
      modifier: foulType
    });
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

  // Mobile Layout
  if (isMobile) {
    return (
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
      />
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
          key={`scoreboard-${JSON.stringify(tracker.scores)}`} // ✅ FORCE RE-RENDER
          teamAName={gameData.team_a?.name || 'Team A'}
          teamBName={coachMode ? (opponentNameParam || 'Opponent Team') : (gameData.team_b?.name || 'Team B')}
          teamAScore={(() => {
            const score = tracker.scores[gameData.team_a_id] || 0;
            console.log('🔍 SCOREBOARD DEBUG:', {
              coachMode,
              team_a_id: gameData.team_a_id,
              team_b_id: gameData.team_b_id,
              tracker_scores: tracker.scores,
              teamAScore: score,
              teamBScore: coachMode ? (tracker.scores.opponent || 0) : (tracker.scores[gameData.team_b_id] || 0)
            });
            return score;
          })()}
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
          teamATimeouts={tracker.teamTimeouts[gameData.team_a_id] || 7}
          teamBTimeouts={tracker.teamTimeouts[gameData.team_b_id] || 7}
          // Shot Clock Props
          shotClockSeconds={tracker.shotClock.secondsRemaining}
          shotClockIsRunning={tracker.shotClock.isRunning}
          shotClockIsVisible={tracker.shotClock.isVisible}
          onShotClockStart={tracker.startShotClock}
          onShotClockStop={tracker.stopShotClock}
          onShotClockReset={tracker.resetShotClock}
          onShotClockSetTime={tracker.setShotClockTime}
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

        {/* Dimmed Overlay During Timeout - Prevents Stat Entry */}
        {tracker.timeoutActive && (
          <div className="fixed inset-0 bg-black/60 z-40 pointer-events-none">
            {/* Overlay blocks interaction with stat tracker during timeout */}
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