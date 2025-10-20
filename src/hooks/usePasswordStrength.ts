/**
 * usePasswordStrength Hook
 * Tier 2 #1: Password Strength Indicator
 * Extracted to comply with Frontend Modularity Guardrails
 * Max hook size: 100 lines | Current: ~30 lines ✅
 */

import { useState, useCallback } from 'react';
import { getPasswordStrength, type PasswordStrength } from '@/utils/validators/authValidators';

export interface UsePasswordStrengthReturn {
  passwordStrength: PasswordStrength;
  updatePasswordStrength: (password: string) => void;
  resetPasswordStrength: () => void;
}

const initialStrength: PasswordStrength = { score: 0, label: '', color: '' };

/**
 * Hook to manage password strength calculation and state
 */
export const usePasswordStrength = (): UsePasswordStrengthReturn => {
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>(initialStrength);

  const updatePasswordStrength = useCallback((password: string) => {
    const strength = getPasswordStrength(password);
    setPasswordStrength(strength);
  }, []);

  const resetPasswordStrength = useCallback(() => {
    setPasswordStrength(initialStrength);
  }, []);

  return {
    passwordStrength,
    updatePasswordStrength,
    resetPasswordStrength
  };
};
