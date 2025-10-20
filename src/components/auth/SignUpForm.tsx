/**
 * SignUpForm Component - Extracted from AuthPageV2
 * Handles sign-up specific form fields and logic
 */

import React from 'react';
import { AuthInput } from './AuthInput';
import { RoleSelector, type UserRole } from './RoleSelector';
import { authPageStyles } from './styles/AuthPageStyles';

export interface SignUpFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignUpFormProps {
  formData: SignUpFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  userType: UserRole;
  onUserTypeChange: (role: UserRole) => void;
  disabled?: boolean;
}

/**
 * Sign-up form component with all registration fields
 */
export const SignUpForm: React.FC<SignUpFormProps> = ({
  formData,
  onInputChange,
  onSubmit,
  loading,
  userType,
  onUserTypeChange,
  disabled = false
}) => {
  return (
    <form onSubmit={onSubmit}>
      <AuthInput
        type="text"
        name="firstName"
        placeholder="First Name"
        value={formData.firstName}
        onChange={onInputChange}
        required
        disabled={disabled || loading}
      />
      
      <AuthInput
        type="text"
        name="lastName"
        placeholder="Last Name"
        value={formData.lastName}
        onChange={onInputChange}
        required
        disabled={disabled || loading}
      />

      <RoleSelector
        userType={userType}
        setUserType={onUserTypeChange}
        disabled={disabled || loading}
      />

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
        autoComplete="new-password"
        disabled={disabled || loading}
      />
      
      <div style={{ marginBottom: '8px', fontSize: '12px', color: '#6b7280' }}>
        Password must be at least 6 characters long
      </div>
      
      <AuthInput
        type="password"
        name="confirmPassword"
        placeholder="Confirm Password"
        value={formData.confirmPassword}
        onChange={onInputChange}
        required
        minLength={6}
        autoComplete="new-password"
        disabled={disabled || loading}
      />
      
      <div style={{ marginBottom: '16px', fontSize: '12px', color: '#6b7280' }}>
        Please confirm your password
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
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
};
