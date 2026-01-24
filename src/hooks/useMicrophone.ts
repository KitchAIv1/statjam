/**
 * useMicrophone Hook
 * 
 * Manages microphone access and audio stream.
 * Provides toggle control for mute/unmute.
 * 
 * Limits: < 100 lines
 */

import { useState, useRef, useCallback } from 'react';

interface UseMicrophoneReturn {
  audioStream: MediaStream | null;
  isEnabled: boolean;
  isMuted: boolean;
  error: string | null;
  isLoading: boolean;
  start: () => Promise<void>;
  stop: () => void;
  toggleMute: () => void;
}

export function useMicrophone(): UseMicrophoneReturn {
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
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
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      });

      streamRef.current = mediaStream;
      setAudioStream(mediaStream);
      setIsEnabled(true);
      setIsMuted(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(errorMessage);
      console.error('Microphone access error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setAudioStream(null);
      setIsEnabled(false);
      setIsMuted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  return {
    audioStream,
    isEnabled,
    isMuted,
    error,
    isLoading,
    start,
    stop,
    toggleMute,
  };
}
