/**
 * Clip Generator Service
 * Uses FFmpeg to extract clips from source videos
 */

import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface ClipConfig {
  sourceUrl: string;           // Bunny.net video URL
  startTime: number;           // Start time in seconds
  endTime: number;             // End time in seconds
  outputPath?: string;         // Optional custom output path
}

export interface ClipResult {
  success: boolean;
  outputPath?: string;
  duration?: number;
  error?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TEMP_DIR = path.join(os.tmpdir(), 'statjam-clips');
const OUTPUT_RESOLUTION = '1280x720';  // 720p
const VIDEO_BITRATE = '2500k';
const AUDIO_BITRATE = '128k';

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// ============================================================================
// CLIP EXTRACTION
// ============================================================================

/**
 * Extract a clip from a video URL
 */
export async function extractClip(config: ClipConfig): Promise<ClipResult> {
  const { sourceUrl, startTime, endTime } = config;
  const duration = endTime - startTime;
  
  // Generate output path
  const outputFileName = `clip_${uuidv4()}.mp4`;
  const outputPath = config.outputPath || path.join(TEMP_DIR, outputFileName);

  logger.info(`🎬 Extracting clip: ${startTime}s - ${endTime}s (${duration}s)`);

  return new Promise((resolve) => {
    ffmpeg(sourceUrl)
      // HTTP headers for Bunny Stream access (since Block direct url is disabled, we don't need these)
      .inputOption('-user_agent', 'Mozilla/5.0 (compatible; StatJam/1.0)')
      // Seek to start time (fast seek before input)
      .setStartTime(startTime)
      // Set duration
      .setDuration(duration)
      // Video settings
      .videoCodec('libx264')
      .size(OUTPUT_RESOLUTION)
      .videoBitrate(VIDEO_BITRATE)
      // Audio settings
      .audioCodec('aac')
      .audioBitrate(AUDIO_BITRATE)
      .audioChannels(2)
      // Output settings
      .outputOptions([
        '-preset fast',         // Fast encoding
        '-movflags +faststart', // Web streaming optimization
        '-pix_fmt yuv420p',     // Browser compatibility
      ])
      // Output file
      .output(outputPath)
      // Event handlers
      .on('start', (commandLine: string) => {
        logger.debug(`FFmpeg command: ${commandLine}`);
      })
      .on('progress', (progress: { percent?: number }) => {
        if (progress.percent) {
          logger.debug(`Progress: ${progress.percent.toFixed(1)}%`);
        }
      })
      .on('error', (err: Error) => {
        logger.error(`FFmpeg error: ${err.message}`);
        resolve({
          success: false,
          error: err.message,
        });
      })
      .on('end', () => {
        logger.info(`✅ Clip extracted: ${outputPath}`);
        resolve({
          success: true,
          outputPath,
          duration,
        });
      })
      .run();
  });
}

/**
 * Clean up temporary clip file
 */
export function cleanupClip(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.debug(`🧹 Cleaned up: ${filePath}`);
    }
  } catch (error) {
    logger.warn(`Failed to cleanup ${filePath}:`, error);
  }
}

/**
 * Get source video URL from Bunny Stream
 * Note: Source videos are in Bunny Stream (different from Storage)
 */
export function getBunnyVideoUrl(bunnyVideoId: string): string {
  // BUNNY_STREAM_CDN_URL = Bunny Stream CDN for source videos
  // BUNNY_CDN_URL = Bunny Storage CDN for clip uploads (different!)
  const streamCdnUrl = process.env.BUNNY_STREAM_CDN_URL || process.env.BUNNY_CDN_URL || 'https://statjam.b-cdn.net';
  
  // Ensure URL has protocol
  const baseUrl = streamCdnUrl.startsWith('http') ? streamCdnUrl : `https://${streamCdnUrl}`;
  
  // Use 720p version for clip extraction
  return `${baseUrl}/${bunnyVideoId}/play_720p.mp4`;
}

/**
 * Generate clip storage path for Bunny.net
 */
export function generateClipStoragePath(
  gameId: string,
  playerId: string,
  statType: string,
  timestampSeconds: number,
  quarter: number
): string {
  // Format: /clips/game_id/player_id/stat_type_XXmXXs_qX.mp4
  const minutes = Math.floor(timestampSeconds / 60);
  const seconds = Math.floor(timestampSeconds % 60);
  const timeStr = `${minutes}m${seconds.toString().padStart(2, '0')}s`;
  
  return `/clips/${gameId}/${playerId}/${statType}_${timeStr}_q${quarter}.mp4`;
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

export interface BatchClipConfig extends ClipConfig {
  clipId: string;
}

export interface BatchClipResult extends ClipResult {
  clipId: string;
}

/**
 * Process multiple clips in parallel
 */
export async function extractClipsBatch(
  clips: BatchClipConfig[],
  maxParallel: number = 10
): Promise<BatchClipResult[]> {
  const results: BatchClipResult[] = [];
  
  // Process in batches
  for (let i = 0; i < clips.length; i += maxParallel) {
    const batch = clips.slice(i, i + maxParallel);
    logger.info(`📦 Processing batch ${Math.floor(i / maxParallel) + 1} (${batch.length} clips)`);
    
    const batchResults = await Promise.all(
      batch.map(async (clip) => {
        const result = await extractClip(clip);
        return {
          ...result,
          clipId: clip.clipId,
        };
      })
    );
    
    results.push(...batchResults);
  }
  
  return results;
}

