'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Video, Smartphone, Wifi, WifiOff, AlertCircle, CheckCircle, RefreshCw, ExternalLink } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useWebRTCStream, ConnectionStatus } from '@/hooks/useWebRTCStream';
import { isFirebaseConfigured } from '@/lib/firebase';
import { EnhancedScoreOverlay } from '@/components/live-streaming/EnhancedScoreOverlay';
import { useTournaments } from '@/lib/hooks/useTournaments';
import { GameService } from '@/lib/services/gameService';

interface LiveGame {
  // Existing required fields
  id: string;
  team_a_id: string;
  team_b_id: string;
  team_a_name: string;
  team_b_name: string;
  home_score: number;
  away_score: number;
  quarter: number;
  status: string;
  game_clock_minutes: number;
  game_clock_seconds: number;
  shot_clock_seconds?: number;
  
  // Enhanced fields (all optional)
  team_a_logo?: string;
  team_b_logo?: string;
  team_a_primary_color?: string;
  team_b_primary_color?: string;
  team_a_secondary_color?: string;
  team_b_secondary_color?: string;
  team_a_accent_color?: string;
  team_b_accent_color?: string;
  team_a_fouls?: number;
  team_b_fouls?: number;
  team_a_timeouts?: number;
  team_b_timeouts?: number;
  current_possession_team_id?: string;
  jump_ball_arrow_team_id?: string;
  venue?: string;
}

interface ScoreOverlayProps {
  teamAName: string;
  teamBName: string;
  homeScore: number;
  awayScore: number;
  quarter: number;
  gameClockMinutes: number;
  gameClockSeconds: number;
  shotClockSeconds?: number;
}

function ScoreOverlay({ 
  teamAName, 
  teamBName, 
  homeScore, 
  awayScore, 
  quarter, 
  gameClockMinutes, 
  gameClockSeconds,
  shotClockSeconds 
}: ScoreOverlayProps) {
  // Format game clock like NBA: "MM:SS"
  const gameClockDisplay = `${gameClockMinutes}:${gameClockSeconds.toString().padStart(2, '0')}`;
  
  // Determine quarter display
  const quarterDisplay = quarter > 4 ? `OT${quarter - 4}` : `Q${quarter}`;
  
  return (
    <div className="absolute top-0 left-0 right-0 pointer-events-none">
      {/* NBA-Style Main Score Bar */}
      <div className="bg-gradient-to-b from-black/95 via-black/90 to-transparent backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-8">
            
            {/* Away Team (Left) */}
            <div className="flex items-center gap-4 flex-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-0.5">Away</div>
                <div className="text-xl font-black text-white truncate max-w-[200px]">{teamAName}</div>
              </div>
              <div className="text-6xl font-black text-white tabular-nums tracking-tight">
                {awayScore}
              </div>
            </div>

            {/* Center - Game Clock & Quarter */}
            <div className="flex flex-col items-center gap-2 min-w-[160px]">
              {/* Game Clock */}
              <div className="bg-red-600 rounded-lg px-6 py-2 shadow-lg">
                <div className="text-3xl font-black text-white tabular-nums tracking-wider">
                  {gameClockDisplay}
                </div>
              </div>
              
              {/* Quarter */}
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-1 border border-white/30">
                <div className="text-sm font-bold text-white tracking-wider">
                  {quarterDisplay}
                </div>
              </div>
              
              {/* Shot Clock (if available) */}
              {shotClockSeconds !== undefined && shotClockSeconds !== null && (
                <div className={`rounded-lg px-3 py-1 ${
                  shotClockSeconds <= 5 
                    ? 'bg-red-500 animate-pulse' 
                    : 'bg-orange-500/80'
                }`}>
                  <div className="text-lg font-bold text-white tabular-nums">
                    {shotClockSeconds}
                  </div>
                </div>
              )}
            </div>

            {/* Home Team (Right) */}
            <div className="flex items-center gap-4 flex-1 justify-end">
              <div className="text-6xl font-black text-white tabular-nums tracking-tight">
                {homeScore}
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-0.5">Home</div>
                <div className="text-xl font-black text-white truncate max-w-[200px]">{teamBName}</div>
              </div>
            </div>

          </div>
        </div>
        
        {/* Bottom gradient fade */}
        <div className="h-8 bg-gradient-to-b from-transparent to-transparent"></div>
      </div>
    </div>
  );
}

