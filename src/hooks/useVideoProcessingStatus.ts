/**
 * useVideoProcessingStatus - Poll video processing status
 * 
 * Polls the API to check when Bunny.net video processing is complete.
 * Stops polling when video is ready or on error/timeout.
 * 
 * @module useVideoProcessingStatus
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface VideoStatus {
  status: string;
  statusCode: number;
  isReady: boolean;
  isError: boolean;
  duration: number;
  thumbnail: string | null;
  encodeProgress: number;
}

interface UseVideoProcessingStatusProps {
  videoId: string | null;
  enabled?: boolean;
  pollIntervalMs?: number;
  timeoutMs?: number;
  onReady?: (status: VideoStatus) => void;
  onError?: (error: string) => void;
}

interface UseVideoProcessingStatusReturn {
  status: VideoStatus | null;
  isPolling: boolean;
  error: string | null;
  refetch: () => void;
}

export function useVideoProcessingStatus({
  videoId,
  enabled = true,
  pollIntervalMs = 15000, // 15 seconds (increased for rate limiting)
  timeoutMs = 900000, // 15 minutes (longer for big files)
  onReady,
  onError,
}: UseVideoProcessingStatusProps): UseVideoProcessingStatusReturn {
  const [status, setStatus] = useState<VideoStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const backoffRef = useRef<number>(1); // Backoff multiplier for rate limiting
  const consecutiveErrorsRef = useRef<number>(0);

  const checkStatus = useCallback(async () => {
    if (!videoId) return;
    
    try {
      const response = await fetch(`/api/video/check-status?videoId=${videoId}`);
      
      // Handle rate limiting with exponential backoff
      if (response.status === 429) {
        consecutiveErrorsRef.current++;
        backoffRef.current = Math.min(backoffRef.current * 2, 8); // Max 8x backoff
        console.log(`⏳ Rate limited, backing off ${backoffRef.current}x`);
        return; // Don't throw, just skip this poll
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check status');
      }
      
      // Success - reset backoff
      consecutiveErrorsRef.current = 0;
      backoffRef.current = 1;
      
      const data = await response.json();
      setStatus(data);
      
      if (data.isReady) {
        // Video is ready - stop polling
        stopPolling();
        onReady?.(data);
      } else if (data.isError) {
        // Video processing failed
        stopPolling();
        const errorMsg = 'Video processing failed';
        setError(errorMsg);
        onError?.(errorMsg);
      }
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Status check error:', errorMsg);
      consecutiveErrorsRef.current++;
      // Don't stop polling on network errors - keep trying with backoff
      if (consecutiveErrorsRef.current > 10) {
        backoffRef.current = Math.min(backoffRef.current * 1.5, 4);
      }
    }
  }, [videoId, onReady, onError]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const startPolling = useCallback(() => {
    if (!videoId || !enabled) return;
    
    stopPolling();
    setIsPolling(true);
    setError(null);
    startTimeRef.current = Date.now();
    backoffRef.current = 1;
    consecutiveErrorsRef.current = 0;
    
    // Immediate first check
    checkStatus();
    
    // Use dynamic interval with backoff
    const scheduleNextCheck = () => {
      const dynamicInterval = pollIntervalMs * backoffRef.current;
      intervalRef.current = setTimeout(() => {
        checkStatus();
        if (intervalRef.current) {
          scheduleNextCheck(); // Schedule next check with potentially updated backoff
        }
      }, dynamicInterval);
    };
    scheduleNextCheck();
    
    // Set up timeout
    timeoutRef.current = setTimeout(() => {
      stopPolling();
      const errorMsg = 'Video processing timed out';
      setError(errorMsg);
      onError?.(errorMsg);
    }, timeoutMs);
    
  }, [videoId, enabled, pollIntervalMs, timeoutMs, checkStatus, stopPolling, onError]);

  // Start polling when videoId is provided and enabled
  useEffect(() => {
    if (videoId && enabled) {
      startPolling();
    }
    
    return () => {
      stopPolling();
    };
  }, [videoId, enabled, startPolling, stopPolling]);

  const refetch = useCallback(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    status,
    isPolling,
    error,
    refetch,
  };
}


