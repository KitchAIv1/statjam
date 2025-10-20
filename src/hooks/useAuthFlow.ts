/**
 * useAuthFlow Hook - Extracted from AuthPageV2
 * Manages authentication business logic and flow control
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthV2 } from './useAuthV2';
import { type UserRole } from '@/components/auth/RoleSelector';
import { type SignUpFormData, type SignInFormData } from '@/components/auth/utils/authValidation';

export interface AuthFlowState {
  showEmailConfirmation: boolean;
  signupEmail: string;
  isLogin: boolean;
}

export interface UseAuthFlowReturn {
  // State
  authFlowState: AuthFlowState;
  loading: boolean;
  user: any;
  
  // Actions
  handleSignIn: (formData: SignInFormData) => Promise<void>;
  handleSignUp: (formData: SignUpFormData, userType: UserRole) => Promise<void>;
  handleBackToSignIn: () => void;
  setIsLogin: (isLogin: boolean) => void;
  
  // Redirect handling
  clearSession: () => void;
}

/**
 * Custom hook for managing authentication flow and business logic
 */
export const useAuthFlow = (): UseAuthFlowReturn => {
  const { user, loading, signIn: signInV2, signUp: signUpV2 } = useAuthV2();
  
  const [authFlowState, setAuthFlowState] = useState<AuthFlowState>({
    showEmailConfirmation: false,
    signupEmail: '',
    isLogin: true
  });

  // ✅ EMERGENCY: Clear stuck redirect flags on component mount
  useEffect(() => {
    const clearStuckFlags = () => {
      const isRedirecting = sessionStorage.getItem('auth-redirecting');
      const redirectTimestamp = sessionStorage.getItem('auth-redirect-timestamp');
      const now = Date.now();
      
      if (isRedirecting === 'true' && redirectTimestamp) {
        const timeDiff = now - parseInt(redirectTimestamp);
        if (timeDiff > 3000) { // 3 seconds
          console.log('🚨 useAuthFlow: Clearing stuck redirect flags on mount');
          sessionStorage.removeItem('auth-redirecting');
          sessionStorage.removeItem('auth-redirect-timestamp');
        }
      }
    };
    
    clearStuckFlags();
  }, []); // Run once on mount

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !loading) {
      // ✅ FIX: Check if we're currently redirecting to prevent infinite loop
      const isRedirecting = sessionStorage.getItem('auth-redirecting');
      const redirectTimestamp = sessionStorage.getItem('auth-redirect-timestamp');
      const now = Date.now();
      
      // If we're already redirecting and it's been less than 3 seconds, don't redirect again
      if (isRedirecting === 'true' && redirectTimestamp) {
        const timeDiff = now - parseInt(redirectTimestamp);
        if (timeDiff < 3000) {
          console.log('🚨 useAuthFlow: Already redirecting, skipping duplicate redirect');
          return;
        }
      }
      
      // Set redirect flags
      sessionStorage.setItem('auth-redirecting', 'true');
      sessionStorage.setItem('auth-redirect-timestamp', now.toString());
      
      console.log('🔄 useAuthFlow: User logged in, redirecting to dashboard...');
      
      // Use setTimeout to ensure redirect happens after render
      setTimeout(() => {
        if (user.role === 'organizer') {
          window.location.href = '/dashboard';
        } else if (user.role === 'player') {
          window.location.href = '/dashboard/player';
        } else if (user.role === 'stat_admin') {
          window.location.href = '/stat-tracker';
        } else {
          console.warn('⚠️ useAuthFlow: Unknown user role, redirecting to general dashboard');
          window.location.href = '/dashboard';
        }
      }, 100);
    }
  }, [user, loading]);

  /**
   * Handles sign-in flow
   */
  const handleSignIn = useCallback(async (formData: SignInFormData): Promise<void> => {
    console.log('🔐 useAuthFlow: Signing in with raw HTTP...');
    const result = await signInV2(formData.email, formData.password);
    if (!result.success) {
      throw new Error(result.error || 'Sign in failed');
    }
    console.log('✅ useAuthFlow: Sign in successful!');
    // useAuthV2 hook will handle redirect via useEffect
  }, [signInV2]);

  /**
   * Handles sign-up flow
   */
  const handleSignUp = useCallback(async (formData: SignUpFormData, userType: UserRole): Promise<void> => {
    console.log('🔐 useAuthFlow: Signing up with raw HTTP...');
    const result = await signUpV2(
      formData.email, 
      formData.password,
      {
        firstName: formData.firstName,
        lastName: formData.lastName,
        userType: userType
      }
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Sign up failed');
    }
    
    console.log('✅ useAuthFlow: Sign up successful!');
    
    // ✅ ENHANCED: Handle different signup outcomes
    if (result.autoSignedIn) {
      console.log('🚀 useAuthFlow: Auto sign-in enabled, user will be redirected by useEffect');
      
      // ✅ NEW: Show role confirmation if available
      if (result.profile) {
        console.log(`👤 useAuthFlow: User signed up as ${result.profile.role}`);
      }
      
      // Don't show email confirmation - user is already signed in
      // The useEffect will handle the redirect to dashboard
      return;
    }
    
    // ✅ NEW: Handle delayed profile sync warning
    if (result.warning) {
      console.warn('⚠️ useAuthFlow:', result.warning);
      throw new Error(`Account created successfully! ${result.warning}`);
    }
    
    // Show email confirmation screen only if email confirmation is required
    setAuthFlowState(prev => ({
      ...prev,
      signupEmail: formData.email,
      showEmailConfirmation: true
    }));
  }, [signUpV2]);

  /**
   * Handles returning to sign-in from email confirmation
   */
  const handleBackToSignIn = useCallback(() => {
    setAuthFlowState(prev => ({
      ...prev,
      showEmailConfirmation: false,
      isLogin: true
    }));
  }, []);

  /**
   * Sets login/signup mode
   */
  const setIsLogin = useCallback((isLogin: boolean) => {
    setAuthFlowState(prev => ({
      ...prev,
      isLogin
    }));
  }, []);

  /**
   * Clears session data
   */
  const clearSession = useCallback(() => {
    sessionStorage.removeItem('auth-redirecting');
    sessionStorage.removeItem('auth-redirect-timestamp');
  }, []);

  return {
    authFlowState,
    loading,
    user,
    handleSignIn,
    handleSignUp,
    handleBackToSignIn,
    setIsLogin,
    clearSession
  };
};
