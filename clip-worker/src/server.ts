/**
 * StatJam Clip Worker - Railway Backend Server
 * 
 * Handles clip generation jobs from Supabase webhook calls.
 * Processes clips in parallel using FFmpeg and uploads to Bunny.net.
 */

// Load environment variables FIRST (before any imports that use them)
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { processClipJob } from './jobs/processClipJob';
import { retryClip } from './jobs/retryClip';
import { checkFFmpeg } from './utils/ffmpegCheck';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * Health check endpoint
 * Used by Railway for health monitoring
 */
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const ffmpegAvailable = await checkFFmpeg();
    res.json({
      status: 'ok',
      ffmpeg: ffmpegAvailable,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Process clip generation job
 * Called by Supabase webhook when job is approved
 */
app.post('/api/process-job', async (req: Request, res: Response) => {
  try {
    const { job_id } = req.body;

    if (!job_id) {
      res.status(400).json({ error: 'job_id is required' });
      return;
    }

    logger.info(`🎬 Starting clip job: ${job_id}`);

    // Start processing in background (don't block response)
    processClipJob(job_id).catch((error) => {
      logger.error(`❌ Job ${job_id} failed:`, error);
    });

    // Immediate response
    res.json({
      status: 'processing',
      job_id,
      message: 'Clip generation started',
    });
  } catch (error) {
    logger.error('❌ Error starting job:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Retry a single failed clip
 * Called manually by admin
 */
app.post('/api/retry-clip', async (req: Request, res: Response) => {
  try {
    const { clip_id } = req.body;

    if (!clip_id) {
      res.status(400).json({ error: 'clip_id is required' });
      return;
    }

    logger.info(`🔄 Retrying clip: ${clip_id}`);

    const result = await retryClip(clip_id);

    res.json({
      status: result.success ? 'success' : 'failed',
      clip_id,
      message: result.message,
    });
  } catch (error) {
    logger.error('❌ Error retrying clip:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get job status
 * Quick status check without full DB query
 */
app.get('/api/job-status/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    
    // Import supabase client
    const { supabase } = await import('./services/supabaseClient');
    
    const { data, error } = await supabase
      .from('clip_generation_jobs')
      .select('status, total_clips, completed_clips, failed_clips, error_message')
      .eq('id', jobId)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.json(data);
  } catch (error) {
    logger.error('❌ Error fetching job status:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// ============================================================================
// JOB POLLING (for approved jobs)
// ============================================================================

let isProcessing = false;

async function pollForJobs() {
  logger.info('🔍 Polling for approved jobs...');
  
  if (isProcessing) {
    logger.info('⏳ Already processing a job, skipping poll');
    return;
  }

  try {
    const { supabase } = await import('./services/supabaseClient');
    
    // Find approved jobs waiting to be processed
    const { data: jobs, error } = await supabase
      .from('clip_generation_jobs')
      .select('id, game_id, status')
      .eq('status', 'approved')
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      logger.error('❌ Error polling for jobs:', error);
      return;
    }

    logger.info(`📊 Found ${jobs?.length || 0} approved jobs`);

    if (jobs && jobs.length > 0) {
      const job = jobs[0];
      logger.info(`🎬 Starting job: ${job.id} for game: ${job.game_id}`);
      
      isProcessing = true;
      try {
        await processClipJob(job.id);
        logger.info(`✅ Job ${job.id} completed`);
      } catch (err) {
        logger.error(`❌ Job ${job.id} failed:`, err);
      } finally {
        isProcessing = false;
      }
    }
  } catch (err) {
    logger.error('❌ Poll error:', err);
  }
}

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  logger.info(`🚀 Clip Worker running on port ${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Check FFmpeg on startup
  checkFFmpeg().then((available) => {
    if (available) {
      logger.info('✅ FFmpeg is available');
    } else {
      logger.error('❌ FFmpeg is NOT available - clips will fail!');
    }
  });

  // Start polling for approved jobs every 30 seconds
  const POLL_INTERVAL = 30000; // 30 seconds
  logger.info(`🔄 Starting job polling (every ${POLL_INTERVAL / 1000}s)`);
  setInterval(pollForJobs, POLL_INTERVAL);
  
  // Also poll immediately on startup
  setTimeout(pollForJobs, 5000);
});

export default app;

