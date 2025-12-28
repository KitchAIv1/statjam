/**
 * Video Composition Test Page
 * 
 * Tests video composition with webcam + Canvas overlay.
 * Shows composed stream preview.
 */

'use client';

import { useState, useMemo } from 'react';
import { VideoCompositionPreview } from '@/components/live-streaming/VideoCompositionPreview';
import { BroadcastControls } from '@/components/live-streaming/BroadcastControls';
import { useWebcam } from '@/hooks/useWebcam';
import { useWebRTCStream } from '@/hooks/useWebRTCStream';
import { useVideoComposition } from '@/hooks/useVideoComposition';
import { useBroadcast } from '@/hooks/useBroadcast';
import { GameOverlayData } from '@/lib/services/canvas-overlay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Video, Camera, CameraOff, Smartphone } from 'lucide-react';

export default function VideoCompositionTestPage() {
  const [videoSource, setVideoSource] = useState<'webcam' | 'iphone' | null>(null);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  
  // Mock game overlay data
  const overlayData: GameOverlayData = useMemo(() => ({
    teamAName: 'Celtics',
    teamBName: 'Lakers',
    teamAId: 'team-a',
    teamBId: 'team-b',
    homeScore: 85,
    awayScore: 92,
    quarter: 4,
    gameClockMinutes: 2,
    gameClockSeconds: 34,
    shotClockSeconds: 18,
    teamAFouls: 3,
    teamBFouls: 4,
    teamATimeouts: 2,
    teamBTimeouts: 3,
  }), []);
  
  // Webcam hook - manual control only (no auto-start)
  // Request high resolution for broadcast quality
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
        frameRate: { ideal: 30, min: 24 },
      },
      audio: false,
    },
  });
  
  // iPhone WebRTC hook
  const {
    remoteStream: iphoneStream,
    connectionStatus,
    error: webrtcError,
    reconnect: reconnectWebRTC,
    disconnect: disconnectWebRTC,
  } = useWebRTCStream({
    gameId: gameId || null,
    role: 'dashboard', // Dashboard receives stream from iPhone
    onRemoteStream: () => {
      console.log('iPhone stream received');
    },
  });
  
  // Select active video stream based on source
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
    overlayData,
    enabled: false, // Manual control
  });

  // Broadcast hook
  const {
    state: broadcastState,
    start: startBroadcast,
    stop: stopBroadcast,
  } = useBroadcast({
    relayServerUrl: process.env.NEXT_PUBLIC_RELAY_SERVER_URL || 'ws://localhost:8080',
  });
  
  const handleSelectWebcam = async () => {
    // Stop iPhone if active
    if (videoSource === 'iphone') {
      disconnectWebRTC();
      setGameId(null);
    }
    
    if (videoSource === 'webcam' && webcamEnabled) {
      // Stop webcam
      setVideoSource(null);
      setWebcamEnabled(false);
      stopComposition();
      stopWebcam();
    } else {
      // Start webcam
      setVideoSource('webcam');
      setWebcamEnabled(true);
      await startWebcam();
    }
  };
  
  const handleSelectiPhone = () => {
    // Stop webcam if active
    if (videoSource === 'webcam' && webcamEnabled) {
      stopComposition();
      stopWebcam();
      setWebcamEnabled(false);
    }
    
    if (videoSource === 'iphone') {
      // Stop iPhone
      setVideoSource(null);
      disconnectWebRTC();
      setGameId(null);
    } else {
      // Start iPhone connection (need gameId)
      const testGameId = prompt('Enter Game ID for iPhone connection (or use "test"):') || 'test';
      setGameId(testGameId);
      setVideoSource('iphone');
    }
  };
  
  const handleToggleComposition = async () => {
    if (state.isComposing) {
      stopComposition();
    } else {
      console.log('Starting composition...', { webcamStream, overlayData });
      try {
        await startComposition();
        console.log('Composition started successfully');
      } catch (err) {
        console.error('Failed to start composition:', err);
      }
    }
  };
  
  return (
    <div className="container mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Video Composition Test</h1>
        <p className="text-muted-foreground">
          Test video composition with webcam + Canvas overlay
        </p>
      </div>
      
      {/* Video Source Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Source
          </CardTitle>
          <CardDescription>
            Choose webcam or iPhone WebRTC stream
          </CardDescription>
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
                    Connect via WebRTC. iPhone must be on /dashboard/mobile-camera page and streaming first.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSelectiPhone}
                variant={videoSource === 'iphone' ? 'destructive' : 'outline'}
                size="sm"
              >
                {videoSource === 'iphone' ? 'Disconnect' : 'Connect'}
              </Button>
            </div>
            
            {/* Status Messages */}
            {webcamError && (
              <p className="text-sm text-destructive">Webcam: {webcamError}</p>
            )}
            {webrtcError && (
              <p className="text-sm text-destructive">WebRTC: {webrtcError}</p>
            )}
            {videoSource === 'webcam' && webcamStream && (
              <p className="text-sm text-muted-foreground">
                Webcam active ({webcamStream.getVideoTracks().length} track(s))
              </p>
            )}
            {videoSource === 'iphone' && (
              <p className="text-sm text-muted-foreground">
                WebRTC Status: {connectionStatus} {gameId && `(Game ID: ${gameId})`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Composition Preview */}
      <VideoCompositionPreview
        composedStream={composedStream}
        isComposing={state.isComposing}
        error={compositionError || undefined}
        onStart={handleToggleComposition}
        onStop={handleToggleComposition}
      />

      {/* Broadcast Controls */}
      {composedStream && state.isComposing && (
        <BroadcastControls
          isBroadcasting={broadcastState.isBroadcasting}
          isConnecting={broadcastState.isConnecting}
          connectionStatus={broadcastState.connectionStatus}
          error={broadcastState.error}
          onStart={async (platform, streamKey) => {
            const rtmpUrl = platform === 'youtube' 
              ? 'rtmp://a.rtmp.youtube.com/live2'
              : 'rtmp://live.twitch.tv/app';
            await startBroadcast(composedStream, { platform, streamKey, rtmpUrl });
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
            <div>
              <span className="font-semibold">Composing:</span>{' '}
              {state.isComposing ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="font-semibold">Frames Rendered:</span>{' '}
              {state.frameCount}
            </div>
            <div>
              <span className="font-semibold">Webcam Stream:</span>{' '}
              {webcamStream ? 'Active' : 'Inactive'}
            </div>
            <div>
              <span className="font-semibold">Composed Stream:</span>{' '}
              {composedStream ? 'Active' : 'Inactive'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

