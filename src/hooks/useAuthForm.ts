/**
 * useAuthForm Hook - Extracted from AuthPageV2
 * Manages form state and input handling for authentication forms
 */

import { useState, useCallback } from 'react';
import { 
  validateSignUpForm, 
  validateSignInForm, 
  normalizeEmail, 
  sanitizeTextInput,
  type SignUpFormData,
  type SignInFormData,
  type ValidationResult
} from '../components/auth/utils/authValidation';

export interface AuthFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  rememberMe: boolean;
  agreeToTerms: boolean;
}

export interface UseAuthFormReturn {
  formData: AuthFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resetForm: () => void;
  validateForm: (isLogin: boolean) => ValidationResult;
  getSignUpData: () => SignUpFormData;
  getSignInData: () => SignInFormData;
}

const initialFormData: AuthFormData = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  rememberMe: false,
  agreeToTerms: false
};

/**
 * Custom hook for managing authentication form state and validation
 */
export const useAuthForm = (): UseAuthFormReturn => {
  const [formData, setFormData] = useState<AuthFormData>(initialFormData);

  /**
   * Handles input changes with proper normalization and sanitization
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    let processedValue: string | boolean;
    
    if (type === 'checkbox') {
      processedValue = checked;
    } else if (name === 'email') {
      // ✅ CRITICAL FIX #1: Normalize email input to prevent whitespace issues
      processedValue = normalizeEmail(value);
    } else if (name === 'firstName' || name === 'lastName') {
      // Sanitize text inputs by trimming whitespace
      processedValue = sanitizeTextInput(value);
    } else {
      processedValue = value;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  }, []);

  /**
   * Resets form to initial state
   */
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
  }, []);

  /**
   * Validates form based on whether it's login or signup
   */
  const validateForm = useCallback((isLogin: boolean): ValidationResult => {
    if (isLogin) {
      return validateSignInForm(getSignInData());
    } else {
      return validateSignUpForm(getSignUpData());
    }
  }, [formData]);

  /**
   * Gets sign-up specific form data
   */
  const getSignUpData = useCallback((): SignUpFormData => {
    return {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword
    };
  }, [formData]);

  /**
   * Gets sign-in specific form data
   */
  const getSignInData = useCallback((): SignInFormData => {
    return {
      email: formData.email,
      password: formData.password
    };
  }, [formData]);

  return {
    formData,
    handleInputChange,
    resetForm,
    validateForm,
    getSignUpData,
    getSignInData
  };
};
