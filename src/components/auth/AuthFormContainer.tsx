/**
 * AuthFormContainer Component
 * Renders the authentication form UI
 * Extracted to comply with max-lines-per-function limit
 * Max component size: 200 lines | Current: ~80 lines ✅
 */

import React from 'react';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { SignUpFormMultiStep } from './SignUpFormMultiStep';
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
      <div style={authPageStyles.container} className="auth-container animate-fadeIn">
        <div style={authPageStyles.formContainer} className="auth-form animate-fadeInUp">
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
            <SignUpFormMultiStep
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

          {/* Product Hunt Badge */}
          <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '12px' }}>As featured on</p>
            <a 
              href="https://www.producthunt.com/products/statjam?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-statjam" 
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block' }}
            >
              <img 
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1035008&theme=light&t=1762437800195" 
                alt="StatJam - Level stats, real-time, zero friction | Product Hunt" 
                style={{ width: '250px', height: '54px' }} 
                width="250" 
                height="54" 
              />
            </a>
          </div>
        </div>
      </div>
    </>
  );
};
