/**
 * Bunny.net Upload Service
 * Handles uploading generated clips to Bunny.net Storage
 */

import axios from 'axios';
import * as fs from 'fs';
import { logger } from '../utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface UploadResult {
  success: boolean;
  url?: string;
  storagePath?: string;
  error?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const BUNNY_STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY;
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'statjam-videos';
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL || 'https://statjam.b-cdn.net';
const BUNNY_STORAGE_HOSTNAME = process.env.BUNNY_STORAGE_HOSTNAME || 'storage.bunnycdn.com';

// ============================================================================
// UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload a clip file to Bunny.net Storage
 */
export async function uploadClipToBunny(
  localFilePath: string,
  storagePath: string
): Promise<UploadResult> {
  if (!BUNNY_STORAGE_API_KEY) {
    return {
      success: false,
      error: 'BUNNY_STORAGE_API_KEY not configured',
    };
  }

  // Read file
  if (!fs.existsSync(localFilePath)) {
    return {
      success: false,
      error: `File not found: ${localFilePath}`,
    };
  }

  const fileBuffer = fs.readFileSync(localFilePath);
  const fileSize = fs.statSync(localFilePath).size;

  logger.info(`📤 Uploading to Bunny.net: ${storagePath} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

  // Construct upload URL
  // Format: https://storage.bunnycdn.com/{storageZoneName}/{path}
  const uploadUrl = `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE}${storagePath}`;

  try {
    const response = await axios.put(uploadUrl, fileBuffer, {
      headers: {
        'AccessKey': BUNNY_STORAGE_API_KEY,
        'Content-Type': 'video/mp4',
        'Content-Length': fileSize,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    if (response.status === 201 || response.status === 200) {
      // Construct CDN URL
      const cdnUrl = `${BUNNY_CDN_URL}${storagePath}`;
      
      logger.info(`✅ Upload successful: ${cdnUrl}`);
      
      return {
        success: true,
        url: cdnUrl,
        storagePath,
      };
    } else {
      return {
        success: false,
        error: `Unexpected response status: ${response.status}`,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`❌ Upload failed: ${message}`);
    
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Delete a clip from Bunny.net Storage
 * Used for cleanup on failure or when retrying
 */
export async function deleteClipFromBunny(storagePath: string): Promise<boolean> {
  if (!BUNNY_STORAGE_API_KEY) {
    logger.error('BUNNY_STORAGE_API_KEY not configured');
    return false;
  }

  const deleteUrl = `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE}${storagePath}`;

  try {
    const response = await axios.delete(deleteUrl, {
      headers: {
        'AccessKey': BUNNY_STORAGE_API_KEY,
      },
    });

    if (response.status === 200 || response.status === 404) {
      logger.info(`🗑️ Deleted from Bunny.net: ${storagePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`❌ Delete failed: ${message}`);
    return false;
  }
}

/**
 * Check if a file exists in Bunny.net Storage
 */
export async function checkClipExists(storagePath: string): Promise<boolean> {
  if (!BUNNY_STORAGE_API_KEY) {
    return false;
  }

  const checkUrl = `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE}${storagePath}`;

  try {
    const response = await axios.head(checkUrl, {
      headers: {
        'AccessKey': BUNNY_STORAGE_API_KEY,
      },
    });

    return response.status === 200;
  } catch {
    return false;
  }
}

/**
 * Get the CDN URL for a storage path
 */
export function getClipCdnUrl(storagePath: string): string {
  return `${BUNNY_CDN_URL}${storagePath}`;
}

