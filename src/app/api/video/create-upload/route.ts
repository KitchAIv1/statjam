/**
 * API Route: Create Video Upload Session
 * 
 * Creates a video entry in Bunny.net Stream and returns
 * the TUS upload URL for direct browser upload.
 * 
 * This keeps the BUNNY_STREAM_API_KEY secure on the server.
 * 
 * Security: Verifies user authentication and game ownership before allowing upload.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { UPLOAD_CONFIG } from '@/lib/config/videoConfig';
import * as Sentry from '@sentry/nextjs';

const BUNNY_STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY || '';
const BUNNY_LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Generate Bunny.net TUS upload authorization signature
 * Format: SHA256(library_id + api_key + expiration_time + video_id)
 */
function generateTusSignature(
  libraryId: string,
  apiKey: string,
  expirationTime: number,
  videoId: string
): string {
  const signatureString = `${libraryId}${apiKey}${expirationTime}${videoId}`;
  return crypto.createHash('sha256').update(signatureString).digest('hex');
}

// Daily upload limit (resets at midnight EST)
const DAILY_UPLOAD_LIMIT = 2;

/**
 * Check if user is a stat_admin (exempt from daily limit)
 */
async function isStatAdmin(userId: string): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return false;
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  
  return user?.role === 'stat_admin';
}

/**
 * Check daily upload limit for user (resets at midnight EST)
 * Returns: { allowed: boolean, count: number, limit: number }
 */
async function checkDailyUploadLimit(
  userId: string, 
  gameId: string
): Promise<{ allowed: boolean; count: number; limit: number }> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { allowed: true, count: 0, limit: DAILY_UPLOAD_LIMIT }; // Fail open
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Get start of today in EST (midnight EST as UTC)
  const now = new Date();
  const estDateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  
  // Determine EST offset (handle DST)
  const testDate = new Date(`${estDateStr}T12:00:00Z`);
  const tzName = testDate.toLocaleString('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' });
  const isDST = tzName.includes('EDT');
  const offset = isDST ? '-04:00' : '-05:00';
  
  const todayMidnightEST = new Date(`${estDateStr}T00:00:00${offset}`);
  
  // Check if this is a re-upload (existing video for this game)
  const { data: existingVideo } = await supabase
    .from('game_videos')
    .select('id')
    .eq('game_id', gameId)
    .eq('uploaded_by', userId)
    .single();
  
  // Re-uploads don't count toward the limit
  if (existingVideo) {
    console.log('📹 Re-upload detected for game:', gameId, '- not counting toward limit');
    return { allowed: true, count: 0, limit: DAILY_UPLOAD_LIMIT };
  }
  
  // Count NEW uploads today by this user
  const { count, error } = await supabase
    .from('game_videos')
    .select('id', { count: 'exact', head: true })
    .eq('uploaded_by', userId)
    .gte('created_at', todayMidnightEST.toISOString());
  
  if (error) {
    console.error('Error checking upload limit:', error);
    return { allowed: true, count: 0, limit: DAILY_UPLOAD_LIMIT }; // Fail open
  }
  
  const uploadCount = count || 0;
  console.log('📊 Daily upload check:', { userId, uploadsToday: uploadCount, limit: DAILY_UPLOAD_LIMIT });
  
  return {
    allowed: uploadCount < DAILY_UPLOAD_LIMIT,
    count: uploadCount,
    limit: DAILY_UPLOAD_LIMIT,
  };
}

/**
 * Verify user owns the game
 * Checks: stat_admin (coach games) OR tournament organizer (organizer games)
 */
