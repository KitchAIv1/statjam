/**
 * ForgotPasswordForm Component
 * Email input form for requesting password reset
 * 
 * @module ForgotPasswordForm
 */

import React from 'react';
import { AuthInput } from './AuthInput';
import { authPageStyles } from './styles/AuthPageStyles';

interface ForgotPasswordFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
  onBackToSignIn: () => void;
  loading: boolean;
  error: string | null;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  email,
  onEmailChange,
  onSubmit,
  onBackToSignIn,
  loading,
  error,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <p style={{ 
        color: 'rgba(0, 0, 0, 0.8)', 
        fontSize: '14px', 
        marginBottom: '20px',
        textAlign: 'center',
        fontWeight: '500',
      }}>
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>

      {error && (
        <div style={authPageStyles.error}>
          {error}
        </div>
      )}

      <AuthInput
        type="email"
        name="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        required
        autoComplete="email"
        disabled={loading}
      />

      <button
        type="submit"
        disabled={loading}
        style={{
          ...authPageStyles.button,
          opacity: loading ? 0.6 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
        className="auth-button"
      >
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>

      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <button
          type="button"
          onClick={onBackToSignIn}
          style={authPageStyles.switchButton}
        >
          Back to Sign In
        </button>
      </div>
    </form>
  );
};
