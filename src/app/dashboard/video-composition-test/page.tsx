/**
 * Video Composition Test Page
 * 
 * Live streaming studio with webcam + Canvas overlay composition.
 * Compact single-screen design - all controls visible without scrolling.
 */

'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { BroadcastControls } from '@/components/live-streaming/BroadcastControls';
import { OverlayControlPanel } from '@/components/live-streaming/OverlayControlPanel';
import { BroadcastReadinessIndicator } from '@/components/live-streaming/BroadcastReadinessIndicator';
import { StudioHeader } from '@/components/live-streaming/StudioHeader';
import { VideoSourceSelector } from '@/components/video-sources';
import { useWebRTCStream } from '@/hooks/useWebRTCStream';
import { useVideoComposition } from '@/hooks/useVideoComposition';
import { useBroadcast } from '@/hooks/useBroadcast';
import { useVideoSourceSelector } from '@/hooks/useVideoSourceSelector';
import { BroadcastPlatform, QualityPreset } from '@/lib/services/broadcast/types';
import { OverlayVariant } from '@/lib/services/canvas-overlay';
import { ConnectionStatus } from '@/lib/services/video-sources/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Video, Mic, MicOff } from 'lucide-react';
import { useMicrophone } from '@/hooks/useMicrophone';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTournaments } from '@/lib/hooks/useTournaments';
import { GameService } from '@/lib/services/gameService';
import { supabase } from '@/lib/supabase';
import { useGameOverlayData } from '@/hooks/useGameOverlayData';
import { useGamePlayers } from '@/hooks/useGamePlayers';
import { usePlayerStatsOverlay } from '@/hooks/usePlayerStatsOverlay';
import { useBroadcastReadiness } from '@/hooks/useBroadcastReadiness';
import { notify } from '@/lib/services/notificationService';

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
  const [games, setGames] = useState<LiveGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [loadingGames, setLoadingGames] = useState(true);
  const [autoTriggerEnabled, setAutoTriggerEnabled] = useState(true);
  const [broadcastStartTime, setBroadcastStartTime] = useState<number | null>(null);
  const [overlayVariant, setOverlayVariant] = useState<OverlayVariant>('classic');
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { tournaments, loading: tournamentsLoading } = useTournaments(user);
  const tournamentIds = useMemo(() => tournaments.map(t => t.id).join(','), [tournaments]);
  const { overlayData } = useGameOverlayData(selectedGameId);
  const { teamAPlayers, teamBPlayers, teamAName, teamBName, loading: playersLoading } = useGamePlayers(selectedGameId);
  const { activePlayerStats, triggerOverlay, hideOverlay } = usePlayerStatsOverlay(selectedGameId, autoTriggerEnabled);
  
  const { audioStream: micStream, isEnabled: micEnabled, isMuted: micMuted, error: micError, isLoading: micLoading, start: startMic, stop: stopMic, toggleMute: toggleMicMute } = useMicrophone();
  
  // WebRTC for iPhone streaming
  const { remoteStream: iphoneStream, connectionStatus: iphoneConnectionStatus, reconnect: reconnectWebRTC } = useWebRTCStream({ gameId: selectedGameId, role: 'dashboard' });
  
  // Log WebRTC status changes for debugging
  useEffect(() => {
    console.log(`🔌 [Studio] WebRTC status: ${iphoneConnectionStatus}, stream: ${iphoneStream ? 'available' : 'null'}`);
  }, [iphoneConnectionStatus, iphoneStream]);
  
  // Map WebRTC connection status to our ConnectionStatus type
  const mappedIphoneStatus: ConnectionStatus = iphoneConnectionStatus === 'connected' ? 'connected' 
    : iphoneConnectionStatus === 'connecting' ? 'connecting'
    : iphoneConnectionStatus === 'error' ? 'error' 
    : 'idle';
  
  // Video source selector (OBS-like)
  const { 
    state: videoSourceState, 
    selectWebcam, 
    selectiPhone, 
    selectScreen, 
    clearSource 
  } = useVideoSourceSelector({
    iphoneStream,
    iphoneConnectionStatus: mappedIphoneStatus,
  });
  
  const activeVideoStream = videoSourceState.stream;
  
  const fullOverlayData = useMemo(() => {
    if (!overlayData) return null;
    return { ...overlayData, activePlayerStats: activePlayerStats ?? undefined };
  }, [overlayData, activePlayerStats]);
  
  const { composedStream, state, error: compositionError, start: startComposition, stop: stopComposition, setVariant } = useVideoComposition({
    videoStream: activeVideoStream,
    overlayData: fullOverlayData,
    enabled: false,
  });
  
  // Update variant when changed
  useEffect(() => {
    setVariant(overlayVariant);
  }, [overlayVariant, setVariant]);

  const { state: broadcastState, start: startBroadcast, stop: stopBroadcast } = useBroadcast({
    relayServerUrl: process.env.NEXT_PUBLIC_RELAY_SERVER_URL || 'ws://localhost:8080',
  });
  
  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && composedStream) {
      videoRef.current.srcObject = composedStream;
      videoRef.current.play().catch(err => {
        console.error('Error playing composed stream:', err);
      });
    } else if (videoRef.current && !composedStream) {
      videoRef.current.srcObject = null;
    }
  }, [composedStream]);
  
  // Fetch games
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
  
  const handleToggleComposition = async () => {
    if (state.isComposing) {
      stopComposition();
      notify.info('Composition stopped');
    } else {
      if (!overlayData) {
        notify.warning('Select a game first', 'Please choose a game to start composition');
        return;
      }
      if (!activeVideoStream) {
        // Check if iPhone is selected but not connected
        if (videoSourceState.activeSource === 'iphone' && videoSourceState.connectionStatus !== 'connected') {
          notify.warning('iPhone not connected', 'Wait for iPhone to connect or select a different source');
        } else {
          notify.warning('No video source', 'Select a video source (webcam, iPhone, or screen) first');
        }
        return;
      }
      await startComposition();
      notify.success('Composition started', 'Video and overlay are now composing');
    }
  };
  
  const handleStartBroadcast = useCallback(async (platform: BroadcastPlatform, streamKey: string, quality?: QualityPreset) => {
    if (!composedStream) return;
    const rtmpUrl = platform === 'youtube' ? 'rtmp://a.rtmp.youtube.com/live2' : 'rtmp://live.twitch.tv/app';
    const broadcastStream = new MediaStream();
    composedStream.getVideoTracks().forEach(track => broadcastStream.addTrack(track));
    if (micEnabled && micStream) micStream.getAudioTracks().forEach(track => broadcastStream.addTrack(track));
    setBroadcastStartTime(Date.now());
    await startBroadcast(broadcastStream, { platform, streamKey, rtmpUrl, quality });
    notify.success('Broadcast started', `Streaming to ${platform === 'youtube' ? 'YouTube' : 'Twitch'}`);
  }, [composedStream, micEnabled, micStream, startBroadcast]);

  const handleStopBroadcast = useCallback(() => {
    stopBroadcast();
    setBroadcastStartTime(null);
    notify.info('Broadcast stopped');
  }, [stopBroadcast]);

  // Format broadcast duration
  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }, []);

  const [broadcastDuration, setBroadcastDuration] = useState(0);

  // Update broadcast duration timer
  useEffect(() => {
    if (!broadcastState.isBroadcasting || !broadcastStartTime) {
      setBroadcastDuration(0);
      return;
    }

    const interval = setInterval(() => {
      setBroadcastDuration(Math.floor((Date.now() - broadcastStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [broadcastState.isBroadcasting, broadcastStartTime]);

  // Reset timer when broadcast stops
  useEffect(() => {
    if (!broadcastState.isBroadcasting) {
      setBroadcastStartTime(null);
      setBroadcastDuration(0);
    }
  }, [broadcastState.isBroadcasting]);

  const selectedGame = games.find(g => g.id === selectedGameId);
  const isComposing = !!(state.isComposing && composedStream);
  
  const broadcastReadiness = useBroadcastReadiness(selectedGameId, activeVideoStream, isComposing);
  
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <StudioHeader
        hasGameSelected={!!selectedGameId}
        hasVideoStream={!!activeVideoStream}
        isComposing={state.isComposing}
        isBroadcasting={broadcastState.isBroadcasting}
        broadcastDuration={formatDuration(broadcastDuration)}
      />

      {/* Main Content - Grid Layout */}
      <div className="flex-1 overflow-hidden p-3">
        <div className="h-full grid grid-cols-12 gap-3">
          {/* Left Sidebar - Compact (3 columns) */}
          <div className="col-span-3 flex flex-col gap-2 overflow-y-auto">
            {/* Game Selection - Compact */}
            <Card className="p-3 flex-shrink-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Game</h3>
                  {selectedGame && overlayData && (
                    <span className="text-xs px-1.5 py-0.5 bg-green-500/10 text-green-600 rounded">LIVE</span>
                  )}
                </div>
                {loadingGames || tournamentsLoading ? (
                  <div className="space-y-2 py-2 animate-in fade-in-0">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                  </div>
                ) : games.length === 0 ? (
                  <div className="py-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">No live games</p>
                    <p className="text-[10px] text-muted-foreground">Start a game in your tournament to begin streaming</p>
                  </div>
                ) : (
                  <select
                    value={selectedGameId || ''}
                    onChange={(e) => setSelectedGameId(e.target.value || null)}
                    className="w-full text-xs px-2 py-1.5 bg-background border rounded transition-all duration-200 animate-in fade-in-0"
                  >
                    <option value="">-- Select --</option>
                    {games.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.team_b_name} vs {g.team_a_name}
                      </option>
                    ))}
                  </select>
                )}
                {selectedGame && overlayData && (
                  <div className="text-xs space-y-0.5 pt-1 border-t animate-in fade-in-0 slide-in-from-top-1 duration-200">
                    <p className="font-medium">
                      {overlayData.teamBName} {overlayData.awayScore} - {overlayData.homeScore} {overlayData.teamAName}
                    </p>
                    <p className="text-muted-foreground">
                      Q{overlayData.quarter} | {overlayData.gameClockMinutes}:{String(overlayData.gameClockSeconds).padStart(2, '0')}
                    </p>
                  </div>
                )}
              </div>
            </Card>
            
            {/* Video Source Selector (OBS-like) */}
            <VideoSourceSelector
              activeSource={videoSourceState.activeSource}
              connectionStatus={videoSourceState.connectionStatus}
              selectedDeviceId={videoSourceState.selectedDeviceId}
              gameId={selectedGameId}
              onSelectWebcam={selectWebcam}
              onSelectiPhone={selectiPhone}
              onSelectScreen={selectScreen}
              onClear={clearSource}
              error={videoSourceState.error}
            />
            
            {/* Ready to Broadcast Indicator */}
            <BroadcastReadinessIndicator
              readiness={broadcastReadiness}
              isBroadcasting={broadcastState.isBroadcasting}
            />
            
            {/* Broadcast Settings - Collapsible when not composing */}
            {isComposing && (
              <div className="flex-shrink-0">
                <BroadcastControls
                  isBroadcasting={broadcastState.isBroadcasting}
                  isConnecting={broadcastState.isConnecting}
                  connectionStatus={broadcastState.connectionStatus}
                  error={broadcastState.error}
                  onStart={handleStartBroadcast}
                  onStop={handleStopBroadcast}
                />
              </div>
            )}
          </div>
          
          {/* Center - Preview (6 columns) */}
          <div className="col-span-6 flex flex-col gap-2">
            <Card className="flex-1 flex flex-col overflow-hidden p-3 min-h-0">
              <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <h3 className="text-sm font-semibold">Preview</h3>
                {!isComposing ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button 
                          onClick={handleToggleComposition} 
                          size="sm" 
                          className="h-7 text-xs"
                          disabled={!activeVideoStream || !overlayData}
                        >
                          {videoSourceState.activeSource === 'iphone' && videoSourceState.connectionStatus === 'connecting' 
                            ? 'Connecting...' 
                            : 'Start Composition'}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Combine video with game overlay</p>
                      <p className="text-[10px] opacity-80">
                        {!activeVideoStream ? 'Select a video source first' : !overlayData ? 'Select a game for overlay' : 'Ready to compose'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleToggleComposition} variant="destructive" size="sm" className="h-7 text-xs">
                        Stop
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Stop composition</p>
                      <p className="text-[10px] opacity-80">End overlay rendering</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="flex-1 relative bg-black rounded overflow-hidden min-h-0">
                {isComposing && composedStream ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-contain"
                    />
                    {broadcastState.isBroadcasting && (
                      <div className="absolute top-2 right-2">
                        <div className="flex items-center gap-1.5 bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                          LIVE
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <Video className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-xs text-muted-foreground mb-1">Ready to compose</p>
                    <p className="text-[10px] text-muted-foreground">Select a game and video source, then start composition</p>
                  </div>
                )}
              </div>
            </Card>
            
            {/* Compact Controls Row */}
            {isComposing && (
              <div className="grid grid-cols-2 gap-2 flex-shrink-0">
                {/* Mic Control - Compact */}
                <Card className="p-2">
                  <div className="flex items-center justify-between">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 cursor-help">
                          {micMuted ? (
                            <MicOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Mic className={`h-4 w-4 ${micEnabled ? 'text-green-600' : 'text-muted-foreground'}`} />
                          )}
                          <span className="text-xs">{micEnabled ? (micMuted ? 'Muted' : 'Live') : 'Off'}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Microphone status</p>
                        <p className="text-[10px] opacity-80">
                          {micEnabled ? (micMuted ? 'Muted - audio disabled' : 'Live - audio active') : 'Off - enable to add commentary'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="flex gap-1">
                      {!micEnabled ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button onClick={startMic} disabled={micLoading || broadcastState.isBroadcasting} size="sm" variant="outline" className="h-6 text-xs px-2">
                              Enable
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enable microphone</p>
                            <p className="text-[10px] opacity-80">Add live commentary to stream</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button onClick={toggleMicMute} size="sm" variant="ghost" className="h-6 text-xs px-2">
                                {micMuted ? 'Unmute' : 'Mute'}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{micMuted ? 'Unmute microphone' : 'Mute microphone'}</p>
                              <p className="text-[10px] opacity-80">
                                {micMuted ? 'Restore audio to stream' : 'Temporarily disable audio'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() => {
                                  if (broadcastState.isBroadcasting) {
                                    if (confirm('Cut audio permanently?')) stopMic();
                                  } else {
                                    stopMic();
                                  }
                                }}
                                size="sm"
                                variant="ghost"
                                className="h-6 text-xs px-2 text-destructive"
                              >
                                Off
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Disable microphone</p>
                              <p className="text-[10px] opacity-80">
                                {broadcastState.isBroadcasting ? 'Permanently removes audio from stream' : 'Turn off microphone'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </div>
                  {micError && <p className="text-xs text-destructive mt-1">{micError}</p>}
                </Card>
                
                {/* Quick Stats */}
                <Card className="p-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Frames:</span>
                    <span className="font-mono">{state.frameCount}</span>
                  </div>
                </Card>
              </div>
            )}
          </div>
          
          {/* Right Sidebar - Overlay Controls (3 columns) */}
          <div className="col-span-3 flex flex-col gap-2 overflow-y-auto">
            {/* Overlay Variant Selector */}
            <Card className="p-3 flex-shrink-0">
              <h3 className="text-sm font-semibold mb-2">Overlay Style</h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => setOverlayVariant('classic')}
                  size="sm"
                  variant={overlayVariant === 'classic' ? 'default' : 'outline'}
                  className="flex-1 h-auto py-2 flex flex-col items-center gap-0.5"
                >
                  <span className="text-xs font-semibold">Classic</span>
                  <span className="text-[10px] opacity-70">Floating</span>
                </Button>
                <Button
                  onClick={() => setOverlayVariant('nba')}
                  size="sm"
                  variant={overlayVariant === 'nba' ? 'default' : 'outline'}
                  className="flex-1 h-auto py-2 flex flex-col items-center gap-0.5"
                >
                  <span className="text-xs font-semibold">NBA</span>
                  <span className="text-[10px] opacity-70">ESPN Bar</span>
                </Button>
              </div>
            </Card>
            
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
    </div>
  );
}
