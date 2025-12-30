/**
 * Video Assignment Service
 * 
 * Handles admin assignment of uploaded videos to stat admins
 * and stat admin tracking workflow.
 * 
 * @module videoAssignmentService
 */

import { supabase } from '@/lib/supabase';
import { GameVideo, VideoAssignmentStatus } from '@/lib/types/video';

// Helper to ensure supabase is initialized
function getSupabase() {
  if (!supabase) throw new Error('Supabase not initialized');
  return supabase;
}

// =============================================================================
// TYPES
// =============================================================================

export interface VideoQueueItem {
  video: GameVideo;
  coachName: string;
  coachEmail: string;
  teamName: string;
  opponentName: string;
  gameDate: string | null;
  country: string | null;
  hoursRemaining: number | null;
  assignedAdminName: string | null;
}

export interface StatAdminOption {
  id: string;
  name: string;
  email: string;
  activeAssignments: number;
}

// =============================================================================
// ADMIN: VIDEO QUEUE OPERATIONS
// =============================================================================

/**
 * Pagination options for video queue
 */
export interface VideoQueuePaginationOptions {
  page?: number;
  pageSize?: number;
}

export interface VideoQueueResult {
  items: VideoQueueItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Get all videos pending assignment or in progress (admin only)
 * Sorted by latest first, with pagination support
 * Note: Works with or without the assignment_status column (pre/post migration)
 */
export async function getVideoQueue(
  options: VideoQueuePaginationOptions = {}
): Promise<VideoQueueResult> {
  const { page = 1, pageSize = 20 } = options;
  const offset = (page - 1) * pageSize;
  
  try {
    const db = getSupabase();
    
    // First get total count
    const { count: totalCount, error: countError } = await db
      .from('game_videos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ready');
    
    if (countError) throw countError;
    
    // Simple query that works before and after migration
    // Sorted by created_at descending (latest first)
    const { data, error } = await db
      .from('game_videos')
      .select(`
        *,
        games!inner(
          id,
          team_a_id,
          opponent_name,
          start_time,
          stat_admin_id
        )
      `)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    // Include all videos in the pipeline (pending through completed)
    const pendingVideos = (data || []).filter(item => {
      // If assignment_status exists, use it; otherwise treat all ready videos as pending
      const status = item.assignment_status || 'pending';
      return ['pending', 'assigned', 'in_progress', 'completed'].includes(status);
    });

    // Fetch uploader info separately
    const uploaderIds = [...new Set(pendingVideos.map(v => v.uploaded_by).filter(Boolean))];
    const { data: uploaders } = await db
      .from('users')
      .select('id, name, email, country')
      .in('id', uploaderIds.length > 0 ? uploaderIds : ['none']);
    
    const uploaderMap = new Map((uploaders || []).map(u => [u.id, u]));

    // Fetch team names
    const teamIds = [...new Set(pendingVideos.map(v => v.games?.team_a_id).filter(Boolean))];
    const { data: teams } = await db
      .from('teams')
      .select('id, name')
      .in('id', teamIds.length > 0 ? teamIds : ['none']);
    
    const teamMap = new Map((teams || []).map(t => [t.id, t.name]));

    const items = pendingVideos.map((item) => {
      const dueAt = item.due_at ? new Date(item.due_at) : null;
      const hoursRemaining = dueAt 
        ? Math.max(0, (dueAt.getTime() - Date.now()) / (1000 * 60 * 60))
        : null;

      const uploader = uploaderMap.get(item.uploaded_by);
      const teamName = teamMap.get(item.games?.team_a_id);

      return {
        video: transformGameVideo(item),
        coachName: uploader?.name || uploader?.email?.split('@')[0] || 'Unknown Coach',
        coachEmail: uploader?.email || '',
        teamName: teamName || 'Unknown Team',
        opponentName: item.games?.opponent_name || 'Unknown Opponent',
        gameDate: item.games?.start_time || null,
        country: uploader?.country || null,
        hoursRemaining,
        assignedAdminName: null, // Will be populated after migration
      };
    });

    return {
      items,
      totalCount: totalCount || 0,
      page,
      pageSize,
      totalPages: Math.ceil((totalCount || 0) / pageSize),
    };
  } catch (error) {
    console.error('❌ Error fetching video queue:', error);
    throw error;
  }
}

/**
 * Get list of stat admins available for assignment
 * Note: Works before migration (assignment columns may not exist)
 */
export async function getStatAdminOptions(): Promise<StatAdminOption[]> {
  try {
    const db = getSupabase();
    
    const { data: statAdmins, error: adminsError } = await db
      .from('users')
      .select('id, name, email')
      .eq('role', 'stat_admin');

    if (adminsError) throw adminsError;

    // Try to get active assignments count (may fail if columns don't exist)
    let assignmentCounts = new Map<string, number>();
    try {
      const { data: assignments } = await db
        .from('game_videos')
        .select('assigned_stat_admin_id')
        .not('assigned_stat_admin_id', 'is', null);

      (assignments || []).forEach((a) => {
        if (a.assigned_stat_admin_id) {
          const count = assignmentCounts.get(a.assigned_stat_admin_id) || 0;
          assignmentCounts.set(a.assigned_stat_admin_id, count + 1);
        }
      });
    } catch {
      // Column doesn't exist yet - that's fine, all counts will be 0
    }

    return (statAdmins || []).map((admin) => ({
      id: admin.id,
      name: admin.name || admin.email?.split('@')[0] || admin.email,
      email: admin.email,
      activeAssignments: assignmentCounts.get(admin.id) || 0,
    }));
  } catch (error) {
    console.error('❌ Error fetching stat admin options:', error);
    throw error;
  }
}

/**
 * Assign a video to a stat admin
 */
export async function assignVideoToStatAdmin(
  videoId: string,
  statAdminId: string
): Promise<void> {
  try {
    const db = getSupabase();
    const dueAt = new Date();
    dueAt.setHours(dueAt.getHours() + 24); // 24-hour turnaround

    const { error } = await db
      .from('game_videos')
      .update({
        assigned_stat_admin_id: statAdminId,
        assignment_status: 'assigned',
        assigned_at: new Date().toISOString(),
        due_at: dueAt.toISOString(),
      })
      .eq('id', videoId);

    if (error) throw error;
  } catch (error) {
    console.error('❌ Error assigning video:', error);
    throw error;
  }
}

/**
 * Unassign a video (return to pending)
 */
export async function unassignVideo(videoId: string): Promise<void> {
  try {
    const db = getSupabase();
    const { error } = await db
      .from('game_videos')
      .update({
        assigned_stat_admin_id: null,
        assignment_status: 'pending',
        assigned_at: null,
        due_at: null,
      })
      .eq('id', videoId);

    if (error) throw error;
  } catch (error) {
    console.error('❌ Error unassigning video:', error);
    throw error;
  }
}

// =============================================================================
// STAT ADMIN: ASSIGNED VIDEOS
// =============================================================================

/**
 * Get videos assigned to the current stat admin
 * Sorted by latest first
 */
export async function getAssignedVideos(
  statAdminId: string
): Promise<VideoQueueItem[]> {
  try {
    const db = getSupabase();
    
    // Simplified query that works before migration
    // Sorted by created_at descending (latest first)
    const { data, error } = await db
      .from('game_videos')
      .select(`
        *,
        games!inner(
          id,
          team_a_id,
          opponent_name,
          start_time
        )
      `)
      .eq('status', 'ready')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter by assigned_stat_admin_id (may not exist before migration)
    const assignedVideos = (data || []).filter(item => 
      item.assigned_stat_admin_id === statAdminId
    );

    return assignedVideos.map((item) => {
      const dueAt = item.due_at ? new Date(item.due_at) : null;
      const hoursRemaining = dueAt 
        ? Math.max(0, (dueAt.getTime() - Date.now()) / (1000 * 60 * 60))
        : null;

      return {
        video: transformGameVideo(item),
        coachName: 'Unknown Coach',
        coachEmail: '',
        teamName: 'Unknown Team',
        opponentName: item.games?.opponent_name || 'Unknown Opponent',
        gameDate: item.games?.start_time || null,
        country: null,
        hoursRemaining,
        assignedAdminName: null,
      };
    });
  } catch (error) {
    console.error('❌ Error fetching assigned videos:', error);
    throw error;
  }
}

/**
 * Update assignment status (stat admin starts/completes tracking)
 */
export async function updateAssignmentStatus(
  videoId: string,
  status: VideoAssignmentStatus
): Promise<void> {
  try {
    const db = getSupabase();
    const updates: Record<string, unknown> = {
      assignment_status: status,
    };

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await db
      .from('game_videos')
      .update(updates)
      .eq('id', videoId);

    if (error) throw error;
  } catch (error) {
    console.error('❌ Error updating assignment status:', error);
    throw error;
  }
}

// =============================================================================
// COACH: VIDEO STATUS
// =============================================================================

/**
 * Get videos uploaded by coach with assignment status
 */
export async function getCoachVideos(coachId: string): Promise<GameVideo[]> {
  try {
    const db = getSupabase();
    const { data, error } = await db
      .from('game_videos')
      .select('*')
      .eq('uploaded_by', coachId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(transformGameVideo);
  } catch (error) {
    console.error('❌ Error fetching coach videos:', error);
    throw error;
  }
}

// =============================================================================
// HELPERS
// =============================================================================

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
    statsCount: (data.stats_count as number) || 0,
    assignedStatAdminId: data.assigned_stat_admin_id as string | null,
    assignmentStatus: (data.assignment_status as GameVideo['assignmentStatus']) || 'pending',
    assignedAt: data.assigned_at as string | null,
    dueAt: data.due_at as string | null,
    completedAt: data.completed_at as string | null,
    uploadedBy: data.uploaded_by as string | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

