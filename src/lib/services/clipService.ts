/**
 * Clip Service
 * Handles clip generation job management and clip access
 */

import { supabase } from '@/lib/supabase';

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
  approved_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
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
  video_timestamp_start: number;
  video_timestamp_end: number;
  clip_duration_seconds: number;
  quarter: number;
  game_clock_minutes: number;
  game_clock_seconds: number;
  stat_type: string;
  stat_modifier: string | null;
  points_value: number | null;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  error_message: string | null;
  created_at: string;
  generated_at: string | null;
}

export interface ClipEligibleStat {
  id: string;
  player_id: string | null;
  custom_player_id: string | null;
  player_name: string;
  team_id: string;
  stat_type: string;
  modifier: string | null;
  points: number | null;
  quarter: number;
  game_time_minutes: number;
  game_time_seconds: number;
  video_timestamp_ms: number;
  is_clip_eligible: boolean;
}

// ============================================================================
// CLIP ELIGIBILITY
// ============================================================================

/**
 * Check if a stat type is clip-eligible
 * Mirrors the database function is_clip_eligible_stat
 */
export function isClipEligible(statType: string, modifier: string | null): boolean {
  if (statType === 'field_goal' && modifier === 'made') return true;
  if (statType === 'three_pointer' && modifier === 'made') return true; // ✅ 3PT made
  if (statType === 'free_throw' && modifier === 'made') return true;
  if (statType === 'rebound') return true;
  if (statType === 'assist') return true;
  if (statType === 'steal') return true;
  if (statType === 'block') return true;
  return false;
}

/**
 * Get stats for QC review with clip eligibility marked
 */
export async function getStatsForQCReview(gameId: string): Promise<ClipEligibleStat[]> {
  try {
    // Try with video_timestamp_ms filter first (video-tracked games)
    const { data, error } = await supabase
      .from('game_stats')
      .select(`
        id,
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
        users:player_id (name),
        custom_players:custom_player_id (name)
      `)
      .eq('game_id', gameId)
      .not('video_timestamp_ms', 'is', null)
      .order('video_timestamp_ms', { ascending: true });

    if (error) {
      // If filter fails, try without video_timestamp_ms filter
      console.warn('⚠️ Trying fallback query without video_timestamp_ms filter:', error.message);
      
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('game_stats')
        .select(`
          id,
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
          users:player_id (name),
          custom_players:custom_player_id (name)
        `)
        .eq('game_id', gameId)
        .order('created_at', { ascending: true });

      if (fallbackError) {
        console.error('❌ Error fetching stats for QC:', fallbackError);
        return [];
      }

      // Filter client-side for stats with video timestamps
      const statsWithVideo = (fallbackData || []).filter(
        (s: any) => s.video_timestamp_ms != null
      );

      return statsWithVideo.map((stat: any) => ({
        id: stat.id,
        player_id: stat.player_id,
        custom_player_id: stat.custom_player_id,
        player_name: stat.users?.name || stat.custom_players?.name || 'Unknown',
        team_id: stat.team_id,
        stat_type: stat.stat_type,
        modifier: stat.modifier,
        points: stat.stat_value,
        quarter: stat.quarter,
        game_time_minutes: stat.game_time_minutes || 0,
        game_time_seconds: stat.game_time_seconds || 0,
        video_timestamp_ms: stat.video_timestamp_ms,
        is_clip_eligible: isClipEligible(stat.stat_type, stat.modifier),
      }));
    }

    return (data || []).map((stat: any) => ({
      id: stat.id,
      player_id: stat.player_id,
      custom_player_id: stat.custom_player_id,
      player_name: stat.users?.name || stat.custom_players?.name || 'Unknown',
      team_id: stat.team_id,
      stat_type: stat.stat_type,
      modifier: stat.modifier,
      points: stat.stat_value,
      quarter: stat.quarter,
      game_time_minutes: stat.game_time_minutes || 0,
      game_time_seconds: stat.game_time_seconds || 0,
      video_timestamp_ms: stat.video_timestamp_ms,
      is_clip_eligible: isClipEligible(stat.stat_type, stat.modifier),
    }));
  } catch (err) {
    console.error('❌ Exception in getStatsForQCReview:', err);
    return [];
  }
}

