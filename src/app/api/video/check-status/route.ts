/**
 * API Route: Check Video Processing Status
 * 
 * Polls Bunny.net to check if video processing is complete.
 * When processing is complete, updates the database status.
 * Returns video status and metadata.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getNextMidnightEST } from '@/lib/utils/dueDate';

const BUNNY_STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY || '';
const BUNNY_LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Bunny.net video status codes
const STATUS_LABELS: Record<number, string> = {
  0: 'created',
  1: 'uploaded',
  2: 'processing',
  3: 'transcoding',
  4: 'ready',
  5: 'error',
  6: 'upload_failed',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { error: 'Missing videoId parameter' },
        { status: 400 }
      );
    }

    if (!BUNNY_STREAM_API_KEY || !BUNNY_LIBRARY_ID) {
      return NextResponse.json(
        { error: 'Bunny.net not configured' },
        { status: 500 }
      );
    }

    // Fetch video status from Bunny.net
    const response = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
      {
        headers: {
          'AccessKey': BUNNY_STREAM_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bunny status check error:', errorText);
      return NextResponse.json(
        { error: 'Failed to check video status' },
        { status: 500 }
      );
    }

    const video = await response.json();
    
    const statusCode = video.status ?? 0;
    const statusLabel = STATUS_LABELS[statusCode] || 'unknown';
    const isReady = statusCode === 4; // Only status 4 is truly ready
    const isError = statusCode >= 5;

    // UPDATE DATABASE when video is ready (or errored)
    if ((isReady || isError) && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        const newStatus = isError ? 'error' : 'ready';
        const dueAt = isReady ? getNextMidnightEST().toISOString() : null;
        
        // Update game_videos status
        const { error } = await supabase
          .from('game_videos')
          .update({ 
            status: newStatus,
            due_at: dueAt,
            duration_seconds: video.length || null,
            updated_at: new Date().toISOString(),
          })
          .eq('bunny_video_id', videoId)
          .eq('status', 'processing'); // Only update if still processing
        
        if (error) {
          console.error('Failed to update video status in DB:', error);
        } else {
          console.log(`📹 Video ${videoId} status updated to ${newStatus}`);
        }
      } catch (dbError) {
        console.error('DB update error:', dbError);
        // Don't fail the request if DB update fails
      }
    }

    return NextResponse.json({
      success: true,
      videoId: video.guid,
      status: statusLabel,
      statusCode,
      isReady,
      isError,
      duration: video.length || 0, // Duration in seconds
      thumbnail: video.thumbnailFileName 
        ? `https://${process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME}/${video.guid}/${video.thumbnailFileName}`
        : null,
      encodeProgress: video.encodeProgress || 0,
    });

  } catch (error) {
    console.error('Check status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




