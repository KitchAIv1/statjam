/**
 * useCheckoutReturn Hook
 * Handles Stripe checkout return flow: detects params, shows toast, refreshes subscription
 * 
 * @module useCheckoutReturn
 */

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useSubscription } from './useSubscription';
import type { UserRole } from '@/lib/types/subscription';

interface UseCheckoutReturnOptions {
  role: UserRole;
}

/**
 * Hook to handle checkout return URL params and show appropriate feedback
 * Call this in dashboard pages to handle post-checkout UX
 */
export function useCheckoutReturn({ role }: UseCheckoutReturnOptions): void {
  const searchParams = useSearchParams();
  const { refetch } = useSubscription(role);
  const hasHandledRef = useRef(false);

  useEffect(() => {
    // Prevent double-handling (React 18 strict mode)
    if (hasHandledRef.current) return;
    
    const checkoutStatus = searchParams.get('checkout');
    if (!checkoutStatus) return;

    hasHandledRef.current = true;

    // Handle success
    if (checkoutStatus === 'success' || checkoutStatus === 'video_success') {
      const isVideoCredits = checkoutStatus === 'video_success';
      
      toast.success(
        isVideoCredits ? '🎬 Video credits added!' : '🎉 Welcome to Pro!',
        {
          description: isVideoCredits 
            ? 'Your video tracking credits are now available.'
            : 'Your subscription is now active. Enjoy all premium features!',
          duration: 5000,
        }
      );
      
      // Refresh subscription data
      refetch();
    }

    // Handle cancellation
    if (checkoutStatus === 'cancelled') {
      toast.info('Checkout cancelled', {
        description: 'No worries — you can upgrade anytime.',
        duration: 3000,
      });
    }

    // Clean URL (remove checkout param)
    cleanCheckoutParam();
  }, [searchParams, refetch]);
}

/**
 * Remove checkout param from URL without page reload
 */
function cleanCheckoutParam(): void {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  url.searchParams.delete('checkout');
  
  const cleanUrl = url.pathname + (url.search || '');
  window.history.replaceState({}, '', cleanUrl);
}
