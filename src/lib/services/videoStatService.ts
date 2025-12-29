/**
 * Video Stat Service
 * 
 * Handles video-related database operations for stat tracking.
 * Manages game videos, clock sync, and video-stat linking.
 * 
 * @module videoStatService
 */

import { supabase } from '@/lib/supabase';
import type { 
  GameVideo, 
  ClockSyncConfig, 
  VideoStat,
  ClipConfig 
} from '@/lib/types/video';

// Re-export types for consumers
export type { ClockSyncConfig };
import { VIDEO_CONFIG } from '@/lib/config/videoConfig';

// =============================================================================
// GAME VIDEOS
// =============================================================================

/**
 * Get video for a game
 */
export async function getGameVideo(gameId: string): Promise<GameVideo | null> {
  if (!supabase) throw new Error('Supabase not initialized');
  
  const { data, error } = await supabase
    .from('game_videos')
    .select('*')
    .eq('game_id', gameId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching game video:', error);
    throw new Error('Failed to fetch game video');
  }
  
  return data ? transformGameVideo(data) : null;
}

/**
 * Create a game video record
 */
export async function createGameVideo(
  gameId: string,
  bunnyLibraryId: string,
  bunnyVideoId: string,
  uploadedBy: string,
  originalFilename?: string,
  fileSizeBytes?: number
): Promise<GameVideo> {
  if (!supabase) throw new Error('Supabase not initialized');
  
  const { data, error } = await supabase
    .from('game_videos')
    .insert({
      game_id: gameId,
      bunny_library_id: bunnyLibraryId,
      bunny_video_id: bunnyVideoId,
      uploaded_by: uploadedBy,
      original_filename: originalFilename,
      file_size_bytes: fileSizeBytes,
      status: 'processing',
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating game video:', error);
    throw new Error('Failed to create game video record');
  }
  
  return transformGameVideo(data);
}

/**
 * Update video status
 */
export async function updateVideoStatus(
  videoId: string,
  status: 'uploading' | 'processing' | 'ready' | 'failed',
  errorMessage?: string,
  durationSeconds?: number
): Promise<void> {
  if (!supabase) throw new Error('Supabase not initialized');
  
  // Calculate due date (24 hours from now) when video becomes ready
  const dueAt = status === 'ready' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined;
  
  const { error } = await supabase
    .from('game_videos')
    .update({
      status,
      error_message: errorMessage,
      duration_seconds: durationSeconds,
      // Set assignment status to 'pending' when ready for tracking queue
      ...(status === 'ready' && { 
        assignment_status: 'pending',
        due_at: dueAt,
      }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', videoId);
  
  if (error) {
    console.error('Error updating video status:', error);
    throw new Error('Failed to update video status');
  }
}

// =============================================================================
// CLOCK SYNC
// =============================================================================

/**
 * Save clock sync calibration
 * Note: All timestamp values are rounded to integers (DB columns are INTEGER type)
 */
export async function saveClockSync(
  videoId: string,
  config: ClockSyncConfig
): Promise<void> {
  if (!supabase) throw new Error('Supabase not initialized');
  
  // Helper to safely round to integer (null-safe)
  const toInt = (val: number | null | undefined): number | null => 
    val != null ? Math.round(val) : null;
  
  const { error } = await supabase
    .from('game_videos')
    .update({
      jumpball_timestamp_ms: toInt(config.jumpballTimestampMs),
      halftime_timestamp_ms: toInt(config.halftimeTimestampMs),
      quarter_length_minutes: config.quarterLengthMinutes,
      q2_start_timestamp_ms: toInt(config.q2StartTimestampMs),
      q3_start_timestamp_ms: toInt(config.q3StartTimestampMs),
      q4_start_timestamp_ms: toInt(config.q4StartTimestampMs),
      ot1_start_timestamp_ms: toInt(config.ot1StartTimestampMs),
      ot2_start_timestamp_ms: toInt(config.ot2StartTimestampMs),
      ot3_start_timestamp_ms: toInt(config.ot3StartTimestampMs),
      is_calibrated: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', videoId);
  
  if (error) {
    console.error('Error saving clock sync:', error);
    throw new Error('Failed to save clock sync');
  }
}

/**
 * Get clock sync config for a video
 */
export async function getClockSync(videoId: string): Promise<ClockSyncConfig | null> {
  if (!supabase) throw new Error('Supabase not initialized');
  
  const { data, error } = await supabase
    .from('game_videos')
    .select(`
      jumpball_timestamp_ms,
      halftime_timestamp_ms,
      quarter_length_minutes,
      q2_start_timestamp_ms,
      q3_start_timestamp_ms,
      q4_start_timestamp_ms,
      ot1_start_timestamp_ms,
      ot2_start_timestamp_ms,
      ot3_start_timestamp_ms,
      is_calibrated
    `)
    .eq('id', videoId)
    .single();
  
  console.log(`🔍 getClockSync DB result: videoId=${videoId}, jumpballMs=${data?.jumpball_timestamp_ms}, quarterLen=${data?.quarter_length_minutes}, isCalibrated=${data?.is_calibrated}, error=${error?.message || 'none'}`);
  
  if (error || !data || !data.is_calibrated) {
    console.log('⚠️ getClockSync returning null:', { error: !!error, hasData: !!data, isCalibrated: data?.is_calibrated });
    return null;
  }
  
  const config = {
    jumpballTimestampMs: data.jumpball_timestamp_ms,
    halftimeTimestampMs: data.halftime_timestamp_ms,
    quarterLengthMinutes: data.quarter_length_minutes,
    q2StartTimestampMs: data.q2_start_timestamp_ms,
    q3StartTimestampMs: data.q3_start_timestamp_ms,
    q4StartTimestampMs: data.q4_start_timestamp_ms,
    ot1StartTimestampMs: data.ot1_start_timestamp_ms,
    ot2StartTimestampMs: data.ot2_start_timestamp_ms,
    ot3StartTimestampMs: data.ot3_start_timestamp_ms,
  };
  
  console.log('✅ getClockSync returning config:', config);
  return config;
}

// =============================================================================
// VIDEO STATS
// =============================================================================

interface RecordVideoStatParams {
  gameId: string;
  videoId: string;
  playerId?: string; // Optional for custom players or opponent stats
  customPlayerId?: string; // For custom players (coach mode)
  isOpponentStat?: boolean; // For coach mode opponent stats
  teamId: string;
  statType: string;
  modifier?: string;
  videoTimestampMs: number;
  quarter: number;
  gameTimeMinutes: number;
  gameTimeSeconds: number;
  shotLocationX?: number;
  shotLocationY?: number;
  shotZone?: string;
}

/**
 * Record a stat with video timestamp
 * Uses raw HTTP to Supabase REST API (same pattern as GameServiceV3)
 */
export async function recordVideoStat(params: RecordVideoStatParams): Promise<string> {
  const {
    gameId,
    playerId,
    customPlayerId,
    isOpponentStat = false,
    teamId,
    statType,
    modifier,
    videoTimestampMs,
    quarter,
    gameTimeMinutes,
    gameTimeSeconds,
    shotLocationX,
    shotLocationY,
    shotZone,
  } = params;
  
  // Determine stat value based on type
  let statValue = 1;
  if (statType === 'three_pointer' && modifier === 'made') statValue = 3;
  else if (statType === 'field_goal' && modifier === 'made') statValue = 2;
  else if (statType === 'free_throw' && modifier === 'made') statValue = 1;
  
  // Get access token from authServiceV2 localStorage
  const accessToken = typeof window !== 'undefined' 
    ? localStorage.getItem('sb-access-token') 
    : null;
    
  if (!accessToken) {
    throw new Error('No access token found - user not authenticated');
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }
  
  // Ensure video_timestamp_ms is an integer (DB column is integer type)
  const videoTimestampMsInt = Math.round(videoTimestampMs);
  
  const payload = {
    game_id: gameId,
    player_id: playerId || null,
    custom_player_id: customPlayerId || null,
    is_opponent_stat: isOpponentStat,
    team_id: teamId,
    stat_type: statType,
    modifier: modifier || null,
    stat_value: statValue,
    quarter,
    game_time_minutes: gameTimeMinutes,
    game_time_seconds: gameTimeSeconds,
    video_timestamp_ms: videoTimestampMsInt,
    shot_location_x: shotLocationX ?? null,
    shot_location_y: shotLocationY ?? null,
    shot_zone: shotZone || null,
  };
  
  console.log(`💾 recordVideoStat payload: quarter=${quarter}, gameTimeMin=${gameTimeMinutes}, gameTimeSec=${gameTimeSeconds}, videoMs=${videoTimestampMsInt}, statType=${statType}, isOpponentStat=${isOpponentStat}, customPlayerId=${customPlayerId || 'none'}`);
  
  // Use raw HTTP request with proper auth (bypasses broken Supabase client)
  const response = await fetch(`${supabaseUrl}/rest/v1/game_stats`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error recording video stat:', response.status, errorText);
    throw new Error(`Failed to record stat: ${response.status}`);
  }
  
  const result = await response.json();
  const savedStat = Array.isArray(result) ? result[0] : result;
  
  if (!savedStat || !savedStat.id) {
    throw new Error('Failed to record stat - no ID returned');
  }
  
  // Update stats count on video
  await updateStatsCount(gameId);
  
  // ✅ FIX: Update game clock state for minutes calculation
  await updateGameClockState(gameId, quarter, gameTimeMinutes, gameTimeSeconds);
  
  return savedStat.id;
}

/**
 * Get all stats with video timestamps for a game
 */
export async function getVideoStats(gameId: string): Promise<VideoStat[]> {
  if (!supabase) throw new Error('Supabase not initialized');
  
  const { data, error } = await supabase
    .from('game_stats')
    .select(`
      id,
      game_id,
      player_id,
      custom_player_id,
      is_opponent_stat,
      team_id,
      stat_type,
      modifier,
      stat_value,
      quarter,
      game_time_minutes,
      game_time_seconds,
      video_timestamp_ms,
      shot_location_x,
      shot_location_y,
      shot_zone,
      created_at
    `)
    .eq('game_id', gameId)
    .not('video_timestamp_ms', 'is', null)
    .order('video_timestamp_ms', { ascending: false });
  
  if (error) {
    console.error('Error fetching video stats:', error);
    throw new Error('Failed to fetch video stats');
  }
  
  // Fetch player names
  const playerIds = new Set<string>();
  const customPlayerIds = new Set<string>();
  
  (data || []).forEach((stat: Record<string, unknown>) => {
    if (stat.player_id) playerIds.add(stat.player_id as string);
    if (stat.custom_player_id) customPlayerIds.add(stat.custom_player_id as string);
  });
  
  // Get player names in parallel
  const [players, customPlayers] = await Promise.all([
    playerIds.size > 0 ? fetchPlayerNames(Array.from(playerIds)) : new Map(),
    customPlayerIds.size > 0 ? fetchCustomPlayerNames(Array.from(customPlayerIds)) : new Map(),
  ]);
  
  return (data || []).map((stat: Record<string, unknown>) => {
    // Combine minutes and seconds into total seconds for display
    const minutes = (stat.game_time_minutes as number) || 0;
    const seconds = (stat.game_time_seconds as number) || 0;
    const totalClockSeconds = minutes * 60 + seconds;
    const isOpponentStat = stat.is_opponent_stat === true;
    
    return {
      id: stat.id as string,
      gameStatId: stat.id as string,
      videoTimestampMs: stat.video_timestamp_ms as number,
      quarter: stat.quarter as number,
      gameClockSeconds: totalClockSeconds,
      playerId: stat.player_id as string | null,
      customPlayerId: stat.custom_player_id as string | null,
      isOpponentStat,
      // For opponent stats, return 'Opponent' as placeholder; timeline will use opponentName prop
      playerName: isOpponentStat ? 'Opponent' : getPlayerName(stat, players, customPlayers),
      jerseyNumber: '', // TODO: Fetch from roster
      teamId: stat.team_id as string,
      statType: stat.stat_type as string,
      modifier: stat.modifier as string | undefined,
      statValue: stat.stat_value as number,
      shotLocationX: stat.shot_location_x as number | undefined,
      shotLocationY: stat.shot_location_y as number | undefined,
      shotZone: stat.shot_zone as string | undefined,
      createdAt: stat.created_at as string,
    };
  });
}

/**
 * Update stats count on game video
 */
export async function updateStatsCount(gameId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not initialized');
  
  // Count stats with video timestamps
  const { count, error: countError } = await supabase
    .from('game_stats')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', gameId)
    .not('video_timestamp_ms', 'is', null);
  
  if (countError) {
    console.error('Error counting stats:', countError);
    return;
  }
  
  // Update game video
  const { error } = await supabase
    .from('game_videos')
    .update({ stats_count: count || 0 })
    .eq('game_id', gameId);
  
  if (error) {
    console.error('Error updating stats count:', error);
  }
}

/**
 * Update game clock state for minutes calculation
 * ✅ FIX: Video tracking needs to keep game clock in sync for player minutes
 */
export async function updateGameClockState(
  gameId: string,
  quarter: number,
  gameTimeMinutes: number,
  gameTimeSeconds: number
): Promise<void> {
  if (!supabase) throw new Error('Supabase not initialized');
  
  try {
    const { error } = await supabase
      .from('games')
      .update({
        quarter,
        game_clock_minutes: gameTimeMinutes,
        game_clock_seconds: gameTimeSeconds,
      })
      .eq('id', gameId);
    
    if (error) {
      console.error('Error updating game clock state:', error);
    }
  } catch (e) {
    // Non-critical - don't throw, just log
    console.warn('⚠️ Could not update game clock state:', e);
  }
}

/**
 * Backfill game clock state from the latest video stat
 * ✅ FIX: For existing video-tracked games, sync game clock from latest stat
 */
export async function backfillGameClockFromStats(gameId: string): Promise<boolean> {
  if (!supabase) throw new Error('Supabase not initialized');
  
  try {
    // Get the latest stat with video timestamp (most recent in game)
    const { data: stats, error: statsError } = await supabase
      .from('game_stats')
      .select('quarter, game_time_minutes, game_time_seconds')
      .eq('game_id', gameId)
      .not('video_timestamp_ms', 'is', null)
      .order('video_timestamp_ms', { ascending: false })
      .limit(1);
    
    if (statsError || !stats || stats.length === 0) {
      console.warn('⚠️ No video stats found for game clock backfill');
      return false;
    }
    
    const latestStat = stats[0];
    console.log(`📊 Backfilling game clock from latest stat: Q${latestStat.quarter} ${latestStat.game_time_minutes}:${latestStat.game_time_seconds}`);
    
    // Update the game's clock state
    const { error: updateError } = await supabase
      .from('games')
      .update({
        quarter: latestStat.quarter,
        game_clock_minutes: latestStat.game_time_minutes,
        game_clock_seconds: latestStat.game_time_seconds,
      })
      .eq('id', gameId);
    
    if (updateError) {
      console.error('Error backfilling game clock:', updateError);
      return false;
    }
    
    console.log('✅ Game clock backfilled successfully');
    return true;
  } catch (e) {
    console.error('Error in backfillGameClockFromStats:', e);
    return false;
  }
}

// =============================================================================
// CLIP CONFIG
// =============================================================================

/**
 * Get or create clip config for a game
 */
export async function getClipConfig(gameId: string): Promise<ClipConfig> {
  if (!supabase) throw new Error('Supabase not initialized');
  
  const { data, error } = await supabase
    .from('clip_configs')
    .select('*')
    .eq('game_id', gameId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching clip config:', error);
    throw new Error('Failed to fetch clip config');
  }
  
  if (data) {
    return transformClipConfig(data);
  }
  
  // Create default config
  return createDefaultClipConfig(gameId);
}

/**
 * Create default clip config
 */
async function createDefaultClipConfig(gameId: string): Promise<ClipConfig> {
  if (!supabase) throw new Error('Supabase not initialized');
  
  const { data, error } = await supabase
    .from('clip_configs')
    .insert({
      game_id: gameId,
      clip_before_ms: VIDEO_CONFIG.defaultClipBeforeMs,
      clip_after_ms: VIDEO_CONFIG.defaultClipAfterMs,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating clip config:', error);
    throw new Error('Failed to create clip config');
  }
  
  return transformClipConfig(data);
}

// =============================================================================
// HELPERS
// =============================================================================

async function fetchPlayerNames(ids: string[]): Promise<Map<string, string>> {
  if (!supabase) return new Map();
  
  const { data } = await supabase
    .from('users')
    .select('id, name')
    .in('id', ids);
  
  const map = new Map<string, string>();
  (data || []).forEach((p: { id: string; name: string }) => map.set(p.id, p.name));
  return map;
}

async function fetchCustomPlayerNames(ids: string[]): Promise<Map<string, string>> {
  if (!supabase) return new Map();
  
  const { data } = await supabase
    .from('custom_players')
    .select('id, name')
    .in('id', ids);
  
  const map = new Map<string, string>();
  (data || []).forEach((p: { id: string; name: string }) => map.set(p.id, p.name));
  return map;
}

function getPlayerName(
  stat: Record<string, unknown>,
  players: Map<string, string>,
  customPlayers: Map<string, string>
): string {
  if (stat.player_id) {
    return players.get(stat.player_id as string) || 'Unknown';
  }
  if (stat.custom_player_id) {
    return customPlayers.get(stat.custom_player_id as string) || 'Unknown';
  }
  return 'Unknown';
}

function transformGameVideo(data: Record<string, unknown>): GameVideo {
  return {
    id: data.id as string,
    gameId: data.game_id as string,
    bunnyLibraryId: data.bunny_library_id as string,
    bunnyVideoId: data.bunny_video_id as string,
    originalFilename: data.original_filename as string | null,
    fileSizeBytes: data.file_size_bytes as number | null,
    durationSeconds: data.duration_seconds as number | null,
    status: data.status as GameVideo['status'],
    errorMessage: data.error_message as string | null,
    jumpballTimestampMs: data.jumpball_timestamp_ms as number | null,
    halftimeTimestampMs: data.halftime_timestamp_ms as number | null,
    quarterLengthMinutes: (data.quarter_length_minutes as 8 | 10 | 12) || 12,
    q2StartTimestampMs: data.q2_start_timestamp_ms as number | null,
    q3StartTimestampMs: data.q3_start_timestamp_ms as number | null,
    q4StartTimestampMs: data.q4_start_timestamp_ms as number | null,
    ot1StartTimestampMs: data.ot1_start_timestamp_ms as number | null,
    ot2StartTimestampMs: data.ot2_start_timestamp_ms as number | null,
    ot3StartTimestampMs: data.ot3_start_timestamp_ms as number | null,
    isCalibrated: data.is_calibrated as boolean,
    statsCount: data.stats_count as number,
    // Assignment workflow
    assignedStatAdminId: data.assigned_stat_admin_id as string | null,
    assignmentStatus: (data.assignment_status as GameVideo['assignmentStatus']) || 'pending',
    assignedAt: data.assigned_at as string | null,
    dueAt: data.due_at as string | null,
    completedAt: data.completed_at as string | null,
    // Audit
    uploadedBy: data.uploaded_by as string | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function transformClipConfig(data: Record<string, unknown>): ClipConfig {
  return {
    id: data.id as string,
    gameId: data.game_id as string,
    clipBeforeMs: data.clip_before_ms as number,
    clipAfterMs: data.clip_after_ms as number,
    generateMadeFg: data.generate_made_fg as boolean,
    generateMade3pt: data.generate_made_3pt as boolean,
    generateMadeFt: data.generate_made_ft as boolean,
    generateAssists: data.generate_assists as boolean,
    generateBlocks: data.generate_blocks as boolean,
    generateSteals: data.generate_steals as boolean,
    generateDunks: data.generate_dunks as boolean,
    outputResolution: data.output_resolution as ClipConfig['outputResolution'],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

// =============================================================================
// BACKFILL VIDEO TIMESTAMPS
// =============================================================================

/**
 * Calculate video timestamp from game clock
 * Used for backfilling existing stats after jumpball sync
 * Also used by StatEditForm to recalculate video_timestamp_ms when game clock is edited
 */
export function calculateVideoTimestamp(
  config: ClockSyncConfig,
  quarter: number,
  gameTimeMinutes: number,
  gameTimeSeconds: number
): number {
  const quarterLengthMs = config.quarterLengthMinutes * 60 * 1000;
  const overtimeLengthMs = VIDEO_CONFIG.overtimeLengthMinutes * 60 * 1000;
  
  // Calculate quarter start (estimate based on jumpball)
  const isOT = quarter > 4;
  const regularQuarters = Math.min(quarter - 1, 4);
  const otPeriods = Math.max(0, quarter - 5);
  
  const quarterStartMs = config.jumpballTimestampMs + 
    (regularQuarters * quarterLengthMs) + 
    (otPeriods * overtimeLengthMs);
  
  // Calculate time into quarter (time remaining → elapsed)
  const currentQuarterLengthMs = isOT ? overtimeLengthMs : quarterLengthMs;
  const timeRemainingMs = (gameTimeMinutes * 60 + gameTimeSeconds) * 1000;
  const elapsedMs = currentQuarterLengthMs - timeRemainingMs;
  
  return quarterStartMs + elapsedMs;
}

/**
 * Backfill video timestamps for existing stats after jumpball sync
 * Updates all stats that have game clock but no video timestamp
 */
export async function backfillVideoTimestamps(
  gameId: string,
  config: ClockSyncConfig
): Promise<number> {
  if (!supabase) throw new Error('Supabase not initialized');
  
  // Get stats without video_timestamp_ms
  const { data: stats, error: fetchError } = await supabase
    .from('game_stats')
    .select('id, quarter, game_time_minutes, game_time_seconds')
    .eq('game_id', gameId)
    .is('video_timestamp_ms', null);
  
  if (fetchError) {
    console.error('Error fetching stats for backfill:', fetchError);
    throw new Error('Failed to fetch stats for backfill');
  }
  
  if (!stats || stats.length === 0) {
    console.log('📊 No stats to backfill (all stats already have video timestamps or no stats exist)');
    return 0;
  }
  
  console.log(`📊 Backfilling video timestamps for ${stats.length} stats...`);
  console.log('📊 Sample stat to backfill:', stats[0]);
  
  // Get access token for batch update
  const accessToken = typeof window !== 'undefined'
    ? localStorage.getItem('sb-access-token')
    : null;
  
  if (!accessToken) {
    throw new Error('No access token found - user not authenticated');
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }
  
  // Update each stat with calculated video timestamp
  let updatedCount = 0;
  for (const stat of stats) {
    const videoMs = calculateVideoTimestamp(
      config,
      stat.quarter,
      stat.game_time_minutes || 0,
      stat.game_time_seconds || 0
    );
    
    const response = await fetch(
      `${supabaseUrl}/rest/v1/game_stats?id=eq.${stat.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ video_timestamp_ms: Math.round(videoMs) })
      }
    );
    
    if (response.ok) {
      updatedCount++;
    } else {
      const errorText = await response.text();
      console.error(`❌ Failed to update stat ${stat.id}:`, response.status, errorText);
    }
  }
  
  console.log(`✅ Backfilled ${updatedCount}/${stats.length} stats`);
  
  // Verify the update worked
  if (updatedCount > 0) {
    const { data: verifyData } = await supabase
      .from('game_stats')
      .select('id, video_timestamp_ms')
      .eq('game_id', gameId)
      .not('video_timestamp_ms', 'is', null)
      .limit(5);
    console.log('📊 Verification - stats with video_timestamp_ms:', verifyData?.length || 0);
  }
  
  return updatedCount;
}

// =============================================================================
// SERVICE EXPORT
// =============================================================================

export const VideoStatService = {
  // Game videos
  getGameVideo,
  createGameVideo,
  updateVideoStatus,
  
  // Clock sync
  saveClockSync,
  getClockSync,
  
  // Video stats
  recordVideoStat,
  getVideoStats,
  updateStatsCount,
  backfillVideoTimestamps,
  
  // Game clock sync
  updateGameClockState,
  backfillGameClockFromStats,
  
  // Clip config
  getClipConfig,
  
  // Video timestamp calculation (for edit sync)
  calculateVideoTimestamp,
};

