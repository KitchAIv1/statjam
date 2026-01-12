'use client';

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useWebRTCStream } from '@/hooks/useWebRTCStream';
import { isRealtimeConfigured } from '@/lib/services/webrtcService';
import { Video, Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTournaments } from '@/lib/hooks/useTournaments';
import { GameService } from '@/lib/services/gameService';

interface LiveGame {
  id: string;
  team_a_name: string;
  team_b_name: string;
  home_score: number;
  away_score: number;
  quarter: number;
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
 * Fetch team data for games
 */
async function fetchTeamsData(teamIds: string[]) {
  if (teamIds.length === 0) return new Map();
  
  const { data: teamsData } = await supabase
    .from('teams')
    .select('id, name')
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
    team_a_name: teamA?.name || 'Team A',
    team_b_name: teamB?.name || 'Team B',
    home_score: game.home_score || 0,
    away_score: game.away_score || 0,
    quarter: game.quarter || 1,
  };
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

export default function MobileCameraPage() {
  const { user } = useAuthContext();
  const [games, setGames] = useState<LiveGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Get organizer's tournaments (same pattern as OrganizerLiveStream)
  const { tournaments } = useTournaments(user);

  // Initialize WebRTC connection
  const { connectionStatus, error: webrtcError } = useWebRTCStream({
    gameId: selectedGameId,
    role: 'mobile',
    localStream,
  });

  // Fetch live games from organizer's tournaments (same pattern as OrganizerLiveStream)
  useEffect(() => {
    async function fetchLiveGames() {
      if (!user?.id || tournaments.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // ✅ SAME PATTERN AS OrganizerLiveStream: Get games per tournament
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
    } else {
      setLoading(false);
    }
  }, [user?.id, tournaments.length]);

  // Request camera access
  useEffect(() => {
    async function setupCamera() {
      try {
        console.log('📹 Requesting camera access...');
        
        // First, try to enumerate devices to find rear camera explicitly
        let rearCameraId: string | null = null;
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          
          // Find rear camera by label (iOS Safari uses "Back" or "Back Camera")
          // Also check for devices with facingMode constraints
          const rearCamera = videoDevices.find(device => {
            const label = device.label.toLowerCase();
            return label.includes('back') || label.includes('rear') || label.includes('environment');
          });
          
          if (rearCamera) {
            rearCameraId = rearCamera.deviceId;
            console.log('✅ Found rear camera:', rearCamera.label);
          } else if (videoDevices.length > 1) {
            // If multiple cameras, prefer the last one (usually rear on iOS)
            rearCameraId = videoDevices[videoDevices.length - 1].deviceId;
            console.log('✅ Using last camera device (likely rear):', videoDevices[videoDevices.length - 1].label);
          }
        } catch (enumError) {
          console.warn('⚠️ Could not enumerate devices, falling back to facingMode:', enumError);
        }
        
        // Request rear camera with high quality
        const constraints: MediaStreamConstraints = {
          video: rearCameraId
            ? {
                deviceId: { exact: rearCameraId }, // Explicit device selection
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              }
            : {
                facingMode: 'environment', // Fallback to facingMode
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              },
          audio: false, // No audio for MVP
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        console.log('✅ Camera access granted');
        setLocalStream(stream);

        // Display preview
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('❌ Camera access error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
        setCameraError(errorMessage);
      }
    }

    setupCamera();

    // Cleanup: stop camera when component unmounts
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Check Supabase Realtime configuration
  if (!isRealtimeConfigured()) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Supabase Not Configured</h1>
          <p className="text-muted-foreground mb-4">
            Please set up Supabase configuration to use live streaming.
          </p>
        </div>
      </div>
    );
  }

  // Status indicator component
  const StatusIndicator = () => {
    let icon = <WifiOff className="w-5 h-5" />;
    let text = 'Not Connected';
    let colorClass = 'text-muted-foreground';

    if (connectionStatus === 'connecting') {
      icon = <Wifi className="w-5 h-5 animate-pulse" />;
      text = 'Connecting...';
      colorClass = 'text-yellow-500';
    } else if (connectionStatus === 'connected') {
      icon = <CheckCircle className="w-5 h-5" />;
      text = 'Connected';
      colorClass = 'text-green-500';
    } else if (connectionStatus === 'error') {
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
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-bold">Live Camera</h1>
          </div>
          <StatusIndicator />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Game Selection */}
        <div className="bg-card border-b border-border p-4">
          <label className="block text-sm font-medium mb-2">Select Game to Stream</label>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading games...</div>
          ) : games.length === 0 ? (
            <div className="text-sm text-muted-foreground">No live games available</div>
          ) : (
            <select
              value={selectedGameId || ''}
              onChange={(e) => setSelectedGameId(e.target.value || null)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">-- Select a game --</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.team_b_name} vs {game.team_a_name} (Q{game.quarter}) - {game.home_score}:{game.away_score}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Camera Preview */}
        <div className="flex-1 bg-black relative">
          {cameraError ? (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Camera Access Error</h2>
                <p className="text-gray-300 mb-4">{cameraError}</p>
                <p className="text-sm text-gray-400">
                  Make sure you've granted camera permissions and are using HTTPS.
                </p>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Overlay Info */}
          {localStream && selectedGameId && (
            <div className="absolute top-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white">
              <div className="text-sm font-medium">
                {games.find(g => g.id === selectedGameId)?.team_b_name} vs{' '}
                {games.find(g => g.id === selectedGameId)?.team_a_name}
              </div>
              <div className="text-xs text-gray-300 mt-1">
                Streaming to dashboard...
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="bg-card border-t border-border p-4">
          {webrtcError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-destructive">Connection Error</div>
                  <div className="text-xs text-destructive/80 mt-1">{webrtcError}</div>
                </div>
              </div>
            </div>
          )}

          {!selectedGameId && !cameraError && (
            <div className="text-center text-sm text-muted-foreground">
              Select a game above to start streaming
            </div>
          )}

          {selectedGameId && connectionStatus === 'connected' && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-500">Live</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      {!selectedGameId && !cameraError && (
        <div className="bg-muted/50 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            📱 Keep this device positioned to capture the game
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            💻 Open the dashboard on your computer to view the stream
          </p>
        </div>
      )}
    </div>
  );
}

