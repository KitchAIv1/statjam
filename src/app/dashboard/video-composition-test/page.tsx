/**
 * Video Composition Test Page
 * 
 * Live streaming studio with webcam + Canvas overlay composition.
 * UI Layout: Setup on left, Preview + Controls on right.
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { VideoCompositionPreview } from '@/components/live-streaming/VideoCompositionPreview';
import { BroadcastControls } from '@/components/live-streaming/BroadcastControls';
import { OverlayControlPanel } from '@/components/live-streaming/OverlayControlPanel';
import { useWebcam } from '@/hooks/useWebcam';
import { useWebRTCStream } from '@/hooks/useWebRTCStream';
import { useVideoComposition } from '@/hooks/useVideoComposition';
import { useBroadcast } from '@/hooks/useBroadcast';
import { BroadcastPlatform, QualityPreset } from '@/lib/services/broadcast/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Video, Camera, Smartphone, Mic, MicOff } from 'lucide-react';
import { useMicrophone } from '@/hooks/useMicrophone';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTournaments } from '@/lib/hooks/useTournaments';
import { GameService } from '@/lib/services/gameService';
import { supabase } from '@/lib/supabase';
import { useGameOverlayData } from '@/hooks/useGameOverlayData';
import { useGamePlayers } from '@/hooks/useGamePlayers';
import { usePlayerStatsOverlay } from '@/hooks/usePlayerStatsOverlay';

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
  const [autoTriggerEnabled, setAutoTriggerEnabled] = useState(true);
  
  const { tournaments, loading: tournamentsLoading } = useTournaments(user);
  // Stable reference for tournament IDs to prevent infinite loops
  const tournamentIds = useMemo(() => tournaments.map(t => t.id).join(','), [tournaments]);
  const { overlayData } = useGameOverlayData(selectedGameId);
  const { teamAPlayers, teamBPlayers, teamAName, teamBName, loading: playersLoading } = useGamePlayers(selectedGameId);
  const { activePlayerStats, triggerOverlay, hideOverlay } = usePlayerStatsOverlay(selectedGameId, autoTriggerEnabled);
  
  const { stream: webcamStream, error: webcamError, isLoading: webcamLoading, start: startWebcam, stop: stopWebcam } = useWebcam({
    enabled: false,
    constraints: { video: { width: { ideal: 1920, min: 1280 }, height: { ideal: 1080, min: 720 }, frameRate: { ideal: 60, min: 30 } }, audio: false },
  });
  
  const { audioStream: micStream, isEnabled: micEnabled, isMuted: micMuted, error: micError, isLoading: micLoading, start: startMic, stop: stopMic, toggleMute: toggleMicMute } = useMicrophone();
  const { remoteStream: iphoneStream, connectionStatus, error: webrtcError, disconnect: disconnectWebRTC } = useWebRTCStream({ gameId: selectedGameId, role: 'dashboard' });
  
  const activeVideoStream = videoSource === 'webcam' ? webcamStream : videoSource === 'iphone' ? iphoneStream : null;
  
  // Always include activePlayerStats - autoTriggerEnabled only controls auto-detection, not manual triggers
  const fullOverlayData = useMemo(() => {
    if (!overlayData) return null;
    return { ...overlayData, activePlayerStats: activePlayerStats ?? undefined };
  }, [overlayData, activePlayerStats]);
  
  const { composedStream, state, error: compositionError, start: startComposition, stop: stopComposition } = useVideoComposition({
    videoStream: activeVideoStream,
    overlayData: fullOverlayData,
    enabled: false,
  });

  const { state: broadcastState, start: startBroadcast, stop: stopBroadcast } = useBroadcast({
    relayServerUrl: process.env.NEXT_PUBLIC_RELAY_SERVER_URL || 'ws://localhost:8080',
  });
  
  // Fetch games - use tournamentIds for stable dependency
  useEffect(() => {
    async function fetchGames() {
      if (!user?.id || !tournamentIds) { setLoadingGames(false); return; }
      try {
        setLoadingGames(true);
        const ids = tournamentIds.split(',').filter(Boolean);
        const tournamentGamesPromises = ids.map(id => GameService.getGamesByTournament(id).then(g => g.filter((x: any) => ['live', 'in_progress'].includes(String(x.status || '').toLowerCase()))).catch(() => []));
        const allGames = (await Promise.all(tournamentGamesPromises)).flat();
        const teamIds = [...new Set(allGames.flatMap((g: any) => [g.team_a_id, g.team_b_id]).filter(Boolean))];
        let teamsMap = new Map<string, any>();
        if (teamIds.length > 0 && supabase) {
          const { data } = await supabase.from('teams').select('id, name').in('id', teamIds);
          teamsMap = new Map((data || []).map(t => [t.id, t]));
        }
        setGames(allGames.map((g: any) => ({ id: g.id, team_a_id: g.team_a_id, team_b_id: g.team_b_id, team_a_name: teamsMap.get(g.team_a_id)?.name || 'Team A', team_b_name: teamsMap.get(g.team_b_id)?.name || 'Team B', home_score: g.home_score || 0, away_score: g.away_score || 0, quarter: g.quarter || 1, status: g.status, game_clock_minutes: g.game_clock_minutes || 10, game_clock_seconds: g.game_clock_seconds || 0 })));
      } catch (err) { console.error('Error loading games:', err); } finally { setLoadingGames(false); }
    }
    if (!tournamentsLoading && tournamentIds) fetchGames();
    else if (!tournamentsLoading) setLoadingGames(false);
  }, [user?.id, tournamentIds, tournamentsLoading]);
  
  const handleSelectWebcam = async () => {
    if (videoSource === 'iphone') disconnectWebRTC();
    if (videoSource === 'webcam' && webcamEnabled) { setVideoSource(null); setWebcamEnabled(false); stopComposition(); stopWebcam(); }
    else { setVideoSource('webcam'); setWebcamEnabled(true); await startWebcam(); }
  };
  
  const handleSelectiPhone = () => {
    if (!selectedGameId) { alert('Please select a game first'); return; }
    if (videoSource === 'webcam' && webcamEnabled) { stopComposition(); stopWebcam(); setWebcamEnabled(false); }
    if (videoSource === 'iphone') { setVideoSource(null); disconnectWebRTC(); } else { setVideoSource('iphone'); }
  };
  
  const handleToggleComposition = async () => {
    if (state.isComposing) stopComposition();
    else { if (!overlayData) { alert('Please select a game first'); return; } await startComposition(); }
  };
  
  const handleStartBroadcast = useCallback(async (platform: BroadcastPlatform, streamKey: string, quality?: QualityPreset) => {
    if (!composedStream) return;
    const rtmpUrl = platform === 'youtube' ? 'rtmp://a.rtmp.youtube.com/live2' : 'rtmp://live.twitch.tv/app';
    const broadcastStream = new MediaStream();
    composedStream.getVideoTracks().forEach(track => broadcastStream.addTrack(track));
    if (micEnabled && micStream) micStream.getAudioTracks().forEach(track => broadcastStream.addTrack(track));
    await startBroadcast(broadcastStream, { platform, streamKey, rtmpUrl, quality });
  }, [composedStream, micEnabled, micStream, startBroadcast]);

  const selectedGame = games.find(g => g.id === selectedGameId);
  const isComposing = state.isComposing && composedStream;
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Live Stream Studio</h1>
        <p className="text-sm text-muted-foreground">Compose and broadcast with overlays</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Setup */}
        <div className="space-y-4">
          {/* Game Selection */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Select Game</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingGames || tournamentsLoading ? (
                <p className="text-xs text-muted-foreground">Loading...</p>
              ) : games.length === 0 ? (
                <p className="text-xs text-muted-foreground">No live games</p>
              ) : (
                <select value={selectedGameId || ''} onChange={(e) => setSelectedGameId(e.target.value || null)} className="w-full bg-background border rounded-md px-2 py-1.5 text-sm">
                  <option value="">-- Select --</option>
                  {games.map(g => <option key={g.id} value={g.id}>{g.team_b_name} vs {g.team_a_name}</option>)}
                </select>
              )}
              {selectedGame && overlayData && (
                <div className="mt-2 p-2 bg-muted rounded text-xs">
                  <p><strong>{overlayData.teamBName}</strong> {overlayData.awayScore} - {overlayData.homeScore} <strong>{overlayData.teamAName}</strong></p>
                  <p className="text-muted-foreground">Q{overlayData.quarter} | {overlayData.gameClockMinutes}:{String(overlayData.gameClockSeconds).padStart(2, '0')}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Video Source */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Video className="h-4 w-4" />Video Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2"><Camera className="h-4 w-4" /><span className="text-sm">Webcam</span></div>
                <Button onClick={handleSelectWebcam} disabled={webcamLoading} variant={videoSource === 'webcam' ? 'destructive' : 'outline'} size="sm" className="h-7 text-xs">
                  {videoSource === 'webcam' ? 'Stop' : 'Start'}
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2"><Smartphone className="h-4 w-4" /><span className="text-sm">iPhone</span></div>
                <Button onClick={handleSelectiPhone} disabled={!selectedGameId} variant={videoSource === 'iphone' ? 'destructive' : 'outline'} size="sm" className="h-7 text-xs">
                  {videoSource === 'iphone' ? 'Stop' : 'Connect'}
                </Button>
              </div>
              {webcamError && <p className="text-xs text-destructive">{webcamError}</p>}
              {webrtcError && <p className="text-xs text-destructive">{webrtcError}</p>}
              {videoSource === 'iphone' && <p className="text-xs text-muted-foreground">Status: {connectionStatus}</p>}
            </CardContent>
          </Card>
          
          {/* Broadcast Settings */}
          {isComposing && (
            <BroadcastControls
              isBroadcasting={broadcastState.isBroadcasting}
              isConnecting={broadcastState.isConnecting}
              connectionStatus={broadcastState.connectionStatus}
              error={broadcastState.error}
              onStart={handleStartBroadcast}
              onStop={stopBroadcast}
            />
          )}
        </div>
        
        {/* Center Column: Preview */}
        <div className="lg:col-span-2 space-y-4">
          <VideoCompositionPreview
            composedStream={composedStream}
            isComposing={state.isComposing}
            error={compositionError ?? null}
            onStart={handleToggleComposition}
            onStop={handleToggleComposition}
          />
          
          {/* Status Bar with Mic Controls */}
          {isComposing && (
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>Game: {selectedGameId ? '✓' : '○'}</span>
                <span>Video: {activeVideoStream ? '✓' : '○'}</span>
                <span>Frames: {state.frameCount}</span>
              </div>
              {/* Compact Mic Controls */}
              <div className="flex items-center gap-2">
                {micMuted ? <MicOff className="h-4 w-4 text-muted-foreground" /> : <Mic className="h-4 w-4 text-green-600" />}
                <span className="text-xs">{micEnabled ? (micMuted ? 'Muted' : 'Live') : 'Off'}</span>
                {!micEnabled ? (
                  <Button onClick={startMic} disabled={micLoading || broadcastState.isBroadcasting} variant="outline" size="sm" className="h-6 text-xs px-2">
                    {micLoading ? '...' : 'Enable'}
                  </Button>
                ) : (
                  <>
                    <Button onClick={toggleMicMute} variant={micMuted ? 'ghost' : 'default'} size="sm" className="h-6 text-xs px-2">
                      {micMuted ? 'Unmute' : 'Mute'}
                    </Button>
                    <Button onClick={() => { if (broadcastState.isBroadcasting) { if (confirm('Cut audio permanently?')) stopMic(); } else stopMic(); }} variant="ghost" size="sm" className="h-6 text-xs px-2 text-destructive">
                      Off
                    </Button>
                  </>
                )}
                {micError && <span className="text-xs text-destructive">{micError}</span>}
              </div>
            </div>
          )}
          
          {/* Overlay Controls - Full Width */}
          {isComposing && selectedGameId && (
            <OverlayControlPanel
              teamAPlayers={teamAPlayers}
              teamBPlayers={teamBPlayers}
              teamAName={teamAName}
              teamBName={teamBName}
              teamAPrimaryColor={overlayData?.teamAPrimaryColor}
              teamBPrimaryColor={overlayData?.teamBPrimaryColor}
              activePlayerStats={activePlayerStats}
              autoTriggerEnabled={autoTriggerEnabled}
              playersLoading={playersLoading}
              onTriggerPlayer={(player) => triggerOverlay(player.id, player.teamId, player.isCustomPlayer)}
              onHideOverlay={hideOverlay}
              onToggleAutoTrigger={setAutoTriggerEnabled}
            />
          )}
        </div>
      </div>
    </div>
  );
}
