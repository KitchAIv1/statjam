/**
 * useWebcam Hook
 * 
 * Manages webcam access and stream.
 * Returns MediaStream from user's webcam.
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
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access webcam';
      setError(errorMessage);
      console.error('Webcam access error:', err);
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

