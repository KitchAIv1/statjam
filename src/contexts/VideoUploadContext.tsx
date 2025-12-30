'use client';

/**
 * VideoUploadContext - Global state for video upload progress
 * 
 * Provides upload state across all coach dashboard pages.
 * Enables navigation during upload while showing persistent status.
 * Supports resume capability via localStorage.
 * 
 * @module VideoUploadContext
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { VideoUploadProgress } from '@/lib/types/video';

// =============================================================================
// TYPES
// =============================================================================

interface UploadSession {
  gameId: string;
  fileName: string;
  fileSize: number;
  videoId: string;
  uploadUrl: string;
  bytesUploaded: number;
  authSignature: string;
  authExpire: number;
  libraryId: string;
  startedAt: number;
}

interface VideoUploadContextType {
  // Current upload state
  isUploading: boolean;
  progress: VideoUploadProgress | null;
  fileName: string | null;
  gameId: string | null;
  
  // Actions
  startUpload: (gameId: string, fileName: string, fileSize: number) => void;
  updateProgress: (progress: VideoUploadProgress) => void;
  completeUpload: () => void;
  cancelUpload: () => void;
  
  // Resume capability
  pendingResume: UploadSession | null;
  clearPendingResume: () => void;
  
  // Session management
  saveSession: (session: UploadSession) => void;
  getSession: () => UploadSession | null;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEY = 'statjam_video_upload_session';

// =============================================================================
// CONTEXT
// =============================================================================

const VideoUploadContext = createContext<VideoUploadContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================

interface VideoUploadProviderProps {
  children: ReactNode;
}

export function VideoUploadProvider({ children }: VideoUploadProviderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<VideoUploadProgress | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [pendingResume, setPendingResume] = useState<UploadSession | null>(null);

  // Check for pending upload session on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const session: UploadSession = JSON.parse(stored);
        // Only offer resume if session is less than 24 hours old
        const ageMs = Date.now() - session.startedAt;
        const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours
        
        if (ageMs < maxAgeMs && session.bytesUploaded > 0) {
          setPendingResume(session);
        } else {
          // Session too old, clear it
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const startUpload = useCallback((newGameId: string, newFileName: string, fileSize: number) => {
    setIsUploading(true);
    setGameId(newGameId);
    setFileName(newFileName);
    setProgress({
      bytesUploaded: 0,
      totalBytes: fileSize,
      percentage: 0,
      status: 'pending',
    });
  }, []);

  const updateProgress = useCallback((newProgress: VideoUploadProgress) => {
    setProgress(newProgress);
    
    // Update localStorage session with new progress
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const session: UploadSession = JSON.parse(stored);
        session.bytesUploaded = newProgress.bytesUploaded;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const completeUpload = useCallback(() => {
    setIsUploading(false);
    setProgress(null);
    setFileName(null);
    setGameId(null);
    setPendingResume(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const cancelUpload = useCallback(() => {
    setIsUploading(false);
    setProgress(null);
    setFileName(null);
    setGameId(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const clearPendingResume = useCallback(() => {
    setPendingResume(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const saveSession = useCallback((session: UploadSession) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, []);

  const getSession = useCallback((): UploadSession | null => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  return (
    <VideoUploadContext.Provider
      value={{
        isUploading,
        progress,
        fileName,
        gameId,
        startUpload,
        updateProgress,
        completeUpload,
        cancelUpload,
        pendingResume,
        clearPendingResume,
        saveSession,
        getSession,
      }}
    >
      {children}
    </VideoUploadContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useVideoUpload(): VideoUploadContextType {
  const context = useContext(VideoUploadContext);
  
  if (context === undefined) {
    throw new Error('useVideoUpload must be used within a VideoUploadProvider');
  }
  
  return context;
}

export { VideoUploadContext };
export type { UploadSession, VideoUploadContextType };

