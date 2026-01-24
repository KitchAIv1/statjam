/**
 * useWebcam Hook
 * 
 * Manages webcam access and stream.
 * Returns MediaStream from user's webcam.
 * Auto-detects mobile devices and prefers rear camera.
 * 
 * Limits: < 100 lines
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseWebcamOptions {
  enabled?: boolean;
  constraints?: MediaStreamConstraints;
}

interface UseWebcamReturn {
  stream: MediaStream | null;
  error: string | null;
  isLoading: boolean;
  start: () => Promise<void>;
  stop: () => void;
}

/** Detect if running on mobile device */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** Build video constraints with mobile rear camera support */
function buildVideoConstraints(baseConstraints: MediaStreamConstraints): MediaStreamConstraints {
  const isMobile = isMobileDevice();
  const baseVideo = baseConstraints.video;
  
  // If video is false or specific deviceId is set, use as-is
  if (!baseVideo || (typeof baseVideo === 'object' && 'deviceId' in baseVideo)) {
    return baseConstraints;
  }
  
  // On mobile: add facingMode: 'environment' for rear camera
  if (isMobile) {
    const videoObj = typeof baseVideo === 'object' ? baseVideo : {};
    return {
      ...baseConstraints,
      video: { ...videoObj, facingMode: { ideal: 'environment' } },
    };
  }
  
  // Desktop: use constraints as-is (browser picks available camera)
  return baseConstraints;
}

export function useWebcam({
  enabled = false,
  constraints = { video: true, audio: false },
}: UseWebcamOptions = {}): UseWebcamReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  
  const start = useCallback(async () => {
    if (streamRef.current) {
      return; // Already started
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const finalConstraints = buildVideoConstraints(constraints);
      console.log('📹 Requesting camera with constraints:', finalConstraints);
      const mediaStream = await navigator.mediaDevices.getUserMedia(finalConstraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);
      console.log('✅ Camera access granted');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access webcam';
      setError(errorMessage);
      console.error('❌ Webcam access error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [constraints]);
  
  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);
  
  // Auto-start/stop based on enabled flag
  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }
    
    start();
    
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
  
  return {
    stream,
    error,
    isLoading,
    start,
    stop,
  };
}

