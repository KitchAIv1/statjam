/**
 * RoleSelector Component
 * Handles user role selection during signup with clear descriptions
 * UI styled to match AuthPage glassmorphism design
 */

import React, { useState } from 'react';
import { 
  ROLE_OPTIONS, 
  STAT_KEEPER_CONFIRMATION,
  type UserRole,
  type RoleOption 
} from '@/config/auth/roleConfig';
import { authPageStyles, roleButtonHandlers } from './styles/AuthPageStyles';

export type { UserRole };

export interface RoleSelectorProps {
  userType: UserRole;
  setUserType: (role: UserRole) => void;
  disabled?: boolean;
}

/**
 * Role selection component for signup form
 * Styled to match auth page glassmorphism design
 */
export const RoleSelector: React.FC<RoleSelectorProps> = ({
  userType,
  setUserType,
  disabled = false
}) => {
  const [showStatKeeperHint, setShowStatKeeperHint] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    if (disabled) return;
    setUserType(role);
    setShowStatKeeperHint(role === 'stat_admin');
  };

  const handleSwitchToPlayer = () => {
    setUserType('player');
    setShowStatKeeperHint(false);
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={authPageStyles.roleLabel}>
        I am signing up as a:
      </label>
      
      <div style={authPageStyles.roleGrid} className="role-grid">
        {ROLE_OPTIONS.map((role) => (
          <RoleCard
            key={role.value}
            role={role}
            isSelected={userType === role.value}
            disabled={disabled}
            onSelect={handleRoleSelect}
          />
        ))}
      </div>

      {/* Inline hint for stat_admin selection */}
      {showStatKeeperHint && (
        <div style={styles.hintContainer}>
          <span style={styles.hintText}>
            ℹ️ {STAT_KEEPER_CONFIRMATION.message}{' '}
            {STAT_KEEPER_CONFIRMATION.switchPrompt}{' '}
            <button
              type="button"
              onClick={handleSwitchToPlayer}
              style={styles.hintLink}
            >
              {STAT_KEEPER_CONFIRMATION.switchLabel}
            </button>
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Individual role card component - center aligned, glassmorphism style
 */
interface RoleCardProps {
  role: RoleOption;
  isSelected: boolean;
  disabled: boolean;
  onSelect: (role: UserRole) => void;
}

const RoleCard: React.FC<RoleCardProps> = ({ 
  role, 
  isSelected, 
  disabled, 
  onSelect 
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(role.value)}
      disabled={disabled}
      style={{
        ...authPageStyles.roleButton,
        ...styles.card,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
      className={isSelected ? 'role-button-selected' : 'role-button-unselected'}
      onMouseEnter={(e) => !disabled && roleButtonHandlers.onMouseEnter(e, isSelected)}
      onMouseLeave={(e) => !disabled && roleButtonHandlers.onMouseLeave(e, isSelected)}
    >
      {/* Icon */}
      <span style={styles.icon}>{role.icon}</span>
      
      {/* Title */}
      <span style={styles.title}>{role.label}</span>
      
      {/* Tagline */}
      <span style={{
        ...styles.tagline,
        color: isSelected ? 'white' : 'rgba(0,0,0,0.7)'
      }}>
        {role.tagline}
      </span>
      
      {/* Clarification (only for stat_admin) */}
      {role.clarification && (
        <span style={{
          ...styles.clarification,
          color: isSelected ? 'white' : 'rgba(0,0,0,0.6)',
          borderTopColor: isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'
        }}>
          {role.clarification}
        </span>
      )}
    </button>
  );
};

/**
 * Component styles - center aligned, glassmorphism consistent
 */
const styles: Record<string, React.CSSProperties> = {
  // Card layout - center aligned
  card: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    minHeight: '100px',
    padding: '14px 10px',
    gap: '4px'
  },
  icon: {
    fontSize: '24px',
    lineHeight: 1,
    marginBottom: '4px'
  },
  title: {
    fontSize: '14px',
    fontWeight: '700',
    lineHeight: 1.2
  },
  tagline: {
    fontSize: '11px',
    fontWeight: '500',
    lineHeight: '1.3',
    marginTop: '2px'
  },
  clarification: {
    fontSize: '10px',
    fontWeight: '500',
    fontStyle: 'italic',
    marginTop: '4px',
    paddingTop: '4px',
    borderTop: '1px solid rgba(255,255,255,0.2)'
  },
  // Hint box - dark glass style for better contrast
  hintContainer: {
    marginTop: '12px',
    padding: '12px 16px',
    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.3) 100%)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    textAlign: 'center'
  },
  hintText: {
    fontSize: '12px',
    color: 'white',
    lineHeight: '1.5',
    fontWeight: '500'
  },
  hintLink: {
    background: 'none',
    border: 'none',
    color: '#fbbf24',
    fontWeight: '700',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0,
    fontSize: '12px'
  }
};
