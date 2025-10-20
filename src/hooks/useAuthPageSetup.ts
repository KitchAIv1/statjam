/**
 * useAuthPageSetup Hook
 * Handles AuthPageV2 initialization and setup
 * Extracted to comply with max-lines-per-function limit
 * Max hook size: 100 lines | Current: ~30 lines ✅
 */

import { useEffect } from 'react';
import { type UseAuthFormCallbacks } from './useAuthForm';

export interface UseAuthPageSetupProps {
  setCallbacks: (callbacks: UseAuthFormCallbacks) => void;
  updatePasswordStrength: (password: string) => void;
  validateFirstName: (name: string) => boolean;
  validateLastName: (name: string) => boolean;
}

/**
 * Hook to setup authentication page callbacks and initialization
 */
export const useAuthPageSetup = ({
  setCallbacks,
  updatePasswordStrength,
  validateFirstName,
  validateLastName
}: UseAuthPageSetupProps): void => {
  
  useEffect(() => {
    setCallbacks({
      onPasswordChange: updatePasswordStrength,
      onFirstNameChange: validateFirstName,
      onLastNameChange: validateLastName
    });
  }, [setCallbacks, updatePasswordStrength, validateFirstName, validateLastName]);
};
