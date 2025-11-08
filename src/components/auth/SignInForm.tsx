/**
 * SignInForm Component - Extracted from AuthPageV2
 * Handles sign-in specific form fields and logic
 */

import React from 'react';
import { AuthInput } from './AuthInput';
import { authPageStyles } from './styles/AuthPageStyles';

export interface SignInFormData {
  email: string;
  password: string;
}

export interface SignInFormProps {
  formData: SignInFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error?: string;
  disabled?: boolean;
}

/**
 * Sign-in form component with email and password fields
 */
export const SignInForm: React.FC<SignInFormProps> = ({
  formData,
  onInputChange,
  onSubmit,
  loading,
  disabled = false
}) => {
  return (
    <form onSubmit={onSubmit}>
      <AuthInput
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={onInputChange}
        required
        autoComplete="email"
        disabled={disabled || loading}
      />
      
      <AuthInput
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={onInputChange}
        required
        minLength={6}
        autoComplete="current-password"
        disabled={disabled || loading}
      />
      
      <div style={{ marginBottom: '8px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
        Password must be at least 6 characters long
      </div>

      <button
        type="submit"
        disabled={loading || disabled}
        style={{
          ...authPageStyles.button,
          opacity: (loading || disabled) ? 0.6 : 1,
          cursor: (loading || disabled) ? 'not-allowed' : 'pointer'
        }}
        className="auth-button"
      >
        {loading ? 'Signing In...' : 'Sign In'}
      </button>
    </form>
  );
};
