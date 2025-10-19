/**
 * 🏀 ENTERPRISE AUTH SERVICE V2
 * 
 * Raw HTTP authentication - bypasses broken Supabase client
 * Same approach as data fetching: reliable, fast, never hangs
 */

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

    if (!url || !anonKey) {
      throw new Error('AuthServiceV2: Missing Supabase environment variables');
    }

    this.config = {
      url,
      anonKey,
      timeout: 10000, // 10 seconds
      maxRetries: 2,
    };

    console.log('🔐 AuthServiceV2: Enterprise auth service initialized');
  }

  private getHeaders(accessToken?: string) {
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
      console.log('🔐 AuthServiceV2: Signing in user:', email);

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

      console.log('✅ AuthServiceV2: Sign in successful for:', email);
      return { data, error: null };

    } catch (error: any) {
      console.error('❌ AuthServiceV2: Sign in error:', error.message);
      return { data: null, error };
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
      console.log('🔐 AuthServiceV2: Signing up user:', email);

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
        const errorMessage = this.getAuthErrorMessage(response.status, errorData);
        throw new Error(errorMessage);
      }

      const data: SignUpResponse = await response.json();
      console.log('✅ AuthServiceV2: Sign up successful for:', email);
      
      // Store tokens in localStorage if provided (email confirmation disabled)
      if (data.access_token && typeof window !== 'undefined') {
        console.log('🔐 AuthServiceV2: Storing signup tokens in localStorage');
        localStorage.setItem('sb-access-token', data.access_token);
        localStorage.setItem('sb-refresh-token', data.refresh_token || '');
        localStorage.setItem('sb-user', JSON.stringify(data.user));
      }
      
      return { data, error: null };

    } catch (error: any) {
      console.error('❌ AuthServiceV2: Sign up error:', error.message);
      return { data: null, error };
    }
  }

  /**
   * 🔐 SIGN OUT - Raw HTTP (never hangs)
   */
  async signOut(): Promise<{ error: Error | null }> {
    try {
      console.log('🔐 AuthServiceV2: Signing out user');

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

      console.log('✅ AuthServiceV2: Sign out successful');
      return { error: null };

    } catch (error: any) {
      console.error('❌ AuthServiceV2: Sign out error:', error.message);
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
      console.log('🔐 AuthServiceV2: Fetching user profile');

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
        console.error('❌ AuthServiceV2: Failed to get user from token:', userResponse.status, errorText);
        throw new Error(`Failed to get user from token: ${userResponse.status}`);
      }

      const userData = await userResponse.json();
      const userId = userData.id;

      console.log('🔐 AuthServiceV2: User ID:', userId);

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
        console.error('❌ AuthServiceV2: Failed to fetch profile:', profileResponse.status, errorText);
        throw new Error(`Failed to fetch user profile from database: ${profileResponse.status}`);
      }

      const profiles = await profileResponse.json();
      
      if (!profiles || profiles.length === 0) {
        console.log('⚠️ AuthServiceV2: No profile found in users table, might be new user');
        return { data: null, error: new Error('Profile not found') };
      }

      const profile: UserProfile = profiles[0];
      console.log('✅ AuthServiceV2: Profile fetched successfully, role:', profile.role);
      
      return { data: profile, error: null };

    } catch (error: any) {
      console.error('❌ AuthServiceV2: Get profile error:', error.message);
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
      console.log('🔐 AuthServiceV2: Refreshing access token');

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
        throw new Error('Token refresh failed');
      }

      const data: SignInResponse = await response.json();
      
      // Update tokens in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('sb-access-token', data.access_token);
        localStorage.setItem('sb-refresh-token', data.refresh_token);
        localStorage.setItem('sb-user', JSON.stringify(data.user));
      }

      console.log('✅ AuthServiceV2: Token refreshed successfully');
      return { data, error: null };

    } catch (error: any) {
      console.error('❌ AuthServiceV2: Refresh token error:', error.message);
      return { data: null, error };
    }
  }

  /**
   * 🔐 RESEND CONFIRMATION EMAIL - Raw HTTP (never hangs)
   */
  async resendConfirmationEmail(email: string): Promise<{ error: Error | null }> {
    try {
      console.log('🔐 AuthServiceV2: Resending confirmation email to:', email);

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

      console.log('✅ AuthServiceV2: Confirmation email resent successfully');
      return { error: null };

    } catch (error: any) {
      console.error('❌ AuthServiceV2: Resend confirmation email error:', error.message);
      return { error };
    }
  }
}

// Export singleton instance
export const authServiceV2 = new AuthServiceV2();

