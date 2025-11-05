/**
 * Image Upload Service
 * 
 * Handles image upload to Supabase Storage with validation and optimization.
 * Single responsibility: Manage image file uploads to storage buckets.
 */

import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface ImageUploadOptions {
  bucket: string;
  folder?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
  generateUniqueName?: boolean;
}

export interface ImageUploadResult {
  publicUrl: string;
  path: string;
  fileName: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_SIZE_MB = 5;
const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const BYTES_IN_MB = 1024 * 1024;

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate image file before upload
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = DEFAULT_MAX_SIZE_MB,
  allowedTypes: string[] = DEFAULT_ALLOWED_TYPES
): ValidationResult {
  // Check if file exists
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * BYTES_IN_MB;
  if (file.size > maxSizeBytes) {
    return { 
      isValid: false, 
      error: `File size exceeds ${maxSizeMB}MB limit` 
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'Invalid file type. Please upload an image file (JPEG, PNG, WebP, or GIF)' 
    };
  }

  return { isValid: true };
}

// ============================================================================
// FILE NAMING
// ============================================================================

/**
 * Generate unique filename for upload
 */
export function generateUniqueFileName(userId: string, originalName: string, prefix?: string): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const sanitizedPrefix = prefix ? `${prefix}-` : '';
  return `${sanitizedPrefix}${timestamp}.${extension}`;
}

/**
 * Construct file path for storage
 */
export function constructFilePath(userId: string, fileName: string, folder?: string): string {
  const folderPath = folder ? `${folder}/` : '';
  return `${userId}/${folderPath}${fileName}`;
}

// ============================================================================
// UPLOAD
// ============================================================================

/**
 * Upload image to Supabase Storage
 */
export async function uploadImage(
  file: File,
  userId: string,
  options: ImageUploadOptions
): Promise<ImageUploadResult> {
  const {
    bucket,
    folder,
    maxSizeMB = DEFAULT_MAX_SIZE_MB,
    allowedTypes = DEFAULT_ALLOWED_TYPES,
    generateUniqueName = true
  } = options;

  // Validate file
  const validation = validateImageFile(file, maxSizeMB, allowedTypes);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Check Supabase client
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  // Generate filename
  const fileName = generateUniqueName 
    ? generateUniqueFileName(userId, file.name, folder)
    : file.name;

  // Construct full path
  const filePath = constructFilePath(userId, fileName, folder);

  // Upload to storage
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return {
    publicUrl,
    path: filePath,
    fileName
  };
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete image from Supabase Storage
 */
export async function deleteImage(bucket: string, filePath: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Extract file path from public URL
 */
export function extractFilePathFromUrl(publicUrl: string, bucket: string): string | null {
  try {
    const url = new URL(publicUrl);
    const pathMatch = url.pathname.match(new RegExp(`/storage/v1/object/public/${bucket}/(.+)`));
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}

// ============================================================================
// PLAYER IMAGE HELPERS
// ============================================================================

/**
 * Upload player profile photo
 */
export async function uploadPlayerPhoto(
  file: File,
  userId: string,
  photoType: 'profile' | 'pose'
): Promise<ImageUploadResult> {
  return uploadImage(file, userId, {
    bucket: 'player-images',
    folder: photoType,
    maxSizeMB: 5,
    generateUniqueName: true
  });
}

/**
 * Delete old player photo when replacing
 */
export async function deletePlayerPhoto(publicUrl: string): Promise<void> {
  const filePath = extractFilePathFromUrl(publicUrl, 'player-images');
  if (filePath) {
    await deleteImage('player-images', filePath);
  }
}

