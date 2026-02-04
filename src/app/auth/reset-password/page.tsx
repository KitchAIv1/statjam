'use client';

/**
 * Reset Password Page
 * Handles the complete password reset flow:
 * 1. Request reset email (user enters email)
 * 2. Email sent confirmation
 * 3. New password form (when user clicks reset link)
 * 4. Success confirmation
 * 
 * @module ResetPasswordPage
 */

import React, { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { usePasswordReset } from '@/hooks/usePasswordReset';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { authPageStyles, authPageCSSStyles } from '@/components/auth/styles/AuthPageStyles';

function ResetPasswordContent() {
  const router = useRouter();
  const {
    state,
    setEmail,
    sendResetEmail,
    updatePassword,
    setAccessToken,
    reset,
  } = usePasswordReset();

  // Parse URL hash on mount (handles redirect from Supabase reset email)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash.substring(1);
    if (!hash) return;

    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const tokenType = params.get('type');

    // Only process recovery tokens
    if (accessToken && tokenType === 'recovery') {
      setAccessToken(accessToken);
      // Clean URL hash
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [setAccessToken]);

  const handleBackToSignIn = () => {
    reset();
    router.push('/auth');
  };

  const handlePasswordUpdate = async (newPassword: string) => {
    const success = await updatePassword(newPassword);
    if (success) {
      // Auto-redirect after success
      setTimeout(() => {
        router.push('/auth');
      }, 3000);
    }
  };

  const renderContent = () => {
    switch (state.step) {
      case 'request':
        return (
          <ForgotPasswordForm
            email={state.email}
            onEmailChange={setEmail}
            onSubmit={sendResetEmail}
            onBackToSignIn={handleBackToSignIn}
            loading={state.loading}
            error={state.error}
          />
        );

      case 'email_sent':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '16px',
            }}>
              ✉️
            </div>
            <h2 style={{ 
              color: '#111827', 
              fontSize: '20px', 
              fontWeight: '600',
              marginBottom: '12px',
            }}>
              Check your email
            </h2>
            <p style={{ 
              color: 'rgba(0, 0, 0, 0.7)', 
              fontSize: '14px',
              marginBottom: '24px',
              lineHeight: '1.5',
            }}>
              We&apos;ve sent a password reset link to<br />
              <strong>{state.email}</strong>
            </p>
            <button
              type="button"
              onClick={handleBackToSignIn}
              style={authPageStyles.switchButton}
            >
              Back to Sign In
            </button>
          </div>
        );

      case 'new_password':
        return (
          <ResetPasswordForm
            onSubmit={handlePasswordUpdate}
            loading={state.loading}
            error={state.error}
          />
        );

      case 'success':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '16px',
            }}>
              ✅
            </div>
            <h2 style={{ 
              color: '#111827', 
              fontSize: '20px', 
              fontWeight: '600',
              marginBottom: '12px',
            }}>
              Password Updated!
            </h2>
            <p style={{ 
              color: 'rgba(0, 0, 0, 0.7)', 
              fontSize: '14px',
              marginBottom: '24px',
            }}>
              Your password has been successfully reset.<br />
              Redirecting to sign in...
            </p>
            <button
              type="button"
              onClick={handleBackToSignIn}
              style={{
                ...authPageStyles.button,
                marginTop: '8px',
              }}
              className="auth-button"
            >
              Sign In Now
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (state.step) {
      case 'request':
      case 'email_sent':
        return 'Forgot Password';
      case 'new_password':
        return 'Reset Password';
      case 'success':
        return 'Success!';
      default:
        return 'Reset Password';
    }
  };

  return (
    <>
      <style jsx>{authPageCSSStyles}</style>
      <div style={authPageStyles.container} className="auth-container animate-fadeIn">
        <div style={authPageStyles.formContainer} className="auth-form animate-fadeInUp">
          <div style={authPageStyles.header} className="auth-header">
            <h1 style={authPageStyles.title} className="auth-title">StatJam</h1>
            <p style={authPageStyles.subtitle} className="auth-subtitle">
              {getTitle()}
            </p>
          </div>

          {renderContent()}
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
