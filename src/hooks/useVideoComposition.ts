/**
 * useVideoComposition Hook
 * 
 * Manages video composition lifecycle.
 * Limits: < 100 lines
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { VideoCompositionState } from '@/lib/services/video-composition';
import { GameOverlayData, OverlayPosition, OverlayVariant } from '@/lib/services/canvas-overlay';
import { initializeComposer, startComposition as startCompositionHelper } from './useVideoCompositionHelpers';

interface UseVideoCompositionOptions {
  videoStream: MediaStream | null;
  overlayData: GameOverlayData | null;
  enabled?: boolean;
}

interface UseVideoCompositionReturn {
  composedStream: MediaStream | null;
  state: VideoCompositionState;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  setVariant: (variant: OverlayVariant) => void;
  setPosition: (position: OverlayPosition) => void;
}

export function useVideoComposition({
  videoStream,
  overlayData,
  enabled = true,
}: UseVideoCompositionOptions): UseVideoCompositionReturn {
  const composerRef = useRef<ReturnType<typeof initializeComposer> | null>(null);
  const videoSourcePromiseRef = useRef<Promise<void> | null>(null);
  const [composedStream, setComposedStream] = useState<MediaStream | null>(null);
  const [state, setState] = useState<VideoCompositionState>({
    isComposing: false,
    error: null,
    frameCount: 0,
  });
  const [error, setError] = useState<string | null>(null);
  
  // Initialize composer
  useEffect(() => {
    const composer = initializeComposer();
    composerRef.current = composer;
    
    return () => {
      composer.destroy();
      composerRef.current = null;
    };
  }, []);
  
  // Update video source (track promise for start() to await)
  useEffect(() => {
    if (composerRef.current && videoStream) {
      videoSourcePromiseRef.current = composerRef.current.setVideoSource(videoStream).catch(err => {
        console.error('Failed to set video source:', err);
        setError(err.message);
      });
    } else if (composerRef.current && !videoStream) {
      videoSourcePromiseRef.current = composerRef.current.setVideoSource(null);
    }
  }, [videoStream]);
  
  // Update overlay data
  useEffect(() => {
    if (composerRef.current && overlayData && state.isComposing) {
      composerRef.current.updateOverlayData(overlayData);
    }
  }, [overlayData, state.isComposing]);
  
  // Start composition
  const start = useCallback(async () => {
    if (!composerRef.current || !overlayData) {
      setError('Video source or overlay data missing');
      return;
    }
    
    // Wait for video source to be set (async operation from useEffect)
    if (videoSourcePromiseRef.current) {
      await videoSourcePromiseRef.current;
    }
    
    const stream = await startCompositionHelper(
      composerRef.current,
      overlayData,
      setState,
      setError
    );
    
    setComposedStream(stream);
  }, [overlayData]);
  
  // Stop composition
  const stop = useCallback(() => {
    if (composerRef.current) {
      composerRef.current.stopComposition();
      setComposedStream(null);
    }
  }, []);
  
  // Set overlay variant
  const setVariant = useCallback((variant: OverlayVariant) => {
    if (composerRef.current) {
      composerRef.current.setOverlayVariant(variant);
    }
  }, []);

  const setPosition = useCallback((position: OverlayPosition) => {
    if (composerRef.current) {
      composerRef.current.setOverlayPosition(position);
    }
  }, []);

  // Auto-start/stop based on enabled flag
  useEffect(() => {
    // Only auto-control if enabled is explicitly true
    // If enabled is false/undefined, manual control is expected - don't interfere
    if (enabled !== true) {
      return; // Manual control mode - don't auto-start/stop
    }
    
    const shouldStart = videoStream && overlayData && !state.isComposing;
    const shouldStop = (!videoStream || !overlayData) && state.isComposing;
    
    if (shouldStart) {
      start();
    } else if (shouldStop) {
      stop();
    }
  }, [enabled, videoStream, overlayData, state.isComposing, start, stop]);
  
  return {
    composedStream,
    state,
    error,
    start,
    stop,
    setVariant,
    setPosition,
  };
}

