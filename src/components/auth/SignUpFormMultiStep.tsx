/**
 * SignUpFormMultiStep Component
 * 
 * Purpose: Multi-step signup form (4 steps)
 * Pure UI reorganization - no logic changes
 * Follows .cursorrules: <200 lines, single responsibility
 */

import React, { useState } from 'react';
import { AuthInput } from './AuthInput';
import { RoleSelector, type UserRole } from './RoleSelector';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { CountrySelector } from './CountrySelector';
import { SignupProgressIndicator } from './SignupProgressIndicator';
import { useSignupSteps } from '@/hooks/useSignupSteps';
import { authPageStyles } from './styles/AuthPageStyles';
import { type PasswordStrength } from '@/utils/validators/authValidators';
import { type NameErrors } from '@/hooks/useNameValidation';
import { type SignUpFormData } from './utils/authValidation';

export interface SignUpFormMultiStepProps {
  formData: SignUpFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  userType: UserRole;
  onUserTypeChange: (role: UserRole) => void;
  disabled?: boolean;
  passwordStrength?: PasswordStrength;
  nameErrors?: NameErrors;
}

export const SignUpFormMultiStep: React.FC<SignUpFormMultiStepProps> = ({
  formData,
  onInputChange,
  onSubmit,
  loading,
  userType,
  onUserTypeChange,
  disabled = false,
  passwordStrength,
  nameErrors
}) => {
  const { 
    currentStep, 
    stepIndex, 
    totalSteps,
    canGoBack, 
    canContinue,
    goToNextStep, 
    goToPreviousStep,
    isLastStep
  } = useSignupSteps();

  // Local state for country (optional field)
  const [country, setCountry] = useState('');

  // Validation for each step
  const canProceedFromStep = () => {
    switch (currentStep) {
      case 'identity':
        return formData.firstName.trim().length >= 2 && 
               formData.lastName.trim().length >= 2 && 
               formData.email.trim().length > 0;
      case 'role':
        return true; // Role is always selected (defaults to player)
      case 'location':
        return true; // Optional step
      case 'security':
        return formData.password.length >= 6 && 
               formData.password === formData.confirmPassword;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceedFromStep()) {
      goToNextStep();
    }
  };

  const handleSubmitWrapper = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLastStep && canProceedFromStep()) {
      // Store country in localStorage for profile update after signup
      if (country) {
        localStorage.setItem('pending_country', country);
      }
      onSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmitWrapper}>
      {/* Progress Indicator */}
      <SignupProgressIndicator currentStep={stepIndex} totalSteps={totalSteps} />

      {/* Step 1: Identity */}
      {currentStep === 'identity' && (
        <div>
          <h3 style={{ 
            color: '#fff', 
            fontSize: '20px', 
            fontWeight: '600', 
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            Who are you?
          </h3>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.7)', 
            fontSize: '14px', 
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            Let's start with the basics
          </p>

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
        </div>
      )}

      {/* Step 2: Role */}
      {currentStep === 'role' && (
        <div>
          <h3 style={{ 
            color: '#fff', 
            fontSize: '20px', 
            fontWeight: '600', 
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            Choose your role
          </h3>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.7)', 
            fontSize: '14px', 
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            What brings you to StatJam?
          </p>

          <RoleSelector
            userType={userType}
            setUserType={onUserTypeChange}
            disabled={disabled || loading}
          />
        </div>
      )}

      {/* Step 3: Location */}
      {currentStep === 'location' && (
        <div>
          <h3 style={{ 
            color: '#fff', 
            fontSize: '20px', 
            fontWeight: '600', 
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            Where are you from?
          </h3>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.7)', 
            fontSize: '14px', 
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            Help us connect you with local events
          </p>

          <CountrySelector
            value={country}
            onChange={setCountry}
            disabled={disabled || loading}
          />
        </div>
      )}

      {/* Step 4: Security */}
      {currentStep === 'security' && (
        <div>
          <h3 style={{ 
            color: '#fff', 
            fontSize: '20px', 
            fontWeight: '600', 
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            Secure your account
          </h3>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.7)', 
            fontSize: '14px', 
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            Choose a strong password
          </p>

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
          
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <small style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '-12px', marginBottom: '8px' }}>
              Passwords do not match
            </small>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginTop: '24px' 
      }}>
        {canGoBack && (
          <button
            type="button"
            onClick={goToPreviousStep}
            disabled={loading || disabled}
            style={{
              flex: 1,
              padding: '14px 24px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: (loading || disabled) ? 'not-allowed' : 'pointer',
              opacity: (loading || disabled) ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
          >
            ← Back
          </button>
        )}

        {currentStep === 'location' && (
          <button
            type="button"
            onClick={goToNextStep}
            disabled={loading || disabled}
            style={{
              flex: 1,
              padding: '14px 24px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '500',
              cursor: (loading || disabled) ? 'not-allowed' : 'pointer',
              opacity: (loading || disabled) ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
          >
            Skip
          </button>
        )}

        <button
          type={isLastStep ? 'submit' : 'button'}
          onClick={isLastStep ? undefined : handleNext}
          disabled={loading || disabled || !canProceedFromStep()}
          style={{
            ...authPageStyles.button,
            flex: 1,
            opacity: (loading || disabled || !canProceedFromStep()) ? 0.6 : 1,
            cursor: (loading || disabled || !canProceedFromStep()) ? 'not-allowed' : 'pointer'
          }}
          className="auth-button"
        >
          {loading ? 'Creating Account...' : isLastStep ? 'Create Account' : 'Continue →'}
        </button>
      </div>
    </form>
  );
};

