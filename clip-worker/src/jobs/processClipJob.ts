/**
 * Process Clip Job
 * Main job processor for clip generation
 */

import {
  getJob,
  getVideo,
  getClipEligibleStats,
  createPendingClips,
  getPendingClips,
  updateJobStatus,
  updateClipStatus,
  incrementJobProgress,
  updateVideoAssignmentStatus,
  GeneratedClip,
} from '../services/supabaseClient';
import {
  extractClip,
  cleanupClip,
  getBunnyVideoUrl,
  generateClipStoragePath,
} from '../services/clipGenerator';
import { uploadClipToBunny } from '../services/bunnyUpload';
import { logger } from '../utils/logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

const MAX_PARALLEL_CLIPS = parseInt(process.env.MAX_PARALLEL_CLIPS || '10', 10);
const CLIP_WINDOW_SECONDS = parseFloat(process.env.CLIP_WINDOW_SECONDS || '2');
const MAX_RETRY_ATTEMPTS = 3;

// ============================================================================
// MAIN JOB PROCESSOR
// ============================================================================

/**
 * Process a clip generation job
 */
export async function processClipJob(jobId: string): Promise<void> {
  logger.info(`🎬 Starting job: ${jobId}`);

  // 1. Get job details
  const job = await getJob(jobId);
  if (!job) {
    logger.error(`❌ Job not found: ${jobId}`);
    return;
  }

  // Check job is in correct state
  if (job.status !== 'approved') {
    logger.warn(`⚠️ Job ${jobId} is not approved (status: ${job.status})`);
    return;
  }

  // 2. Get video details
  const video = await getVideo(job.video_id);
  if (!video || !video.bunny_video_id) {
    logger.error(`❌ Video not found or missing bunny_video_id for job ${jobId}`);
    await updateJobStatus(jobId, {
      status: 'failed',
      error_message: 'Video not found or not processed',
    });
    return;
  }

  // 3. Update job status to processing
  await updateJobStatus(jobId, {
    status: 'processing',
    started_at: new Date().toISOString(),
  });

  try {
    // 4. Get clip-eligible stats (filtered by team if specified)
    const teamFilter = job.team_filter || 'all';
    logger.info(`🎯 Using team filter: ${teamFilter}`);
    const stats = await getClipEligibleStats(job.game_id, teamFilter);
    logger.info(`📊 Found ${stats.length} clip-eligible stats (filter: ${teamFilter})`);

    if (stats.length === 0) {
      await updateJobStatus(jobId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_clips: 0,
        completed_clips: 0,
      });
      // Update video status even if no clips
      await updateVideoAssignmentStatus(job.video_id, 'completed');
      logger.info(`✅ Job ${jobId} completed (no clips to generate)`);
      return;
    }

    // 5. Create pending clip records
    const clipIds = await createPendingClips(
      jobId,
      job.game_id,
      stats,
      CLIP_WINDOW_SECONDS
    );
    
    logger.info(`📋 Created ${clipIds.length} pending clip records`);

    // Update total clips count
    await updateJobStatus(jobId, {
      total_clips: clipIds.length,
    });

    // 6. Get source video URL
    const sourceUrl = getBunnyVideoUrl(video.bunny_video_id);
    logger.info(`🎥 Source video: ${sourceUrl}`);

    // 7. Process clips in batches
    let hasMoreClips = true;
    
    while (hasMoreClips) {
      // Get next batch of pending clips
      const pendingClips = await getPendingClips(jobId, MAX_PARALLEL_CLIPS);
      
      if (pendingClips.length === 0) {
        hasMoreClips = false;
        break;
      }

      logger.info(`📦 Processing batch of ${pendingClips.length} clips`);

      // Process batch in parallel
      await Promise.all(
        pendingClips.map((clip) => processClip(clip, sourceUrl, video.duration_seconds))
      );
    }

    // 8. Check final status
    const updatedJob = await getJob(jobId);
    if (updatedJob) {
      const processedCount = updatedJob.completed_clips + updatedJob.failed_clips + (updatedJob.skipped_clips || 0);
      const allComplete = processedCount >= updatedJob.total_clips;
      
      if (allComplete) {
        const finalStatus = updatedJob.failed_clips === 0 ? 'completed' : 'completed';
        await updateJobStatus(jobId, {
          status: finalStatus,
          completed_at: new Date().toISOString(),
        });
        
        // 9. Update video assignment status to completed (connects to admin pipeline)
        await updateVideoAssignmentStatus(job.video_id, 'completed');
        
        const skippedCount = updatedJob.skipped_clips || 0;
        logger.info(`✅ Job ${jobId} finished: ${updatedJob.completed_clips} success, ${updatedJob.failed_clips} failed, ${skippedCount} skipped`);
      }
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`❌ Job ${jobId} failed:`, error);
    
    await updateJobStatus(jobId, {
      status: 'failed',
      error_message: message,
    });
  }
}

