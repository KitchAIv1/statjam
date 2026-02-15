/**
 * API Route: Bunny.net Video Webhook
 * 
 * Receives webhook notifications from Bunny.net when video processing completes.
 * Creates/updates the game_videos database record as a fallback if client callback failed.
 * 
 * This ensures large file uploads don't get lost if the browser closes before
 * the client-side callback runs.
 * 
 * Bunny.net webhook payload includes:
 * - VideoGuid: The video ID
 * - VideoLibraryId: Library ID
 * - Status: Processing status (0=created, 1=uploaded, 2=processing, 3=ready, 4=failed)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as Sentry from '@sentry/nextjs';

const BUNNY_STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY || '';
const BUNNY_LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Bunny video status codes
const BUNNY_STATUS = {
  CREATED: 0,
  UPLOADED: 1,
  PROCESSING: 2,
  READY: 3,
  FAILED: 4,
} as const;

/**
 * Fetch video details from Bunny to get metadata (gameId, userId)
 */
async function fetchVideoMetadata(videoId: string): Promise<{
  gameId: string | null;
  userId: string | null;
  title: string | null;
}> {
  try {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
      {
        headers: { 'AccessKey': BUNNY_STREAM_API_KEY },
      }
    );
    
    if (!response.ok) {
      console.error('Failed to fetch video details from Bunny:', response.status);
      return { gameId: null, userId: null, title: null };
    }
    
    const video = await response.json();
    
    // Extract metadata from metaTags array
    let gameId: string | null = null;
    let userId: string | null = null;
    
    if (video.metaTags && Array.isArray(video.metaTags)) {
      for (const tag of video.metaTags) {
        if (tag.property === 'gameId') gameId = tag.value;
        if (tag.property === 'userId') userId = tag.value;
      }
    }
    
    // Fallback: parse gameId from title (format: Game_${gameId}_${timestamp})
    if (!gameId && video.title) {
      const match = video.title.match(/^Game_([a-f0-9-]+)_/i);
      if (match) gameId = match[1];
    }
    
    return { gameId, userId, title: video.title };
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    return { gameId: null, userId: null, title: null };
  }
}

/**
 * Create or update game_videos record
 */
async function upsertGameVideo(
  gameId: string,
  bunnyVideoId: string,
  userId: string | null,
  status: 'processing' | 'ready'
): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Supabase not configured');
    return false;
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Check if record already exists
  const { data: existing } = await supabase
    .from('game_videos')
    .select('id, status')
    .eq('game_id', gameId)
    .single();
  
  if (existing) {
    // Record exists - only update status if it changed
    if (existing.status !== status) {
      console.log('📹 Webhook: Updating existing video status:', { gameId, status });
      await supabase
        .from('game_videos')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('game_id', gameId);
    } else {
      console.log('📹 Webhook: Record already exists with same status, skipping');
    }
    return true;
  }
  
  // No record exists - create it (this is the fallback scenario)
  console.log('📹 Webhook: Creating missing video record:', { gameId, bunnyVideoId, userId });
  
  const { error } = await supabase
    .from('game_videos')
    .insert({
      game_id: gameId,
      bunny_library_id: BUNNY_LIBRARY_ID,
      bunny_video_id: bunnyVideoId,
      uploaded_by: userId || null,
      status,
      is_calibrated: false,
      stats_count: 0,
    });
  
  if (error) {
    console.error('❌ Webhook: Failed to create video record:', error);
    return false;
  }
  
  console.log('✅ Webhook: Video record created successfully');
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📥 Bunny webhook received:', JSON.stringify(body, null, 2));
    
    const { VideoGuid, VideoLibraryId, Status } = body;
    
    // Validate payload
    if (!VideoGuid) {
      console.error('Missing VideoGuid in webhook payload');
      return NextResponse.json({ error: 'Missing VideoGuid' }, { status: 400 });
    }
    
    // Verify library ID matches (basic security check)
    if (VideoLibraryId && VideoLibraryId !== BUNNY_LIBRARY_ID) {
      console.error('Library ID mismatch:', { received: VideoLibraryId, expected: BUNNY_LIBRARY_ID });
      return NextResponse.json({ error: 'Invalid library' }, { status: 403 });
    }
    
    // Only process when video is ready or failed
    if (Status !== BUNNY_STATUS.READY && Status !== BUNNY_STATUS.FAILED) {
      console.log('📹 Webhook: Ignoring status', Status, '- waiting for READY or FAILED');
      return NextResponse.json({ success: true, message: 'Status ignored' });
    }
    
    // Fetch video metadata from Bunny
    const metadata = await fetchVideoMetadata(VideoGuid);
    
    if (!metadata.gameId) {
      console.error('❌ Webhook: Could not determine gameId for video:', VideoGuid);
      return NextResponse.json({ 
        error: 'Could not determine gameId from video metadata',
        videoId: VideoGuid 
      }, { status: 400 });
    }
    
    // Determine status
    const dbStatus = Status === BUNNY_STATUS.READY ? 'ready' : 'processing';
    
    // Create or update the database record
    const success = await upsertGameVideo(
      metadata.gameId,
      VideoGuid,
      metadata.userId,
      dbStatus
    );
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update database' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      gameId: metadata.gameId,
      videoId: VideoGuid,
      status: dbStatus,
    });
    
  } catch (error) {
    console.error('❌ Bunny webhook error:', error);
    Sentry.captureException(error, {
      tags: { route: 'bunny-webhook', action: 'process_video_webhook' },
      extra: { videoId: body?.VideoGuid, status: body?.Status },
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also handle GET for webhook verification (some services use this)
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    service: 'bunny-webhook',
    timestamp: new Date().toISOString(),
  });
}

