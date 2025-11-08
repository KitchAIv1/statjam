/**
 * SignUpForm Component - Extracted from AuthPageV2
 * Handles sign-up specific form fields and logic
 * Enhanced with Tier 2 features: Password Strength & Name Validation
 */

import React from 'react';
import { AuthInput } from './AuthInput';
import { RoleSelector, type UserRole } from './RoleSelector';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { authPageStyles } from './styles/AuthPageStyles';
import { type PasswordStrength } from '@/utils/validators/authValidators';
import { type NameErrors } from '@/hooks/useNameValidation';

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
  // Tier 2 #1: Password Strength
  passwordStrength?: PasswordStrength;
  // Tier 2 #4: Name Validation
  nameErrors?: NameErrors;
  onNameBlur?: (field: 'firstName' | 'lastName') => void;
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
  disabled = false,
  passwordStrength,
  nameErrors,
  onNameBlur
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
        minLength={2}
        disabled={disabled || loading}
      />
      {nameErrors?.firstName && (
        <small style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '-12px', marginBottom: '8px' }}>
          {nameErrors.firstName}
        </small>
      )}
      
      <AuthInput
        type="text"
        name="lastName"
        placeholder="Last Name"
        value={formData.lastName}
        onChange={onInputChange}
        required
        minLength={2}
        disabled={disabled || loading}
      />
      {nameErrors?.lastName && (
        <small style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '-12px', marginBottom: '8px' }}>
          {nameErrors.lastName}
        </small>
      )}

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
      
      {/* Tier 2 #1: Password Strength Indicator */}
      {passwordStrength && (
        <PasswordStrengthIndicator
          password={formData.password}
          passwordStrength={passwordStrength}
        />
      )}
      
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
      
      <div style={{ marginBottom: '16px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
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
