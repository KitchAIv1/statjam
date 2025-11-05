/**
 * Photo Upload Hook
 * 
 * Custom hook for managing photo upload state and operations.
 * Single responsibility: Coordinate photo upload UI state.
 */

import { useState } from 'react';
import { uploadPlayerPhoto, deletePlayerPhoto, validateImageFile } from '@/lib/services/imageUploadService';

// ============================================================================
// TYPES
// ============================================================================

export interface UsePhotoUploadOptions {
  userId: string;
  photoType: 'profile' | 'pose';
  maxSizeMB?: number;
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
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
  const { userId, photoType, maxSizeMB = 5, onSuccess, onError } = options;

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  /**
   * Handle file selection and upload
   */
  const handleFileSelect = async (file: File): Promise<void> => {
    setError(null);
    setProgress(0);

    // Validate file
    const validation = validateImageFile(file, maxSizeMB);
    if (!validation.isValid) {
      const errorMessage = validation.error || 'Invalid file';
      setError(errorMessage);
      onError?.(errorMessage);
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      setUploading(true);
      setProgress(50); // Simulated progress

      // Upload to Supabase Storage
      const result = await uploadPlayerPhoto(file, userId, photoType);
      
      setProgress(100);
      setPreviewUrl(result.publicUrl);
      onSuccess?.(result.publicUrl);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setPreviewUrl(null);
      onError?.(errorMessage);
      
      // Cleanup preview URL
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    } finally {
      setUploading(false);
    }
  };

  /**
   * Clear preview
   */
  const clearPreview = (): void => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
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

