/**
 * Tournament Live Stream Embed Component
 * 
 * Embeds YouTube or Twitch live stream for public tournament pages.
 * Uses YouTube IFrame Player API for state detection (ended, error, live).
 * Twitch uses standard iframe (different API).
 * 
 * @module TournamentLiveStreamEmbed
 */

'use client';

import { useMemo, useEffect, useRef, useState, useCallback, useId } from 'react';
import { Video, ExternalLink, Loader2 } from 'lucide-react';

export type PlayerState = 'loading' | 'unstarted' | 'playing' | 'paused' | 'buffering' | 'ended' | 'error';

interface TournamentLiveStreamEmbedProps {
  streamUrl: string;
  platform: 'youtube' | 'twitch' | 'facebook';
  className?: string;
  /** Callback when player state changes - allows parent to react (e.g., hide container when ended) */
  onStateChange?: (state: PlayerState) => void;
}

/** Extract YouTube video ID from various URL formats */
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

/** Extract Twitch channel name from URL */
function extractTwitchChannel(url: string): string | null {
  const match = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
  return match?.[1] ?? null;
}

/** Extract Facebook video URL for embedding */
function extractFacebookVideoUrl(url: string): string | null {
  // Facebook URLs can be in various formats:
  // - facebook.com/watch/live/?v=123456789
  // - facebook.com/video.php?v=123456789
  // - facebook.com/username/videos/123456789
  // - fb.watch/abc123/
  if (url.includes('facebook.com') || url.includes('fb.watch')) {
    return url;
  }
  return null;
}

/** Load YouTube IFrame API script (singleton) */
let ytApiLoaded = false;
let ytApiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (ytApiLoaded) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.body.appendChild(script);

    (window as any).onYouTubeIframeAPIReady = () => {
      ytApiLoaded = true;
      resolve();
    };
  });

  return ytApiPromise;
}

