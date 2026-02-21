/**
 * Video Composition Test Page
 * 
 * Live streaming studio with webcam + Canvas overlay composition.
 * Compact single-screen design - all controls visible without scrolling.
 */

'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { BroadcastControls } from '@/components/live-streaming/BroadcastControls';
import { BroadcastTimer } from '@/components/live-streaming/BroadcastTimer';
import { OverlayControlPanel } from '@/components/live-streaming/OverlayControlPanel';
import { BroadcastReadinessIndicator } from '@/components/live-streaming/BroadcastReadinessIndicator';
import { StudioHeader } from '@/components/live-streaming/StudioHeader';
import { TournamentGameSelector } from '@/components/live-streaming/TournamentGameSelector';
import { OnboardingBanner } from '@/components/live-streaming/OnboardingBanner';
import { VideoSourceSelector } from '@/components/video-sources';
import { useWebRTCStream } from '@/hooks/useWebRTCStream';
import { useVideoComposition } from '@/hooks/useVideoComposition';
import { useBroadcast } from '@/hooks/useBroadcast';
import { useVideoSourceSelector } from '@/hooks/useVideoSourceSelector';
import { BroadcastPlatform, QualityPreset, RelayRegion } from '@/lib/services/broadcast/types';
import { OverlayVariant, InfoBarToggles } from '@/lib/services/canvas-overlay';
import { ConnectionStatus } from '@/lib/services/video-sources/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Video, Mic, MicOff } from 'lucide-react';
import { useMicrophone } from '@/hooks/useMicrophone';
import { useAuthContext } from '@/contexts/AuthContext';
import { useGameOverlayData } from '@/hooks/useGameOverlayData';
import { useGamePlayers } from '@/hooks/useGamePlayers';
import { usePlayerStatsOverlay } from '@/hooks/usePlayerStatsOverlay';
import { useBroadcastReadiness } from '@/hooks/useBroadcastReadiness';
import { useInfoBarOverlays } from '@/hooks/useInfoBarOverlays';
import { useOptimisticScores } from '@/hooks/useOptimisticScores';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { useBoxScoreOverlay } from '@/hooks/useBoxScoreOverlay';
import { useScheduleOverlay } from '@/hooks/useScheduleOverlay';
import { useStartingLineupOverlay } from '@/hooks/useStartingLineupOverlay';
import { toScheduleDateString } from '@/lib/utils/scheduleOverlayUtils';
import { notify } from '@/lib/services/notificationService';
import { UpgradeModal } from '@/components/subscription';
import { BoxScoreOverlayPanel } from '@/components/overlay/BoxScoreOverlayPanel';
import { ScheduleOverlayPanel } from '@/components/overlay/ScheduleOverlayPanel';
import { StartingLineupOverlayPanel } from '@/components/overlay/StartingLineupOverlayPanel';
import type { Tournament } from '@/lib/types/tournament';

