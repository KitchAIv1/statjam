/**
 * 🏀 ENTERPRISE AUTH HOOK V2
 * 
 * Uses raw HTTP authentication - never hangs, instant responses
 * Replaces broken Supabase client auth
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';
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
   * Load user from localStorage on mount (ONCE ONLY) + Setup automatic token refresh
   */
  useEffect(() => {
    let isMounted = true; // ✅ Prevent state updates after unmount
    let refreshInterval: NodeJS.Timeout | null = null;
    
    const loadUser = async () => {
      try {
        const session = authServiceV2.getSession();
        
        if (!session.accessToken || !session.user) {
          logger.debug('🔐 useAuthV2: No session found');
          if (isMounted) setState({ user: null, loading: false, error: null });
          return;
        }

        logger.debug('🔐 useAuthV2: Session found, loading profile...');
        
        // Check if token is expired or about to expire
        const tokenPayload = JSON.parse(atob(session.accessToken.split('.')[1]));
        const expirationTime = tokenPayload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeUntilExpiry = expirationTime - currentTime;
        
        logger.debug('🔐 useAuthV2: Token expires in', Math.round(timeUntilExpiry / 1000 / 60), 'minutes');
        
        // If token is expired or expires in less than 5 minutes, refresh it immediately
        if (timeUntilExpiry < 5 * 60 * 1000) {
          logger.debug('🔐 useAuthV2: Token expires soon or is expired, refreshing immediately...');
          const refreshResult = await refreshSession();
          if (!refreshResult.success) {
            logger.debug('🔐 useAuthV2: Refresh failed, clearing invalid session');
            await authServiceV2.signOut();
            if (isMounted) setState({ user: null, loading: false, error: null });
            return;
          }
        }
        
        // Fetch full profile from database
        const { data: profile, error } = await authServiceV2.getUserProfile(session.accessToken);
        
        if (error || !profile) {
          // Check if error is due to expired token
          if (error?.message?.includes('JWT expired') || error?.message?.includes('401') || error?.message?.includes('403')) {
            logger.debug('🔐 useAuthV2: Token expired, attempting refresh...');
            const refreshResult = await refreshSession();
            if (refreshResult.success) {
              // Retry getting profile with new token
              const newSession = authServiceV2.getSession();
              const { data: newProfile, error: newError } = await authServiceV2.getUserProfile(newSession.accessToken);
              if (newProfile && !newError) {
                logger.debug('✅ useAuthV2: User loaded after token refresh:', newProfile.email, 'role:', newProfile.role);
                if (isMounted) setState({ user: newProfile, loading: false, error: null });
                setupTokenRefreshTimer();
                return;
              }
            }
          }
          
          logger.warn('⚠️ useAuthV2: Could not load profile, clearing invalid session');
          // ✅ FIX: Clear invalid tokens from localStorage
          await authServiceV2.signOut();
          if (isMounted) {
            setState({ user: null, loading: false, error: null });
          }
          return;
        }

        logger.debug('✅ useAuthV2: User loaded:', profile.email, 'role:', profile.role);
        if (isMounted) setState({ user: profile, loading: false, error: null });
        
        // Setup automatic token refresh
        setupTokenRefreshTimer();

      } catch (error: any) {
        logger.error('❌ useAuthV2: Error loading user:', error);
        // ✅ FIX: Clear invalid session on error
        await authServiceV2.signOut();
        if (isMounted) setState({ user: null, loading: false, error: null });
      }
    };

    const setupTokenRefreshTimer = () => {
      // Clear existing timer
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      
      // Set up automatic refresh every 45 minutes (tokens usually expire in 1 hour)
      refreshInterval = setInterval(async () => {
        if (!isMounted) return;
        
        logger.debug('🔐 useAuthV2: Automatic token refresh triggered');
        const refreshResult = await refreshSession();
        if (!refreshResult.success) {
          logger.warn('⚠️ useAuthV2: Automatic refresh failed, user will need to re-authenticate');
        }
      }, 45 * 60 * 1000); // 45 minutes
      
      logger.debug('✅ useAuthV2: Automatic token refresh timer set (45 minutes)');
    };

    loadUser();
    
    // ✅ Cleanup to prevent memory leaks
    return () => {
      isMounted = false;
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []); // ✅ Empty deps = run ONCE on mount

  /**
   * 🔐 SIGN IN
   */
  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      logger.debug('🔐 useAuthV2: Signing in...');
      const { data, error } = await authServiceV2.signIn(email, password);
      
      if (error || !data) {
        throw error || new Error('Sign in failed');
      }

      // Fetch full profile
      const { data: profile, error: profileError } = await authServiceV2.getUserProfile(data.access_token);
      
      if (profileError || !profile) {
        logger.warn('⚠️ useAuthV2: Could not load profile after sign in');
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

      logger.debug('✅ useAuthV2: Sign in successful, role:', profile.role);
      setState({ user: profile, loading: false, error: null });
      return { success: true };

    } catch (error: any) {
      logger.error('❌ useAuthV2: Sign in error:', error);
      setState({ user: null, loading: false, error: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * 🔐 SIGN UP - Enhanced with retry logic for profile creation
   */
  const signUp = useCallback(async (
    email: string, 
    password: string,
    metadata?: { firstName?: string; lastName?: string; userType?: string }
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      logger.debug('🔐 useAuthV2: Signing up...', { email, userType: metadata?.userType });
      const { data, error } = await authServiceV2.signUp(email, password, metadata);
      
      if (error || !data) {
        throw error || new Error('Sign up failed');
      }

      logger.debug('✅ useAuthV2: Sign up successful');
      
      // If auto sign-in is enabled (access_token returned)
      if (data.access_token) {
        logger.debug('🔍 useAuthV2: Attempting to fetch user profile...');
        
        // ✅ ENHANCED: Retry logic for profile creation timing
        let profile = null;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (attempts < maxAttempts && !profile) {
          attempts++;
          logger.debug(`🔄 useAuthV2: Profile fetch attempt ${attempts}/${maxAttempts}`);
          
          const { data: profileData, error: profileError } = await authServiceV2.getUserProfile(data.access_token);
          
          if (profileData) {
            profile = profileData;
            logger.debug('✅ useAuthV2: Profile found:', { role: profile.role, email: profile.email });
            break;
          }
          
          if (profileError) {
            logger.warn(`⚠️ useAuthV2: Profile fetch attempt ${attempts} failed:`, profileError.message);
          }
          
          // Wait before retry (exponential backoff)
          if (attempts < maxAttempts) {
            const delay = Math.min(500 * Math.pow(1.5, attempts - 1), 3000); // 500ms, 750ms, 1125ms, 1687ms, 2531ms
            logger.debug(`⏳ useAuthV2: Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        
        if (profile) {
          // Check for pending country from signup
          const pendingCountry = typeof window !== 'undefined' 
            ? localStorage.getItem('pending_country') 
            : null;
          
          // ✅ ENHANCED: Validate role matches requested userType
          const requestedRole = metadata?.userType || 'player';
          if (profile.role !== requestedRole) {
            logger.warn(`⚠️ useAuthV2: Role mismatch! Requested: ${requestedRole}, Got: ${profile.role}`);
            
            // ✅ CRITICAL FIX: Update profile with correct role immediately
            logger.debug('🔧 useAuthV2: Attempting to fix role mismatch...');
            try {
              const { data: updatedProfile, error: updateError } = await authServiceV2.updateUserRole(profile.id, requestedRole);
              if (updatedProfile && !updateError) {
                logger.debug('✅ useAuthV2: Role corrected successfully!');
                profile.role = requestedRole; // Update local profile
              } else {
                logger.error('❌ useAuthV2: Role correction failed:', updateError?.message);
              }
            } catch (roleFixError: any) {
              logger.error('❌ useAuthV2: Role correction threw error:', roleFixError.message);
            }
          }
          
          // ✅ Update country if pending from signup
          if (pendingCountry && (!profile.country || profile.country === 'US')) {
            logger.debug('🌍 useAuthV2: Updating profile with pending country:', pendingCountry);
            try {
              const { data: updatedProfile, error: updateError } = await authServiceV2.updateUserCountry(profile.id, pendingCountry);
              if (updatedProfile && !updateError) {
                logger.debug('✅ useAuthV2: Country updated successfully!');
                profile.country = pendingCountry; // Update local profile
                
                // Clear pending country from localStorage
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('pending_country');
                  logger.debug('🧹 useAuthV2: Cleared pending_country from localStorage');
                }
              } else {
                logger.error('❌ useAuthV2: Country update failed:', updateError?.message);
              }
            } catch (countryError: any) {
              logger.error('❌ useAuthV2: Country update threw error:', countryError.message);
            }
          }
          
          setState({ user: profile, loading: false, error: null });
          return { success: true, autoSignedIn: true, profile };
        } else {
          logger.error('❌ useAuthV2: Profile not found after all retry attempts');
          
          // ✅ ULTIMATE FALLBACK: Try to create profile manually
          if (metadata) {
            logger.debug('🔧 useAuthV2: Attempting manual profile creation as fallback...');
            
            // Check for pending country from signup
            const pendingCountry = typeof window !== 'undefined' 
              ? localStorage.getItem('pending_country') 
              : null;
            
            if (pendingCountry) {
              logger.debug('🌍 useAuthV2: Found pending country from signup:', pendingCountry);
            }
            
            try {
              const { data: createdProfile, error: createError } = await authServiceV2.createUserProfile({
                email: data.user.email,
                role: metadata.userType || 'player',
                name: `${metadata.firstName || ''} ${metadata.lastName || ''}`.trim(),
                country: pendingCountry || 'US'
              });
              
              if (createdProfile && !createError) {
                logger.debug('✅ useAuthV2: Manual profile creation successful!');
                
                // Clear pending country from localStorage after successful use
                if (typeof window !== 'undefined' && pendingCountry) {
                  localStorage.removeItem('pending_country');
                  logger.debug('🧹 useAuthV2: Cleared pending_country from localStorage');
                }
                
                setState({ user: createdProfile, loading: false, error: null });
                return { success: true, autoSignedIn: true, profile: createdProfile };
              } else {
                logger.error('❌ useAuthV2: Manual profile creation failed:', createError?.message);
              }
            } catch (fallbackError: any) {
              logger.error('❌ useAuthV2: Manual profile creation threw error:', fallbackError.message);
            }
          }
          
          // Still return success since auth user was created
          setState({ user: null, loading: false, error: null });
          return { 
            success: true, 
            autoSignedIn: false, 
            warning: 'Account created but profile sync delayed. Please try signing in.' 
          };
        }
      }

      setState({ user: null, loading: false, error: null });
      return { success: true, autoSignedIn: false };

    } catch (error: any) {
      logger.error('❌ useAuthV2: Sign up error:', error);
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
      logger.debug('🔐 useAuthV2: Signing out...');
      await authServiceV2.signOut();
      
      logger.debug('✅ useAuthV2: Sign out successful');
      setState({ user: null, loading: false, error: null });
      return { success: true };

    } catch (error: any) {
      logger.error('❌ useAuthV2: Sign out error:', error);
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

      logger.debug('🔐 useAuthV2: Refreshing session...');
      const { data, error } = await authServiceV2.refreshToken(session.refreshToken);
      
      if (error || !data) {
        throw error || new Error('Token refresh failed');
      }

      const { data: profile } = await authServiceV2.getUserProfile(data.access_token);
      
      if (profile) {
        setState({ user: profile, loading: false, error: null });
      }

      logger.debug('✅ useAuthV2: Session refreshed');
      return { success: true };

    } catch (error: any) {
      logger.error('❌ useAuthV2: Refresh session error:', error);
      // If refresh fails (expired refresh token), clear invalid session
      logger.debug('🔐 useAuthV2: Clearing invalid session due to refresh failure');
      await authServiceV2.signOut();
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

