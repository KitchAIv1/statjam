/**
 * useVideoStatTracker - Video stat tracker state management
 * 
 * Manages video loading, upload handling, clock sync, and processing status
 * for the video-based stat tracking page.
 * 
 * @module useVideoStatTracker
 */

import { useState, useEffect, useCallback } from 'react';
import { VideoStatService } from '@/lib/services/videoStatService';
import { useVideoProcessingStatus } from '@/hooks/useVideoProcessingStatus';
import type { GameVideo, ClockSyncConfig } from '@/lib/types/video';

interface UseVideoStatTrackerProps {
  gameId: string;
  userId?: string;
}

interface UseVideoStatTrackerReturn {
  // Video state
  gameVideo: GameVideo | null;
  videoLoading: boolean;
  clockSyncConfig: ClockSyncConfig | null;
  isCalibrated: boolean;
  
  // Processing state
  processingStatus: { status: string; encodeProgress: number } | null;
  isPolling: boolean;
  processingError: string | null;
  
  // Modal state
  showSyncModal: boolean;
  setShowSyncModal: (show: boolean) => void;
  
  // Handlers
  handleUploadComplete: (bunnyVideoId: string) => Promise<void>;
  handleSyncComplete: (config: ClockSyncConfig) => Promise<void>;
}

export function useVideoStatTracker({
  gameId,
  userId,
}: UseVideoStatTrackerProps): UseVideoStatTrackerReturn {
  const [gameVideo, setGameVideo] = useState<GameVideo | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [clockSyncConfig, setClockSyncConfig] = useState<ClockSyncConfig | null>(null);
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [hasHandledReady, setHasHandledReady] = useState(false);

  // Poll for video processing status
  const { 
    status: processingStatus, 
    isPolling, 
    error: processingError 
  } = useVideoProcessingStatus({
    videoId: uploadedVideoId,
    enabled: !!uploadedVideoId && gameVideo?.status === 'processing' && !hasHandledReady,
    pollIntervalMs: 5000,
    onReady: async (status) => {
      if (hasHandledReady) return;
      setHasHandledReady(true);
      
      const video = await VideoStatService.getGameVideo(gameId);
      if (video) {
        await VideoStatService.updateVideoStatus(video.id, 'ready', undefined, status.duration);
        setGameVideo({ ...video, status: 'ready', durationSeconds: status.duration });
        setUploadedVideoId(null);
        setShowSyncModal(true);
      }
    },
    onError: () => {
      setUploadedVideoId(null);
      setHasHandledReady(false);
    },
  });

  // Load video data on mount
  useEffect(() => {
    async function loadVideo() {
      if (!gameId) return;
      
      try {
        setVideoLoading(true);
        const video = await VideoStatService.getGameVideo(gameId);
        setGameVideo(video);
        
        if (video?.status === 'processing' && video.bunnyVideoId) {
          setUploadedVideoId(video.bunnyVideoId);
        }
        
        if (video?.isCalibrated) {
          const sync = await VideoStatService.getClockSync(video.id);
          setClockSyncConfig(sync);
        }
      } catch (error) {
        console.error('Error loading video:', error);
      } finally {
        setVideoLoading(false);
      }
    }
    
    loadVideo();
  }, [gameId]);

  // Handle video upload complete
  const handleUploadComplete = useCallback(async (bunnyVideoId: string) => {
    setHasHandledReady(false);
    setUploadedVideoId(bunnyVideoId);
    
    try {
      await VideoStatService.createGameVideo(
        gameId,
        process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '',
        bunnyVideoId,
        userId || ''
      );
    } catch (err) {
      console.error('Error creating video record:', err);
    }
    
    const video = await VideoStatService.getGameVideo(gameId);
    setGameVideo(video);
    
    if (video?.status === 'ready') {
      setUploadedVideoId(null);
      setShowSyncModal(true);
    }
  }, [gameId, userId]);

  // Handle clock sync complete
  const handleSyncComplete = useCallback(async (config: ClockSyncConfig) => {
    if (!gameVideo) return;
    
    await VideoStatService.saveClockSync(gameVideo.id, config);
    setClockSyncConfig(config);
    setShowSyncModal(false);
    
    const video = await VideoStatService.getGameVideo(gameId);
    setGameVideo(video);
  }, [gameVideo, gameId]);

  const isCalibrated = !!clockSyncConfig?.jumpballTimestampMs;

  return {
    gameVideo,
    videoLoading,
    clockSyncConfig,
    isCalibrated,
    processingStatus,
    isPolling,
    processingError,
    showSyncModal,
    setShowSyncModal,
    handleUploadComplete,
    handleSyncComplete,
  };
}