/**
 * Count clip-eligible stats for a game
 */
export async function countClipEligibleStats(gameId: string): Promise<number> {
  const stats = await getStatsForQCReview(gameId);
  return stats.filter(s => s.is_clip_eligible).length;
}

// ============================================================================
// JOB MANAGEMENT
// ============================================================================

/**
 * Get clip generation job for a game
 */
export async function getClipJob(gameId: string): Promise<ClipGenerationJob | null> {
  try {
    const { data, error } = await supabase
      .from('clip_generation_jobs')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false })
      .limit(1);

    // No error and we got data
    if (!error && data && data.length > 0) {
      return data[0];
    }

    // PGRST116 = no rows, 42P01 = table doesn't exist - both are OK for first time
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      console.error('❌ Error fetching clip job:', error);
    }

    return null;
  } catch (err) {
    // Table might not exist yet (migration not run)
    console.warn('⚠️ clip_generation_jobs table may not exist yet');
    return null;
  }
}

/**
 * Create a new clip generation job (submit for QC)
 */
export async function createClipJob(
  gameId: string,
  videoId: string
): Promise<ClipGenerationJob | null> {
  try {
    // Count clip-eligible stats
    const clipCount = await countClipEligibleStats(gameId);

    const { data, error } = await supabase
      .from('clip_generation_jobs')
      .insert({
        game_id: gameId,
        video_id: videoId,
        status: 'pending',
        total_clips: clipCount,
      })
      .select()
      .single();

    if (error) {
      // 42P01 = table doesn't exist
      if (error.code === '42P01') {
        console.error('❌ clip_generation_jobs table not found - run migration 030');
        throw new Error('Database migration required. Please run migration 030_multi_clipping_system_FIXED.sql');
      }
      console.error('❌ Error creating clip job:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('❌ Exception in createClipJob:', err);
    throw err;
  }
}

/**
 * Approve clip generation job (triggers backend processing)
 */
export async function approveClipJob(
  jobId: string,
  approvedBy: string
): Promise<boolean> {
  const { error } = await supabase
    .from('clip_generation_jobs')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
    })
    .eq('id', jobId);

  if (error) {
    console.error('❌ Error approving clip job:', error);
    return false;
  }

  // Trigger backend webhook (Railway)
  await triggerClipGeneration(jobId);

  return true;
}

/**
 * Request corrections (reject QC)
 */
export async function requestCorrections(
  jobId: string,
  message: string
): Promise<boolean> {
  const { error } = await supabase
    .from('clip_generation_jobs')
    .update({
      status: 'pending',
      error_message: `Corrections requested: ${message}`,
    })
    .eq('id', jobId);

  if (error) {
    console.error('❌ Error requesting corrections:', error);
    return false;
  }

  return true;
}

/**
 * Cancel clip generation job
 */
export async function cancelClipJob(jobId: string): Promise<boolean> {
  const { error } = await supabase
    .from('clip_generation_jobs')
    .update({
      status: 'cancelled',
    })
    .eq('id', jobId);

  if (error) {
    console.error('❌ Error cancelling clip job:', error);
    return false;
  }

  return true;
}

/**
 * Retry a cancelled or failed clip generation job
 * Resets status to approved and triggers backend processing
 */
