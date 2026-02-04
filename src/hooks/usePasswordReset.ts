/**
 * usePasswordReset Hook
 * Manages password reset flow state and operations
 * 
 * @module usePasswordReset
 */

import { useState, useCallback } from 'react';
import { passwordResetService } from '@/lib/services/passwordResetService';

export type ResetStep = 'request' | 'email_sent' | 'new_password' | 'success';

interface UsePasswordResetState {
  step: ResetStep;
  email: string;
  loading: boolean;
  error: string | null;
  accessToken: string | null;
}

interface UsePasswordResetReturn {
  state: UsePasswordResetState;
  setEmail: (email: string) => void;
  sendResetEmail: () => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  setAccessToken: (token: string) => void;
  setStep: (step: ResetStep) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState: UsePasswordResetState = {
  step: 'request',
  email: '',
  loading: false,
  error: null,
  accessToken: null,
};

export function usePasswordReset(): UsePasswordResetReturn {
  const [state, setState] = useState<UsePasswordResetState>(initialState);

  const setEmail = useCallback((email: string) => {
    setState(prev => ({ ...prev, email, error: null }));
  }, []);

  const setAccessToken = useCallback((token: string) => {
    setState(prev => ({ ...prev, accessToken: token, step: 'new_password' }));
  }, []);

  const setStep = useCallback((step: ResetStep) => {
    setState(prev => ({ ...prev, step, error: null }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const sendResetEmail = useCallback(async (): Promise<boolean> => {
    if (!state.email) {
      setState(prev => ({ ...prev, error: 'Please enter your email address' }));
      return false;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const { error } = await passwordResetService.sendResetEmail(state.email);

    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      return false;
    }

    setState(prev => ({ ...prev, loading: false, step: 'email_sent' }));
    return true;
  }, [state.email]);

  const updatePassword = useCallback(async (newPassword: string): Promise<boolean> => {
    if (!state.accessToken) {
      setState(prev => ({ ...prev, error: 'Invalid reset session. Please request a new reset link.' }));
      return false;
    }

    if (!newPassword || newPassword.length < 6) {
      setState(prev => ({ ...prev, error: 'Password must be at least 6 characters' }));
      return false;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const { error } = await passwordResetService.updatePassword(state.accessToken, newPassword);

    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      return false;
    }

    setState(prev => ({ ...prev, loading: false, step: 'success' }));
    return true;
  }, [state.accessToken]);

  return {
    state,
    setEmail,
    sendResetEmail,
    updatePassword,
    setAccessToken,
    setStep,
    clearError,
    reset,
  };
}