/**
 * Fetch team data for games
 */
async function fetchTeamsData(teamIds: string[]) {
  if (teamIds.length === 0) return new Map();
  
  const { data: teamsData } = await supabase
    .from('teams')
    .select('id, name, logo_url, primary_color, secondary_color, accent_color')
    .in('id', teamIds);
  
  return new Map((teamsData || []).map(t => [t.id, t]));
}

/**
 * Map game data to LiveGame format
 */
function mapGameToLiveGame(game: any, teamsMap: Map<string, any>): LiveGame {
  const teamA = teamsMap.get(game.team_a_id);
  const teamB = teamsMap.get(game.team_b_id);
  
  return {
    id: game.id,
    team_a_id: game.team_a_id,
    team_b_id: game.team_b_id,
    team_a_name: teamA?.name || 'Team A',
    team_b_name: teamB?.name || 'Team B',
    home_score: game.home_score || 0,
    away_score: game.away_score || 0,
    quarter: game.quarter || 1,
    status: game.status,
    game_clock_minutes: game.game_clock_minutes || 10,
    game_clock_seconds: game.game_clock_seconds || 0,
    shot_clock_seconds: undefined,
    team_a_logo: teamA?.logo_url,
    team_b_logo: teamB?.logo_url,
    team_a_primary_color: teamA?.primary_color,
    team_b_primary_color: teamB?.primary_color,
    team_a_secondary_color: teamA?.secondary_color,
    team_b_secondary_color: teamB?.secondary_color,
    team_a_accent_color: teamA?.accent_color,
    team_b_accent_color: teamB?.accent_color,
    team_a_fouls: game.team_a_fouls,
    team_b_fouls: game.team_b_fouls,
    team_a_timeouts: game.team_a_timeouts_remaining,
    team_b_timeouts: game.team_b_timeouts_remaining,
    current_possession_team_id: game.current_possession_team_id,
    jump_ball_arrow_team_id: game.jump_ball_arrow_team_id,
    venue: game.venue,
  };
}

/**
 * Filter games by live status
 */
function filterLiveGames(games: any[]): any[] {
  return games.filter(game => {
    const status = String(game.status || '').toLowerCase();
    return status === 'live' || status === 'in_progress';
  });
}

/**
 * Sort games by created_at (latest first)
 */
function sortGamesByCreatedAt(games: LiveGame[], allGames: any[]): LiveGame[] {
  return games.sort((a, b) => {
    const gameA = allGames.find(g => g.id === a.id);
    const gameB = allGames.find(g => g.id === b.id);
    const dateA = gameA?.created_at ? new Date(gameA.created_at).getTime() : 0;
    const dateB = gameB?.created_at ? new Date(gameB.created_at).getTime() : 0;
    return dateB - dateA;
  });
}

