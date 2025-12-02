/**
 * usePlayerClaim Hook
 * 
 * Manages state and operations for the player claim flow.
 * Used by the /claim/[token] page.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ClaimService, ClaimPreview } from '@/lib/services/claimService';
import { useAuthV2 } from '@/hooks/useAuthV2';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type ClaimStatus = 'loading' | 'valid' | 'invalid' | 'claiming' | 'success' | 'error';

interface UsePlayerClaimResult {
  status: ClaimStatus;
  preview: ClaimPreview | null;
  errorMessage: string | null;
  isAuthenticated: boolean;
  userRole: string | null;
  userName: string | null;
  handleClaim: () => Promise<void>;
  handleSignUpSuccess: (userId: string) => void;
  setError: (message: string) => void;
}

// ═══════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════

export function usePlayerClaim(token: string): UsePlayerClaimResult {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthV2();
  const isAuthenticated = !authLoading && !!user;
  
  const [status, setStatus] = useState<ClaimStatus>('loading');
  const [preview, setPreview] = useState<ClaimPreview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setStatus('invalid');
        setErrorMessage('Invalid claim link');
        return;
      }

      setStatus('loading');
      const result = await ClaimService.validateClaimToken(token);

      if (result.valid && result.preview) {
        setPreview(result.preview);
        setStatus('valid');
      } else {
        setStatus('invalid');
        setErrorMessage(result.error || 'Invalid claim link');
      }
    }

    validateToken();
  }, [token]);

  // Handle claim execution
  const handleClaim = useCallback(async () => {
    if (!user?.id || !token) {
      setErrorMessage('Please sign in to claim this profile');
      return;
    }

    setStatus('claiming');
    setErrorMessage(null);

    const result = await ClaimService.executeClaim(token, user.id);

    if (result.success) {
      setStatus('success');
      // Redirect to player dashboard after short delay
      setTimeout(() => {
        router.push('/dashboard/player');
      }, 2000);
    } else {
      setStatus('error');
      setErrorMessage(result.error || 'Failed to claim profile');
    }
  }, [user?.id, token, router]);

  // Handle successful sign up - execute claim with the new user ID directly
  const handleSignUpSuccess = useCallback(async (userId: string) => {
    if (!token || !userId) {
      setErrorMessage('Missing token or user ID');
      setStatus('error');
      return;
    }

    setStatus('claiming');
    setErrorMessage(null);

    const result = await ClaimService.executeClaim(token, userId);

    if (result.success) {
      setStatus('success');
      setTimeout(() => {
        router.push('/dashboard/player');
      }, 2000);
    } else {
      setStatus('error');
      setErrorMessage(result.error || 'Failed to claim profile');
    }
  }, [token, router]);

  // Set error message
  const setError = useCallback((message: string) => {
    setErrorMessage(message);
  }, []);

  return {
    status,
    preview,
    errorMessage,
    isAuthenticated,
    userRole: user?.role ?? null,
    userName: user?.full_name ?? null,
    handleClaim,
    handleSignUpSuccess,
    setError,
  };
}

