/**
 * Photo Upload Hook
 * 
 * Custom hook for managing photo upload state and operations.
 * Single responsibility: Coordinate photo upload UI state.
 */

import { useState, useEffect, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { uploadPlayerPhoto, deletePlayerPhoto, uploadTournamentLogo, deleteTournamentLogo, validateImageFile, extractFilePathFromUrl } from '@/lib/services/imageUploadService';

// ============================================================================
// TYPES
// ============================================================================

export interface UsePhotoUploadOptions {
  userId: string;
  photoType: 'profile' | 'pose' | 'tournament_logo';
  currentPhotoUrl?: string | null; // For cleanup of old photo
  maxSizeMB?: number;
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
  tournamentId?: string; // Required for tournament_logo type
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
  const { userId, photoType, currentPhotoUrl, maxSizeMB = 5, onSuccess, onError, tournamentId } = options;

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Track current blob URL for cleanup (prevent memory leaks)
  const blobUrlRef = useRef<string | null>(null);

  /**
   * Handle file selection and upload
   */
  const handleFileSelect = async (file: File): Promise<void> => {
    let processedFile = file;
    
    try {
      console.log('📤 Starting file upload process...');
      console.log('📦 Original file:', { name: file.name, size: `${(file.size / 1024 / 1024).toFixed(2)}MB`, type: file.type });
      setError(null);
      setProgress(0);

      // ✅ OPTIMIZATION: Compress image before validation (if needed)
      if (file.size > 1024 * 1024) { // Only compress if > 1MB
        try {
          console.log('🗜️ Compressing image...');
          const options = {
            maxSizeMB: 2, // Compress to max 2MB
            maxWidthOrHeight: 1920, // Max dimension
            useWebWorker: true,
            fileType: file.type as any,
            initialQuality: 0.8 // 80% quality
          };
          
          processedFile = await imageCompression(file, options);
          console.log('✅ Compression complete:', { 
            originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
            compressedSize: `${(processedFile.size / 1024 / 1024).toFixed(2)}MB`,
            reduction: `${(((file.size - processedFile.size) / file.size) * 100).toFixed(1)}%`
          });
        } catch (compressionErr) {
          // If compression fails, continue with original
          console.warn('⚠️ Compression failed, using original file:', compressionErr);
          processedFile = file;
        }
      } else {
        console.log('ℹ️ File already small, skipping compression');
      }

      // Validate file (✅ HARDENED: Now async to verify MIME type + dimensions)
      console.log('🔍 Validating file...');
      const validation = await validateImageFile(processedFile, maxSizeMB);
      if (!validation.isValid) {
        const errorMessage = validation.error || 'Invalid file';
        console.error('❌ Validation failed:', errorMessage);
        setError(errorMessage);
        onError?.(errorMessage);
        return;
      }
      console.log('✅ Validation passed');
    } catch (err) {
      const errorMessage = `Processing error: ${err instanceof Error ? err.message : 'Unknown error'}`;
      console.error('❌ Unexpected error during file processing:', err);
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

      // ✅ CLEANUP: Delete old photo before uploading new one (saves storage)
      if (currentPhotoUrl) {
        try {
          console.log('🗑️ Deleting old photo/logo...');
          if (photoType === 'tournament_logo' && currentPhotoUrl.includes('tournament-logos')) {
            await deleteTournamentLogo(currentPhotoUrl);
            console.log('✅ Old tournament logo deleted');
          } else if (currentPhotoUrl.includes('player-images')) {
            await deletePlayerPhoto(currentPhotoUrl);
            console.log('✅ Old player photo deleted');
          }
        } catch (deleteErr) {
          // Don't block upload if delete fails
          console.warn('⚠️ Failed to delete old photo (continuing with upload):', deleteErr);
        }
      }

      setProgress(50); // Upload progress

      // Upload to Supabase Storage
      console.log('📤 Uploading to Supabase Storage...');
      let result;
      if (photoType === 'tournament_logo') {
        if (!tournamentId) {
          throw new Error('Tournament ID required for tournament logo upload');
        }
        result = await uploadTournamentLogo(processedFile, tournamentId, userId);
      } else {
        result = await uploadPlayerPhoto(processedFile, userId, photoType);
      }
      console.log('✅ Upload successful:', result.publicUrl);
      
      setProgress(100);
      setPreviewUrl(result.publicUrl);
      onSuccess?.(result.publicUrl);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed - please try again';
      console.error('❌ Upload error:', err);
      console.error('❌ Error details:', { 
        message: err instanceof Error ? err.message : 'Unknown', 
        stack: err instanceof Error ? err.stack : undefined 
      });
      setError(errorMessage);
      setPreviewUrl(null);
      onError?.(errorMessage);
      
      // ✅ FIX: Cleanup blob URL on error
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

