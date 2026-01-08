/**
 * GameViewerPage (MODERNIZED)
 * 
 * NBA-style live game viewer
 * Single responsibility: Coordinate game display
 * Follows .cursorrules: <200 lines, removed inline styles
 * 
 * @module GameViewerPage
 */

'use client';

import React, { use, useMemo, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameViewerV2 } from '@/hooks/useGameViewerV2';
import { useTeamStats } from '@/hooks/useTeamStats';
import { useGameAwards } from '@/hooks/useGameAwards';
import { useGameViewerTheme } from './hooks/useGameViewerTheme';
import GameHeader from './components/GameHeader';
import PlayByPlayFeed from './components/PlayByPlayFeed';
import { TeamStatsTab } from './components/TeamStatsTab';
import { LiveIndicator } from './components/LiveIndicator';
import { GameAwardsSection } from './components/GameAwardsSection';
import { CoachGameAnalyticsTab } from './components/CoachGameAnalyticsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle } from 'lucide-react';
import { TeamService } from '@/lib/services/tournamentService';

interface GameViewerPageProps {
  params: Promise<{ gameId: string }>;
}

const GameViewerPage: React.FC<GameViewerPageProps> = ({ params }) => {
  const { gameId } = use(params);
  const { game, stats, plays, loading, error } = useGameViewerV2(gameId);
  const { theme, isDark, toggleTheme } = useGameViewerTheme();
  const [teamALogo, setTeamALogo] = useState<string | null>(null);
  const [teamBLogo, setTeamBLogo] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTeamLogos() {
      if (!game?.team_a_id && !game?.team_b_id) {
        if (isMounted) {
          setTeamALogo(null);
          setTeamBLogo(null);
        }
        return;
      }

      try {
        const [teamAInfo, teamBInfo] = await Promise.all([
          game?.team_a_id ? TeamService.getTeamInfo(game.team_a_id) : Promise.resolve(null),
          game?.team_b_id ? TeamService.getTeamInfo(game.team_b_id) : Promise.resolve(null),
        ]);

        if (!isMounted) return;

        setTeamALogo(teamAInfo?.logo ?? null);
        setTeamBLogo(teamBInfo?.logo ?? null);
      } catch (err) {
        console.error('❌ Failed to load team logos for game viewer:', err);
        if (isMounted) {
          setTeamALogo(null);
          setTeamBLogo(null);
        }
      }
    }

    void loadTeamLogos();

    return () => {
      isMounted = false;
    };
  }, [game?.team_a_id, game?.team_b_id]);

  // Prefetch team data for instant tab switching
  const teamAPrefetch = useTeamStats(gameId, game?.team_a_id || '', { 
    prefetch: true, 
    enabled: !!game?.team_a_id 
  });
  
  const teamBPrefetch = useTeamStats(gameId, game?.team_b_id || '', { 
    prefetch: true, 
    enabled: !!game?.team_b_id 
  });

  // ✅ Game completion state (needed for prefetch conditions)
  const isCompleted = game?.status?.toLowerCase() === 'completed';

  // ✅ Prefetch game awards for completed games
  const gameAwardsPrefetch = useGameAwards(gameId, {
    prefetch: true,
    enabled: isCompleted
  });

  // Memoized game object
  // ✅ FIX: Use opponent_name for coach games instead of team_b_name (dummy team)
  const memoizedGame = useMemo(() => ({
    teamAName: game?.team_a_name || 'Team A',
    teamBName: game?.is_coach_game ? (game?.opponent_name || 'Opponent') : (game?.team_b_name || 'Team B'),
    homeScore: game?.home_score || 0,
    awayScore: game?.away_score || 0
  }), [game?.team_a_name, game?.team_b_name, game?.opponent_name, game?.is_coach_game, game?.home_score, game?.away_score]);

  // Calculate cumulative player points
  const calculatePlayerPoints = useCallback((idx: number, id?: string) => {
    if (!id || !plays) return undefined;
    let pts = 0;
    for (let i = plays.length - 1; i >= idx; i--) {
      if (plays[i].playerId === id && plays[i].points) pts += plays[i].points;
    }
    return pts > 0 ? pts : undefined;
  }, [plays]);

  // Calculate cumulative player stats (shooting + non-scoring stats for NBA-style display)
  const calculatePlayerStats = useCallback((idx: number, id?: string) => {
    if (!id || !plays) return undefined;
    
    let fgMade = 0, fgAttempts = 0;
    let threeMade = 0, threeAttempts = 0;
    let ftMade = 0, ftAttempts = 0;
    // ✅ Non-scoring stats
    let assists = 0, rebounds = 0, blocks = 0, steals = 0, turnovers = 0, fouls = 0;
    
    // Count all plays from end to current index (chronological order)
    for (let i = plays.length - 1; i >= idx; i--) {
      if (plays[i].playerId === id) {
        const play = plays[i];
        
        if (play.statType === 'field_goal') {
          fgAttempts++;
          if (play.modifier === 'made') fgMade++;
        } else if (play.statType === 'three_pointer') {
          fgAttempts++;
          threeAttempts++;
          if (play.modifier === 'made') {
            fgMade++;
            threeMade++;
          }
        } else if (play.statType === 'free_throw') {
          ftAttempts++;
          if (play.modifier === 'made') ftMade++;
        } else if (play.statType === 'assist') {
          assists++;
        } else if (play.statType === 'rebound') {
          rebounds++;
        } else if (play.statType === 'block') {
          blocks++;
        } else if (play.statType === 'steal') {
          steals++;
        } else if (play.statType === 'turnover') {
          turnovers++;
        } else if (play.statType === 'foul') {
          fouls++;
        }
      }
    }
    
    // Return stats object (always return for non-scoring stat totals)
    return {
      fieldGoalMade: fgMade,
      fieldGoalAttempts: fgAttempts,
      threePointerMade: threeMade,
      threePointerAttempts: threeAttempts,
      freeThrowMade: ftMade,
      freeThrowAttempts: ftAttempts,
      // ✅ Non-scoring stats
      assists,
      rebounds,
      blocks,
      steals,
      turnovers,
      fouls
    };
  }, [plays]);

  const isLive = game?.status?.toLowerCase().includes('live') || 
                 game?.status?.toLowerCase().includes('progress');

  if (loading) return <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-gradient-to-br from-orange-50/50 via-background to-red-50/30'}`}><Loader2 className="w-12 h-12 text-orange-500 animate-spin" /></div>;
  if (error || !game) return <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-gradient-to-br from-orange-50/50 via-background to-red-50/30'}`}><div className="text-center"><AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" /><h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{error || 'Game Not Found'}</h2></div></div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen flex justify-center px-4 transition-colors duration-300 ${isDark ? 'bg-slate-950 text-foreground' : 'bg-gradient-to-br from-orange-50/50 via-background to-red-50/30 text-gray-900'}`}
    >
      <div className="w-full max-w-4xl mx-auto">
        {/* Game Header */}
        <GameHeader 
          theme={theme}
          onThemeToggle={toggleTheme}
          game={{
            ...game,
            teamAName: game.team_a_name || 'Team A',
            teamBName: game.is_coach_game ? (game.opponent_name || 'Opponent') : (game.team_b_name || 'Team B'),
            teamALogo: teamALogo || undefined,
            teamBLogo: teamBLogo || undefined,
            homeScore: game.home_score || 0,
            awayScore: game.away_score || 0,
            status: game.status || 'scheduled',
            quarter: game.quarter || 1,
            startTime: game.created_at || new Date().toISOString(),
            gameClockMinutes: game.game_clock_minutes ?? 0, // ✅ FIX: Use ?? to allow 0 as valid value
            gameClockSeconds: game.game_clock_seconds ?? 0, // ✅ FIX: Use ?? for consistency
            isClockRunning: game.is_clock_running || false,
            teamAFouls: game.team_a_fouls || 0,
            teamBFouls: game.team_b_fouls || 0,
            teamATimeouts: game.team_a_timeouts_remaining || 5,
            teamBTimeouts: game.team_b_timeouts_remaining || 5,
            gamePhase: game.game_phase || undefined,
          }}
          isLive={isLive}
          lastUpdated={game.updated_at || ''}
        />

        {/* Tabs: Feed / Box Score / Teams */}
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className={`w-full rounded-none h-auto p-0 border-b ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-orange-200'}`}>
            <TabsTrigger value="feed" className={`flex-1 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none py-3 ${isDark ? 'data-[state=active]:bg-slate-700/50 text-muted-foreground data-[state=active]:text-orange-400' : 'data-[state=active]:bg-orange-50 text-gray-600 data-[state=active]:text-orange-600'}`}>
              Feed
            </TabsTrigger>
            <TabsTrigger value="game" className={`flex-1 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none py-3 ${isDark ? 'data-[state=active]:bg-slate-700/50 text-muted-foreground data-[state=active]:text-orange-400' : 'data-[state=active]:bg-orange-50 text-gray-600 data-[state=active]:text-orange-600'}`}>
              Box Score
            </TabsTrigger>
            <TabsTrigger value="teamA" className={`flex-1 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none py-3 ${isDark ? 'data-[state=active]:bg-slate-700/50 text-muted-foreground data-[state=active]:text-orange-400' : 'data-[state=active]:bg-orange-50 text-gray-600 data-[state=active]:text-orange-600'}`}>
              {game.team_a_name || 'Team A'}
            </TabsTrigger>
            <TabsTrigger value="teamB" className={`flex-1 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none py-3 ${isDark ? 'data-[state=active]:bg-slate-700/50 text-muted-foreground data-[state=active]:text-orange-400' : 'data-[state=active]:bg-orange-50 text-gray-600 data-[state=active]:text-orange-600'}`}>
              {game.is_coach_game ? (game.opponent_name || 'Opponent') : (game.team_b_name || 'Team B')}
            </TabsTrigger>
            {/* ✅ Coach Analytics Tab - Only for coach games */}
            {game.is_coach_game && isCompleted && (
              <TabsTrigger value="analytics" className={`flex-1 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none py-3 ${isDark ? 'data-[state=active]:bg-slate-700/50 text-muted-foreground data-[state=active]:text-orange-400' : 'data-[state=active]:bg-orange-50 text-gray-600 data-[state=active]:text-orange-600'}`}>
                Analytics
              </TabsTrigger>
            )}
          </TabsList>

          {/* Feed Tab */}
          <TabsContent value="feed" className="mt-0">
            <PlayByPlayFeed
              playByPlay={plays || []}
              game={memoizedGame}
              isLive={isLive}
              theme={theme}
              calculatePlayerStats={calculatePlayerStats}
              calculatePlayerPoints={calculatePlayerPoints}
            />
          </TabsContent>

          {/* Box Score Tab */}
          <TabsContent value="game" className={`mt-0 p-6 space-y-4 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-orange-50/30 to-background'}`}>
            {/* Game Summary Card */}
            <div className={`rounded-lg p-6 space-y-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-orange-200 shadow-sm'} border`}>
              <h3 className={`text-xl font-bold pb-3 border-b ${isDark ? 'text-foreground border-slate-700' : 'text-gray-900 border-orange-200'}`}>Game Summary</h3>
              
              {/* Team A Score Row */}
              <div className={`flex justify-between items-center py-3 border-b ${isDark ? 'border-slate-700' : 'border-orange-200'}`}>
                <span className={`text-lg font-semibold ${isDark ? 'text-foreground' : 'text-gray-900'}`}>{game.team_a_name}</span>
                <span className={`text-2xl font-extrabold ${isDark ? 'text-foreground' : 'text-gray-900'}`}>{game.home_score}</span>
              </div>
              
              {/* Team B Score Row */}
              <div className={`flex justify-between items-center py-3 border-b ${isDark ? 'border-slate-700' : 'border-orange-200'}`}>
                <span className={`text-lg font-semibold ${isDark ? 'text-foreground' : 'text-gray-900'}`}>{game.is_coach_game ? (game.opponent_name || 'Opponent') : game.team_b_name}</span>
                <span className={`text-2xl font-extrabold ${isDark ? 'text-foreground' : 'text-gray-900'}`}>{game.away_score}</span>
              </div>
              
              {/* Game Info Grid */}
              <div className={`grid grid-cols-3 gap-4 pt-4 text-sm ${isDark ? 'text-muted-foreground' : 'text-gray-600'}`}>
                <div><span className="font-semibold">Status:</span> {game.status}</div>
                <div><span className="font-semibold">Q:</span> {game.quarter}</div>
                <div><span className="font-semibold">Time:</span> {String(game.game_clock_minutes||0).padStart(2,'0')}:{String(game.game_clock_seconds||0).padStart(2,'0')}</div>
              </div>
              <div className={`grid grid-cols-2 gap-4 text-sm ${isDark ? 'text-muted-foreground' : 'text-gray-600'}`}>
                <div><span className="font-semibold">Fouls:</span> {game.team_a_fouls||0}-{game.team_b_fouls||0}</div>
                <div><span className="font-semibold">TOs:</span> {game.team_a_timeouts_remaining||5}-{game.team_b_timeouts_remaining||5}</div>
              </div>
            </div>

            {/* Game Awards Section - Only for completed games */}
            {isCompleted && (
              <GameAwardsSection 
                isDark={isDark}
                loading={gameAwardsPrefetch.loading}
                gameId={gameId}
                prefetchedData={!gameAwardsPrefetch.loading ? {
                  playerOfTheGame: gameAwardsPrefetch.playerOfTheGame,
                  hustlePlayer: gameAwardsPrefetch.hustlePlayer
                } : undefined}
              />
            )}
          </TabsContent>

          {/* Team A Tab */}
          <TabsContent value="teamA" className="mt-0">
            <TeamStatsTab 
              gameId={gameId} 
              teamId={game.team_a_id} 
              teamName={game.team_a_name || 'Team A'}
              isDark={isDark}
              prefetchedData={!teamAPrefetch.loading && !teamAPrefetch.error ? {
                teamStats: teamAPrefetch.teamStats,
                onCourtPlayers: teamAPrefetch.onCourtPlayers,
                benchPlayers: teamAPrefetch.benchPlayers
              } : undefined}
            />
          </TabsContent>

          {/* Team B Tab */}
          <TabsContent value="teamB" className="mt-0">
            <TeamStatsTab 
              gameId={gameId} 
              teamId={game.team_b_id} 
              teamName={game.is_coach_game ? (game.opponent_name || 'Opponent') : (game.team_b_name || 'Team B')}
              isDark={isDark}
              teamStatsOnly={game.is_coach_game || false}
              prefetchedData={!teamBPrefetch.loading && !teamBPrefetch.error ? {
                teamStats: teamBPrefetch.teamStats,
                onCourtPlayers: teamBPrefetch.onCourtPlayers,
                benchPlayers: teamBPrefetch.benchPlayers
              } : undefined}
            />
          </TabsContent>

          {/* ✅ Coach Analytics Tab - Game breakdown for coach games */}
          {game.is_coach_game && isCompleted && (
            <TabsContent value="analytics" className="mt-0">
              <CoachGameAnalyticsTab
                gameId={gameId}
                teamId={game.team_a_id}
                teamName={game.team_a_name || 'Team'}
                isDark={isDark}
              />
            </TabsContent>
          )}
        </Tabs>


        {/* Live Indicator */}
        <LiveIndicator show={isLive} position="bottom-right" size="md" />
      </div>
    </motion.div>
  );
};

export default GameViewerPage;
