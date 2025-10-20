/**
 * PasswordStrengthIndicator Component
 * Tier 2 #1: Password Strength Indicator
 * Extracted to comply with Frontend Modularity Guardrails
 * Max component size: 200 lines | Current: ~60 lines ✅
 */

import React from 'react';
import { type PasswordStrength } from '@/utils/validators/authValidators';

export interface PasswordStrengthIndicatorProps {
  password: string;
  passwordStrength: PasswordStrength;
}

/**
 * Visual password strength indicator with color-coded bar and label
 */
export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  passwordStrength
}) => {
  if (!password) return null;

  return (
    <div style={{
      marginTop: '8px',
      marginBottom: '8px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {/* Strength bar */}
        <div style={{
          flex: 1,
          height: '4px',
          backgroundColor: '#e0e0e0',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${(passwordStrength.score / 6) * 100}%`,
            backgroundColor: passwordStrength.color,
            transition: 'all 0.3s ease'
          }} />
        </div>
        
        {/* Strength label */}
        <span style={{
          fontSize: '12px',
          fontWeight: '500',
          color: passwordStrength.color,
          minWidth: '80px'
        }}>
          {passwordStrength.label}
        </span>
      </div>
      
      {/* Helpful hint */}
      <small style={{
        display: 'block',
        marginTop: '4px',
        fontSize: '11px',
        color: '#666',
        lineHeight: '1.4'
      }}>
        Use 8+ characters with mixed case, numbers, and symbols for a strong password
      </small>
    </div>
  );
};
