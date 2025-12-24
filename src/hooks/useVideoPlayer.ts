/**
 * useVideoPlayer - Video player state and controls
 * 
 * Manages video playback state and provides control functions.
 * Used with the VideoPlayer component for video stat tracking.
 * 
 * @module useVideoPlayer
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { VideoPlayerState, VideoPlayerControls, PlaybackSpeed } from '@/lib/types/video';
import { VIDEO_CONFIG } from '@/lib/config/videoConfig';

interface UseVideoPlayerProps {
  videoUrl?: string;
  videoId?: string;
  onTimeUpdate?: (currentTimeMs: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (timeMs: number) => void;
}

interface UseVideoPlayerReturn {
  state: VideoPlayerState;
  controls: VideoPlayerControls;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  currentTimeMs: number;
}

export function useVideoPlayer(props: UseVideoPlayerProps): UseVideoPlayerReturn {
  const { videoUrl, videoId, onTimeUpdate, onPlay, onPause, onSeek } = props;
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  const [state, setState] = useState<VideoPlayerState>({
    videoId: videoId || '',
    url: videoUrl || '',
    duration: 0,
    currentTime: 0,
    playing: false,
    playbackRate: 1,
    volume: 1,
    muted: false,
    buffering: false,
  });
  
  // Track if video element is attached (for re-running effect)
  const [videoAttached, setVideoAttached] = useState(false);
  
  // Check for video element attachment periodically until found
  useEffect(() => {
    if (videoRef.current) {
      setVideoAttached(true);
      return;
    }
    
    // Poll for video element (handles conditional rendering)
    const checkInterval = setInterval(() => {
      if (videoRef.current) {
        setVideoAttached(true);
        clearInterval(checkInterval);
      }
    }, 100);
    
    return () => clearInterval(checkInterval);
  }, [videoUrl]); // Re-check when URL changes
  
  // Sync state when video loads
  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      console.log('⚠️ useVideoPlayer: videoRef.current is null');
      return;
    }
    
    console.log('✅ useVideoPlayer: Attaching event listeners to video element');
    
    const handleLoadedMetadata = () => {
      console.log('🎬 Video loadedmetadata: duration=', video.duration);
      setState(prev => ({
        ...prev,
        duration: video.duration,
      }));
    };
    
    const handleTimeUpdate = () => {
      setState(prev => ({
        ...prev,
        currentTime: video.currentTime,
      }));
      onTimeUpdate?.(video.currentTime * 1000);
    };
    
    const handlePlay = () => {
      setState(prev => ({ ...prev, playing: true }));
      onPlay?.();
    };
    
    const handlePause = () => {
      setState(prev => ({ ...prev, playing: false }));
      onPause?.();
    };
    
    const handleWaiting = () => {
      setState(prev => ({ ...prev, buffering: true }));
    };
    
    const handleCanPlay = () => {
      setState(prev => ({ ...prev, buffering: false }));
    };
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    
    // If metadata already loaded (video was cached), sync immediately
    if (video.duration && !isNaN(video.duration)) {
      handleLoadedMetadata();
    }
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [onTimeUpdate, onPlay, onPause, videoAttached]); // Re-run when video becomes attached
  
  // Update URL when props change
  useEffect(() => {
    setState(prev => ({
      ...prev,
      url: videoUrl || '',
      videoId: videoId || '',
    }));
  }, [videoUrl, videoId]);
  
  // Control functions
  const play = useCallback(() => {
    videoRef.current?.play();
  }, []);
  
  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, []);
  
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);
  
  const seek = useCallback((timeSeconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    // Guard against invalid values
    if (!isFinite(timeSeconds) || !isFinite(video.duration) || video.duration <= 0) {
      console.warn('Seek skipped: invalid time or duration', { timeSeconds, duration: video.duration });
      return;
    }
    
    const clampedTime = Math.max(0, Math.min(timeSeconds, video.duration));
    video.currentTime = clampedTime;
    onSeek?.(clampedTime * 1000);
  }, [onSeek]);
  
  const seekRelative = useCallback((deltaSeconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    seek(video.currentTime + deltaSeconds);
  }, [seek]);
  
  const stepFrame = useCallback((direction: 'forward' | 'backward') => {
    const video = videoRef.current;
    if (!video) return;
    
    // Pause if playing
    if (!video.paused) {
      video.pause();
    }
    
    const frameTime = VIDEO_CONFIG.frameStepMs / 1000;
    const delta = direction === 'forward' ? frameTime : -frameTime;
    seek(video.currentTime + delta);
  }, [seek]);
  
  const setPlaybackRate = useCallback((rate: PlaybackSpeed) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.playbackRate = rate;
    setState(prev => ({ ...prev, playbackRate: rate }));
  }, []);
  
  const setVolume = useCallback((volume: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.volume = Math.max(0, Math.min(1, volume));
    setState(prev => ({ ...prev, volume: video.volume }));
  }, []);
  
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !video.muted;
    setState(prev => ({ ...prev, muted: video.muted }));
  }, []);
  
  const controls: VideoPlayerControls = {
    play,
    pause,
    togglePlayPause,
    seek,
    seekRelative,
    stepFrame,
    setPlaybackRate,
    setVolume,
    toggleMute,
  };
  
  return {
    state,
    controls,
    videoRef,
    currentTimeMs: state.currentTime * 1000,
  };
}

