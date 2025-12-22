/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events to sync subscription state.
 * Updates Supabase when payments succeed, subscriptions change, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !webhookSecret) {
    console.error('Missing signature or webhook secret');
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  const role = session.metadata?.role || 'player';

  if (!userId) {
    console.error('No user ID in checkout session metadata');
    return;
  }

  // Get subscription details
  const subscriptionId = session.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  const tier = getTierFromPrice(subscription.items.data[0]?.price.id);
  const billingPeriod = getBillingPeriod(subscription.items.data[0]?.price);

  // Upsert subscription in Supabase
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: userId,
      role: role,
      tier: tier,
      billing_period: billingPeriod,
      status: 'active',
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscriptionId,
      expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,role',
    });

  if (error) {
    console.error('Error upserting subscription:', error);
  }

  // Update user verified status
  await supabaseAdmin
    .from('users')
    .update({ is_verified: true })
    .eq('id', userId);

  console.log(`✅ Subscription created for user ${userId} - ${tier}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;
  
  if (!userId) {
    console.error('No user ID in subscription metadata');
    return;
  }

  const tier = getTierFromPrice(subscription.items.data[0]?.price.id);
  const billingPeriod = getBillingPeriod(subscription.items.data[0]?.price);
  const status = subscription.status === 'active' ? 'active' : 
                 subscription.status === 'canceled' ? 'cancelled' : 'expired';

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      tier: tier,
      billing_period: billingPeriod,
      status: status,
      expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
  }

  console.log(`✅ Subscription updated: ${subscription.id} - ${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error cancelling subscription:', error);
  }

  // Remove verified status if needed
  const userId = subscription.metadata?.supabase_user_id;
  if (userId) {
    await supabaseAdmin
      .from('users')
      .update({ is_verified: false })
      .eq('id', userId);
  }

  console.log(`✅ Subscription cancelled: ${subscription.id}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`✅ Payment succeeded for invoice: ${invoice.id}`);
  // Subscription is automatically renewed by Stripe
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`❌ Payment failed for invoice: ${invoice.id}`);
  // Stripe handles retries automatically
  // Could send notification to user here
}

// =============================================================================
// HELPERS
// =============================================================================

// Map Stripe price IDs to tier names
// TODO: Update these with your actual Stripe price IDs
const PRICE_TO_TIER_MAP: Record<string, string> = {
  // Organizer
  'price_organizer_pro_monthly': 'pro',
  'price_organizer_seasonal': 'seasonal_pass',
  // Coach
  'price_coach_pro_monthly': 'pro',
  'price_coach_seasonal': 'seasonal_pass',
  'price_coach_annual': 'annual',
  // Player
  'price_player_seasonal': 'seasonal_pass',
  'price_player_annual': 'annual',
  'price_player_family': 'family',
};

function getTierFromPrice(priceId: string | undefined): string {
  if (!priceId) return 'free';
  return PRICE_TO_TIER_MAP[priceId] || 'pro';
}

function getBillingPeriod(price: Stripe.Price | undefined): string | null {
  if (!price?.recurring) return null;
  
  const interval = price.recurring.interval;
  const intervalCount = price.recurring.interval_count;
  
  if (interval === 'month' && intervalCount === 1) return 'monthly';
  if (interval === 'month' && intervalCount >= 3) return 'seasonal';
  if (interval === 'year') return 'annual';
  
  return 'monthly';
}

