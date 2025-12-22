/**
 * Create Stripe Customer Portal Session API
 * 
 * Creates a portal session for subscription management.
 * Allows users to update payment methods, cancel, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  try {
    // Check for required env vars
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    // Verify auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const accessToken = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the token and get user
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (authError || !authUser) {
      console.error('Auth verification failed:', authError);
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, returnUrl } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    // Verify the userId matches the authenticated user
    if (userId !== authUser.id) {
      console.error('User ID mismatch:', { provided: userId, authenticated: authUser.id });
      return NextResponse.json({ error: 'User verification failed' }, { status: 403 });
    }

    // Get user's Stripe customer ID
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .maybeSingle();

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found for this user' },
        { status: 404 }
      );
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}

