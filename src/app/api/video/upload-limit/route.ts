/**
 * API Route: Check Daily Upload Limit
 * 
 * Returns the user's current daily upload count and remaining uploads.
 * Used by UI to display upload availability.
 * 
 * Resets at midnight EST each day.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as Sentry from '@sentry/nextjs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const DAILY_UPLOAD_LIMIT = 2;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Stat admins are exempt from limits
    if (role === 'stat_admin') {
      return NextResponse.json({
        uploadsToday: 0,
        limit: DAILY_UPLOAD_LIMIT,
        remaining: DAILY_UPLOAD_LIMIT,
        isExempt: true,
      });
    }
    
    // Get start of today in EST
    const now = new Date();
    const estDateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    
    // Determine EST offset (handle DST)
    const testDate = new Date(`${estDateStr}T12:00:00Z`);
    const tzName = testDate.toLocaleString('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' });
    const isDST = tzName.includes('EDT');
    const offset = isDST ? '-04:00' : '-05:00';
    
    const todayMidnightEST = new Date(`${estDateStr}T00:00:00${offset}`);
    
    // Count uploads today by this user
    const { count, error } = await supabase
      .from('game_videos')
      .select('id', { count: 'exact', head: true })
      .eq('uploaded_by', userId)
      .gte('created_at', todayMidnightEST.toISOString());
    
    if (error) {
      console.error('Error checking upload count:', error);
      return NextResponse.json(
        { error: 'Failed to check upload count' },
        { status: 500 }
      );
    }
    
    const uploadsToday = count || 0;
    const remaining = Math.max(0, DAILY_UPLOAD_LIMIT - uploadsToday);
    
    return NextResponse.json({
      uploadsToday,
      limit: DAILY_UPLOAD_LIMIT,
      remaining,
      isExempt: false,
    });
    
  } catch (error) {
    console.error('Upload limit check error:', error);
    Sentry.captureException(error, { tags: { route: 'video-upload-limit', action: 'check_limit' } });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

