/**
 * useAuthError Hook - Extracted from AuthPageV2
 * Manages error state and sanitization for authentication
 */

import { useState, useCallback, useMemo } from 'react';
import DOMPurify from 'dompurify';

export interface UseAuthErrorReturn {
  error: string;
  setError: (error: string) => void;
  clearError: () => void;
  sanitizedError: string;
}

/**
 * Custom hook for managing authentication error state with XSS protection
 */
export const useAuthError = (): UseAuthErrorReturn => {
  const [error, setError] = useState<string>('');

  /**
   * Sets error message
   */
  const setErrorMessage = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  /**
   * Clears error message
   */
  const clearError = useCallback(() => {
    setError('');
  }, []);

  /**
   * Sanitized error message to prevent XSS attacks
   */
  const sanitizedError = useMemo(() => {
    if (!error) return '';
    
    return DOMPurify.sanitize(error, { 
      ALLOWED_TAGS: [], // Strip all HTML tags
      ALLOWED_ATTR: [] // Strip all attributes
    });
  }, [error]);

  return {
    error,
    setError: setErrorMessage,
    clearError,
    sanitizedError
  };
};
