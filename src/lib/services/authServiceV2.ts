/**
 * 🏀 ENTERPRISE AUTH SERVICE V2
 * 
 * Raw HTTP authentication - bypasses broken Supabase client
 * Same approach as data fetching: reliable, fast, never hangs
 */

import { logger } from '@/lib/utils/logger';

interface AuthConfig {
  url: string;
  anonKey: string;
  timeout: number;
  maxRetries: number;
}

interface SignInResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    email_confirmed_at?: string;
    user_metadata?: any;
  };
}

interface SignUpResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  expires_at?: number;
  refresh_token?: string;
  user: {
    id: string;
    email: string;
    email_confirmed_at?: string;
    user_metadata?: any;
  };
}

interface UserProfile {
  id: string;
  email: string;
  role: string;
  name?: string;
  country?: string;
  premium_status?: string;
  profile_image?: string;
  created_at: string;
  updated_at: string;
}

export class AuthServiceV2 {
  private config: AuthConfig;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    this.config = {
      url: url || '',
      anonKey: anonKey || '',
      timeout: 10000, // 10 seconds
      maxRetries: 2,
    };

    // Graceful degradation instead of throwing at construction time
    if (!url || !anonKey) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn('⚠️ AuthServiceV2: Missing Supabase environment variables - auth methods will fail gracefully');
      }
      // Methods that require config will check and throw with clear message
      return;
    }

    logger.debug('🔐 AuthServiceV2: Enterprise auth service initialized');
  }

  private getHeaders(accessToken?: string) {
    // Validate config before using
    if (!this.config.url || !this.config.anonKey) {
      throw new Error('AuthServiceV2: Missing Supabase configuration. Please check environment variables.');
    }

    const headers: Record<string, string> = {
      'apikey': this.config.anonKey,
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return headers;
  }

  /**
   * Convert auth error responses to user-friendly messages
   */
  private getAuthErrorMessage(status: number, errorData: any): string {
    const message = errorData?.error_description || errorData?.message || '';
    
    // Check for specific error messages from Supabase
    if (message.includes('Invalid login credentials')) {
      return 'Invalid email or password';
    }
    
    if (message.includes('Email not confirmed')) {
      return 'Please confirm your email before signing in';
    }
    
    if (message.includes('User already registered')) {
      return 'This email is already registered. Please sign in instead.';
    }
    
    if (message.includes('Password should be at least')) {
      return 'Password must be at least 6 characters long';
    }

    if (message.includes('Invalid email')) {
      return 'Please enter a valid email address';
    }

    // Fall back to status-based messages
    switch (status) {
      case 400:
        return 'Invalid email or password format';
      case 401:
        return 'Invalid email or password';
      case 422:
        return 'Invalid email or password provided';
      case 429:
        return 'Too many login attempts. Please try again in a few minutes.';
      case 500:
      case 502:
      case 503:
        return 'Authentication service unavailable. Please try again later.';
      default:
        return message || 'Authentication failed. Please try again.';
    }
  }

  /**
   * 🔐 SIGN IN - Raw HTTP (never hangs)
   */
  async signIn(email: string, password: string): Promise<{ data: SignInResponse | null; error: Error | null }> {
    try {
      // ✅ CRITICAL FIX #1: Normalize email (trim and lowercase) for sign-in too
      email = email.trim().toLowerCase();
      
      logger.debug('🔐 AuthServiceV2: Signing in user:', email);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        const errorMessage = this.getAuthErrorMessage(response.status, errorData);
        throw new Error(errorMessage);
      }

      const data: SignInResponse = await response.json();
      
      // Store tokens in localStorage for session persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('sb-access-token', data.access_token);
        localStorage.setItem('sb-refresh-token', data.refresh_token);
        localStorage.setItem('sb-user', JSON.stringify(data.user));
      }

      logger.debug('✅ AuthServiceV2: Sign in successful for:', email);
      return { data, error: null };

    } catch (error: any) {
      // ✅ RELIABILITY: Better error handling for aborted requests
      const errorMessage = error.name === 'AbortError' 
        ? 'Request timed out. Please check your connection and try again.'
        : error.message || 'Sign in failed';
      
      logger.error('❌ AuthServiceV2: Sign in error:', errorMessage);
      return { data: null, error: new Error(errorMessage) };
    }
  }

  /**
   * 🔐 SIGN UP - Raw HTTP (never hangs)
   */
  async signUp(
    email: string, 
    password: string, 
    metadata?: { firstName?: string; lastName?: string; userType?: string }
  ): Promise<{ data: SignUpResponse | null; error: Error | null }> {
    try {
      // ✅ CRITICAL FIX #1: Normalize email (trim and lowercase)
      email = email.trim().toLowerCase();
      
      logger.debug('🔐 AuthServiceV2: Signing up user:', email, {
        passwordLength: password?.length || 0,
        hasMetadata: !!metadata,
        userType: metadata?.userType
      });

      // ✅ VALIDATION: Check metadata and userType (Tier 2 #3)
      if (!metadata || !metadata.userType) {
        logger.error('❌ AuthServiceV2: Missing userType in metadata');
        throw new Error('User type must be selected');
      }

      const validUserTypes = ['player', 'organizer', 'stat_admin', 'coach'];
      if (!validUserTypes.includes(metadata.userType)) {
        logger.error('❌ AuthServiceV2: Invalid userType:', metadata.userType);
        throw new Error(`Invalid user type. Must be one of: ${validUserTypes.join(', ')}`);
      }

      logger.debug('✅ AuthServiceV2: Metadata validated:', {
        userType: metadata.userType,
        hasOtherMetadata: Object.keys(metadata).length > 1
      });

      // ✅ VALIDATION: Check password length (Supabase requires min 6 characters)
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // ✅ VALIDATION: Check email format (improved regex - Tier 2 #2)
      const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*[a-zA-Z0-9]@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;
      if (!email || !emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.url}/auth/v1/signup`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          email,
          password,
          data: metadata || {},
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        logger.error('❌ AuthServiceV2: Signup API error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        const errorMessage = this.getAuthErrorMessage(response.status, errorData);
        throw new Error(errorMessage);
      }

      const data: SignUpResponse = await response.json();
      logger.debug('✅ AuthServiceV2: Sign up successful for:', email);
      
      // Store tokens in localStorage if provided (email confirmation disabled)
      if (data.access_token && typeof window !== 'undefined') {
        logger.debug('🔐 AuthServiceV2: Storing signup tokens in localStorage');
        localStorage.setItem('sb-access-token', data.access_token);
        localStorage.setItem('sb-refresh-token', data.refresh_token || '');
        localStorage.setItem('sb-user', JSON.stringify(data.user));
      }
      
      return { data, error: null };

    } catch (error: any) {
      logger.error('❌ AuthServiceV2: Sign up error:', error.message);
      return { data: null, error };
    }
  }

  /**
   * 🔐 SIGN OUT - Raw HTTP (never hangs)
   */
  async signOut(): Promise<{ error: Error | null }> {
    try {
      logger.debug('🔐 AuthServiceV2: Signing out user');

      const accessToken = typeof window !== 'undefined' 
        ? localStorage.getItem('sb-access-token') 
        : null;

      if (accessToken) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        await fetch(`${this.config.url}/auth/v1/logout`, {
          method: 'POST',
          headers: this.getHeaders(accessToken),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
      }

      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
        localStorage.removeItem('sb-user');
      }

      logger.debug('✅ AuthServiceV2: Sign out successful');
      return { error: null };

    } catch (error: any) {
      logger.error('❌ AuthServiceV2: Sign out error:', error.message);
      // Still clear local storage even if API call fails
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
        localStorage.removeItem('sb-user');
      }
      return { error };
    }
  }

  /**
   * 🔐 GET USER PROFILE - Raw HTTP (never hangs)
   */
  async getUserProfile(accessToken: string): Promise<{ data: UserProfile | null; error: Error | null }> {
    try {
      logger.debug('🔐 AuthServiceV2: Fetching user profile');

      // ✅ FIX: Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      // First, get user ID from token
      const userResponse = await fetch(`${this.config.url}/auth/v1/user`, {
        method: 'GET',
        headers: this.getHeaders(accessToken),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!userResponse.ok) {
        const errorText = await userResponse.text().catch(() => 'Unknown error');
        logger.error('❌ AuthServiceV2: Failed to get user from token:', userResponse.status, errorText);
        throw new Error(`Failed to get user from token: ${userResponse.status}`);
      }

      const userData = await userResponse.json();
      const userId = userData.id;

      logger.debug('🔐 AuthServiceV2: User ID:', userId);

      // ✅ FIX: Add timeout for profile fetch
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), this.config.timeout);

      // Then fetch profile from users table using raw HTTP
      const profileResponse = await fetch(
        `${this.config.url}/rest/v1/users?select=id,email,role,name,country,premium_status,profile_image,created_at,updated_at&id=eq.${userId}`,
        {
          method: 'GET',
          headers: {
            'apikey': this.config.anonKey,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          signal: controller2.signal,
        }
      );

      clearTimeout(timeoutId2);

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text().catch(() => 'Unknown error');
        logger.error('❌ AuthServiceV2: Failed to fetch profile:', profileResponse.status, errorText);
        throw new Error(`Failed to fetch user profile from database: ${profileResponse.status}`);
      }

      const profiles = await profileResponse.json();
      
      if (!profiles || profiles.length === 0) {
        logger.debug('⚠️ AuthServiceV2: No profile found in users table, might be new user');
        return { data: null, error: new Error('Profile not found') };
      }

      const profile: UserProfile = profiles[0];
      logger.debug('✅ AuthServiceV2: Profile fetched successfully, role:', profile.role);
      
      return { data: profile, error: null };

    } catch (error: any) {
      // ✅ FIX: Don't log AbortError - this is expected during navigation/unmount
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        logger.debug('🔄 AuthServiceV2: Profile fetch aborted (navigation/unmount)');
        return { data: null, error };
      }
      logger.error('❌ AuthServiceV2: Get profile error:', error.message);
      return { data: null, error };
    }
  }

  /**
   * 🔐 GET CURRENT SESSION - From localStorage
   */
  getSession(): { accessToken: string | null; refreshToken: string | null; user: any | null } {
    if (typeof window === 'undefined') {
      return { accessToken: null, refreshToken: null, user: null };
    }

    const accessToken = localStorage.getItem('sb-access-token');
    const refreshToken = localStorage.getItem('sb-refresh-token');
    const userStr = localStorage.getItem('sb-user');
    const user = userStr ? JSON.parse(userStr) : null;

    return { accessToken, refreshToken, user };
  }

  /**
   * 🔐 REFRESH TOKEN - Raw HTTP (never hangs)
   */
  async refreshToken(refreshToken: string): Promise<{ data: SignInResponse | null; error: Error | null }> {
    try {
      logger.debug('🔐 AuthServiceV2: Refreshing access token');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.url}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ refresh_token: refreshToken }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`❌ AuthServiceV2: Token refresh failed with ${response.status}:`, errorText);
        
        // If 400, it means refresh token is expired/invalid
        if (response.status === 400) {
          throw new Error('Refresh token expired or invalid');
        }
        
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data: SignInResponse = await response.json();
      
      // Update tokens in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('sb-access-token', data.access_token);
        localStorage.setItem('sb-refresh-token', data.refresh_token);
        localStorage.setItem('sb-user', JSON.stringify(data.user));
      }

      logger.debug('✅ AuthServiceV2: Token refreshed successfully');
      return { data, error: null };

    } catch (error: any) {
      logger.error('❌ AuthServiceV2: Refresh token error:', error.message);
      return { data: null, error };
    }
  }

  /**
   * 🔐 CREATE USER PROFILE - Manual profile creation fallback
   */
  async createUserProfile(profileData: {
    email: string;
    role: string;
    name?: string;
    country?: string;
  }): Promise<{ data: any | null; error: Error | null }> {
    try {
      logger.debug('🔐 AuthServiceV2: Creating user profile manually:', profileData.email);

      const session = this.getSession();
      if (!session.accessToken) {
        throw new Error('No access token available for profile creation');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.url}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'apikey': this.config.anonKey,
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          email: profileData.email,
          role: profileData.role,
          name: profileData.name || '',
          country: profileData.country || 'US',
          premium_status: false
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Profile creation failed: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      logger.debug('✅ AuthServiceV2: User profile created manually');
      
      return { data: data[0] || data, error: null };

    } catch (error: any) {
      logger.error('❌ AuthServiceV2: Create profile error:', error.message);
      return { data: null, error };
    }
  }

  /**
   * 🔐 UPDATE USER ROLE - Fix role mismatch issues
   */
  async updateUserRole(userId: string, newRole: string): Promise<{ data: any | null; error: Error | null }> {
    try {
      logger.debug('🔐 AuthServiceV2: Updating user role:', { userId, newRole });

      const session = this.getSession();
      if (!session.accessToken) {
        throw new Error('No access token available for role update');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.url}/rest/v1/users?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': this.config.anonKey,
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          role: newRole
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Role update failed: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      logger.debug('✅ AuthServiceV2: User role updated successfully');
      
      return { data: data[0] || data, error: null };

    } catch (error: any) {
      logger.error('❌ AuthServiceV2: Update role error:', error.message);
      return { data: null, error };
    }
  }

  /**
   * 🔐 UPDATE USER COUNTRY - Update country after signup
   */
  async updateUserCountry(userId: string, country: string): Promise<{ data: any | null; error: Error | null }> {
    try {
      logger.debug('🔐 AuthServiceV2: Updating user country:', { userId, country });

      const session = this.getSession();
      if (!session.accessToken) {
        throw new Error('No access token available for country update');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.url}/rest/v1/users?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': this.config.anonKey,
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          country: country
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Country update failed: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      logger.debug('✅ AuthServiceV2: User country updated successfully');
      
      return { data: data[0] || data, error: null };

    } catch (error: any) {
      logger.error('❌ AuthServiceV2: Update country error:', error.message);
      return { data: null, error };
    }
  }

  /**
   * 🔐 RESEND CONFIRMATION EMAIL - Raw HTTP (never hangs)
   */
  async resendConfirmationEmail(email: string): Promise<{ error: Error | null }> {
    try {
      logger.debug('🔐 AuthServiceV2: Resending confirmation email to:', email);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.url}/auth/v1/resend`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          type: 'signup',
          email: email,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.error_description || errorData.message || 'Failed to resend confirmation email');
      }

      logger.debug('✅ AuthServiceV2: Confirmation email resent successfully');
      return { error: null };

    } catch (error: any) {
      logger.error('❌ AuthServiceV2: Resend confirmation email error:', error.message);
      return { error };
    }
  }
}

// Export singleton instance
export const authServiceV2 = new AuthServiceV2();

