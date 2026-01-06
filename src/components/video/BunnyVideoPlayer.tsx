'use client';

/**
 * BunnyVideoPlayer - Bunny.net Stream embedded player
 * 
 * Uses Bunny.net's iframe embed player for reliable video playback.
 * Communicates with the player via postMessage API.
 * 
 * @module BunnyVideoPlayer
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { getBunnyConfig } from '@/lib/config/videoConfig';

interface BunnyVideoPlayerProps {
  videoId: string;
  onTimeUpdate?: (currentTimeSeconds: number) => void;
  onDurationChange?: (durationSeconds: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onReady?: () => void;
  className?: string;
  autoplay?: boolean;
}

interface PlayerState {
  currentTime: number;
  duration: number;
  playing: boolean;
  ready: boolean;
}

export function BunnyVideoPlayer({
  videoId,
  onTimeUpdate,
  onDurationChange,
  onPlay,
  onPause,
  onReady,
  className = '',
  autoplay = false,
}: BunnyVideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentTime: 0,
    duration: 0,
    playing: false,
    ready: false,
  });
  const [loading, setLoading] = useState(true);

  const config = getBunnyConfig();
  const embedUrl = `https://iframe.mediadelivery.net/embed/${config.libraryId}/${videoId}?autoplay=${autoplay}&preload=true&responsive=true`;

  // Handle messages from the Bunny player
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from Bunny
      if (!event.origin.includes('mediadelivery.net')) return;
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        if (data.event === 'ready') {
          setLoading(false);
          setPlayerState(prev => ({ ...prev, ready: true }));
          onReady?.();
        }
        
        if (data.event === 'timeupdate' && typeof data.data === 'number') {
          setPlayerState(prev => ({ ...prev, currentTime: data.data }));
          onTimeUpdate?.(data.data);
        }
        
        if (data.event === 'durationchange' && typeof data.data === 'number') {
          setPlayerState(prev => ({ ...prev, duration: data.data }));
          onDurationChange?.(data.data);
        }
        
        if (data.event === 'play') {
          setPlayerState(prev => ({ ...prev, playing: true }));
          onPlay?.();
        }
        
        if (data.event === 'pause') {
          setPlayerState(prev => ({ ...prev, playing: false }));
          onPause?.();
        }
      } catch (e) {
        // Ignore parse errors
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onTimeUpdate, onDurationChange, onPlay, onPause, onReady]);

  // Send command to player
  const sendCommand = useCallback((command: string, value?: number) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: command, data: value }),
        '*'
      );
    }
  }, []);

  // Player controls
  const play = useCallback(() => sendCommand('play'), [sendCommand]);
  const pause = useCallback(() => sendCommand('pause'), [sendCommand]);
  const seek = useCallback((time: number) => sendCommand('seek', time), [sendCommand]);
  const setPlaybackRate = useCallback((rate: number) => sendCommand('playbackRate', rate), [sendCommand]);

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full h-full"
        style={{ border: 'none', aspectRatio: '16/9' }}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        onLoad={() => setLoading(false)}
      />
      
      {/* Expose controls for parent components */}
      <BunnyPlayerControls
        playerRef={{ play, pause, seek, setPlaybackRate }}
        state={playerState}
      />
    </div>
  );
}

// Hidden component to expose controls via ref pattern
function BunnyPlayerControls({ 
  playerRef, 
  state 
}: { 
  playerRef: { play: () => void; pause: () => void; seek: (time: number) => void; setPlaybackRate: (rate: number) => void };
  state: PlayerState;
}) {
  // This component exists to expose the player controls
  // The parent can access these via the BunnyVideoPlayer component
  return null;
}

// Export a hook to control the player
export function useBunnyPlayer() {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  return {
    state: { currentTime, duration, playing, ready },
    handlers: {
      onTimeUpdate: setCurrentTime,
      onDurationChange: setDuration,
      onPlay: () => setPlaying(true),
      onPause: () => setPlaying(false),
      onReady: () => setReady(true),
    },
  };
}






