/**
 * RoleSelector Component - Extracted from AuthPageV2
 * Handles user role selection during signup
 */

import React from 'react';
import { authPageStyles, roleButtonHandlers } from './styles/AuthPageStyles';

export type UserRole = 'player' | 'organizer' | 'stat_admin';

export interface RoleSelectorProps {
  userType: UserRole;
  setUserType: (role: UserRole) => void;
  disabled?: boolean;
}

interface RoleOption {
  value: UserRole;
  label: string;
  icon: string;
}

const roleOptions: RoleOption[] = [
  { value: 'player', label: 'Player', icon: '🏀' },
  { value: 'organizer', label: 'Organizer', icon: '🏆' },
  { value: 'stat_admin', label: 'Stat Admin', icon: '📊' }
];

/**
 * Role selection component for signup form
 */
export const RoleSelector: React.FC<RoleSelectorProps> = ({
  userType,
  setUserType,
  disabled = false
}) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={authPageStyles.roleLabel}>
        I am signing up as a:
      </label>
      <div style={authPageStyles.roleGrid} className="role-grid">
        {roleOptions.map((role) => (
          <button
            key={role.value}
            type="button"
            onClick={() => !disabled && setUserType(role.value)}
            disabled={disabled}
            style={{
              ...authPageStyles.roleButton,
              opacity: disabled ? 0.6 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer'
            }}
            className={userType === role.value ? 'role-button-selected' : 'role-button-unselected'}
            onMouseEnter={(e) => !disabled && roleButtonHandlers.onMouseEnter(e, userType === role.value)}
            onMouseLeave={(e) => !disabled && roleButtonHandlers.onMouseLeave(e, userType === role.value)}
          >
            {role.icon} {role.label}
          </button>
        ))}
      </div>
    </div>
  );
};
