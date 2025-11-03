'use client';

/**
 * AuthPageV2 - Refactored Authentication Component
 * Reduced from 997 lines to ~150 lines using extracted components and hooks
 * Maintains exact same functionality and user experience
 */

import React, { useState } from 'react';
import EmailConfirmationPending from './EmailConfirmationPending';

// Extracted hooks
import { useAuthForm } from '@/hooks/useAuthForm';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { useAuthError } from '@/hooks/useAuthError';
import { usePasswordStrength } from '@/hooks/usePasswordStrength';
import { useNameValidation } from '@/hooks/useNameValidation';
import { useAuthSubmit } from '@/hooks/useAuthSubmit';
import { useAuthPageSetup } from '@/hooks/useAuthPageSetup';

// Extracted components
import { AuthFormContainer } from './AuthFormContainer';
import { type UserRole } from './RoleSelector';

interface AuthPageV2Props {
  initialMode?: 'signin' | 'signup';
}

const AuthPageV2 = ({ initialMode = 'signin' }: AuthPageV2Props) => {
  // State management
  const [userType, setUserType] = useState<UserRole>('player');
  
  // Custom hooks
  const { handleInputChange, validateForm, getSignUpData, getSignInData, setCallbacks } = useAuthForm();
  const { authFlowState, loading, handleSignIn, handleSignUp, handleBackToSignIn, setIsLogin } = useAuthFlow();
  const { error, setError, clearError, sanitizedError } = useAuthError();
  
  // ✅ Set initial mode from URL parameter
  React.useEffect(() => {
    if (initialMode === 'signup') {
      setIsLogin(false);
    }
  }, [initialMode, setIsLogin]);
  
  // Tier 2 hooks
  const { passwordStrength, updatePasswordStrength } = usePasswordStrength();
  const { nameErrors, validateFirstName, validateLastName } = useNameValidation();
  
  // Setup callbacks and form submission
  useAuthPageSetup({ setCallbacks, updatePasswordStrength, validateFirstName, validateLastName });
  
  const { handleSubmit: submitForm } = useAuthSubmit({
    validateForm,
    handleSignIn,
    handleSignUp,
    setIsLogin,
    setError,
    clearError
  });

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
    <AuthFormContainer
      isLogin={authFlowState.isLogin}
      error={error}
      sanitizedError={sanitizedError}
      signInData={getSignInData()}
      signUpData={getSignUpData()}
      onInputChange={handleInputChange}
      onSubmit={(e) => submitForm(e, authFlowState.isLogin, getSignInData(), getSignUpData(), userType)}
      loading={loading}
      userType={userType}
      onUserTypeChange={setUserType}
      onToggleMode={() => setIsLogin(!authFlowState.isLogin)}
      onClearError={clearError}
      passwordStrength={passwordStrength}
      nameErrors={nameErrors}
    />
  );
};

export default AuthPageV2;