export function TournamentLiveStreamEmbed({ 
  streamUrl, 
  platform,
  className = '',
  onStateChange,
}: TournamentLiveStreamEmbedProps) {
  const [playerState, setPlayerState] = useState<PlayerState>('loading');
  const [mounted, setMounted] = useState(false);
  
  // Fix hydration mismatch - only render player after client mount
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Notify parent when state changes
  useEffect(() => {
    onStateChange?.(playerState);
  }, [playerState, onStateChange]);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const playerId = `yt-player${reactId.replace(/:/g, '-')}`; // useId() returns :r0:, sanitize for DOM

  const videoId = useMemo(() => 
    platform === 'youtube' ? extractYouTubeVideoId(streamUrl) : null
  , [streamUrl, platform]);

  const twitchChannel = useMemo(() => 
    platform === 'twitch' ? extractTwitchChannel(streamUrl) : null
  , [streamUrl, platform]);

  const facebookVideoUrl = useMemo(() => 
    platform === 'facebook' ? extractFacebookVideoUrl(streamUrl) : null
  , [streamUrl, platform]);

  // YouTube Player state change handler
  const onPlayerStateChange = useCallback((event: any) => {
    const state = event.data;
    // YT.PlayerState: UNSTARTED=-1, ENDED=0, PLAYING=1, PAUSED=2, BUFFERING=3, CUED=5
    switch (state) {
      case -1: setPlayerState('unstarted'); break;
      case 0: setPlayerState('ended'); break;
      case 1: setPlayerState('playing'); break;
      case 2: setPlayerState('paused'); break;
      case 3: setPlayerState('buffering'); break;
      default: break;
    }
  }, []);

  const onPlayerError = useCallback((event: any) => {
    // YouTube error codes: 2=invalid video ID, 5=HTML5 error, 100=not found, 101/150=embedding disabled
    const errorCode = event?.data;
    console.error('❌ [TournamentLiveStreamEmbed] YouTube player error:', errorCode, {
      2: 'Invalid video ID',
      5: 'HTML5 player error',
      100: 'Video not found or private',
      101: 'Embedding disabled by owner',
      150: 'Embedding disabled by owner',
    }[errorCode] || 'Unknown error');
    setPlayerState('error');
  }, []);

  // Initialize YouTube Player (only after client mount)
  useEffect(() => {
    if (!mounted || platform !== 'youtube' || !videoId) return;

    let isActive = true;

    const initPlayer = async () => {
      await loadYouTubeApi();
      if (!isActive || !containerRef.current) return;

      // Clean up existing player
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new (window as any).YT.Player(playerId, {
        videoId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: () => setPlayerState('unstarted'),
          onStateChange: onPlayerStateChange,
          onError: onPlayerError,
        },
      });
    };

    initPlayer();

    return () => {
      isActive = false;
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [mounted, videoId, platform, playerId, onPlayerStateChange, onPlayerError]);

  // Fallback UI for invalid URLs
  if ((platform === 'youtube' && !videoId) || (platform === 'twitch' && !twitchChannel) || (platform === 'facebook' && !facebookVideoUrl)) {
    const platformName = platform === 'youtube' ? 'YouTube' : platform === 'twitch' ? 'Twitch' : 'Facebook';
    return (
      <div className={`relative bg-black rounded-lg overflow-hidden ${className}`} style={{ aspectRatio: '16/9' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <Video className="h-8 w-8 text-white/40 mb-2" />
          <p className="text-sm text-white/60 mb-2">Unable to embed stream</p>
          <a href={streamUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-[#FF3B30] hover:underline">
            Watch on {platformName}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    );
  }

  // Twitch: Standard iframe (different API)
  if (platform === 'twitch' && twitchChannel) {
    const parentDomain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const twitchUrl = `https://player.twitch.tv/?channel=${twitchChannel}&parent=${parentDomain}&muted=true`;
    
    return (
      <div className={`relative bg-black rounded-lg overflow-hidden ${className}`} style={{ aspectRatio: '16/9' }}>
        <iframe src={twitchUrl} title="Twitch live stream" className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen" allowFullScreen />
        <LiveBadge />
      </div>
    );
  }

  // Facebook: Standard iframe with Facebook Video plugin
  if (platform === 'facebook' && facebookVideoUrl) {
    const encodedUrl = encodeURIComponent(facebookVideoUrl);
    const fbEmbedUrl = `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=false&autoplay=true&muted=true`;
    
    return (
      <div className={`relative bg-black rounded-lg overflow-hidden ${className}`} style={{ aspectRatio: '16/9' }}>
        <iframe 
          src={fbEmbedUrl} 
          title="Facebook live stream" 
          className="absolute inset-0 w-full h-full"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" 
          allowFullScreen 
        />
        <LiveBadge />
      </div>
    );
  }

  // YouTube: IFrame Player API
  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`} style={{ aspectRatio: '16/9' }} ref={containerRef}>
      {/* Only render player div after mount to prevent hydration mismatch */}
      {mounted && <div id={playerId} className="absolute inset-0 w-full h-full" />}
      
      {/* State-aware overlay */}
      {playerState === 'loading' && <LoadingOverlay />}
      {playerState === 'playing' && <LiveBadge />}
      {playerState === 'buffering' && <BufferingBadge />}
      {playerState === 'ended' && <EndedOverlay streamUrl={streamUrl} />}
      {playerState === 'error' && <ErrorOverlay streamUrl={streamUrl} />}
      {playerState === 'unstarted' && <WaitingOverlay />}
    </div>
  );
}

// --- Sub-components (kept small, inline) ---

function LiveBadge() {
  return (
    <div className="absolute top-2 left-2 z-10">
      <div className="flex items-center gap-1.5 bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        LIVE
      </div>
    </div>
  );
}

function BufferingBadge() {
  return (
    <div className="absolute top-2 left-2 z-10">
      <div className="flex items-center gap-1.5 bg-yellow-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
        <Loader2 className="w-3 h-3 animate-spin" />
        Buffering
      </div>
    </div>
  );
}

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
      <Loader2 className="w-8 h-8 text-white animate-spin" />
    </div>
  );
}

function WaitingOverlay() {
  return (
    <div className="absolute top-2 left-2 z-10">
      <div className="flex items-center gap-1.5 bg-gray-700 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
        Waiting for stream...
      </div>
    </div>
  );
}

function EndedOverlay({ streamUrl }: { streamUrl: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 text-center p-4">
      <Video className="h-8 w-8 text-white/40 mb-2" />
      <p className="text-sm text-white/80 font-semibold mb-1">Stream has ended</p>
      <a href={streamUrl} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs text-[#FF3B30] hover:underline">
        Watch replay on YouTube
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

function ErrorOverlay({ streamUrl }: { streamUrl: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 text-center p-4">
      <Video className="h-8 w-8 text-red-400/60 mb-2" />
      <p className="text-sm text-white/80 font-semibold mb-1">Stream unavailable</p>
      <a href={streamUrl} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs text-[#FF3B30] hover:underline">
        Watch on YouTube
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
