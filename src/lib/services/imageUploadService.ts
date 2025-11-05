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
 * Verify file is actually an image by checking magic numbers (file signature)
 * Prevents renamed executables from bypassing type checks
 */
async function verifyImageMimeType(file: File): Promise<ValidationResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onloadend = (e) => {
      try {
        if (!e.target?.result) {
          resolve({ isValid: false, error: 'Unable to read file content' });
          return;
        }

        const arr = new Uint8Array(e.target.result as ArrayBuffer);
        
        // Debug: Log first bytes for troubleshooting
        console.log('🔍 File magic numbers:', Array.from(arr.slice(0, 12)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
        
        // Check magic numbers (file signatures)
        // JPEG: FF D8 FF
        if (arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF) {
          console.log('✅ Detected JPEG image');
          resolve({ isValid: true });
          return;
        }
        
        // PNG: 89 50 4E 47
        if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) {
          console.log('✅ Detected PNG image');
          resolve({ isValid: true });
          return;
        }
        
        // GIF: 47 49 46 38
        if (arr[0] === 0x47 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x38) {
          console.log('✅ Detected GIF image');
          resolve({ isValid: true });
          return;
        }
        
        // WebP: 52 49 46 46 ... 57 45 42 50
        if (arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46 &&
            arr[8] === 0x57 && arr[9] === 0x45 && arr[10] === 0x42 && arr[11] === 0x50) {
          console.log('✅ Detected WebP image');
          resolve({ isValid: true });
          return;
        }
        
        console.error('❌ Invalid file signature - not a recognized image format');
        resolve({ 
          isValid: false, 
          error: 'File is not a valid image. The file content does not match an image format (JPEG, PNG, GIF, or WebP).' 
        });
      } catch (err) {
        console.error('❌ Error processing file signature:', err);
        resolve({ 
          isValid: false, 
          error: `Error verifying file: ${err instanceof Error ? err.message : 'Unknown error'}` 
        });
      }
    };
    
    reader.onerror = (err) => {
      console.error('❌ FileReader error:', err);
      resolve({ isValid: false, error: 'Error reading file. Please try again.' });
    };
    
    try {
      // Read first 12 bytes to check magic numbers
      reader.readAsArrayBuffer(file.slice(0, 12));
    } catch (err) {
      console.error('❌ Error initiating file read:', err);
      resolve({ 
        isValid: false, 
        error: `Error reading file: ${err instanceof Error ? err.message : 'Unknown error'}` 
      });
    }
  });
}

/**
 * Validate image file before upload
 * ✅ HARDENED: Now includes MIME type verification via magic numbers
 */
export async function validateImageFile(
  file: File,
  maxSizeMB: number = DEFAULT_MAX_SIZE_MB,
  allowedTypes: string[] = DEFAULT_ALLOWED_TYPES
): Promise<ValidationResult> {
  try {
    console.log('🔍 Validating file:', { name: file.name, size: file.size, type: file.type });
    
    // Check if file exists
    if (!file) {
      console.error('❌ No file provided');
      return { isValid: false, error: 'No file selected' };
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * BYTES_IN_MB;
    if (file.size > maxSizeBytes) {
      console.error('❌ File too large:', file.size, 'bytes, max:', maxSizeBytes);
      return { 
        isValid: false, 
        error: `File size exceeds ${maxSizeMB}MB limit` 
      };
    }

    // Check file type (MIME type from browser)
    if (!allowedTypes.includes(file.type)) {
      console.error('❌ Invalid MIME type:', file.type);
      return { 
        isValid: false, 
        error: 'Invalid file type. Please upload an image file (JPEG, PNG, WebP, or GIF)' 
      };
    }

    // ✅ SECURITY: Verify actual file content (prevent renamed executables)
    console.log('🔍 Verifying file content...');
    const mimeVerification = await verifyImageMimeType(file);
    if (!mimeVerification.isValid) {
      console.error('❌ MIME verification failed:', mimeVerification.error);
      return mimeVerification;
    }

    console.log('✅ File validation passed');
    return { isValid: true };
  } catch (err) {
    console.error('❌ Unexpected error during validation:', err);
    return {
      isValid: false,
      error: `Validation error: ${err instanceof Error ? err.message : 'Unknown error'}`
    };
  }
}

// ============================================================================
// FILE NAMING
// ============================================================================

/**
 * Generate unique filename for upload
 * ✅ HARDENED: Sanitizes extension to prevent path traversal attacks
 */
export function generateUniqueFileName(userId: string, originalName: string, prefix?: string): string {
  const timestamp = Date.now();
  
  // ✅ SECURITY: Sanitize file extension (only alphanumeric chars)
  let extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  extension = extension.replace(/[^a-z0-9]/gi, ''); // Remove special chars
  
  // Whitelist only valid image extensions
  const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  if (!validExtensions.includes(extension)) {
    extension = 'jpg'; // Default to jpg if invalid
  }
  
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

  // Validate file (✅ FIX: Added await for async validation)
  const validation = await validateImageFile(file, maxSizeMB, allowedTypes);
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

