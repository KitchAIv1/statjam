/**
 * Stripe Service (Frontend)
 * 
 * Client-side service for Stripe interactions.
 * Handles checkout session creation and portal access.
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';
import type { UserRole, PricingTier } from '@/lib/types/subscription';

// Lazy-load Stripe.js
let stripePromise: Promise<Stripe | null> | null = null;

function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

// =============================================================================
// CHECKOUT
// =============================================================================

export interface CheckoutOptions {
  priceId: string;
  userId: string;
  userEmail: string;
  role: UserRole;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Redirect user to Stripe Checkout for subscription purchase
 */
export async function redirectToCheckout(options: CheckoutOptions): Promise<void> {
  const stripe = await getStripe();
  
  if (!stripe) {
    throw new Error('Stripe failed to load');
  }

  // Get auth token for server-side verification
  const accessToken = typeof window !== 'undefined' 
    ? localStorage.getItem('sb-access-token') 
    : null;

  if (!accessToken) {
    throw new Error('Please sign in to continue');
  }

  // Create checkout session via our API with auth header
  const response = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json();
    const errorMsg = error.details ? `${error.error}: ${error.details}` : error.error;
    throw new Error(errorMsg || 'Failed to create checkout session');
  }

  const { url, sessionId } = await response.json();

  // Redirect to Stripe Checkout
  if (url) {
    window.location.href = url;
  } else if (sessionId) {
    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) {
      throw new Error(error.message);
    }
  }
}

// =============================================================================
// CUSTOMER PORTAL
// =============================================================================

/**
 * Redirect user to Stripe Customer Portal for subscription management
 */
export async function redirectToPortal(userId: string, returnUrl?: string): Promise<void> {
  // Get auth token for server-side verification
  const accessToken = typeof window !== 'undefined' 
    ? localStorage.getItem('sb-access-token') 
    : null;

  if (!accessToken) {
    throw new Error('Please sign in to continue');
  }

  const response = await fetch('/api/stripe/create-portal-session', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ userId, returnUrl }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create portal session');
  }

  const { url } = await response.json();
  
  if (url) {
    window.location.href = url;
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Check if Stripe is configured and available
 */
export async function isStripeAvailable(): Promise<boolean> {
  const stripe = await getStripe();
  return stripe !== null;
}

/**
 * Get price ID for a pricing tier
 */
export function getPriceIdForTier(tier: PricingTier, role: UserRole): string | null {
  // Look up from the tier's metadata if available
  const priceId = (tier as PricingTier & { stripePriceId?: string }).stripePriceId;
  if (priceId) return priceId;

  // Fallback mapping (update with your actual price IDs from Stripe Dashboard)
  const priceMap: Record<string, Record<string, string>> = {
    organizer: {
      pro: 'price_organizer_pro_monthly',
      seasonal_pass: 'price_organizer_seasonal',
    },
    coach: {
      pro: 'price_coach_pro_monthly',
      seasonal_pass: 'price_coach_seasonal',
      annual: 'price_coach_annual',
    },
    player: {
      seasonal_pass: 'price_player_seasonal',
      annual: 'price_player_annual',
      family: 'price_player_family',
    },
  };

  return priceMap[role]?.[tier.id] || null;
}

// =============================================================================
// EXPORT SERVICE OBJECT
// =============================================================================

export const StripeService = {
  redirectToCheckout,
  redirectToPortal,
  isStripeAvailable,
  getPriceIdForTier,
};

