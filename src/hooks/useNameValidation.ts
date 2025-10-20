/**
 * useNameValidation Hook
 * Tier 2 #4: Name Validation
 * Extracted to comply with Frontend Modularity Guardrails
 * Max hook size: 100 lines | Current: ~40 lines ✅
 */

import { useState, useCallback } from 'react';
import { validateName } from '@/utils/validators/authValidators';

export interface NameErrors {
  firstName: string;
  lastName: string;
}

export interface UseNameValidationReturn {
  nameErrors: NameErrors;
  validateFirstName: (name: string) => boolean;
  validateLastName: (name: string) => boolean;
  clearNameErrors: () => void;
}

const initialErrors: NameErrors = { firstName: '', lastName: '' };

/**
 * Hook to manage name validation state and logic
 */
export const useNameValidation = (): UseNameValidationReturn => {
  const [nameErrors, setNameErrors] = useState<NameErrors>(initialErrors);

  const validateFirstName = useCallback((name: string): boolean => {
    const result = validateName(name, 'First name');
    setNameErrors(prev => ({ ...prev, firstName: result.error || '' }));
    return result.isValid;
  }, []);

  const validateLastName = useCallback((name: string): boolean => {
    const result = validateName(name, 'Last name');
    setNameErrors(prev => ({ ...prev, lastName: result.error || '' }));
    return result.isValid;
  }, []);

  const clearNameErrors = useCallback(() => {
    setNameErrors(initialErrors);
  }, []);

  return {
    nameErrors,
    validateFirstName,
    validateLastName,
    clearNameErrors
  };
};
