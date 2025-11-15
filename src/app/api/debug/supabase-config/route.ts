/**
 * Debug API Route - Supabase Configuration Check
 * 
 * Purpose: Check which Supabase project production is using
 * Access: Only in development or with debug flag
 * 
 * Usage: GET /api/debug/supabase-config
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // Only allow in development or with debug flag
  const isDevelopment = process.env.NODE_ENV === 'development';
  const debugEnabled = process.env.NEXT_PUBLIC_DEBUG === 'true';
  
  if (!isDevelopment && !debugEnabled) {
    return NextResponse.json(
      { error: 'Debug endpoint disabled in production' },
      { status: 403 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: 'Supabase environment variables not configured' },
      { status: 500 }
    );
  }

  // Extract project ID from URL
  const projectIdMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  const projectId = projectIdMatch ? projectIdMatch[1] : 'UNKNOWN';

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    supabase: {
      projectId: projectId,
      url: supabaseUrl.replace(/https:\/\/([^.]+)\.supabase\.co/, 'https://$1.supabase.co'), // Sanitized
      anonKeyExists: !!supabaseAnonKey,
      anonKeyPrefix: supabaseAnonKey.substring(0, 20) + '...'
    },
    comparison: {
      localProjectId: 'xhunnsczqjwfrwgjetff', // From your local .env.local
      matches: projectId === 'xhunnsczqjwfrwgjetff'
    }
  });
}

