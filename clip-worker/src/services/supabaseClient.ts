/**
 * Supabase Client for Clip Worker
 * Uses service role key for full database access
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  throw new Error('Supabase configuration missing');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================================================
// TYPES
// ============================================================================

export interface ClipGenerationJob {
  id: string;
  game_id: string;
  video_id: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'failed' | 'cancelled';
  total_clips: number;
  completed_clips: number;
  failed_clips: number;
  skipped_clips: number;
  approved_at: string | null;
  approved_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  team_filter?: 'all' | 'my_team' | 'opponent';
}

export interface GameVideo {
  id: string;
  game_id: string;
  bunny_video_id: string;
  status: string;
  duration_seconds: number | null;
}

export interface ClipEligibleStat {
  id: string;
  game_id: string;
  player_id: string | null;
  custom_player_id: string | null;
  team_id: string;
  stat_type: string;
  modifier: string | null;
  stat_value: number | null;
  quarter: number;
  game_time_minutes: number;
  game_time_seconds: number;
  video_timestamp_ms: number;
}

export interface GeneratedClip {
  id: string;
  job_id: string;
  game_id: string;
  stat_event_id: string;
  player_id: string | null;
  custom_player_id: string | null;
  team_id: string;
  bunny_clip_url: string | null;
  bunny_storage_path: string | null;
  video_timestamp_start: number;
  video_timestamp_end: number;
  clip_duration_seconds: number;
  quarter: number;
  game_clock_minutes: number;
  game_clock_seconds: number;
  stat_type: string;
  stat_modifier: string | null;
  points_value: number | null;
  status: 'pending' | 'processing' | 'ready' | 'failed' | 'skipped';
  generation_attempts: number;
  generated_at: string | null;
  error_message: string | null;
  skip_reason: string | null;
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Get job by ID
 */
export async function getJob(jobId: string): Promise<ClipGenerationJob | null> {
  const { data, error } = await supabase
    .from('clip_generation_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    logger.error(`Error fetching job ${jobId}:`, error);
    return null;
  }

  return data;
}

/**
 * Update job status
 */
export async function updateJobStatus(
  jobId: string,
  updates: Partial<ClipGenerationJob>
): Promise<boolean> {
  const { error } = await supabase
    .from('clip_generation_jobs')
    .update(updates)
    .eq('id', jobId);

  if (error) {
    logger.error(`Error updating job ${jobId}:`, error);
    return false;
  }

  return true;
}

/**
 * Get video by ID
 */
export async function getVideo(videoId: string): Promise<GameVideo | null> {
  const { data, error } = await supabase
    .from('game_videos')
    .select('id, game_id, bunny_video_id, status, duration_seconds')
    .eq('id', videoId)
    .single();

  if (error) {
    logger.error(`Error fetching video ${videoId}:`, error);
    return null;
  }

  return data;
}

// Team filter type (matches frontend)
export type TeamFilter = 'all' | 'my_team' | 'opponent';

/**
 * Get clip-eligible stats for a game
 * @param gameId - The game ID
 * @param teamFilter - Filter by team: 'all', 'my_team', or 'opponent'
 */
export async function getClipEligibleStats(
  gameId: string,
  teamFilter: TeamFilter = 'all'
): Promise<ClipEligibleStat[]> {
  // Get all stats with video timestamps that are clip-eligible
  const { data, error } = await supabase
    .from('game_stats')
    .select(`
      id,
      game_id,
      player_id,
      custom_player_id,
      team_id,
      stat_type,
      modifier,
      stat_value,
      quarter,
      game_time_minutes,
      game_time_seconds,
      video_timestamp_ms,
      is_opponent_stat
    `)
    .eq('game_id', gameId)
    .not('video_timestamp_ms', 'is', null)
    .order('video_timestamp_ms', { ascending: true });

  if (error) {
    logger.error(`Error fetching stats for game ${gameId}:`, error);
    return [];
  }

  // Filter by team first
  let filteredData = data || [];
  if (teamFilter === 'my_team') {
    filteredData = filteredData.filter((stat) => !stat.is_opponent_stat);
    logger.info(`📊 Team filter: my_team - filtered from ${data?.length || 0} to ${filteredData.length} stats`);
  } else if (teamFilter === 'opponent') {
    filteredData = filteredData.filter((stat) => stat.is_opponent_stat === true);
    logger.info(`📊 Team filter: opponent - filtered from ${data?.length || 0} to ${filteredData.length} stats`);
  } else {
    logger.info(`📊 Team filter: all - using all ${filteredData.length} stats`);
  }

  // Then filter to clip-eligible stats only
  return filteredData.filter((stat) => isClipEligible(stat.stat_type, stat.modifier));
}

/**
 * Check if a stat type is clip-eligible
 */
function isClipEligible(statType: string, modifier: string | null): boolean {
  // Made shots
  if (statType === 'field_goal' && modifier === 'made') return true;
  if (statType === 'three_pointer' && modifier === 'made') return true; // ✅ 3PT made
  if (statType === 'free_throw' && modifier === 'made') return true;
  
  // Other positive stats (no modifier check needed)
  if (statType === 'rebound') return true;
  if (statType === 'assist') return true;
  if (statType === 'steal') return true;
  if (statType === 'block') return true;
  
  return false;
}

/**
 * Get stat-specific clip timing windows
 * Returns {before, after} in seconds for context-aware clip durations
 */
