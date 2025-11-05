/**
 * Photo Upload Hook
 * 
 * Custom hook for managing photo upload state and operations.
 * Single responsibility: Coordinate photo upload UI state.
 */

import { useState, useEffect, useRef } from 'react';
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
  
  // Track current blob URL for cleanup (prevent memory leaks)
  const blobUrlRef = useRef<string | null>(null);

  /**
   * Handle file selection and upload
   */
  const handleFileSelect = async (file: File): Promise<void> => {
    try {
      console.log('📤 Starting file upload process...');
      setError(null);
      setProgress(0);

      // Validate file (✅ HARDENED: Now async to verify MIME type)
      console.log('🔍 Validating file...');
      const validation = await validateImageFile(file, maxSizeMB);
      if (!validation.isValid) {
        const errorMessage = validation.error || 'Invalid file';
        console.error('❌ Validation failed:', errorMessage);
        setError(errorMessage);
        onError?.(errorMessage);
        return;
      }
      console.log('✅ Validation passed');
    } catch (err) {
      const errorMessage = `Validation error: ${err instanceof Error ? err.message : 'Unknown error'}`;
      console.error('❌ Unexpected error during validation:', err);
      setError(errorMessage);
      onError?.(errorMessage);
      return;
    }

    // ✅ FIX: Revoke old blob URL before creating new one (prevent memory leak)
    if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    blobUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);

    try {
      setUploading(true);
      setProgress(50); // Simulated progress

      // Upload to Supabase Storage
      console.log('📤 Uploading to Supabase Storage...');
      const result = await uploadPlayerPhoto(file, userId, photoType);
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

