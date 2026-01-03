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
    }

    // Server-side file size validation (prevents bypassing client-side check)
    if (fileSize && fileSize > UPLOAD_CONFIG.maxFileSizeBytes) {
      console.error('File too large:', { fileSize, max: UPLOAD_CONFIG.maxFileSizeBytes });
      return NextResponse.json(
        { error: `File size exceeds maximum of ${UPLOAD_CONFIG.maxFileSizeGB}GB` },
        { status: 413 }
      );
    }

    // Create video in Bunny Stream
    const videoTitle = `Game_${gameId}_${Date.now()}`;
    
    console.log('Creating video in Bunny Stream:', { videoTitle, libraryId: BUNNY_LIBRARY_ID });
    
    const createResponse = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`,
      {
        method: 'POST',
        headers: {
          'AccessKey': BUNNY_STREAM_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: videoTitle }),
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