function getClipTimingWindow(statType: string, modifier: string | null): { before: number; after: number } {
  // Assists need to capture the pass AND the made shot
  if (statType === 'assist') {
    return { before: 2, after: 4 };
  }
  
  // Rebounds need to capture the missed shot attempt
  if (statType === 'rebound') {
    // Offensive rebounds may lead to put-back, defensive just secures
    return { before: 4, after: 2 };
  }
  
  // Steals often lead to fast breaks
  if (statType === 'steal') {
    return { before: 2, after: 4 };
  }
  
  // Blocks need to show the shot attempt and recovery
  if (statType === 'block') {
    return { before: 2, after: 3 };
  }
  
  // Made shots - need to see setup/pass before + extra 1.5s after for celebration/reaction
  if (statType === 'field_goal' && modifier === 'made') {
    return { before: 3, after: 3.5 };
  }
  if (statType === 'three_pointer' && modifier === 'made') {
    return { before: 3, after: 3.5 };
  }
  
  // Free throws - less context needed
  if (statType === 'free_throw') {
    return { before: 1, after: 2 };
  }
  
  // Default fallback
  return { before: 2, after: 2 };
}

/**
 * Create pending clips for a job
 */
export async function createPendingClips(
  jobId: string,
  gameId: string,
  stats: ClipEligibleStat[],
  clipWindowSeconds: number = 2 // Kept for backwards compatibility, now unused
): Promise<string[]> {
  const clips = stats.map((stat) => {
    const timestampSeconds = stat.video_timestamp_ms / 1000;
    
    // Use stat-specific timing windows for better context
    const timing = getClipTimingWindow(stat.stat_type, stat.modifier);
    const startTime = Math.max(0, timestampSeconds - timing.before);
    const endTime = timestampSeconds + timing.after;

    return {
      job_id: jobId,
      game_id: gameId,
      stat_event_id: stat.id,
      player_id: stat.player_id,
      custom_player_id: stat.custom_player_id,
      team_id: stat.team_id,
      video_timestamp_start: startTime,
      video_timestamp_end: endTime,
      clip_duration_seconds: endTime - startTime,
      quarter: stat.quarter,
      game_clock_minutes: stat.game_time_minutes,
      game_clock_seconds: stat.game_time_seconds,
      stat_type: stat.stat_type,
      stat_modifier: stat.modifier,
      points_value: stat.stat_value,
      status: 'pending' as const,
    };
  });

  // Use upsert to prevent duplicates on retry
  // If clip for this stat_event already exists, update it instead of creating new
  const { data, error } = await supabase
    .from('generated_clips')
    .upsert(clips, { 
      onConflict: 'stat_event_id',
      ignoreDuplicates: false // Update existing record
    })
    .select('id');

  if (error) {
    logger.error('Error creating/updating pending clips:', error);
    return [];
  }

  return (data || []).map((c) => c.id);
}

/**
 * Get pending clips for processing
 */
export async function getPendingClips(
  jobId: string,
  limit: number = 10
): Promise<GeneratedClip[]> {
  const { data, error } = await supabase
    .from('generated_clips')
    .select('*')
    .eq('job_id', jobId)
    .eq('status', 'pending')
    .order('video_timestamp_start', { ascending: true })
    .limit(limit);

  if (error) {
    logger.error(`Error fetching pending clips for job ${jobId}:`, error);
    return [];
  }

  return data || [];
}

/**
 * Update clip status
 */
export async function updateClipStatus(
  clipId: string,
  updates: Partial<GeneratedClip>
): Promise<boolean> {
  const { error } = await supabase
    .from('generated_clips')
    .update(updates)
    .eq('id', clipId);

  if (error) {
    logger.error(`Error updating clip ${clipId}:`, error);
    return false;
  }

  return true;
}

/**
 * Increment job progress
 */
export async function incrementJobProgress(
  jobId: string,
  field: 'completed_clips' | 'failed_clips' | 'skipped_clips'
): Promise<void> {
  const { data: job } = await supabase
    .from('clip_generation_jobs')
    .select('completed_clips, failed_clips, skipped_clips')
    .eq('id', jobId)
    .single();

  if (job) {
    const currentValue = (job as any)[field] || 0;
    await supabase
      .from('clip_generation_jobs')
      .update({ [field]: currentValue + 1 })
      .eq('id', jobId);
  }
}

/**
 * Get clip by ID
 */
export async function getClip(clipId: string): Promise<GeneratedClip | null> {
  const { data, error } = await supabase
    .from('generated_clips')
    .select('*')
    .eq('id', clipId)
    .single();

  if (error) {
    logger.error(`Error fetching clip ${clipId}:`, error);
    return null;
  }

  return data;
}

/**
 * Update video assignment status when clip generation completes
 * Connects clip generation to the video pipeline status
 */
export async function updateVideoAssignmentStatus(
  videoId: string,
  status: 'pending' | 'assigned' | 'in_progress' | 'completed'
): Promise<boolean> {
  const updates: Record<string, unknown> = {
    assignment_status: status,
  };

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('game_videos')
    .update(updates)
    .eq('id', videoId);

  if (error) {
    logger.error(`Error updating video ${videoId} assignment status:`, error);
    return false;
  }

  logger.info(`✅ Video ${videoId} assignment status updated to: ${status}`);
  return true;
}

