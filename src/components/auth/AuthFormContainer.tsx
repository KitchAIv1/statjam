/**
 * AuthFormContainer Component
 * Renders the authentication form UI
 * Extracted to comply with max-lines-per-function limit
 * Max component size: 200 lines | Current: ~80 lines ✅
 */

import React from 'react';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { type UserRole } from './RoleSelector';
import { authPageStyles, authPageCSSStyles } from './styles/AuthPageStyles';
import { type PasswordStrength } from '@/utils/validators/authValidators';
import { type NameErrors } from '@/hooks/useNameValidation';
import { type SignInFormData, type SignUpFormData } from '@/components/auth/utils/authValidation';

export interface AuthFormContainerProps {
  isLogin: boolean;
  error: string;
  sanitizedError: string;
  signInData: SignInFormData;
  signUpData: SignUpFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  userType: UserRole;
  onUserTypeChange: (role: UserRole) => void;
  onToggleMode: () => void;
  onClearError: () => void;
  // Tier 2 props
  passwordStrength: PasswordStrength;
  nameErrors: NameErrors;
}

/**
 * Container for authentication forms with all UI elements
 */
export const AuthFormContainer: React.FC<AuthFormContainerProps> = ({
  isLogin,
  error,
  sanitizedError,
  signInData,
  signUpData,
  onInputChange,
  onSubmit,
  loading,
  userType,
  onUserTypeChange,
  onToggleMode,
  onClearError,
  passwordStrength,
  nameErrors
}) => {
  return (
    <>
      <style jsx>{authPageCSSStyles}</style>
      <div style={authPageStyles.container} className="auth-container">
        <div style={authPageStyles.formContainer} className="auth-form">
          <div style={authPageStyles.header} className="auth-header">
            <h1 style={authPageStyles.title} className="auth-title">StatJam</h1>
            <p style={authPageStyles.subtitle} className="auth-subtitle">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </p>
          </div>

          {error && (
            <div 
              style={authPageStyles.error}
              dangerouslySetInnerHTML={{ 
                __html: sanitizedError
              }}
            />
          )}

          {isLogin ? (
            <SignInForm
              formData={signInData}
              onInputChange={onInputChange}
              onSubmit={onSubmit}
              loading={loading}
            />
          ) : (
            <SignUpForm
              formData={signUpData}
              onInputChange={onInputChange}
              onSubmit={onSubmit}
              loading={loading}
              userType={userType}
              onUserTypeChange={onUserTypeChange}
              passwordStrength={passwordStrength}
              nameErrors={nameErrors}
            />
          )}

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <span style={{ color: '#374151', fontSize: '14px' }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              type="button"
              onClick={() => {
                onToggleMode();
                onClearError();
              }}
              style={authPageStyles.switchButton}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