export async function retryClipJob(jobId: string): Promise<boolean> {
  try {
    // Reset job status to approved and clear error
    const { error } = await supabase
      .from('clip_generation_jobs')
      .update({
        status: 'approved',
        error_message: null,
        failed_clips: 0,
        started_at: null,
        completed_at: null,
      })
      .eq('id', jobId);

    if (error) {
      console.error('❌ Error retrying clip job:', error);
      return false;
    }

    // Trigger backend webhook to start processing
    await triggerClipGeneration(jobId);

    return true;
  } catch (err) {
    console.error('❌ Exception in retryClipJob:', err);
    return false;
  }
}

/**
 * Trigger clip generation on Railway backend (exported for retry)
 */
async function triggerClipGeneration(jobId: string): Promise<void> {
  const backendUrl = process.env.NEXT_PUBLIC_CLIP_WORKER_URL;
  
  if (!backendUrl) {
    console.warn('⚠️ NEXT_PUBLIC_CLIP_WORKER_URL not configured');
    return;
  }

  try {
    const response = await fetch(`${backendUrl}/api/process-job`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId }),
    });

    if (!response.ok) {
      console.error('❌ Failed to trigger clip generation:', await response.text());
    } else {
      console.log('✅ Clip generation triggered for job:', jobId);
    }
  } catch (error) {
    console.error('❌ Error triggering clip generation:', error);
  }
}

/**
 * Get all jobs for admin dashboard
 */
export async function getAllClipJobs(): Promise<ClipGenerationJob[]> {
  try {
    const { data, error } = await supabase
      .from('clip_generation_jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // 42P01 = table doesn't exist - migration not run yet
      if (error.code === '42P01') {
        console.warn('⚠️ clip_generation_jobs table not found - run migration 030');
        return [];
      }
      console.error('❌ Error fetching all clip jobs:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn('⚠️ clip_generation_jobs table may not exist yet');
    return [];
  }
}

// ============================================================================
// CLIP ACCESS
// ============================================================================

/**
 * Get generated clips for a game
 */
export async function getGameClips(gameId: string): Promise<GeneratedClip[]> {
  const { data, error } = await supabase
    .from('generated_clips')
    .select('*')
    .eq('game_id', gameId)
    .eq('status', 'ready')
    .order('video_timestamp_start', { ascending: true });

  if (error) {
    console.error('❌ Error fetching game clips:', error);
    return [];
  }

  return data || [];
}

/**
 * Get clips for a specific player in a game
 */
export async function getPlayerClips(
  gameId: string,
  playerId: string,
  isCustomPlayer: boolean = false
): Promise<GeneratedClip[]> {
  let query = supabase
    .from('generated_clips')
    .select('*')
    .eq('game_id', gameId)
    .eq('status', 'ready')
    .order('video_timestamp_start', { ascending: true });

  if (isCustomPlayer) {
    query = query.eq('custom_player_id', playerId);
  } else {
    query = query.eq('player_id', playerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Error fetching player clips:', error);
    return [];
  }

  return data || [];
}

/**
 * Get clips grouped by stat type for a player
 */
export async function getPlayerClipsGrouped(
  gameId: string,
  playerId: string,
  isCustomPlayer: boolean = false
): Promise<Record<string, GeneratedClip[]>> {
  const clips = await getPlayerClips(gameId, playerId, isCustomPlayer);
  
  return clips.reduce((acc, clip) => {
    const key = clip.stat_type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(clip);
    return acc;
  }, {} as Record<string, GeneratedClip[]>);
}

// ============================================================================
// BACKEND INTEGRATION
// ============================================================================

/**
 * Retry a failed clip
 */
export async function retryFailedClip(clipId: string): Promise<boolean> {
  const backendUrl = process.env.NEXT_PUBLIC_CLIP_WORKER_URL;
  
  if (!backendUrl) {
    console.warn('⚠️ NEXT_PUBLIC_CLIP_WORKER_URL not configured');
    return false;
  }

  try {
    const response = await fetch(`${backendUrl}/api/retry-clip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clip_id: clipId }),
    });

    return response.ok;
  } catch (error) {
    console.error('❌ Error retrying clip:', error);
    return false;
  }
}

