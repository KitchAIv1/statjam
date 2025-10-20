/**
 * Authentication Form Validation Utilities
 * Extracted from AuthPageV2 to provide reusable validation logic
 */

export interface SignUpFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignInFormData {
  email: string;
  password: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates email format using a simple regex
 */
export const validateEmail = (email: string): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }
  
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
};

/**
 * Validates password strength
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long' };
  }
  
  return { isValid: true };
};

/**
 * Validates password confirmation matches original password
 */
export const validatePasswordConfirmation = (password: string, confirmPassword: string): ValidationResult => {
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }
  
  return { isValid: true };
};

/**
 * Validates required text fields (firstName, lastName)
 */
export const validateRequiredField = (value: string, fieldName: string): ValidationResult => {
  if (!value.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  return { isValid: true };
};

/**
 * Validates the complete sign-up form
 */
export const validateSignUpForm = (formData: SignUpFormData): ValidationResult => {
  // Validate first name
  const firstNameValidation = validateRequiredField(formData.firstName, 'First name');
  if (!firstNameValidation.isValid) {
    return firstNameValidation;
  }
  
  // Validate last name
  const lastNameValidation = validateRequiredField(formData.lastName, 'Last name');
  if (!lastNameValidation.isValid) {
    return lastNameValidation;
  }
  
  // Validate email
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    return emailValidation;
  }
  
  // Validate password
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    return passwordValidation;
  }
  
  // Validate password confirmation
  const confirmPasswordValidation = validatePasswordConfirmation(formData.password, formData.confirmPassword);
  if (!confirmPasswordValidation.isValid) {
    return confirmPasswordValidation;
  }
  
  return { isValid: true };
};

/**
 * Validates the sign-in form
 */
export const validateSignInForm = (formData: SignInFormData): ValidationResult => {
  // Validate email
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    return emailValidation;
  }
  
  // Validate password
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    return passwordValidation;
  }
  
  return { isValid: true };
};

/**
 * Normalizes email input (trim and lowercase)
 */
export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

/**
 * Sanitizes text input by trimming whitespace
 */
export const sanitizeTextInput = (input: string): string => {
  return input.trim();
};