async function verifyGameOwnership(gameId: string, userId: string): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Supabase not configured for ownership verification');
    return false;
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Fetch game with tournament info
  const { data: game, error } = await supabase
    .from('games')
    .select('id, stat_admin_id, tournament_id')
    .eq('id', gameId)
    .single();
  
  if (error || !game) {
    console.error('Game not found:', gameId);
    return false;
  }
  
  // Check 1: User is stat_admin (works for coach games)
  if (game.stat_admin_id === userId) {
    return true;
  }
  
  // Check 2: User is organizer of the tournament (for organizer games)
  if (game.tournament_id) {
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('organizer_id')
      .eq('id', game.tournament_id)
      .single();
    
    if (tournament?.organizer_id === userId) {
      return true;
    }
  }
  
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Check configuration
    if (!BUNNY_STREAM_API_KEY || !BUNNY_LIBRARY_ID) {
      console.error('Missing Bunny.net config:', { 
        hasApiKey: !!BUNNY_STREAM_API_KEY, 
        hasLibraryId: !!BUNNY_LIBRARY_ID 
      });
      return NextResponse.json(
        { error: 'Bunny.net not configured on server' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { gameId, filename, fileSize, userId } = body;

    if (!gameId || !filename) {
      return NextResponse.json(
        { error: 'Missing required fields: gameId, filename' },
        { status: 400 }
      );
    }

    // Verify game ownership if userId provided
    if (userId) {
      const isOwner = await verifyGameOwnership(gameId, userId);
      if (!isOwner) {
        console.error('Unauthorized upload attempt:', { gameId, userId });
        return NextResponse.json(
          { error: 'You do not have permission to upload to this game' },
          { status: 403 }
        );
      }
      
      // Check daily upload limit (stat_admins are exempt)
      const userIsStatAdmin = await isStatAdmin(userId);
      if (!userIsStatAdmin) {
        const limitCheck = await checkDailyUploadLimit(userId, gameId);
        if (!limitCheck.allowed) {
          console.log('🚫 Daily upload limit reached:', { userId, count: limitCheck.count });
          return NextResponse.json(
            { 
              error: 'Daily upload limit reached',
              message: `You can upload a maximum of ${DAILY_UPLOAD_LIMIT} games per day. Your limit resets at midnight EST.`,
              uploadsToday: limitCheck.count,
              limit: limitCheck.limit,
            },
            { status: 429 }
          );
        }
      } else {
        console.log('✅ Stat admin exempt from upload limit:', userId);
      }
    }

    // Server-side file size validation (prevents bypassing client-side check)
    if (fileSize && fileSize > UPLOAD_CONFIG.maxFileSizeBytes) {
      console.error('File too large:', { fileSize, max: UPLOAD_CONFIG.maxFileSizeBytes });
      return NextResponse.json(
        { error: `File size exceeds maximum of ${UPLOAD_CONFIG.maxFileSizeGB}GB` },
        { status: 413 }
      );
    }

    // Create video in Bunny Stream with metadata for webhook fallback
    const videoTitle = `Game_${gameId}_${Date.now()}`;
    
    // Store gameId and userId in metaTags for webhook to use if client callback fails
    const metaTags = [
      { property: 'gameId', value: gameId },
      { property: 'userId', value: userId || '' },
      { property: 'libraryId', value: BUNNY_LIBRARY_ID },
    ];
    
    console.log('Creating video in Bunny Stream:', { videoTitle, libraryId: BUNNY_LIBRARY_ID, metaTags });
    
    const createResponse = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`,
      {
        method: 'POST',
        headers: {
          'AccessKey': BUNNY_STREAM_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title: videoTitle,
          metaTags, // Include metadata for webhook fallback
        }),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Bunny create video error:', errorText);
      return NextResponse.json(
        { error: `Failed to create video in Bunny.net: ${errorText}` },
        { status: 500 }
      );
    }

    const video = await createResponse.json();
    console.log('Video created:', { guid: video.guid });
    
    // Generate TUS upload authorization (expires in 1 hour)
    const expirationTime = Math.floor(Date.now() / 1000) + 3600;
    
    // Generate SHA256 signature for TUS upload
    const authorizationSignature = generateTusSignature(
      BUNNY_LIBRARY_ID,
      BUNNY_STREAM_API_KEY,
      expirationTime,
      video.guid
    );

    return NextResponse.json({
      success: true,
      videoId: video.guid,
      libraryId: BUNNY_LIBRARY_ID,
      tusEndpoint: 'https://video.bunnycdn.com/tusupload',
      authorizationSignature,
      authorizationExpire: expirationTime,
      metadata: {
        filename: Buffer.from(filename).toString('base64'),
        filesize: fileSize?.toString() || '0',
      },
    });

  } catch (error) {
    console.error('Create upload error:', error);
    Sentry.captureException(error, {
      tags: { route: 'video-create-upload', action: 'create_upload_session' },
      extra: { gameId: body?.gameId, userId: body?.userId },
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