export default function VideoCompositionTestPage() {
  const { user } = useAuthContext();
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<Date | null>(null);
  const [autoTriggerEnabled, setAutoTriggerEnabled] = useState(true);
  const [broadcastStartTime, setBroadcastStartTime] = useState<number | null>(null);
  const [overlayVariant, setOverlayVariant] = useState<OverlayVariant>('classic');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Feature gate for premium overlays
  const { allowed: overlaysAllowed, upgradeMessage } = useFeatureGate('live_stream_overlays', 'organizer');
  
  const { overlayData } = useGameOverlayData(selectedGameId);
  const { teamAPlayers, teamBPlayers, teamAName, teamBName, loading: playersLoading } = useGamePlayers(selectedGameId);
  const { activePlayerStats, triggerOverlay, hideOverlay } = usePlayerStatsOverlay(selectedGameId, autoTriggerEnabled);
  
  // Build gameState for info bar overlay detection
  const gameState = useMemo(() => {
    if (!overlayData) return null;
    return {
      quarter: overlayData.quarter,
      clockMinutes: overlayData.gameClockMinutes,
      clockSeconds: overlayData.gameClockSeconds,
      isClockRunning: overlayData.isClockRunning ?? false,
      teamAId: overlayData.teamAId,
      teamBId: overlayData.teamBId,
      teamAName: overlayData.teamAName,
      teamBName: overlayData.teamBName,
      tournamentName: selectedTournament?.name,
    };
  }, [overlayData, selectedTournament?.name]);
  
  // Info bar overlays (team run, timeout, halftime, shot made, foul, etc.)
  const { activeItem: infoBarActiveItem, secondaryItem: infoBarSecondaryItem, toggles: infoBarToggles, setToggles: setInfoBarToggles, shotMadeData, scoreDelta } = useInfoBarOverlays(selectedGameId, gameState);
  
  // Per-team optimistic scores (freeze on shot, prevents double-counting from DB sync)
  const optimisticScores = useOptimisticScores({
    dbHomeScore: overlayData?.homeScore ?? 0,
    dbAwayScore: overlayData?.awayScore ?? 0,
    teamAId: overlayData?.teamAId ?? null,
    teamBId: overlayData?.teamBId ?? null,
    scoreDelta,
  });
  
  // Box Score overlay (manual trigger)
  const boxScore = useBoxScoreOverlay({
    gameId: selectedGameId,
    teamAId: overlayData?.teamAId ?? null,
    teamBId: overlayData?.teamBId ?? null,
    teamAName: overlayData?.teamAName ?? 'Team A',
    teamBName: overlayData?.teamBName ?? 'Team B',
    teamAScore: optimisticScores.homeScore,
    teamBScore: optimisticScores.awayScore,
    teamAPrimaryColor: overlayData?.teamAPrimaryColor,
    teamBPrimaryColor: overlayData?.teamBPrimaryColor,
    teamALogoUrl: overlayData?.teamALogo,
    teamBLogoUrl: overlayData?.teamBLogo,
  });

  // Day Schedule overlay (manual trigger; user picks which day to show)
  const scheduleOverlay = useScheduleOverlay({
    tournamentId: selectedTournament?.id ?? null,
    country: selectedTournament?.country ?? '',
    selectedDate: selectedScheduleDate,
  });

  // Starting Lineup overlay (manual trigger; first 5 per team)
  // Starting Lineup overlay — team colors from overlayData (same source as Box Score / scoring overlay)
  const startingLineup = useStartingLineupOverlay({
    gameId: selectedGameId,
    teamAId: overlayData?.teamAId ?? null,
    teamBId: overlayData?.teamBId ?? null,
    teamAName: overlayData?.teamAName ?? 'Team A',
    teamBName: overlayData?.teamBName ?? 'Team B',
    teamALogo: overlayData?.teamALogo,
    teamBLogo: overlayData?.teamBLogo,
    teamAPrimaryColor: overlayData?.teamAPrimaryColor,
    teamBPrimaryColor: overlayData?.teamBPrimaryColor,
    tournamentName: selectedTournament?.name ?? '',
    tournamentLogo: selectedTournament?.logo,
  });

  // Clear selected date when tournament changes
  useEffect(() => {
    setSelectedScheduleDate(null);
  }, [selectedTournament?.id]);

  // Clear when selected date is no longer in available list (e.g. schedule refresh)
  useEffect(() => {
    if (!selectedScheduleDate || scheduleOverlay.availableDates.length === 0) return;
    const selectedStr = toScheduleDateString(selectedScheduleDate);
    const isInList = scheduleOverlay.availableDates.some(
      (d) => toScheduleDateString(d) === selectedStr
    );
    if (!isInList) setSelectedScheduleDate(null);
  }, [scheduleOverlay.availableDates, selectedScheduleDate]);

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
  
  // Callbacks for TournamentGameSelector
  const handleGameSelect = useCallback((gameId: string | null) => {
    setSelectedGameId(gameId);
  }, []);
  
  const handleTournamentSelect = useCallback((tournament: Tournament | null) => {
    setSelectedTournament(tournament);
  }, []);
  
  const fullOverlayData = useMemo(() => {
    if (!overlayData) return null;
    
    return { 
      ...overlayData, 
      // Use optimistic scores (per-team freeze prevents double-counting)
      homeScore: optimisticScores.homeScore,
      awayScore: optimisticScores.awayScore,
      activePlayerStats: activePlayerStats ?? undefined,
      // Pass tournament name directly from selected tournament (no DB query needed)
      tournamentName: selectedTournament?.name,
      tournamentLogo: selectedTournament?.logo,
      // Info bar overlays (team run, timeout, halftime, shot made, etc.)
      infoBarLabel: infoBarActiveItem?.label,
      infoBarType: infoBarActiveItem?.type,
      infoBarTeamId: infoBarActiveItem?.teamId,
      // Secondary item (for split NBA-style display)
      infoBarSecondaryLabel: infoBarSecondaryItem?.label,
      infoBarSecondaryType: infoBarSecondaryItem?.type,
      infoBarSecondaryTeamId: infoBarSecondaryItem?.teamId,
      // Shot made animation data (for 3PT shake effect)
      shotMadeAnimationStart: shotMadeData?.animationStart,
      shotMadeIs3Pointer: shotMadeData?.is3Pointer,
      // Hide canvas scoreboard when Day Schedule or Starting Lineup overlay is active
      hideScoreBar: scheduleOverlay.isVisible || startingLineup.isVisible,
      // Schedule overlay (canvas)
      scheduleOverlayVisible: scheduleOverlay.isVisible,
      scheduleOverlayPayload:
        scheduleOverlay.isVisible && scheduleOverlay.schedulePayload
          ? {
              date: scheduleOverlay.schedulePayload.displayDate,
              games: (scheduleOverlay.schedulePayload.games || []).map((g) => ({
                id: g.id,
                awayTeamName: g.teamAName,
                homeTeamName: g.teamBName,
                awayTeamLogo: g.teamALogoUrl ?? null,
                homeTeamLogo: g.teamBLogoUrl ?? null,
                time: g.timeFormatted,
                venue: g.venue ?? null,
                status: null,
              })),
            }
          : null,
      // Lineup overlay (canvas)
      lineupOverlayVisible: startingLineup.isVisible,
      lineupOverlayPayload:
        startingLineup.isVisible && startingLineup.payload
          ? {
              tournamentName: startingLineup.payload.tournamentName,
              tournamentLogo: startingLineup.payload.tournamentLogo,
              teamA: {
                name: startingLineup.payload.teamA.name,
                logo: startingLineup.payload.teamA.logo,
                primaryColor: startingLineup.payload.teamA.primaryColor,
                players: startingLineup.payload.teamA.players,
              },
              teamB: {
                name: startingLineup.payload.teamB.name,
                logo: startingLineup.payload.teamB.logo,
                primaryColor: startingLineup.payload.teamB.primaryColor,
                players: startingLineup.payload.teamB.players,
              },
            }
          : null,
    };
  }, [
    overlayData,
    optimisticScores,
    activePlayerStats,
    selectedTournament,
    infoBarActiveItem,
    infoBarSecondaryItem,
    shotMadeData,
    scheduleOverlay.isVisible,
    scheduleOverlay.schedulePayload,
    startingLineup.isVisible,
    startingLineup.payload,
  ]);
  
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
  
  const handleStartBroadcast = useCallback(async (platform: BroadcastPlatform, streamKey: string, quality?: QualityPreset, publicStreamUrl?: string, relayRegion?: RelayRegion) => {
    if (!composedStream) return;
    const rtmpUrl = platform === 'youtube' 
      ? 'rtmp://a.rtmp.youtube.com/live2' 
      : platform === 'twitch' 
      ? 'rtmp://live.twitch.tv/app'
      : 'rtmps://live-api-s.facebook.com:443/rtmp/';
    const broadcastStream = new MediaStream();
    composedStream.getVideoTracks().forEach(track => broadcastStream.addTrack(track));
    if (micEnabled && micStream) micStream.getAudioTracks().forEach(track => broadcastStream.addTrack(track));
    setBroadcastStartTime(Date.now());
    
    // Start broadcast first (critical path - no delays)
    await startBroadcast(broadcastStream, { platform, streamKey, rtmpUrl, quality, region: relayRegion ?? 'us' });
    notify.success('Broadcast started', `Streaming to ${platform === 'youtube' ? 'YouTube' : platform === 'twitch' ? 'Twitch' : 'Facebook Live'}`);
    
    // Update tournament streaming status in background (non-blocking)
    if (selectedTournament?.id && publicStreamUrl) {
      import('@/lib/services/tournamentStreamingService')
        .then(({ tournamentStreamingService }) => 
          tournamentStreamingService.startStreaming(selectedTournament.id, platform, publicStreamUrl))
        .catch(error => console.warn('Failed to update tournament streaming status:', error));
    }
    
    // Save stream video ID to game for Media tab replays (non-blocking)
    if (selectedGameId && publicStreamUrl && platform === 'youtube') {
      import('@/lib/services/tournamentStreamingService')
        .then(({ tournamentStreamingService }) => 
          tournamentStreamingService.saveGameStreamVideoId(selectedGameId, publicStreamUrl))
        .catch(error => console.warn('Failed to save game stream video ID:', error));
    }
  }, [composedStream, micEnabled, micStream, startBroadcast, selectedTournament?.id, selectedGameId]);

  const handleStopBroadcast = useCallback(() => {
    // Stop broadcast immediately (critical path)
    stopBroadcast();
    setBroadcastStartTime(null);
    notify.info('Broadcast stopped');
    
    // Clear tournament streaming status in background (non-blocking)
    if (selectedTournament?.id) {
      import('@/lib/services/tournamentStreamingService')
        .then(({ tournamentStreamingService }) => 
          tournamentStreamingService.stopStreaming(selectedTournament.id))
        .catch(error => console.warn('Failed to clear tournament streaming status:', error));
    }
  }, [stopBroadcast, selectedTournament?.id]);

  // Reset broadcast start time when broadcast stops
  useEffect(() => {
    if (!broadcastState.isBroadcasting) {
      setBroadcastStartTime(null);
    }
  }, [broadcastState.isBroadcasting]);

  const isComposing = !!(state.isComposing && composedStream);
  
  const broadcastReadiness = useBroadcastReadiness(selectedGameId, activeVideoStream, isComposing);
  
  return (
    <div className="h-screen flex flex-col bg-background">
      <StudioHeader
        hasGameSelected={!!selectedGameId}
        hasVideoStream={!!activeVideoStream}
        isComposing={state.isComposing}
        isBroadcasting={broadcastState.isBroadcasting}
        broadcastDuration={
          <BroadcastTimer 
            startTime={broadcastStartTime} 
            isBroadcasting={broadcastState.isBroadcasting} 
          />
        }
      />

      {/* Main Content - Grid Layout */}
      <div className="flex-1 min-h-0 p-3 overflow-auto">
        <div className="h-full grid grid-cols-12 gap-3">
          {/* Left Sidebar - Compact (3 columns) */}
          <div className="col-span-3 flex flex-col gap-2 overflow-y-auto pb-4">
            {/* First-time onboarding (dismissible) */}
            <OnboardingBanner />
            
            {/* Tournament & Game Selection (extracted component) */}
            <TournamentGameSelector
              user={user}
              selectedGameId={selectedGameId}
              onGameSelect={handleGameSelect}
              onTournamentSelect={handleTournamentSelect}
              overlayData={overlayData}
            />
            
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
              <div className="flex-1 relative bg-black rounded overflow-hidden min-h-0 flex items-center justify-center">
                {isComposing && composedStream ? (
                  <>
                    {/* Actual video frame: 16:9, matches broadcast output; letterboxing stays outside */}
                    <div className="relative w-full max-h-full min-w-0 aspect-video">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {broadcastState.isBroadcasting && (
                        <div className="absolute top-2 right-2 z-[60]">
                          <div className="flex items-center gap-1.5 bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            LIVE
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none [&>*]:pointer-events-auto">
                        <BoxScoreOverlayPanel
                          isVisible={boxScore.isVisible}
                          isLoading={boxScore.isLoading}
                          data={boxScore.boxScoreData}
                        />
                        <ScheduleOverlayPanel
                          isVisible={scheduleOverlay.isVisible}
                          isLoading={scheduleOverlay.isLoading}
                          payload={scheduleOverlay.schedulePayload}
                          tournamentName={selectedTournament?.name}
                        />
                        <StartingLineupOverlayPanel
                          isVisible={startingLineup.isVisible}
                          isLoading={startingLineup.isLoading}
                          payload={startingLineup.payload}
                        />
                      </div>
                    </div>
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
                // Info Bar (NBA mode only)
                showInfoBarTab={overlayVariant === 'nba'}
                infoBarToggles={infoBarToggles}
                onInfoBarToggleChange={setInfoBarToggles}
                // Premium feature gating
                overlaysLocked={!overlaysAllowed}
                onUpgrade={() => setShowUpgradeModal(true)}
                // Manual overlays
                boxScoreVisible={boxScore.isVisible}
                onBoxScoreToggle={boxScore.toggle}
                scheduleVisible={scheduleOverlay.isVisible}
                onScheduleToggle={scheduleOverlay.toggle}
                scheduleAvailableDates={scheduleOverlay.availableDates}
                selectedScheduleDate={selectedScheduleDate}
                onScheduleDateSelect={setSelectedScheduleDate}
                startingLineupVisible={startingLineup.isVisible}
                onStartingLineupToggle={startingLineup.toggle}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Subscription Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        role="organizer"
        currentTier="free"
        triggerReason={upgradeMessage || 'Upgrade to unlock automatic stream overlays'}
      />
    </div>
  );
}
