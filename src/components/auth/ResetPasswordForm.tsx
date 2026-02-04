/**
 * ResetPasswordForm Component
 * Form for setting a new password after clicking reset link
 * 
 * @module ResetPasswordForm
 */

import React, { useState } from 'react';
import { AuthInput } from './AuthInput';
import { authPageStyles } from './styles/AuthPageStyles';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { getPasswordStrength, type PasswordStrength } from '@/utils/validators/authValidators';

interface ResetPasswordFormProps {
  onSubmit: (newPassword: string) => void;
  loading: boolean;
  error: string | null;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  onSubmit,
  loading,
  error,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: 'Weak',
    color: '#ef4444',
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(getPasswordStrength(newPassword));
    setLocalError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    onSubmit(password);
  };

  const displayError = error || localError;

  return (
    <form onSubmit={handleSubmit}>
      <p style={{ 
        color: 'rgba(0, 0, 0, 0.8)', 
        fontSize: '14px', 
        marginBottom: '20px',
        textAlign: 'center',
        fontWeight: '500',
      }}>
        Enter your new password below.
      </p>

      {displayError && (
        <div style={authPageStyles.error}>
          {displayError}
        </div>
      )}

      <AuthInput
        type="password"
        name="password"
        placeholder="New Password"
        value={password}
        onChange={handlePasswordChange}
        required
        minLength={6}
        autoComplete="new-password"
        disabled={loading}
      />

      {password.length > 0 && (
        <PasswordStrengthIndicator strength={passwordStrength} />
      )}

      <AuthInput
        type="password"
        name="confirmPassword"
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => {
          setConfirmPassword(e.target.value);
          setLocalError(null);
        }}
        required
        minLength={6}
        autoComplete="new-password"
        disabled={loading}
      />

      <button
        type="submit"
        disabled={loading || password.length < 6}
        style={{
          ...authPageStyles.button,
          opacity: (loading || password.length < 6) ? 0.6 : 1,
          cursor: (loading || password.length < 6) ? 'not-allowed' : 'pointer',
        }}
        className="auth-button"
      >
        {loading ? 'Updating...' : 'Reset Password'}
      </button>
    </form>
  );
};
