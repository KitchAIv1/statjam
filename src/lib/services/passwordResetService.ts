/**
 * Password Reset Service
 * Handles password reset flow via Supabase Auth API
 * Extracted to comply with .cursorrules - no legacy file expansion
 * 
 * @module passwordResetService
 * @see authServiceV2.ts for main auth operations
 */

import { logger } from '@/lib/utils/logger';

interface PasswordResetConfig {
  url: string;
  anonKey: string;
  timeout: number;
}

export class PasswordResetService {
  private config: PasswordResetConfig;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    this.config = {
      url: url || '',
      anonKey: anonKey || '',
      timeout: 10000,
    };

    if (!url || !anonKey) {
      logger.warn('⚠️ PasswordResetService: Missing Supabase environment variables');
    }
  }

  private getHeaders(accessToken?: string): Record<string, string> {
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
   * Get the redirect URL for password reset
   * Uses window.location.origin to support both dev and production
   */
  private getResetRedirectUrl(): string {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/auth/reset-password`;
    }
    // Fallback for SSR - use production URL
    return 'https://statjam.net/auth/reset-password';
  }

  /**
   * Send password reset email to user
   * Uses Supabase's /auth/v1/recover endpoint
   */
  async sendResetEmail(email: string): Promise<{ error: Error | null }> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const redirectUrl = this.getResetRedirectUrl();
      logger.debug('🔐 PasswordResetService: Sending reset email to:', normalizedEmail, 'redirect:', redirectUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.url}/auth/v1/recover`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ 
          email: normalizedEmail,
          redirect_to: redirectUrl,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.error_description || errorData.message || 'Failed to send reset email');
      }

      logger.debug('✅ PasswordResetService: Reset email sent successfully');
      return { error: null };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      logger.error('❌ PasswordResetService: Send reset email error:', errorMessage);
      return { error: error instanceof Error ? error : new Error(errorMessage) };
    }
  }

  /**
   * Update user password using recovery access token
   * Called after user clicks the reset link in their email
   */
  async updatePassword(accessToken: string, newPassword: string): Promise<{ error: Error | null }> {
    try {
      logger.debug('🔐 PasswordResetService: Updating password');

      if (!newPassword || newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.url}/auth/v1/user`, {
        method: 'PUT',
        headers: this.getHeaders(accessToken),
        body: JSON.stringify({ password: newPassword }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.error_description || errorData.message || 'Failed to update password');
      }

      logger.debug('✅ PasswordResetService: Password updated successfully');
      return { error: null };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update password';
      logger.error('❌ PasswordResetService: Update password error:', errorMessage);
      return { error: error instanceof Error ? error : new Error(errorMessage) };
    }
  }
}

// Singleton instance
export const passwordResetService = new PasswordResetService();
