'use client';

/**
 * AuthPageV2 - Refactored Authentication Component
 * Reduced from 997 lines to ~150 lines using extracted components and hooks
 * Maintains exact same functionality and user experience
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import EmailConfirmationPending from './EmailConfirmationPending';

// Extracted hooks
import { useAuthForm } from '@/hooks/useAuthForm';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { useAuthError } from '@/hooks/useAuthError';

// Extracted components
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { type UserRole } from './RoleSelector';

// Extracted styles
import { authPageStyles, authPageCSSStyles } from './styles/AuthPageStyles';

const AuthPageV2 = () => {
  const router = useRouter();
  
  // State management
  const [userType, setUserType] = useState<UserRole>('player');
  
  // Custom hooks
  const { formData, handleInputChange, validateForm, getSignUpData, getSignInData } = useAuthForm();
  const { authFlowState, loading, user, handleSignIn, handleSignUp, handleBackToSignIn, setIsLogin } = useAuthFlow();
  const { error, setError, clearError, sanitizedError } = useAuthError();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      // Validate form
      const validation = validateForm(authFlowState.isLogin);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      if (authFlowState.isLogin) {
        await handleSignIn(getSignInData());
      } else {
        await handleSignUp(getSignUpData(), userType);
      }
    } catch (err: any) {
      console.error('❌ AuthPageV2: Error:', err.message);
      setError(err.message);
      
      // Handle delayed profile sync warning with auto-redirect
      if (err.message.includes('Account created successfully!')) {
        setTimeout(() => {
          setIsLogin(true);
          clearError();
        }, 3000);
      }
    }
  };

  // Show email confirmation screen
  if (authFlowState.showEmailConfirmation) {
    return (
      <EmailConfirmationPending
        email={authFlowState.signupEmail}
        onBack={handleBackToSignIn}
      />
    );
  }

  return (
    <>
      <style jsx>{authPageCSSStyles}</style>
      <div style={authPageStyles.container} className="auth-container">
        <div style={authPageStyles.formContainer} className="auth-form">
          <div style={authPageStyles.header} className="auth-header">
            <h1 style={authPageStyles.title} className="auth-title">StatJam</h1>
            <p style={authPageStyles.subtitle} className="auth-subtitle">
              {authFlowState.isLogin ? 'Welcome back' : 'Create your account'}
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

          {authFlowState.isLogin ? (
            <SignInForm
              formData={getSignInData()}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              loading={loading}
            />
          ) : (
            <SignUpForm
              formData={getSignUpData()}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              loading={loading}
              userType={userType}
              onUserTypeChange={setUserType}
            />
          )}

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <span style={{ color: '#374151', fontSize: '14px' }}>
              {authFlowState.isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!authFlowState.isLogin);
                clearError();
              }}
              style={authPageStyles.switchButton}
            >
              {authFlowState.isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthPageV2;
