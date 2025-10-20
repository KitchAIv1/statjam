/**
 * AuthInput Component - Extracted from AuthPageV2
 * Reusable input component with consistent styling and behavior
 */

import React from 'react';
import { authPageStyles, inputHandlers } from './styles/AuthPageStyles';

export interface AuthInputProps {
  type: 'text' | 'email' | 'password';
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  disabled?: boolean;
}

/**
 * Styled input component for authentication forms
 */
export const AuthInput: React.FC<AuthInputProps> = ({
  type,
  name,
  placeholder,
  value,
  onChange,
  required = false,
  minLength,
  autoComplete,
  disabled = false
}) => {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      minLength={minLength}
      autoComplete={autoComplete}
      disabled={disabled}
      style={{
        ...authPageStyles.input,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'text'
      }}
      className="auth-input"
      onFocus={!disabled ? inputHandlers.onFocus : undefined}
      onBlur={!disabled ? inputHandlers.onBlur : undefined}
    />
  );
};
