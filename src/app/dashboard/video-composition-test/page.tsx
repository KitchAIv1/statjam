/**
 * Video Composition Test Page
 * 
 * Tests video composition with webcam + Canvas overlay.
 * Shows composed stream preview with real game data.
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { VideoCompositionPreview } from '@/components/live-streaming/VideoCompositionPreview';
import { BroadcastControls } from '@/components/live-streaming/BroadcastControls';
import { useWebcam } from '@/hooks/useWebcam';
import { useWebRTCStream } from '@/hooks/useWebRTCStream';
import { useVideoComposition } from '@/hooks/useVideoComposition';
import { useBroadcast } from '@/hooks/useBroadcast';
import { GameOverlayData } from '@/lib/services/canvas-overlay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Video, Camera, Smartphone, RefreshCw, Mic, MicOff } from 'lucide-react';
import { useMicrophone } from '@/hooks/useMicrophone';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTournaments } from '@/lib/hooks/useTournaments';
import { GameService } from '@/lib/services/gameService';
import { supabase } from '@/lib/supabase';
import { useGameOverlayData } from '@/hooks/useGameOverlayData';

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
}

export default function VideoCompositionTestPage() {
  const { user } = useAuthContext();
  const [videoSource, setVideoSource] = useState<'webcam' | 'iphone' | null>(null);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [games, setGames] = useState<LiveGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [loadingGames, setLoadingGames] = useState(true);
  
  // Get tournaments
  const { tournaments, loading: tournamentsLoading } = useTournaments(user);
  
  // Get real-time overlay data for selected game
  const { overlayData, loading: overlayLoading } = useGameOverlayData(selectedGameId);
  
  // Webcam hook
  const {
    stream: webcamStream,
    error: webcamError,
    isLoading: webcamLoading,
    start: startWebcam,
    stop: stopWebcam,
  } = useWebcam({
    enabled: false,
    constraints: {
      video: {
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        // 60fps for smooth basketball camera panning
        frameRate: { ideal: 60, min: 30 },
      },
      audio: false,
    },
  });
  
  // Microphone hook
  const {
    audioStream: micStream,
    isEnabled: micEnabled,
    isMuted: micMuted,
    error: micError,
    isLoading: micLoading,
    start: startMic,
    stop: stopMic,
    toggleMute: toggleMicMute,
  } = useMicrophone();
  
  // iPhone WebRTC hook
  const {
    remoteStream: iphoneStream,
    connectionStatus,
    error: webrtcError,
    reconnect: reconnectWebRTC,
    disconnect: disconnectWebRTC,
  } = useWebRTCStream({
    gameId: selectedGameId,
    role: 'dashboard',
  });
  
  // Active video stream
  const activeVideoStream = videoSource === 'webcam' ? webcamStream : 
                           videoSource === 'iphone' ? iphoneStream : 
                           null;
  
  // Video composition hook
  const {
    composedStream,
    state,
    error: compositionError,
    start: startComposition,
    stop: stopComposition,
  } = useVideoComposition({
    videoStream: activeVideoStream,
    overlayData: overlayData ?? null,
    enabled: false,
  });

  // Broadcast hook
  const {
    state: broadcastState,
    start: startBroadcast,
    stop: stopBroadcast,
  } = useBroadcast({
    relayServerUrl: process.env.NEXT_PUBLIC_RELAY_SERVER_URL || 'ws://localhost:8080',
  });
  
  // Fetch games from tournaments
  useEffect(() => {
    async function fetchGames() {
      if (!user?.id || tournaments.length === 0) {
        setLoadingGames(false);
        return;
      }

      try {
        setLoadingGames(true);
        
        const tournamentGamesPromises = tournaments.map(tournament => 
          GameService.getGamesByTournament(tournament.id)
            .then(games => games.filter((g: any) => {
              const status = String(g.status || '').toLowerCase();
              return status === 'live' || status === 'in_progress';
            }))
            .catch(() => [])
        );

        const tournamentGamesArrays = await Promise.all(tournamentGamesPromises);
        const allGames = tournamentGamesArrays.flat();

        // Fetch team names
        const teamIds = [...new Set(allGames.flatMap((g: any) => [g.team_a_id, g.team_b_id]).filter(Boolean))];
        
        let teamsMap = new Map<string, any>();
        if (teamIds.length > 0 && supabase) {
          const { data: teamsData } = await supabase
            .from('teams')
            .select('id, name')
            .in('id', teamIds);
          teamsMap = new Map((teamsData || []).map(t => [t.id, t]));
        }

        const formattedGames: LiveGame[] = allGames.map((game: any) => ({
          id: game.id,
          team_a_id: game.team_a_id,
          team_b_id: game.team_b_id,
          team_a_name: teamsMap.get(game.team_a_id)?.name || 'Team A',
          team_b_name: teamsMap.get(game.team_b_id)?.name || 'Team B',
          home_score: game.home_score || 0,
          away_score: game.away_score || 0,
          quarter: game.quarter || 1,
          status: game.status,
          game_clock_minutes: game.game_clock_minutes || 10,
          game_clock_seconds: game.game_clock_seconds || 0,
        }));

        setGames(formattedGames);
      } catch (err) {
        console.error('Error loading games:', err);
      } finally {
        setLoadingGames(false);
      }
    }

    if (!tournamentsLoading && tournaments.length > 0) {
      fetchGames();
    } else if (!tournamentsLoading) {
      setLoadingGames(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, tournaments.length, tournamentsLoading]);
  
  const handleSelectWebcam = async () => {
    if (videoSource === 'iphone') {
      disconnectWebRTC();
    }
    
    if (videoSource === 'webcam' && webcamEnabled) {
      setVideoSource(null);
      setWebcamEnabled(false);
      stopComposition();
      stopWebcam();
    } else {
      setVideoSource('webcam');
      setWebcamEnabled(true);
      await startWebcam();
    }
  };
  
  const handleSelectiPhone = () => {
    if (!selectedGameId) {
      alert('Please select a game first');
      return;
    }
    
    if (videoSource === 'webcam' && webcamEnabled) {
      stopComposition();
      stopWebcam();
      setWebcamEnabled(false);
    }
    
    if (videoSource === 'iphone') {
      setVideoSource(null);
      disconnectWebRTC();
    } else {
      setVideoSource('iphone');
    }
  };
  
  const handleToggleComposition = async () => {
    if (state.isComposing) {
      stopComposition();
    } else {
      if (!overlayData) {
        alert('Please select a game first');
        return;
      }
      await startComposition();
    }
  };
  
  const selectedGame = games.find(g => g.id === selectedGameId);
  
  return (
    <div className="container mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Video Composition Test</h1>
        <p className="text-muted-foreground">
          Test video composition with webcam + Canvas overlay
        </p>
      </div>
      
      {/* Game Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Game</CardTitle>
          <CardDescription>Choose a live game to display overlay data</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingGames || tournamentsLoading ? (
            <p className="text-sm text-muted-foreground">Loading games...</p>
          ) : games.length === 0 ? (
            <p className="text-sm text-muted-foreground">No live games available</p>
          ) : (
            <select
              value={selectedGameId || ''}
              onChange={(e) => setSelectedGameId(e.target.value || null)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">-- Select a game --</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.team_b_name} vs {game.team_a_name} (Q{game.quarter}) - {game.away_score}:{game.home_score}
                </option>
              ))}
            </select>
          )}
          {selectedGame && overlayData && (
            <div className="mt-3 p-3 bg-muted rounded-lg text-sm">
              <p><strong>Game:</strong> {overlayData.teamBName} vs {overlayData.teamAName}</p>
              <p><strong>Score:</strong> {overlayData.awayScore} - {overlayData.homeScore}</p>
              <p><strong>Quarter:</strong> Q{overlayData.quarter} | {overlayData.gameClockMinutes}:{String(overlayData.gameClockSeconds).padStart(2, '0')}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Video Source Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Source
          </CardTitle>
          <CardDescription>Choose webcam or iPhone WebRTC stream</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Webcam Option */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Camera className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Webcam</p>
                  <p className="text-sm text-muted-foreground">Use laptop camera</p>
                </div>
              </div>
              <Button
                onClick={handleSelectWebcam}
                disabled={webcamLoading}
                variant={videoSource === 'webcam' ? 'destructive' : 'outline'}
                size="sm"
              >
                {videoSource === 'webcam' ? 'Stop' : 'Start'}
              </Button>
            </div>
            
            {/* iPhone Option */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5" />
                <div>
                  <p className="font-semibold">iPhone WebRTC</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedGameId ? 'Ready to connect' : 'Select a game first'}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSelectiPhone}
                disabled={!selectedGameId}
                variant={videoSource === 'iphone' ? 'destructive' : 'outline'}
                size="sm"
              >
                {videoSource === 'iphone' ? 'Disconnect' : 'Connect'}
              </Button>
            </div>
            
            {/* Status */}
            {webcamError && <p className="text-sm text-destructive">Webcam: {webcamError}</p>}
            {webrtcError && <p className="text-sm text-destructive">WebRTC: {webrtcError}</p>}
            {videoSource === 'iphone' && (
              <p className="text-sm text-muted-foreground">
                WebRTC Status: {connectionStatus}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Composition Preview */}
      <VideoCompositionPreview
        composedStream={composedStream}
        isComposing={state.isComposing}
        error={compositionError ?? null}
        onStart={handleToggleComposition}
        onStop={handleToggleComposition}
      />

      {/* Microphone Control */}
      {composedStream && state.isComposing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {micMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              Microphone
            </CardTitle>
            <CardDescription>Enable microphone for live commentary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">
                    Status: {micEnabled ? (micMuted ? 'Muted' : 'Active') : 'Off'}
                  </p>
                  {micError && <p className="text-sm text-destructive">{micError}</p>}
                </div>
                <div className="flex gap-2">
                  {!micEnabled ? (
                    <Button
                      onClick={startMic}
                      disabled={micLoading || broadcastState.isBroadcasting}
                      variant="outline"
                      size="sm"
                    >
                      {micLoading ? 'Starting...' : 'Enable Mic'}
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={toggleMicMute}
                        variant={micMuted ? 'outline' : 'default'}
                        size="sm"
                      >
                        {micMuted ? 'Unmute' : 'Mute'}
                      </Button>
                      <Button
                        onClick={() => {
                          if (broadcastState.isBroadcasting) {
                            if (confirm('Disabling mic will permanently cut audio for this broadcast. Continue?')) {
                              stopMic();
                            }
                          } else {
                            stopMic();
                          }
                        }}
                        variant="destructive"
                        size="sm"
                      >
                        Disable
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {/* Broadcast warning */}
              {broadcastState.isBroadcasting && !micEnabled && (
                <p className="text-xs text-muted-foreground">
                  Note: Enable mic before starting broadcast to include audio
                </p>
              )}
              {broadcastState.isBroadcasting && micEnabled && (
                <p className="text-xs text-green-600">
                  🔴 Live - Mute/Unmute controls broadcast audio in real-time
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Broadcast Controls */}
      {composedStream && state.isComposing && (
        <BroadcastControls
          isBroadcasting={broadcastState.isBroadcasting}
          isConnecting={broadcastState.isConnecting}
          connectionStatus={broadcastState.connectionStatus}
          error={broadcastState.error}
          onStart={async (platform, streamKey, quality) => {
            const rtmpUrl = platform === 'youtube' 
              ? 'rtmp://a.rtmp.youtube.com/live2'
              : 'rtmp://live.twitch.tv/app';
            
            // Build broadcast stream - always start with composed video
            const broadcastStream = new MediaStream();
            composedStream.getVideoTracks().forEach(track => {
              broadcastStream.addTrack(track);
              console.log('🎥 Added video track:', track.label, track.readyState);
            });
            
            // Add audio if mic is enabled and has tracks
            // NOTE: Using same track reference (not clone) so mute/unmute affects broadcast
            if (micEnabled && micStream) {
              const audioTracks = micStream.getAudioTracks();
              console.log('🎤 Mic state:', { micEnabled, micMuted, trackCount: audioTracks.length });
              audioTracks.forEach(track => {
                broadcastStream.addTrack(track);
                console.log('🎤 Added audio track:', track.label, track.enabled, track.readyState);
              });
            } else {
              console.log('🎤 No mic stream:', { micEnabled, hasMicStream: !!micStream });
            }
            
            console.log('📡 Broadcast stream tracks:', {
              video: broadcastStream.getVideoTracks().length,
              audio: broadcastStream.getAudioTracks().length,
            });
            console.log('📊 Quality:', quality);
            
            await startBroadcast(broadcastStream, { platform, streamKey, rtmpUrl, quality });
          }}
          onStop={stopBroadcast}
        />
      )}
      
      {/* Status Info */}
      <Card>
        <CardHeader>
          <CardTitle>Composition Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><span className="font-semibold">Game Selected:</span> {selectedGameId ? 'Yes' : 'No'}</div>
            <div><span className="font-semibold">Composing:</span> {state.isComposing ? 'Yes' : 'No'}</div>
            <div><span className="font-semibold">Frames Rendered:</span> {state.frameCount}</div>
            <div><span className="font-semibold">Video Stream:</span> {activeVideoStream ? 'Active' : 'Inactive'}</div>
            <div><span className="font-semibold">Composed Stream:</span> {composedStream ? 'Active' : 'Inactive'}</div>
            <div><span className="font-semibold">Microphone:</span> {micEnabled ? (micMuted ? 'Muted' : 'Active') : 'Off'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
