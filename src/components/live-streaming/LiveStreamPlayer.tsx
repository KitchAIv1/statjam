'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Video } from 'lucide-react';
import { useLiveStreamGames } from '@/hooks/useLiveStreamGames';
import { useLiveStreamConnection } from '@/hooks/useLiveStreamConnection';
import { LiveStreamContainer } from './LiveStreamContainer';
import { LiveStreamControls } from './LiveStreamControls';
import { EnhancedScoreOverlay } from './EnhancedScoreOverlay';

export type LiveStreamSize = 'compact' | 'expanded' | 'fullscreen';

interface LiveStreamPlayerProps {
  tournamentId?: string;
  user?: { id: string } | null;
  defaultGameId?: string;
  size?: LiveStreamSize;
  showControls?: boolean;
  autoSelect?: boolean; // Auto-select first game (default: false for public, true for organizer)
  className?: string;
  onGameSelect?: (gameId: string) => void;
  onFullscreen?: () => void;
}

export function LiveStreamPlayer({
  tournamentId,
  user,
  defaultGameId,
  size = 'expanded',
  showControls = true,
  autoSelect = false, // Default false - let user select game manually
  className = '',
  onGameSelect,
  onFullscreen,
}: LiveStreamPlayerProps) {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(defaultGameId || null);
  const [connectionTimeout, setConnectionTimeout] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { games, selectedGame, gameStats, loading } = useLiveStreamGames({
    tournamentId,
    user,
    selectedGameId,
  });

  // Auto-select first game only if autoSelect is true
  useEffect(() => {
    if (autoSelect && !selectedGameId && games.length > 0) {
      setSelectedGameId(games[0].id);
    }
  }, [games, selectedGameId, autoSelect]);
  
  const { connectionStatus, remoteStream, error, reconnect } = useLiveStreamConnection({
    gameId: selectedGameId,
    role: 'dashboard',
  });

  // 🔍 DEBUG: Log connection state for troubleshooting
  useEffect(() => {
    console.log('🎥 [LiveStreamPlayer] State:', {
      selectedGameId,
      connectionStatus,
      hasRemoteStream: !!remoteStream,
      error,
      gamesCount: games.length,
    });
  }, [selectedGameId, connectionStatus, remoteStream, error, games.length]);

  // Connection timeout - show "no streamer" message after 15 seconds
  useEffect(() => {
    if (connectionStatus === 'connecting' && selectedGameId) {
      setConnectionTimeout(false);
      const timer = setTimeout(() => {
        if (!remoteStream) {
          setConnectionTimeout(true);
        }
      }, 15000);
      return () => clearTimeout(timer);
    } else if (connectionStatus === 'connected') {
      setConnectionTimeout(false);
    }
  }, [connectionStatus, selectedGameId, remoteStream]);

  useEffect(() => {
    if (videoRef.current && remoteStream) {
      console.log('🎥 [LiveStreamPlayer] Setting video srcObject:', {
        streamId: remoteStream.id,
        tracks: remoteStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })),
      });
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleGameSelect = (gameId: string) => {
    setSelectedGameId(gameId || null);
    onGameSelect?.(gameId);
  };

  return (
    <LiveStreamContainer
      size={size}
      className={className}
      onFullscreen={onFullscreen}
    >
      {showControls && (
        <LiveStreamControls
          games={games}
          selectedGameId={selectedGameId}
          onGameSelect={handleGameSelect}
          connectionStatus={connectionStatus}
          loading={loading}
        />
      )}
      
      <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
        {games.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Video className="h-8 w-8 text-white/40 mb-2" />
            <div className="text-sm text-white/60">No live games at the moment</div>
            <div className="text-xs text-white/40 mt-1">Check back when games are in progress</div>
          </div>
        ) : remoteStream ? (
          <>
            <video
              ref={videoRef}
              srcObject={remoteStream}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
            {selectedGame && (
              <EnhancedScoreOverlay
                size={size}
                teamAName={selectedGame.team_a_name}
                teamBName={selectedGame.team_b_name}
                homeScore={selectedGame.home_score}
                awayScore={selectedGame.away_score}
                quarter={selectedGame.quarter}
                gameClockMinutes={selectedGame.game_clock_minutes}
                gameClockSeconds={selectedGame.game_clock_seconds}
                teamALogo={selectedGame.team_a_logo}
                teamBLogo={selectedGame.team_b_logo}
                teamAPrimaryColor={selectedGame.team_a_primary_color}
                teamBPrimaryColor={selectedGame.team_b_primary_color}
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
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            {loading ? (
              <div className="text-sm text-white/40">Loading games...</div>
            ) : !selectedGameId ? (
              <>
                <Video className="h-6 w-6 text-white/40 mb-2" />
                <div className="text-sm text-white/60">Select a game to watch</div>
                <div className="text-xs text-white/40 mt-1">Choose from the dropdown above</div>
              </>
            ) : connectionTimeout ? (
              <>
                <Video className="h-6 w-6 text-yellow-500/60 mb-2" />
                <div className="text-sm text-yellow-500/80">No active streamer</div>
                <div className="text-xs text-white/40 mt-1">Waiting for camera to connect...</div>
                <button 
                  onClick={reconnect}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  Try reconnecting
                </button>
              </>
            ) : (
              <>
                <div className="animate-pulse text-sm text-white/60">Connecting to stream...</div>
                <div className="text-xs text-white/40 mt-1">This may take a few seconds</div>
              </>
            )}
          </div>
        )}
      </div>
    </LiveStreamContainer>
  );
}

