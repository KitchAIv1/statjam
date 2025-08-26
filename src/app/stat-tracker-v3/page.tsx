'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { TeamService } from '@/lib/services/tournamentService';
import { useTracker } from '@/hooks/useTracker';
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
  jersey_number?: number;
}

export default function StatTrackerV3() {
  const { user, userRole, loading } = useAuthStore();
  const router = useRouter();
  const params = useSearchParams();
  const { isMobile, isDesktop } = useResponsiveLayout();
  
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

        // Import services dynamically
        const { GameService } = await import('@/lib/services/gameService');
        const { TeamService } = await import('@/lib/services/tournamentService');

        // Load game data
        const game = await GameService.getGame(gameIdParam);
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
        
        // Load Team A players with individual error handling
        let teamAPlayersData: Player[] = [];
        try {
          teamAPlayersData = await TeamService.getTeamPlayers(game.team_a_id);
          console.log('✅ Team A players loaded:', teamAPlayersData.length);
          setTeamAPlayers(teamAPlayersData);
        } catch (teamAError) {
          console.error('❌ Failed to load Team A players:', teamAError);
          setTeamAPlayers([]);
        }

        // Load Team B players with individual error handling  
        let teamBPlayersData: Player[] = [];
        try {
          teamBPlayersData = await TeamService.getTeamPlayers(game.team_b_id);
          console.log('✅ Team B players loaded:', teamBPlayersData.length);
          setTeamBPlayers(teamBPlayersData);
        } catch (teamBError) {
          console.error('❌ Failed to load Team B players:', teamBError);
          setTeamBPlayers([]);
        }

        // Auto-select first available player from loaded data
        const allPlayers = [...teamAPlayersData, ...teamBPlayersData];
        if (allPlayers.length > 0) {
          setSelectedPlayer(allPlayers[0].id);
          console.log('✅ Auto-selected first player:', allPlayers[0].name);
        }

      } catch (error) {
        console.error('❌ Error loading game data:', error);
        setError('Failed to load game data');
      } finally {
        setIsLoading(false);
      }
    };

    if (gameIdParam && user) {
      loadGameData();
    }
  }, [gameIdParam, user]);

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

  const handleSubConfirm = async (playerInId: string) => {
    if (!subOutPlayer || !gameData) return;
    
    // Determine which team the player being substituted belongs to
    const isTeamAPlayer = teamAPlayers.some(p => p.id === subOutPlayer);
    const teamId = isTeamAPlayer ? gameData.team_a_id : gameData.team_b_id;
    
    const success = await tracker.substitute({
      gameId: gameData.id,
      teamId,
      playerOutId: subOutPlayer,
      playerInId,
      quarter: tracker.quarter,
      gameTimeSeconds: tracker.clock.secondsRemaining
    });
    
    if (success) {
      setShowSubModal(false);
      setSubOutPlayer(null);
    }
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
      />
    );
  }

  // Desktop Layout - iPad Optimized (No Scrolling)
  return (
    <div className="h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg, #1f2937, #111827)' }}>
      <div className="container mx-auto px-3 py-3 max-w-7xl h-full flex flex-col">
        {/* Header */}
        <GameHeaderV3 
          gameId={gameData.id}
          onBack={() => router.push('/dashboard')}
        />

        {/* Top Scoreboard & Clock */}
        <TopScoreboardV3
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
          // NBA Standard: Team fouls and timeouts (placeholder values for now)
          teamAFouls={3}
          teamBFouls={6}
          teamATimeouts={5}
          teamBTimeouts={4}
        />

        {/* Main Content Grid - iPad Optimized Layout: No Scrolling */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 items-start flex-1 min-h-0">
          {/* Left Column - Team A Roster (Wider for iPad) */}
          <div className="lg:col-span-2">
            <div className="h-full">
              <TeamRosterV3
                players={teamAPlayers}
                teamName={gameData.team_a?.name || 'Team A'}
                teamSide="left"
                selectedPlayer={selectedPlayer}
                onPlayerSelect={setSelectedPlayer}
                onSubstitution={handleSubstitution}
              />
            </div>
          </div>

          {/* Center Column - Stat Interface */}
          <div className="lg:col-span-3">
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

          {/* Right Column - Team B Roster (Wider for iPad) */}
          <div className="lg:col-span-2">
            <div className="h-full">
              <TeamRosterV3
                players={teamBPlayers}
                teamName={gameData.team_b?.name || 'Team B'}
                teamSide="right"
                selectedPlayer={selectedPlayer}
                onPlayerSelect={setSelectedPlayer}
                onSubstitution={handleSubstitution}
              />
            </div>
          </div>
        </div>

        {/* Substitution Modal */}
        <SubstitutionModalV3
          isOpen={showSubModal}
          onClose={() => setShowSubModal(false)}
          playerOutId={subOutPlayer}
          playerOutData={[...teamAPlayers, ...teamBPlayers].find(p => p.id === subOutPlayer)}
          benchPlayers={benchPlayers}
          onConfirm={handleSubConfirm}
        />


      </div>
    </div>
  );
}