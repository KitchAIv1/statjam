/**
 * useAuthSubmit Hook
 * Handles form submission logic for authentication
 * Extracted to comply with max-lines-per-function limit (40 lines)
 * Max hook size: 100 lines | Current: ~40 lines ✅
 */

import { useCallback } from 'react';
import { type SignInFormData, type SignUpFormData } from '@/components/auth/utils/authValidation';
import { type UserRole } from '@/components/auth/RoleSelector';
import { type ValidationResult } from '@/components/auth/utils/authValidation';

export interface UseAuthSubmitProps {
  validateForm: (isLogin: boolean) => ValidationResult;
  handleSignIn: (formData: SignInFormData) => Promise<void>;
  handleSignUp: (formData: SignUpFormData, userType: UserRole) => Promise<void>;
  setIsLogin: (isLogin: boolean) => void;
  setError: (error: string) => void;
  clearError: () => void;
}

export interface UseAuthSubmitReturn {
  handleSubmit: (
    e: React.FormEvent,
    isLogin: boolean,
    signInData: SignInFormData,
    signUpData: SignUpFormData,
    userType: UserRole
  ) => Promise<void>;
}

/**
 * Hook to handle authentication form submission
 */
export const useAuthSubmit = ({
  validateForm,
  handleSignIn,
  handleSignUp,
  setIsLogin,
  setError,
  clearError
}: UseAuthSubmitProps): UseAuthSubmitReturn => {
  
  const handleSubmit = useCallback(async (
    e: React.FormEvent,
    isLogin: boolean,
    signInData: SignInFormData,
    signUpData: SignUpFormData,
    userType: UserRole
  ) => {
    e.preventDefault();
    clearError();

    try {
      // Validate form
      const validation = validateForm(isLogin);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      if (isLogin) {
        await handleSignIn(signInData);
      } else {
        await handleSignUp(signUpData, userType);
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
  }, [validateForm, handleSignIn, handleSignUp, setIsLogin, setError, clearError]);

  return {
    handleSubmit
  };
};
