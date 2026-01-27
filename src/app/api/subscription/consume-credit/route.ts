/**
 * API Route: Consume Video Credit
 * 
 * Uses service_role to bypass RLS and update video_credits.
 * Called from client after successful video upload.
 * 
 * SECURITY: Requires authenticated user - prevents consuming other users' credits
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client with service_role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    // =========================================================================
    // SECURITY: Verify Bearer token and user ownership
    // =========================================================================
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const accessToken = authHeader.replace('Bearer ', '');
    
    // Verify token is valid and get user
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (authError || !authUser) {
      console.error('❌ Auth verification failed:', authError?.message);
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }
    // =========================================================================

    const { userId, role } = await request.json();
    
    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Missing userId or role' },
        { status: 400 }
      );
    }

    // SECURITY: Verify the userId matches the authenticated user
    if (userId !== authUser.id) {
      console.error('❌ User ID mismatch - attempt to consume other user credits:', {
        requestedUserId: userId,
        authenticatedUserId: authUser.id,
      });
      return NextResponse.json({ error: 'User verification failed' }, { status: 403 });
    }
    
    // Get current credits
    const { data: subscription, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('video_credits')
      .eq('user_id', userId)
      .eq('role', role)
      .eq('status', 'active')
      .single();
    
    if (fetchError || !subscription) {
      console.error('Error fetching subscription:', fetchError);
      return NextResponse.json(
        { error: 'Subscription not found', details: fetchError?.message },
        { status: 404 }
      );
    }
    
    const currentCredits = subscription.video_credits ?? 0;
    
    if (currentCredits <= 0) {
      return NextResponse.json(
        { error: 'No video credits available', currentCredits: 0 },
        { status: 400 }
      );
    }
    
    const newCredits = currentCredits - 1;
    
    // Update with service_role (bypasses RLS)
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({ 
        video_credits: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('role', role)
      .eq('status', 'active')
      .select('video_credits')
      .single();
    
    if (updateError) {
      console.error('Error updating credits:', updateError);
      return NextResponse.json(
        { error: 'Failed to consume credit', details: updateError.message },
        { status: 500 }
      );
    }
    
    console.log(`✅ Video credit consumed via API: ${currentCredits} → ${updated.video_credits} for user ${userId}`);
    
    return NextResponse.json({
      success: true,
      previousCredits: currentCredits,
      currentCredits: updated.video_credits,
    });
    
  } catch (error) {
    console.error('Error in consume-credit API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

