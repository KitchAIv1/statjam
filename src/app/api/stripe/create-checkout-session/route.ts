/**
 * Create Stripe Checkout Session API
 * 
 * Creates a checkout session for:
 * - Subscription purchases (mode: 'subscription')
 * - One-time video credit purchases (mode: 'payment')
 * 
 * Redirects user to Stripe's hosted checkout page.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import * as Sentry from '@sentry/nextjs';

// Validate environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  try {
    // Check for required env vars
    if (!stripeSecretKey) {
      console.error('Missing STRIPE_SECRET_KEY');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

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

    const stripe = new Stripe(stripeSecretKey, { typescript: true });

    const body = await request.json();
    const { 
      priceId, 
      userId, 
      userEmail, 
      role, 
      tierId, 
      successUrl, 
      cancelUrl,
      mode = 'subscription' // NEW: support 'payment' for one-time purchases
    } = body;

    // Validate required fields
    if (!priceId || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: priceId, userId, userEmail' },
        { status: 400 }
      );
    }

    // Verify the userId matches the authenticated user
    if (userId !== authUser.id) {
      console.error('User ID mismatch:', { provided: userId, authenticated: authUser.id });
      return NextResponse.json({ error: 'User verification failed' }, { status: 403 });
    }

    // Try to get existing customer ID from Supabase
    let customerId: string | undefined;
    
    try {
      const { data: existingCustomer } = await supabaseAdmin
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .not('stripe_customer_id', 'is', null)
        .limit(1)
        .maybeSingle();
      
      customerId = existingCustomer?.stripe_customer_id;
    } catch (dbError) {
      // Table might not exist yet - proceed without existing customer
      console.log('Could not check existing customer (table may not exist):', dbError);
    }

    // Create new Stripe customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          supabase_user_id: userId,
          role: role || 'player',
        },
      });
      customerId = customer.id;
    }

    // Build session config based on mode
    const baseConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=cancelled`,
      metadata: {
        supabase_user_id: userId,
        role: role || 'player',
        tier: tierId || 'pro',
      },
    };

    let session: Stripe.Checkout.Session;

    if (mode === 'payment') {
      // One-time payment (video credits)
      session = await stripe.checkout.sessions.create({
        ...baseConfig,
        mode: 'payment',
        // For one-time payments, we use payment_intent_data instead of subscription_data
        payment_intent_data: {
          metadata: {
            supabase_user_id: userId,
            role: role || 'player',
            tier: tierId || 'video_credits',
          },
        },
      });
      console.log(`💳 Created one-time payment session for user ${userId}: ${session.id}`);
    } else {
      // Subscription
      session = await stripe.checkout.sessions.create({
        ...baseConfig,
        mode: 'subscription',
        subscription_data: {
          metadata: {
            supabase_user_id: userId,
            role: role || 'player',
            tier: tierId || 'pro',
          },
        },
      });
      console.log(`📅 Created subscription session for user ${userId}: ${session.id}`);
    }

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    Sentry.captureException(error, { tags: { route: 'stripe-checkout', action: 'create_session' } });
    
    // Return detailed error for debugging (remove in production)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error && 'type' in error ? (error as { type?: string }).type : undefined;
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: errorMessage,
        type: errorDetails
      },
      { status: 500 }
    );
  }
}
