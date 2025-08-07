'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { GameViewerData, PlayByPlayEntry } from '@/lib/types/playByPlay';
import { Game } from '@/lib/types/game';

export const useGameStream = (gameId: string) => {
  const [gameData, setGameData] = useState<GameViewerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  /**
   * Transform game stats into play-by-play entries
   */
  const transformStatsToPlayByPlay = (stats: any[], teamMapping?: { teamAId: string; teamBId: string; teamAName: string; teamBName: string }): PlayByPlayEntry[] => {
    console.log('🔄 Transform function called with stats:', stats);
    console.log('🔄 Stats count:', stats.length);
    console.log('🔄 Team mapping:', teamMapping);
    if (stats.length > 0) {
      console.log('🔄 First stat sample:', stats[0]);
    }
    
    return stats.map(stat => {
      // Generate human-readable description
      let description = '';
      // Extract player name with fallbacks
      const playerName = stat.users?.email?.split('@')[0] || 
                        stat.users?.id?.substring(0, 8) || 
                        `Player ${stat.player_id?.substring(0, 8)}` || 
                        'Unknown Player';
      
      // Resolve team name from team_id
      let teamName = 'Unknown Team';
      if (teamMapping && stat.team_id) {
        if (stat.team_id === teamMapping.teamAId) {
          teamName = teamMapping.teamAName;
        } else if (stat.team_id === teamMapping.teamBId) {
          teamName = teamMapping.teamBName;
        } else {
          teamName = `Team ${stat.team_id.substring(0, 8)}`;
        }
      }
      
      console.log('🔍 Player and team extraction:', {
        original: stat.users,
        extracted: playerName,
        playerId: stat.player_id,
        teamId: stat.team_id,
        teamName: teamName,
        teamMapping: teamMapping
      });
      
      switch (stat.stat_type) {
        case 'three_pointer':
          description = `${playerName} ${stat.modifier === 'made' ? 'made' : 'missed'} a 3-pointer`;
          break;
        case 'field_goal':
          description = `${playerName} ${stat.modifier === 'made' ? 'made' : 'missed'} a field goal`;
          break;
        case 'free_throw':
          description = `${playerName} ${stat.modifier === 'made' ? 'made' : 'missed'} a free throw`;
          break;
        case 'assist':
          description = `${playerName} recorded an assist`;
          break;
        case 'rebound':
          description = `${playerName} grabbed a ${stat.modifier || ''} rebound`;
          break;
        case 'steal':
          description = `${playerName} recorded a steal`;
          break;
        case 'block':
          description = `${playerName} blocked a shot`;
          break;
        case 'turnover':
          description = `${playerName} committed a turnover`;
          break;
        case 'foul':
          description = `${playerName} committed a ${stat.modifier || ''} foul`;
          break;
        default:
          description = `${playerName} recorded a ${stat.stat_type}`;
      }

      return {
        id: stat.id,
        gameId: stat.game_id,
        timestamp: stat.created_at,
        quarter: stat.quarter,
        gameTimeMinutes: stat.game_time_minutes,
        gameTimeSeconds: stat.game_time_seconds,
        playType: 'stat_recorded' as const,
        teamId: stat.team_id,
        teamName: teamName,
        playerId: stat.player_id,
        playerName,
        statType: stat.stat_type,
        statValue: stat.stat_value,
        modifier: stat.modifier,
        description,
        scoreAfter: {
          home: 0,
          away: 0
        },
        createdAt: stat.created_at
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  /**
   * Fetch initial game data
   */
  const fetchGameData = useCallback(async (isPollingUpdate = false) => {
    try {
      // Only show loading screen on initial load, not on polling updates
      if (!isPollingUpdate && isInitialLoad) {
        setLoading(true);
      }
      setError(null);

      console.log('🔍 GameViewer: Fetching game data for:', gameId);

      // Fetch game details
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select(`
          *,
          team_a:teams!team_a_id(id, name),
          team_b:teams!team_b_id(id, name)
        `)
        .eq('id', gameId)
        .single();

      if (gameError) {
        throw new Error(`Failed to fetch game: ${gameError.message}`);
      }

      if (!game) {
        throw new Error('Game not found');
      }

      // Fetch game stats for play-by-play
      console.log('📊 Fetching stats for game:', gameId);
      console.log('🔄 CACHE BUST: Current timestamp:', Date.now());
      
      // First, let's check authentication status
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔍 GameViewer: Auth status:', {
        hasSession: !!session,
        userId: session?.user?.id,
        sessionError: sessionError?.message
      });
      
      // First, let's check if there are ANY stats in the game_stats table
      const { data: allStats, error: allStatsError } = await supabase
        .from('game_stats')
        .select('game_id, stat_type, created_at')
        .limit(10);
        
      console.log('🔍 ALL game_stats in DB (sample):', { 
        count: allStats?.length || 0, 
        error: allStatsError,
        data: allStats 
      });
      
      // Log each stat individually to see structure
      if (allStats && allStats.length > 0) {
        console.log('🔍 DETAILED: First stat in DB:', JSON.stringify(allStats[0], null, 2));
      }
      
      // Now try our specific query
      const { data: stats, error: statsError } = await supabase
        .from('game_stats')
        .select(`
          *,
          users!player_id(id, email)
        `)
        .eq('game_id', gameId)
        .order('created_at', { ascending: false });

      console.log('📊 Stats query result for gameId:', gameId, { 
        count: stats?.length || 0, 
        error: statsError,
        statsData: stats
      });
      
      // Log each stat individually for this game
      if (stats && stats.length > 0) {
        console.log('🔍 DETAILED: First stat for this game:', JSON.stringify(stats[0], null, 2));
        stats.forEach((stat, index) => {
          console.log(`🔍 Stat ${index + 1}:`, {
            id: stat.id,
            stat_type: stat.stat_type,
            modifier: stat.modifier,
            userRelation: stat.users,
            playerEmail: stat.users?.email,
            playerId: stat.player_id,
            game_id: stat.game_id
          });
        });
      } else {
        console.log('❌ NO STATS FOUND for game:', gameId);
      }
      
      // If no stats found, let's check if the game_id exists in different format
      if (!stats || stats.length === 0) {
        const { data: gameCheck } = await supabase
          .from('games')
          .select('id')
          .eq('id', gameId);
          
        console.log('🔍 Game ID verification:', {
          gameExists: !!gameCheck?.length,
          gameId: gameId
        });
      }

      if (statsError) {
        console.warn('⚠️ Failed to fetch stats:', statsError);
      }

      // Calculate scores from game_stats (same as play-by-play)
      const calculateScoresFromStats = (stats: any[], teamAId: string, teamBId: string) => {
        let homeScore = 0;
        let awayScore = 0;
        
        stats.forEach(stat => {
          if (stat.modifier === 'made') {
            let points = 0;
            if (stat.stat_type === 'three_pointer') points = 3;
            else if (stat.stat_type === 'field_goal') points = 2;
            else if (stat.stat_type === 'free_throw') points = 1;
            
            if (stat.team_id === teamAId) {
              homeScore += points;
            } else if (stat.team_id === teamBId) {
              awayScore += points;
            }
          }
        });
        
        return { homeScore, awayScore };
      };
      
      const calculatedScores = calculateScoresFromStats(stats || [], game.team_a_id, game.team_b_id);
      
      console.log('🏀 Score calculation from game_stats:', {
        statsCount: stats?.length || 0,
        teamAId: game.team_a_id,
        teamBId: game.team_b_id,
        calculatedScores,
        databaseScores: { home: game.home_score, away: game.away_score }
      });
      
      const playByPlay = transformStatsToPlayByPlay(stats || [], {
        teamAId: game.team_a_id,
        teamBId: game.team_b_id,
        teamAName: game.team_a?.name || 'Team A',
        teamBName: game.team_b?.name || 'Team B'
      });
      
      console.log('🎯 PlayByPlay transformation:', {
        inputStatsCount: stats?.length || 0,
        outputPlayByPlayCount: playByPlay.length,
        samplePlayByPlay: playByPlay.slice(0, 2)
      });

      const gameViewerData: GameViewerData = {
        game: {
          id: game.id,
          tournamentId: game.tournament_id,
          teamAId: game.team_a_id,
          teamBId: game.team_b_id,
          teamAName: game.team_a?.name || 'Team A',
          teamBName: game.team_b?.name || 'Team B',
          status: game.status,
          startTime: game.start_time,
          endTime: game.end_time,
          quarter: game.quarter,
          gameClockMinutes: game.game_clock_minutes,
          gameClockSeconds: game.game_clock_seconds,
          isClockRunning: game.is_clock_running,
          homeScore: calculatedScores.homeScore, // Use calculated scores from game_stats
          awayScore: calculatedScores.awayScore  // Use calculated scores from game_stats
        },
        playByPlay,
        lastUpdated: new Date().toISOString()
      };

      setGameData(gameViewerData);
      // Set live status - consider scheduled games with scores as live too
      const gameIsLive = game.status === 'in_progress' || game.status === 'overtime' || 
                        (game.status === 'scheduled' && (game.home_score > 0 || game.away_score > 0));
      setIsLive(gameIsLive);
      
      console.log('🎯 Live status determination:', {
        status: game.status,
        hasScores: game.home_score > 0 || game.away_score > 0,
        isLive: gameIsLive
      });

      console.log('✅ GameViewer: Game data loaded successfully');
      console.log('📊 Game info:', {
        scores: `${game.home_score}-${game.away_score}`,
        status: game.status,
        quarter: game.quarter,
        playByPlayCount: playByPlay.length
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load game data';
      console.error('❌ GameViewer: Error fetching game data:', errorMessage);
      setError(errorMessage);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  }, [gameId, isInitialLoad]);

  /**
   * Set up real-time subscriptions
   */
  useEffect(() => {
    if (!gameId) return;

    // Initial fetch
    fetchGameData();

    // Set up real-time subscriptions
    console.log('🔗 GameViewer: Setting up subscriptions for game:', gameId);
          console.log('🔗 Subscription filters:', {
        gameFilter: `id=eq.${gameId}`,
        statsFilter: `game_id=eq.${gameId}`
      });
    
    // Also set up polling as backup for real-time updates
    const pollInterval = setInterval(() => {
      console.log('🔄 GameViewer: Polling for updates...');
      fetchGameData(true); // Pass true to indicate this is a polling update
    }, 5000); // Poll every 5 seconds
    
    const gameSubscription = supabase
      .channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`
        },
        (payload) => {
          console.log('🔄 GameViewer: Game state updated:', payload);
          console.log('🎯 Game update details:', payload.new);
          
          if (payload.new) {
            const updatedGame = payload.new as Game;
            
            // Debug score updates specifically
            console.log('🏀 Score sync from games table:', {
              homeScore: updatedGame.home_score,
              awayScore: updatedGame.away_score,
              quarter: updatedGame.quarter,
              timestamp: new Date().toISOString()
            });
            
            setGameData(prev => prev ? {
              ...prev,
              game: {
                ...prev.game,
                quarter: updatedGame.quarter,
                gameClockMinutes: updatedGame.game_clock_minutes,
                gameClockSeconds: updatedGame.game_clock_seconds,
                isClockRunning: updatedGame.is_clock_running,
                homeScore: updatedGame.home_score,
                awayScore: updatedGame.away_score,
                status: updatedGame.status
              },
              lastUpdated: new Date().toISOString()
            } : null);

            setIsLive(updatedGame.status === 'in_progress' || updatedGame.status === 'overtime');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_stats',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          console.log('🔄 GameViewer: New stat recorded:', payload);
          console.log('📈 Stat details:', payload.new);
          
          if (payload.new) {
            console.log('🔄 Triggering data refetch due to new stat...');
            // Small delay to ensure database is fully updated before refetch
            setTimeout(() => {
              console.log('🔄 GameViewer: Executing delayed refetch...');
              fetchGameData(true); // Pass true to avoid loading screen
            }, 200);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔗 GameViewer: Subscription status:', status);
      });

    return () => {
      console.log('🔗 GameViewer: Cleaning up subscriptions and polling...');
      clearInterval(pollInterval);
      supabase.removeChannel(gameSubscription);
    };
  }, [gameId]); // REMOVED fetchGameData and gameData dependencies

  return {
    gameData,
    loading,
    error,
    isLive,
    refetch: fetchGameData
  };
};