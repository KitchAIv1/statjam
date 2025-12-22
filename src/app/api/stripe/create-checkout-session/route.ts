/**
 * Create Stripe Checkout Session API
 * 
 * Creates a checkout session for subscription purchases.
 * Redirects user to Stripe's hosted checkout page.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

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

    const stripe = new Stripe(stripeSecretKey, { typescript: true });

    const body = await request.json();
    const { priceId, userId, userEmail, role, successUrl, cancelUrl } = body;

    // Validate required fields
    if (!priceId || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: priceId, userId, userEmail' },
        { status: 400 }
      );
    }

    // Try to get existing customer ID from Supabase (optional - skip if table doesn't exist)
    let customerId: string | undefined;
    
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
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

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=cancelled`,
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
          role: role || 'player',
        },
      },
      metadata: {
        supabase_user_id: userId,
        role: role || 'player',
      },
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

