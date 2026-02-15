/**
 * Bunny.net Upload Service
 * 
 * Handles video uploads to Bunny.net Stream with resumable upload support.
 * Provides progress tracking and error handling.
 * 
 * @module bunnyUploadService
 */

import { UPLOAD_CONFIG, getBunnyConfig } from '@/lib/config/videoConfig';
import type { VideoUploadProgress } from '@/lib/types/video';
import { errorLoggingService } from '@/lib/services/errorLoggingService';

// =============================================================================
// TYPES
// =============================================================================

export interface UploadOptions {
  file: File;
  gameId: string;
  userId?: string; // For ownership verification
  onProgress?: (progress: VideoUploadProgress) => void;
  abortSignal?: AbortSignal;
}

export interface UploadResult {
  success: boolean;
  videoId?: string;
  error?: string;
}

interface CreateVideoResponse {
  guid: string;
  title: string;
  status: number;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate video file before upload
 */
export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  // Check file exists
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }
  
  // Check file size
  if (file.size > UPLOAD_CONFIG.maxFileSizeBytes) {
    return { 
      valid: false, 
      error: `File size exceeds ${UPLOAD_CONFIG.maxFileSizeGB}GB limit` 
    };
  }
  
  // Check MIME type
  if (!UPLOAD_CONFIG.allowedMimeTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Invalid file type. Please upload MP4, MOV, WebM, AVI, or MKV' 
    };
  }
  
  return { valid: true };
}

// =============================================================================
// UPLOAD FUNCTIONS
// =============================================================================

/**
 * Create a new video in Bunny Stream
 */
async function createBunnyVideo(
  title: string, 
  libraryId: string, 
  apiKey: string
): Promise<CreateVideoResponse> {
  const response = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos`,
    {
      method: 'POST',
      headers: {
        'AccessKey': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create video: ${error}`);
  }
  
  return response.json();
}

/**
 * Upload video file to Bunny Stream using TUS protocol
 * Supports resumable uploads for large files
 * 
 * Uses server-side API route to keep BUNNY_STREAM_API_KEY secure
 */
export async function uploadVideo(options: UploadOptions): Promise<UploadResult> {
  const { file, gameId, userId, onProgress, abortSignal } = options;
  
  // Validate file first
  const validation = validateVideoFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  
  try {
    // Report initial progress
    onProgress?.({
      bytesUploaded: 0,
      totalBytes: file.size,
      percentage: 0,
      status: 'pending',
    });
    
    // Call our API route to create video and get upload credentials
    // Include userId for ownership verification
    const createResponse = await fetch('/api/video/create-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId,
        filename: file.name,
        fileSize: file.size,
        userId, // For server-side ownership verification
      }),
    });
    
    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(errorData.error || 'Failed to create upload session');
    }
    
    const uploadSession = await createResponse.json();
    
    // Initiate TUS upload with server-provided credentials
    const uploadUrl = await initiateTusUpload(
      uploadSession.tusEndpoint,
      uploadSession.libraryId,
      uploadSession.videoId,
      uploadSession.authorizationSignature,
      file,
      uploadSession.authorizationExpire
    );
    
    // Perform chunked upload with progress
    await performChunkedUpload(
      uploadUrl,
      file,
      uploadSession.authorizationSignature,
      uploadSession.authorizationExpire,
      uploadSession.libraryId,
      uploadSession.videoId,
      onProgress,
      abortSignal
    );
    
    return { success: true, videoId: uploadSession.videoId };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    errorLoggingService.logError(error instanceof Error ? error : new Error(errorMessage), { gameId, action: 'video_upload_tus' });
    onProgress?.({
      bytesUploaded: 0,
      totalBytes: file.size,
      percentage: 0,
      status: 'error',
      errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Safely encode string to base64 (handles Unicode)
 */
function safeBase64Encode(str: string): string {
  // Encode to UTF-8 bytes, then to base64
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = '';
  bytes.forEach(byte => binary += String.fromCharCode(byte));
  return btoa(binary);
}

/**
 * Initiate TUS upload session
 */
async function initiateTusUpload(
  endpoint: string,
  libraryId: string,
  videoId: string,
  authSignature: string,
  file: File,
  authExpire?: number
): Promise<string> {
  const expireTime = authExpire || Math.floor(Date.now() / 1000) + 3600;
  
  // Safely encode filename (may contain Unicode characters)
  const encodedFilename = safeBase64Encode(file.name);
  const encodedFiletype = safeBase64Encode(file.type || 'video/mp4');
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'AuthorizationSignature': authSignature,
      'AuthorizationExpire': String(expireTime),
      'VideoId': videoId,
      'LibraryId': libraryId,
      'Tus-Resumable': '1.0.0',
      'Upload-Length': String(file.size),
      'Upload-Metadata': `filename ${encodedFilename},filetype ${encodedFiletype}`,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('TUS initiate error:', response.status, errorText);
    throw new Error(`Failed to initiate upload: ${response.status}`);
  }
  
  let location = response.headers.get('Location');
  if (!location) {
    throw new Error('No upload URL returned');
  }
  
  // Ensure absolute URL (Bunny returns relative path)
  if (location.startsWith('/')) {
    location = `https://video.bunnycdn.com${location}`;
  }
  
  console.log('TUS upload URL:', location);
  return location;
}

/**
 * Retry configuration for chunk uploads
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Upload a single chunk with retry logic
 */
async function uploadChunkWithRetry(
  uploadUrl: string,
  chunk: Blob,
  offset: number,
  authSignature: string,
  authExpire: number,
  libraryId: string,
  videoId: string,
  abortSignal?: AbortSignal
): Promise<void> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < RETRY_CONFIG.maxRetries; attempt++) {
    // Check for abort before each attempt
    if (abortSignal?.aborted) {
      throw new Error('Upload cancelled');
    }
    
    try {
      const response = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          'AuthorizationSignature': authSignature,
          'AuthorizationExpire': String(authExpire),
          'LibraryId': libraryId,
          'VideoId': videoId,
          'Tus-Resumable': '1.0.0',
          'Upload-Offset': String(offset),
          'Content-Type': 'application/offset+octet-stream',
        },
        body: chunk,
        signal: abortSignal,
      });
      
      if (response.ok) {
        return; // Success
      }
      
      const errorText = await response.text();
      lastError = new Error(`Chunk upload failed: ${response.status} - ${errorText}`);
      console.warn(`Chunk upload attempt ${attempt + 1} failed:`, response.status);
      
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Network error');
      
      // Don't retry on abort
      if (abortSignal?.aborted || lastError.message === 'Upload cancelled') {
        throw lastError;
      }
      
      console.warn(`Chunk upload attempt ${attempt + 1} network error:`, lastError.message);
    }
    
    // Wait before retry (exponential backoff with jitter)
    if (attempt < RETRY_CONFIG.maxRetries - 1) {
      const delay = Math.min(
        RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt) + Math.random() * 500,
        RETRY_CONFIG.maxDelayMs
      );
      console.log(`Retrying chunk upload in ${Math.round(delay)}ms...`);
      await sleep(delay);
    }
  }
  
  throw lastError || new Error('Chunk upload failed after retries');
}