// ============================================================================
// INDIVIDUAL CLIP PROCESSOR
// ============================================================================

/**
 * Process a single clip
 * @param clip - The clip record to process
 * @param sourceUrl - Source video URL
 * @param videoDurationSeconds - Optional video duration for validation
 */
async function processClip(
  clip: GeneratedClip, 
  sourceUrl: string, 
  videoDurationSeconds: number | null
): Promise<void> {
  const clipId = clip.id;
  logger.info(`🎬 Processing clip: ${clipId}`);

  // Pre-validation: Check if clip exceeds video duration
  if (videoDurationSeconds !== null && clip.video_timestamp_start > videoDurationSeconds) {
    logger.warn(`⏭️ Skipping clip ${clipId}: timestamp ${clip.video_timestamp_start}s exceeds video duration ${videoDurationSeconds}s`);
    
    await updateClipStatus(clipId, {
      status: 'skipped',
      error_message: `Clip timestamp (${clip.video_timestamp_start}s) exceeds video duration (${videoDurationSeconds}s)`,
    });
    await incrementJobProgress(clip.job_id, 'skipped_clips');
    return;
  }

  // Update status to processing
  await updateClipStatus(clipId, {
    status: 'processing',
    generation_attempts: clip.generation_attempts + 1,
  });

  try {
    // 1. Extract clip using FFmpeg
    const extractResult = await extractClip({
      sourceUrl,
      startTime: clip.video_timestamp_start,
      endTime: clip.video_timestamp_end,
    });

    if (!extractResult.success || !extractResult.outputPath) {
      throw new Error(extractResult.error || 'Clip extraction failed');
    }

    // 2. Generate storage path
    const playerId = clip.player_id || clip.custom_player_id || 'unknown';
    const storagePath = generateClipStoragePath(
      clip.game_id,
      playerId,
      clip.stat_type,
      clip.video_timestamp_start,
      clip.quarter
    );

    // 3. Upload to Bunny.net
    const uploadResult = await uploadClipToBunny(extractResult.outputPath, storagePath);

    // 4. Cleanup local file
    cleanupClip(extractResult.outputPath);

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Upload failed');
    }

    // 5. Update clip record with success
    await updateClipStatus(clipId, {
      status: 'ready',
      bunny_clip_url: uploadResult.url,
      bunny_storage_path: uploadResult.storagePath,
      generated_at: new Date().toISOString(),
    });

    // 6. Increment job progress
    await incrementJobProgress(clip.job_id, 'completed_clips');

    logger.info(`✅ Clip ready: ${clipId}`);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`❌ Clip ${clipId} failed:`, message);

    // Check if we should retry
    const shouldRetry = clip.generation_attempts + 1 < MAX_RETRY_ATTEMPTS;

    if (shouldRetry) {
      // Mark as pending for retry (will be picked up in next batch)
      await updateClipStatus(clipId, {
        status: 'pending',
        error_message: message,
      });
      logger.info(`🔄 Clip ${clipId} will be retried (attempt ${clip.generation_attempts + 1}/${MAX_RETRY_ATTEMPTS})`);
    } else {
      // Mark as failed permanently
      await updateClipStatus(clipId, {
        status: 'failed',
        error_message: message,
      });
      await incrementJobProgress(clip.job_id, 'failed_clips');
      logger.error(`❌ Clip ${clipId} failed permanently after ${MAX_RETRY_ATTEMPTS} attempts`);
    }
  }
}

