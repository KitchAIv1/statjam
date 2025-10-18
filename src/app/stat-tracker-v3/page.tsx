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
import { GameHeaderV3 } from '@/components/tracker-v3/GameHeaderV3';
import { TopScoreboardV3 } from '@/components/tracker-v3/TopScoreboardV3';
import { TeamRosterV3 } from '@/components/tracker-v3/TeamRosterV3';
import { DesktopStatGridV3 } from '@/components/tracker-v3/DesktopStatGridV3';
import { SubstitutionModalV3 } from '@/components/tracker-v3/SubstitutionModalV3';

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

  // Initialize tracker with game data (only when we have valid team IDs)
  const tracker = useTracker({
    initialGameId: gameIdParam || 'unknown',
    teamAId: gameData?.team_a_id || 'teamA',
    teamBId: gameData?.team_b_id || 'teamB'
  });

  // Auth Check
  useEffect(() => {
    console.log('🔐 Auth check:', { loading, user: !!user, userRole });
    if (!loading && (!user || userRole !== 'stat_admin')) {
      console.log('🔄 Redirecting to auth...');
      router.push('/auth');
    }
  }, [user, userRole, loading, router]);

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
          teamAPlayersData = await TeamServiceV3.getTeamPlayersWithSubstitutions(game.team_a_id, game.id);
          console.log('✅ Team A players loaded (with substitutions):', teamAPlayersData.length);
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
  }, [tracker.clock.isRunning, tracker]);

  // NEW: Shot Clock Tick Effect
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
  }, [tracker.shotClock.isRunning, tracker.shotClock.isVisible, tracker]);

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
  }, [tracker.clock.isRunning, tracker.shotClock.isRunning, tracker.shotClock.isVisible, tracker, shotClockViolation]);

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
    
    // Determine which team the selected player belongs to
    const isTeamAPlayer = teamAPlayers.some(p => p.id === selectedPlayer);
    const teamId = isTeamAPlayer ? gameData.team_a_id : gameData.team_b_id;
    
    await tracker.recordStat({
      gameId: gameData.id,
      teamId,
      playerId: selectedPlayer,
      statType: statType as 'field_goal' | 'three_pointer' | 'free_throw' | 'assist' | 'rebound' | 'steal' | 'block' | 'turnover' | 'foul',
      modifier: modifier as 'made' | 'missed' | 'offensive' | 'defensive' | 'shooting' | 'personal' | 'technical' | 'flagrant' | undefined
    });
  };

  // Handle foul recording
  const handleFoulRecord = async (foulType: 'personal' | 'technical') => {
    if (!selectedPlayer || !gameData) return;

    // Determine which team the selected player belongs to
    const isTeamAPlayer = teamAPlayers.some(p => p.id === selectedPlayer);
    const teamId = isTeamAPlayer ? gameData.team_a_id : gameData.team_b_id;

    await tracker.recordStat({
      gameId: gameData.id,
      teamId,
      playerId: selectedPlayer,
      statType: 'foul',
      modifier: foulType
    });
  };



  // Substitution
  const handleSubstitution = (playerOutId: string) => {
    setSubOutPlayer(playerOutId);
    setShowSubModal(true);
  };

  // DISABLED: Buggy main page substitution handler - using MobileLayoutV3 handler instead
  /*
  const handleSubConfirm = async (playerInId: string) => {
    // This handler had bugs and was never properly tested
    // Using the working MobileLayoutV3 handler instead
  };
  */

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
      />
    );
  }

  // Desktop Layout - Responsive with Optional Scrolling
  return (
    <ErrorBoundary>
      <div className="min-h-screen overflow-y-auto" style={{ background: 'linear-gradient(135deg, #1f2937, #111827)' }}>
        <div className="container mx-auto px-3 py-3 max-w-7xl min-h-screen flex flex-col">
        {/* Header */}
        <GameHeaderV3 
          gameId={gameData.id}
          onBack={() => router.push('/dashboard')}
        />

        {/* Top Scoreboard & Clock with Integrated Shot Clock */}
        <TopScoreboardV3
          key={`scoreboard-${JSON.stringify(tracker.scores)}`} // ✅ FORCE RE-RENDER
          teamAName={gameData.team_a?.name || 'Team A'}
          teamBName={gameData.team_b?.name || 'Team B'}
          teamAScore={tracker.scores[gameData.team_a_id] || 0}
          teamBScore={tracker.scores[gameData.team_b_id] || 0}
          quarter={tracker.quarter}
          minutes={Math.floor(tracker.clock.secondsRemaining / 60)}
          seconds={tracker.clock.secondsRemaining % 60}
          isRunning={tracker.clock.isRunning}
          onStart={tracker.startClock}
          onStop={tracker.stopClock}
          onReset={tracker.resetClock}
          onSetCustomTime={tracker.setCustomTime} // NEW: Manual clock editing
          // NBA Standard: Team fouls and timeouts (placeholder values for now)
          teamAFouls={3}
          teamBFouls={6}
          teamATimeouts={5}
          teamBTimeouts={4}
          // Shot Clock Props
          shotClockSeconds={tracker.shotClock.secondsRemaining}
          shotClockIsRunning={tracker.shotClock.isRunning}
          shotClockIsVisible={tracker.shotClock.isVisible}
          onShotClockStart={tracker.startShotClock}
          onShotClockStop={tracker.stopShotClock}
          onShotClockReset={tracker.resetShotClock}
          onShotClockSetTime={tracker.setShotClockTime}
        />

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
              />
            </div>
          </div>

          {/* Center Column - Stat Interface */}
          <div className={isTablet ? "md:col-span-1" : "lg:col-span-3"}>
            <div className="h-full">
              <DesktopStatGridV3
                selectedPlayer={selectedPlayer}
                selectedPlayerData={[...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer)}
                isClockRunning={tracker.clock.isRunning}
                onStatRecord={handleStatRecord}
                onFoulRecord={handleFoulRecord}
                onTimeOut={() => {
                  // TODO: Implement timeout functionality
                  console.log('⏰ Time out called');
                  alert('Time out functionality will be implemented');
                }}
                onSubstitution={() => selectedPlayer && handleSubstitution(selectedPlayer)}
                onGameEnd={tracker.closeGame}
                lastAction={tracker.lastAction}
                lastActionPlayerId={tracker.lastActionPlayerId}
              />
            </div>
          </div>

          {/* Right Column - Team B Roster */}
          <div className={isTablet ? "md:col-span-2" : "lg:col-span-2"}>
            <div className="h-full">
              <TeamRosterV3
                key={`teamB-${rosterRefreshKey}`}
                players={teamBPlayers}
                teamName={gameData.team_b?.name || 'Team B'}
                teamSide="right"
                selectedPlayer={selectedPlayer}
                onPlayerSelect={setSelectedPlayer}
                onSubstitution={handleSubstitution}
                refreshKey={rosterRefreshKey}
              />
            </div>
          </div>
        </div>

        {/* Substitution Modal - Handled by MobileLayoutV3 */}

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