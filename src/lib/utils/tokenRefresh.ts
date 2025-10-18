/**
 * 🔐 TOKEN REFRESH UTILITY
 * 
 * Provides automatic token refresh functionality for API calls
 * Prevents JWT expiration errors by refreshing tokens when needed
 */

import { authServiceV2 } from '@/lib/services/authServiceV2';

/**
 * Makes an authenticated API request with automatic token refresh on 401/403 errors
 */
export async function makeAuthenticatedRequest<T = any>(
  url: string,
  options: RequestInit = {},
  retryCount: number = 0
): Promise<T> {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    throw new Error('No access token found - user not authenticated');
  }

  // Add authorization header
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`,
  };

  console.log('🌐 TokenRefresh: Making authenticated request to', url);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle authentication errors with automatic token refresh
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ TokenRefresh: HTTP ${response.status}:`, errorText);
    
    // Check if it's an authentication error and we haven't retried yet
    if ((response.status === 401 || response.status === 403) && retryCount === 0) {
      console.log('🔐 TokenRefresh: Authentication error detected, attempting token refresh...');
      
      try {
        const session = authServiceV2.getSession();
        
        if (session.refreshToken) {
          const { data, error } = await authServiceV2.refreshToken(session.refreshToken);
          
          if (data && !error) {
            console.log('✅ TokenRefresh: Token refreshed, retrying request...');
            // Retry the request with the new token
            return makeAuthenticatedRequest(url, options, retryCount + 1);
          } else {
            console.error('❌ TokenRefresh: Token refresh failed:', error);
          }
        } else {
          console.error('❌ TokenRefresh: No refresh token available');
        }
      } catch (refreshError) {
        console.error('❌ TokenRefresh: Error during token refresh:', refreshError);
      }
    }
    
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ TokenRefresh: Request successful');
  return data;
}

/**
 * Get access token from localStorage
 */
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sb-access-token');
}

/**
 * Check if a JWT token is expired or about to expire
 */
export function isTokenExpired(token: string, bufferMinutes: number = 5): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const bufferTime = bufferMinutes * 60 * 1000; // Convert minutes to milliseconds
    
    return (expirationTime - currentTime) < bufferTime;
  } catch (error) {
    console.error('❌ TokenRefresh: Error parsing token:', error);
    return true; // Assume expired if we can't parse it
  }
}

/**
 * Get time until token expiration in minutes
 */
export function getTokenExpirationTime(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;
    
    return Math.round(timeUntilExpiry / 1000 / 60); // Return minutes
  } catch (error) {
    console.error('❌ TokenRefresh: Error parsing token:', error);
    return 0; // Return 0 if we can't parse it
  }
}
