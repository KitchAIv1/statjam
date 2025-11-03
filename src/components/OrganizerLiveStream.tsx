'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Video, Smartphone, Wifi, WifiOff, AlertCircle, CheckCircle, RefreshCw, ExternalLink } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useWebRTCStream, ConnectionStatus } from '@/hooks/useWebRTCStream';
import { isFirebaseConfigured } from '@/lib/firebase';

interface LiveGame {
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

export function OrganizerLiveStream() {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<LiveGame | null>(null);
  const [loading, setLoading] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize WebRTC connection to receive stream
  const { connectionStatus, remoteStream, error, reconnect } = useWebRTCStream({
    gameId: selectedGameId,
    role: 'dashboard',
    localStream: null, // Dashboard doesn't send video
  });

  // Fetch live games
  useEffect(() => {
    async function fetchLiveGames() {
      try {
        const { data, error } = await supabase
          .from('games')
          .select(`
            id,
            quarter,
            home_score,
            away_score,
            status,
            team_a_id,
            team_b_id,
            game_clock_minutes,
            game_clock_seconds,
            team_a:teams!team_a_id(name),
            team_b:teams!team_b_id(name)
          `)
          .in('status', ['live', 'in_progress', 'LIVE', 'IN_PROGRESS'])
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Error fetching games:', error);
          return;
        }

        const formattedGames: LiveGame[] = (data || []).map((game: any) => ({
          id: game.id,
          team_a_id: game.team_a_id,
          team_b_id: game.team_b_id,
          team_a_name: game.team_a?.name || 'Team A',
          team_b_name: game.team_b?.name || 'Team B',
          home_score: game.home_score || 0,
          away_score: game.away_score || 0,
          quarter: game.quarter || 1,
          status: game.status,
          game_clock_minutes: game.game_clock_minutes || 10,
          game_clock_seconds: game.game_clock_seconds || 0,
          shot_clock_seconds: undefined, // Shot clock not implemented yet
        }));

        setGames(formattedGames);
      } catch (err) {
        console.error('Error loading games:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLiveGames();
    
    // Refresh game list every 30 seconds
    const interval = setInterval(fetchLiveGames, 30000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to real-time score updates for selected game
  useEffect(() => {
    if (!selectedGameId) return;

    console.log('🔔 Subscribing to score updates for game:', selectedGameId);

    // Set initial game data
    const game = games.find(g => g.id === selectedGameId);
    if (game) {
      setSelectedGame(game);
    }

    // Subscribe to game updates
    const channel = supabase
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
          console.log('📊 Score update received:', payload.new);
          
          // Update selected game with new scores and clock
          setSelectedGame(prev => {
            if (!prev) return null;
            return {
              ...prev,
              home_score: payload.new.home_score || 0,
              away_score: payload.new.away_score || 0,
              quarter: payload.new.quarter || prev.quarter,
              game_clock_minutes: payload.new.game_clock_minutes ?? prev.game_clock_minutes,
              game_clock_seconds: payload.new.game_clock_seconds ?? prev.game_clock_seconds,
            };
          });
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Unsubscribing from score updates');
      supabase.removeChannel(channel);
    };
  }, [selectedGameId, games]);

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
                    <ScoreOverlay
                      teamAName={selectedGame.team_a_name}
                      teamBName={selectedGame.team_b_name}
                      homeScore={selectedGame.home_score}
                      awayScore={selectedGame.away_score}
                      quarter={selectedGame.quarter}
                      gameClockMinutes={selectedGame.game_clock_minutes}
                      gameClockSeconds={selectedGame.game_clock_seconds}
                      shotClockSeconds={selectedGame.shot_clock_seconds}
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
