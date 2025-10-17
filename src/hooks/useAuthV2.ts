/**
 * 🏀 ENTERPRISE AUTH HOOK V2
 * 
 * Uses raw HTTP authentication - never hangs, instant responses
 * Replaces broken Supabase client auth
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { authServiceV2 } from '@/lib/services/authServiceV2';

interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
  country?: string;
  premium_status?: string;
  profile_image?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuthV2() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  /**
   * Load user from localStorage on mount (ONCE ONLY)
   */
  useEffect(() => {
    let isMounted = true; // ✅ Prevent state updates after unmount
    
    const loadUser = async () => {
      try {
        const session = authServiceV2.getSession();
        
        if (!session.accessToken || !session.user) {
          console.log('🔐 useAuthV2: No session found');
          if (isMounted) setState({ user: null, loading: false, error: null });
          return;
        }

        console.log('🔐 useAuthV2: Session found, loading profile...');
        
        // Fetch full profile from database
        const { data: profile, error } = await authServiceV2.getUserProfile(session.accessToken);
        
        if (error || !profile) {
          console.warn('⚠️ useAuthV2: Could not load profile, clearing invalid session');
          // ✅ FIX: Clear invalid tokens from localStorage
          await authServiceV2.signOut();
          if (isMounted) {
            setState({ user: null, loading: false, error: null });
          }
          return;
        }

        console.log('✅ useAuthV2: User loaded:', profile.email, 'role:', profile.role);
        if (isMounted) setState({ user: profile, loading: false, error: null });

      } catch (error: any) {
        console.error('❌ useAuthV2: Error loading user:', error);
        // ✅ FIX: Clear invalid session on error
        await authServiceV2.signOut();
        if (isMounted) setState({ user: null, loading: false, error: null });
      }
    };

    loadUser();
    
    // ✅ Cleanup to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, []); // ✅ Empty deps = run ONCE on mount

  /**
   * 🔐 SIGN IN
   */
  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('🔐 useAuthV2: Signing in...');
      const { data, error } = await authServiceV2.signIn(email, password);
      
      if (error || !data) {
        throw error || new Error('Sign in failed');
      }

      // Fetch full profile
      const { data: profile, error: profileError } = await authServiceV2.getUserProfile(data.access_token);
      
      if (profileError || !profile) {
        console.warn('⚠️ useAuthV2: Could not load profile after sign in');
        // Use basic user data from sign in response
        setState({ 
          user: {
            id: data.user.id,
            email: data.user.email,
            role: 'player', // Default
          }, 
          loading: false, 
          error: null 
        });
        return { success: true };
      }

      console.log('✅ useAuthV2: Sign in successful, role:', profile.role);
      setState({ user: profile, loading: false, error: null });
      return { success: true };

    } catch (error: any) {
      console.error('❌ useAuthV2: Sign in error:', error);
      setState({ user: null, loading: false, error: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * 🔐 SIGN UP
   */
  const signUp = useCallback(async (
    email: string, 
    password: string,
    metadata?: { firstName?: string; lastName?: string; userType?: string }
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('🔐 useAuthV2: Signing up...');
      const { data, error } = await authServiceV2.signUp(email, password, metadata);
      
      if (error || !data) {
        throw error || new Error('Sign up failed');
      }

      console.log('✅ useAuthV2: Sign up successful');
      
      // If auto sign-in is enabled (access_token returned)
      if (data.access_token) {
        const { data: profile } = await authServiceV2.getUserProfile(data.access_token);
        if (profile) {
          setState({ user: profile, loading: false, error: null });
          return { success: true, autoSignedIn: true };
        }
      }

      setState({ user: null, loading: false, error: null });
      return { success: true, autoSignedIn: false };

    } catch (error: any) {
      console.error('❌ useAuthV2: Sign up error:', error);
      setState({ user: null, loading: false, error: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * 🔐 SIGN OUT
   */
  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('🔐 useAuthV2: Signing out...');
      await authServiceV2.signOut();
      
      console.log('✅ useAuthV2: Sign out successful');
      setState({ user: null, loading: false, error: null });
      return { success: true };

    } catch (error: any) {
      console.error('❌ useAuthV2: Sign out error:', error);
      // Still clear user state even if API call failed
      setState({ user: null, loading: false, error: null });
      return { success: true }; // Don't fail sign out
    }
  }, []);

  /**
   * 🔐 REFRESH SESSION
   */
  const refreshSession = useCallback(async () => {
    try {
      const session = authServiceV2.getSession();
      
      if (!session.refreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('🔐 useAuthV2: Refreshing session...');
      const { data, error } = await authServiceV2.refreshToken(session.refreshToken);
      
      if (error || !data) {
        throw error || new Error('Token refresh failed');
      }

      const { data: profile } = await authServiceV2.getUserProfile(data.access_token);
      
      if (profile) {
        setState({ user: profile, loading: false, error: null });
      }

      console.log('✅ useAuthV2: Session refreshed');
      return { success: true };

    } catch (error: any) {
      console.error('❌ useAuthV2: Refresh session error:', error);
      // If refresh fails, sign out user
      setState({ user: null, loading: false, error: null });
      return { success: false };
    }
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };
}