function StatusIndicator({ status }: { status: ConnectionStatus }) {
  let icon = <WifiOff className="w-5 h-5" />;
  let text = 'Not Connected';
  let colorClass = 'text-muted-foreground';

  if (status === 'connecting') {
    icon = <Wifi className="w-5 h-5 animate-pulse" />;
    text = 'Connecting...';
    colorClass = 'text-yellow-500';
  } else if (status === 'connected') {
    icon = <CheckCircle className="w-5 h-5" />;
    text = 'Connected';
    colorClass = 'text-green-500';
  } else if (status === 'error') {
    icon = <AlertCircle className="w-5 h-5" />;
    text = 'Error';
    colorClass = 'text-destructive';
  }

  return (
    <div className={`flex items-center gap-2 ${colorClass}`}>
      {icon}
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}

interface GameStat {
  id: string;
  game_id: string;
  player_id?: string;
  team_id: string;
  stat_type: string;
  stat_value: number;
  modifier?: string | null;
  is_opponent_stat?: boolean;
}

/**
 * Calculate scores from game_stats (same logic as useGameViewerV2)
 */
function calculateScoresFromStats(
  stats: GameStat[],
  teamAId: string,
  teamBId: string
): { homeScore: number; awayScore: number } {
  let homeScore = 0;
  let awayScore = 0;
  
  stats.forEach(stat => {
    if (stat.modifier === 'made') {
      const points = stat.stat_value || 0;
      
      // Check is_opponent_stat flag (matches Tracker logic for coach mode)
      if (stat.is_opponent_stat) {
        // Opponent stats go to away score (matches Tracker's teamBScore logic)
        awayScore += points;
      } else if (stat.team_id === teamAId) {
        homeScore += points;
      } else if (stat.team_id === teamBId) {
        awayScore += points;
      }
    }
  });
  
  return { homeScore, awayScore };
}

interface OrganizerLiveStreamProps {
  user: { id: string } | null;
}

export function OrganizerLiveStream({ user }: OrganizerLiveStreamProps) {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<LiveGame | null>(null);
  const [gameStats, setGameStats] = useState<GameStat[]>([]);
  const [loading, setLoading] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get organizer's tournaments (same pattern as OrganizerGameScheduler)
  const { tournaments, loading: tournamentsLoading } = useTournaments(user);

  // Initialize WebRTC connection to receive stream
  const { connectionStatus, remoteStream, error, reconnect } = useWebRTCStream({
    gameId: selectedGameId,
    role: 'dashboard',
    localStream: null, // Dashboard doesn't send video
  });

  // Fetch live games from organizer's tournaments (same pattern as OrganizerGameScheduler)
  useEffect(() => {
    async function fetchLiveGames() {
      if (!user?.id || tournaments.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // ✅ SAME PATTERN AS OrganizerGameScheduler: Get games per tournament
        const tournamentGamesPromises = tournaments.map(tournament => 
          GameService.getGamesByTournament(tournament.id)
            .then(filterLiveGames)
            .catch(error => {
              console.error(`Failed to load games for tournament ${tournament.name}:`, error);
              return [];
            })
        );

        const tournamentGamesArrays = await Promise.all(tournamentGamesPromises);
        const allGames = tournamentGamesArrays.flat();

        // Fetch team data
        const teamIds = [...new Set(allGames.flatMap(g => [g.team_a_id, g.team_b_id]).filter(Boolean))];
        const teamsMap = await fetchTeamsData(teamIds);

        // Map to LiveGame format and sort
        const formattedGames = sortGamesByCreatedAt(
          allGames.map(game => mapGameToLiveGame(game, teamsMap)),
          allGames
        );

        setGames(formattedGames);
      } catch (err) {
        console.error('Error loading games:', err);
      } finally {
        setLoading(false);
      }
    }

    if (tournaments.length > 0) {
      fetchLiveGames();
      const interval = setInterval(fetchLiveGames, 30000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [user?.id, tournaments.length]);

  // Fetch game_stats and calculate scores when game is selected
  useEffect(() => {
    if (!selectedGameId) {
      setGameStats([]);
      return;
    }

    async function fetchGameStats() {
      try {
        const { data, error } = await supabase
          .from('game_stats')
          .select('id, game_id, player_id, team_id, stat_type, stat_value, modifier, is_opponent_stat')
          .eq('game_id', selectedGameId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching game stats:', error);
          return;
        }

        setGameStats(data || []);
      } catch (err) {
        console.error('Error loading game stats:', err);
      }
    }

    fetchGameStats();
  }, [selectedGameId]);

  // Calculate scores from stats and update selectedGame
  useEffect(() => {
    if (!selectedGame || !selectedGame.team_a_id || !selectedGame.team_b_id) return;

    const calculatedScores = calculateScoresFromStats(
      gameStats,
      selectedGame.team_a_id,
      selectedGame.team_b_id
    );

    // Update scores only if they changed (prevent infinite loop)
    setSelectedGame(prev => {
      if (!prev) return null;
      if (prev.home_score === calculatedScores.homeScore && 
          prev.away_score === calculatedScores.awayScore) {
        return prev; // No change, return same reference
      }
      return {
        ...prev,
        home_score: calculatedScores.homeScore,
        away_score: calculatedScores.awayScore,
      };
    });
  }, [gameStats, selectedGame?.id, selectedGame?.team_a_id, selectedGame?.team_b_id]);

  // Subscribe to real-time updates for selected game
  useEffect(() => {
    if (!selectedGameId) return;

    console.log('🔔 Subscribing to updates for game:', selectedGameId);

    // Set initial game data (only if selectedGame doesn't match selectedGameId - prevents overwriting calculated scores)
    if (!selectedGame || selectedGame.id !== selectedGameId) {
      const game = games.find(g => g.id === selectedGameId);
      if (game) {
        setSelectedGame(game);
      }
    }

    // Subscribe to game_stats changes (source of truth for scores)
    const statsChannel = supabase
      .channel(`game_stats:${selectedGameId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'game_stats',
          filter: `game_id=eq.${selectedGameId}`,
        },
        async (payload) => {
          console.log('📊 Game stat change received:', payload.eventType);
          
          // Refetch all stats to recalculate scores
          const { data, error } = await supabase
            .from('game_stats')
            .select('id, game_id, player_id, team_id, stat_type, stat_value, modifier, is_opponent_stat')
            .eq('game_id', selectedGameId)
            .order('created_at', { ascending: true });

          if (!error && data) {
            setGameStats(data);
          }
        }
      )
      .subscribe();

    // Subscribe to games table updates (for clock, quarter, fouls, etc.)
    const gamesChannel = supabase
      .channel(`game:${selectedGameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${selectedGameId}`,
        },
        (payload) => {
          console.log('📊 Game update received:', payload.new);
          
          // Update selected game with clock, quarter, fouls, etc. (NOT scores)
          setSelectedGame(prev => {
            if (!prev) return null;
            return {
              ...prev,
              // Clock and quarter
              quarter: payload.new.quarter || prev.quarter,
              game_clock_minutes: payload.new.game_clock_minutes ?? prev.game_clock_minutes,
              game_clock_seconds: payload.new.game_clock_seconds ?? prev.game_clock_seconds,
              // Enhanced fields
              team_a_fouls: payload.new.team_a_fouls,
              team_b_fouls: payload.new.team_b_fouls,
              team_a_timeouts: payload.new.team_a_timeouts_remaining,
              team_b_timeouts: payload.new.team_b_timeouts_remaining,
              current_possession_team_id: payload.new.current_possession_team_id,
              jump_ball_arrow_team_id: payload.new.jump_ball_arrow_team_id,
              venue: payload.new.venue,
              // ✅ Preserve calculated scores (NOT from games table)
              home_score: prev.home_score,
              away_score: prev.away_score,
            };
          });
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Unsubscribing from updates');
      supabase.removeChannel(statsChannel);
      supabase.removeChannel(gamesChannel);
    };
  }, [selectedGameId]); // ✅ Removed 'games' dependency - prevents re-running when games array refreshes

  // Update video element when remote stream is available
  useEffect(() => {
    if (videoRef.current && remoteStream) {
      console.log('📹 Setting remote stream to video element');
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Handle game selection
  const handleGameSelect = (gameId: string) => {
    setSelectedGameId(gameId);
    const game = games.find(g => g.id === gameId);
    if (game) {
      setSelectedGame(game);
    }
  };

  // Check Firebase configuration
  if (!isFirebaseConfigured()) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Live Stream</h2>
          <p className="text-muted-foreground">Stream games live with score overlays</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <CardTitle>Firebase Not Configured</CardTitle>
            </div>
            <CardDescription>Live streaming requires Firebase Realtime Database for signaling</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-3">
                To enable live streaming, you need to set up Firebase:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-4">
                <li>Create a Firebase project at console.firebase.google.com</li>
                <li>Enable Realtime Database</li>
                <li>Add Firebase config to your .env.local file</li>
              </ol>
              <Button variant="outline" className="gap-2" asChild>
                <a href="/docs/04-features/live-streaming/FIREBASE_SETUP.md" target="_blank">
                  <ExternalLink className="w-4 h-4" />
                  View Setup Guide
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Live Stream</h2>
          <p className="text-muted-foreground">Stream games live with score overlays</p>
        </div>
        <Button variant="outline" className="gap-2" asChild>
          <a href="/dashboard/mobile-camera" target="_blank">
            <Smartphone className="w-4 h-4" />
            Open Mobile Camera
          </a>
        </Button>
      </div>

      {/* Game Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Game to Stream</CardTitle>
          <CardDescription>Choose a live game to view the camera stream</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading games...</div>
          ) : games.length === 0 ? (
            <div className="text-center py-8">
              <Video className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No live games available</p>
            </div>
          ) : (
            <select
              value={selectedGameId || ''}
              onChange={(e) => handleGameSelect(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2"
            >
              <option value="">-- Select a game --</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.team_b_name} vs {game.team_a_name} (Q{game.quarter}) - {game.home_score}:{game.away_score}
                </option>
              ))}
            </select>
          )}
        </CardContent>
      </Card>

      {/* Video Stream */}
      {selectedGameId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Live Video Stream</CardTitle>
              </div>
              <StatusIndicator status={connectionStatus} />
            </div>
          </CardHeader>
          <CardContent>
            {/* Video Container */}
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              {remoteStream ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                  {selectedGame && (
                    <EnhancedScoreOverlay
                      // Existing props
                      teamAName={selectedGame.team_a_name}
                      teamBName={selectedGame.team_b_name}
                      homeScore={selectedGame.home_score}
                      awayScore={selectedGame.away_score}
                      quarter={selectedGame.quarter}
                      gameClockMinutes={selectedGame.game_clock_minutes}
                      gameClockSeconds={selectedGame.game_clock_seconds}
                      shotClockSeconds={selectedGame.shot_clock_seconds}
                      
                      // Enhanced props (with fallbacks)
                      teamALogo={selectedGame.team_a_logo}
                      teamBLogo={selectedGame.team_b_logo}
                      teamAPrimaryColor={selectedGame.team_a_primary_color}
                      teamBPrimaryColor={selectedGame.team_b_primary_color}
                      teamASecondaryColor={selectedGame.team_a_secondary_color}
                      teamBSecondaryColor={selectedGame.team_b_secondary_color}
                      teamAFouls={selectedGame.team_a_fouls ?? 0}
                      teamBFouls={selectedGame.team_b_fouls ?? 0}
                      teamATimeouts={selectedGame.team_a_timeouts ?? 5}
                      teamBTimeouts={selectedGame.team_b_timeouts ?? 5}
                      currentPossessionTeamId={selectedGame.current_possession_team_id}
                      jumpBallArrowTeamId={selectedGame.jump_ball_arrow_team_id}
                      teamAId={selectedGame.team_a_id}
                      teamBId={selectedGame.team_b_id}
                      venue={selectedGame.venue}
                    />
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    {connectionStatus === 'connecting' ? (
                      <>
                        <Wifi className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
                        <p className="text-white font-medium">Connecting to camera...</p>
                        <p className="text-gray-400 text-sm mt-2">
                          Make sure the mobile camera is opened and the same game is selected
                        </p>
                      </>
                    ) : connectionStatus === 'error' ? (
                      <>
                        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                        <p className="text-white font-medium mb-2">Connection Error</p>
                        {error && <p className="text-gray-400 text-sm mb-4">{error}</p>}
                        <Button onClick={reconnect} variant="secondary" className="gap-2">
                          <RefreshCw className="w-4 h-4" />
                          Retry Connection
                        </Button>
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-white font-medium">Waiting for camera...</p>
                        <p className="text-gray-400 text-sm mt-2">
                          Open the mobile camera page and select this game
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            {connectionStatus === 'connected' && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Live</span>
                </div>
                <Button onClick={reconnect} variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Reconnect
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!selectedGameId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How to Start Streaming</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>Open the <strong>Mobile Camera</strong> page on your iPhone or iPad</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>Select the same game on both devices (mobile and dashboard)</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <span>Grant camera permissions on the mobile device</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <span>The video will automatically connect and display with live scores</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
