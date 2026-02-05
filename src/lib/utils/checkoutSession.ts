/**
 * Checkout Session Utility
 * Handles storing/retrieving return URL for Stripe checkout flow
 * 
 * @module checkoutSession
 */

const CHECKOUT_RETURN_KEY = 'statjam_checkout_return_url';

/**
 * Save the current URL before redirecting to Stripe
 */
export function saveCheckoutReturnUrl(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const currentUrl = window.location.pathname + window.location.search;
    sessionStorage.setItem(CHECKOUT_RETURN_KEY, currentUrl);
  } catch {
    // SessionStorage may be blocked - fail silently
  }
}

/**
 * Get and clear the saved return URL
 */
export function getAndClearCheckoutReturnUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const returnUrl = sessionStorage.getItem(CHECKOUT_RETURN_KEY);
    sessionStorage.removeItem(CHECKOUT_RETURN_KEY);
    return returnUrl;
  } catch {
    return null;
  }
}
