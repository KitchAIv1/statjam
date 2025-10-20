/**
 * Authentication Validation Utilities
 * Extracted to comply with Frontend Modularity Guardrails
 * Max file size: 500 lines | Current: ~60 lines ✅
 */

export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Calculate password strength score and visual indicators
 * Tier 2 #1: Password Strength Indicator
 */
export const getPasswordStrength = (password: string): PasswordStrength => {
  if (!password) return { score: 0, label: '', color: '' };
  
  let score = 0;
  
  // Length checks
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Character variety checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++; // Mixed case
  if (/[0-9]/.test(password)) score++; // Numbers
  if (/[^a-zA-Z0-9]/.test(password)) score++; // Special characters
  
  // Determine label and color
  if (score <= 2) return { score, label: 'Weak', color: '#dc3545' };
  if (score <= 4) return { score, label: 'Medium', color: '#fd7e14' };
  if (score <= 5) return { score, label: 'Strong', color: '#28a745' };
  return { score, label: 'Very Strong', color: '#007bff' };
};

/**
 * Validate name format (first name or last name)
 * Tier 2 #4: Name Validation
 */
export const validateName = (name: string, fieldName: string): ValidationResult => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters` };
  }
  
  if (trimmedName.length > 50) {
    return { isValid: false, error: `${fieldName} must be 50 characters or less` };
  }
  
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(trimmedName)) {
    return { isValid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
  }
  
  return { isValid: true };
};