/**
 * Perform chunked upload with progress tracking and retry logic
 */
async function performChunkedUpload(
  uploadUrl: string,
  file: File,
  authSignature: string,
  authExpire: number,
  libraryId: string,
  videoId: string,
  onProgress?: (progress: VideoUploadProgress) => void,
  abortSignal?: AbortSignal
): Promise<void> {
  const chunkSize = UPLOAD_CONFIG.chunkSizeBytes;
  let bytesUploaded = 0;
  
  onProgress?.({
    bytesUploaded: 0,
    totalBytes: file.size,
    percentage: 0,
    status: 'uploading',
  });
  
  while (bytesUploaded < file.size) {
    // Check for abort
    if (abortSignal?.aborted) {
      throw new Error('Upload cancelled');
    }
    
    const chunk = file.slice(bytesUploaded, bytesUploaded + chunkSize);
    
    // Upload chunk with automatic retry
    await uploadChunkWithRetry(
      uploadUrl,
      chunk,
      bytesUploaded,
      authSignature,
      authExpire,
      libraryId,
      videoId,
      abortSignal
    );
    
    bytesUploaded += chunk.size;
    
    const percentage = Math.round((bytesUploaded / file.size) * 100);
    onProgress?.({
      bytesUploaded,
      totalBytes: file.size,
      percentage,
      status: bytesUploaded >= file.size ? 'processing' : 'uploading',
    });
  }
}

/**
 * Translate technical errors to user-friendly messages
 */
export function getUploadErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    'Failed to fetch': 'Connection interrupted. Please check your internet and try again.',
    'Network error': 'Network connection lost. Please check your internet and retry.',
    'Upload cancelled': 'Upload was cancelled.',
    'Chunk upload failed after retries': 'Upload failed after multiple attempts. Please try again.',
    'Failed to initiate upload': 'Could not start upload. Please refresh and try again.',
    'No upload URL returned': 'Server error. Please try again later.',
  };
  
  // Check for partial matches
  for (const [key, message] of Object.entries(errorMap)) {
    if (error.includes(key)) {
      return message;
    }
  }
  
  return error;
}

/**
 * Check video processing status
 */
export async function checkVideoStatus(
  videoId: string
): Promise<{ status: string; ready: boolean }> {
  const config = getBunnyConfig();
  
  if (!config.libraryId || !config.streamApiKey) {
    throw new Error('Bunny.net not configured');
  }
  
  const response = await fetch(
    `https://video.bunnycdn.com/library/${config.libraryId}/videos/${videoId}`,
    {
      headers: { 'AccessKey': config.streamApiKey },
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to check video status');
  }
  
  const data = await response.json();
  
  // Bunny Stream status codes: 0 = created, 1 = uploaded, 2 = processing, 3 = ready
  return {
    status: ['created', 'uploaded', 'processing', 'ready'][data.status] || 'unknown',
    ready: data.status >= 3,
  };
}

/**
 * Get video embed URL
 */
export function getVideoEmbedUrl(videoId: string): string {
  const config = getBunnyConfig();
  return `https://iframe.mediadelivery.net/embed/${config.libraryId}/${videoId}`;
}

/**
 * Get video direct URL for custom player
 * Note: Bunny Stream encodes to specific resolutions, try 720p first
 */
export function getVideoDirectUrl(videoId: string, resolution: '360p' | '480p' | '720p' | '1080p' = '720p'): string {
  const config = getBunnyConfig();
  // Bunny Stream direct play URL with resolution
  return `https://${config.cdnHostname}/${videoId}/play_${resolution}.mp4`;
}

/**
 * Get HLS playlist URL for adaptive streaming
 */
export function getVideoHlsUrl(videoId: string): string {
  const config = getBunnyConfig();
  return `https://${config.cdnHostname}/${videoId}/playlist.m3u8`;
}

// =============================================================================
// SERVICE EXPORT
// =============================================================================

export const BunnyUploadService = {
  validateVideoFile,
  uploadVideo,
  checkVideoStatus,
  getVideoEmbedUrl,
  getVideoDirectUrl,
  getVideoHlsUrl,
  getUploadErrorMessage,
};

