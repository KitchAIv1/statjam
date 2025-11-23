/**
 * Photo Upload Hook
 * 
 * Custom hook for managing photo upload state and operations.
 * Single responsibility: Coordinate photo upload UI state.
 */

import { useState, useEffect, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { uploadPlayerPhoto, uploadCustomPlayerPhoto, deletePlayerPhoto, deleteCustomPlayerPhoto, uploadTournamentLogo, deleteTournamentLogo, uploadTeamLogo, deleteTeamLogo, validateImageFile, extractFilePathFromUrl } from '@/lib/services/imageUploadService';

// ============================================================================
// TYPES
// ============================================================================

export interface UsePhotoUploadOptions {
  userId?: string; // For regular players
  customPlayerId?: string; // For custom players (NEW)
  photoType: 'profile' | 'pose' | 'tournament_logo' | 'team_logo';
  currentPhotoUrl?: string | null; // For cleanup of old photo
  maxSizeMB?: number;
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
  tournamentId?: string; // Required for tournament_logo type
  teamId?: string; // Required for team_logo type
}

export interface UsePhotoUploadReturn {
  uploading: boolean;
  progress: number;
  error: string | null;
  previewUrl: string | null;
  handleFileSelect: (file: File) => Promise<void>;
  clearPreview: () => void;
  clearError: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function usePhotoUpload(options: UsePhotoUploadOptions): UsePhotoUploadReturn {
  const { userId, customPlayerId, photoType, currentPhotoUrl, maxSizeMB = 5, onSuccess, onError, tournamentId, teamId } = options;

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Track current blob URL for cleanup (prevent memory leaks)
  const blobUrlRef = useRef<string | null>(null);
  
  // ✅ CRITICAL FIX: Capture currentPhotoUrl in a ref when upload starts
  // This prevents the URL from changing if the component re-renders during upload
  // Always initialize with the latest currentPhotoUrl from options
  const currentPhotoUrlRef = useRef<string | null | undefined>(currentPhotoUrl);
  
  useEffect(() => {
    currentPhotoUrlRef.current = currentPhotoUrl;
  }, [currentPhotoUrl]);

  /**
   * Handle file selection and upload
   */
  const handleFileSelect = async (file: File): Promise<void> => {
    const photoUrlToDeleteAtStart = currentPhotoUrlRef.current;
    let processedFile = file;
    
    try {
      setError(null);
      setProgress(0);

      // Compress image if > 1MB
      if (file.size > 1024 * 1024) {
        try {
          const options = {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: file.type as any,
            initialQuality: 0.8
          };
          processedFile = await imageCompression(file, options);
        } catch (compressionErr) {
          processedFile = file;
        }
      }

      // Validate file
      const validation = await validateImageFile(processedFile, maxSizeMB);
      if (!validation.isValid) {
        const errorMessage = validation.error || 'Invalid file';
        setError(errorMessage);
        onError?.(errorMessage);
        return;
      }
    } catch (err) {
      const errorMessage = `Processing error: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMessage);
      onError?.(errorMessage);
      return;
    }

    // ✅ FIX: Revoke old blob URL before creating new one (prevent memory leak)
    if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    // Create preview
    const objectUrl = URL.createObjectURL(processedFile);
    blobUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);

    try {
      setUploading(true);
      setProgress(30); // Pre-upload progress

      // Delete old photo before uploading new one
      if (photoUrlToDeleteAtStart) {
        try {
          if (photoType === 'tournament_logo' && photoUrlToDeleteAtStart.includes('tournament-logos')) {
            await deleteTournamentLogo(photoUrlToDeleteAtStart);
          } else if (photoType === 'team_logo' && photoUrlToDeleteAtStart.includes('team-logos')) {
            await deleteTeamLogo(photoUrlToDeleteAtStart);
          } else if (photoUrlToDeleteAtStart.includes('custom-players') && customPlayerId) {
            await deleteCustomPlayerPhoto(photoUrlToDeleteAtStart);
          } else if (photoUrlToDeleteAtStart.includes('player-images')) {
            await deletePlayerPhoto(photoUrlToDeleteAtStart);
          }
        } catch (deleteErr) {
          // Don't block upload if delete fails
          console.error('Failed to delete old photo:', deleteErr);
        }
      }

      setProgress(50);

      // Upload to Supabase Storage
      let result;
      if (photoType === 'tournament_logo') {
        if (!tournamentId) {
          throw new Error('Tournament ID required for tournament logo upload');
        }
        result = await uploadTournamentLogo(processedFile, tournamentId, userId || '');
      } else if (photoType === 'team_logo') {
        if (!teamId) {
          throw new Error('Team ID required for team logo upload');
        }
        result = await uploadTeamLogo(processedFile, teamId, userId || '');
      } else if (customPlayerId) {
        result = await uploadCustomPlayerPhoto(processedFile, customPlayerId, photoType);
      } else {
        if (!userId) {
          throw new Error('User ID or Custom Player ID required for photo upload');
        }
        result = await uploadPlayerPhoto(processedFile, userId, photoType);
      }
      
      setProgress(100);
      setPreviewUrl(result.publicUrl);
      onSuccess?.(result.publicUrl);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed - please try again';
      setError(errorMessage);
      setPreviewUrl(null);
      onError?.(errorMessage);
      
      if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    } finally {
      setUploading(false);
    }
  };

  /**
   * Clear preview
   */
  const clearPreview = (): void => {
    if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setPreviewUrl(null);
    setProgress(0);
  };

  /**
   * Clear error
   */
  const clearError = (): void => {
    setError(null);
  };

  // ✅ FIX: Cleanup blob URL on component unmount (prevent memory leak)
  useEffect(() => {
    return () => {
      if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  return {
    uploading,
    progress,
    error,
    previewUrl,
    handleFileSelect,
    clearPreview,
    clearError
  };
}

