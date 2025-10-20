/**
 * AuthPageV2 Styles - Extracted from monolithic component
 * Contains all styling for the authentication page including glassmorphism effects,
 * responsive design, and role selection styling.
 */

export interface AuthPageStylesType {
  container: React.CSSProperties;
  formContainer: React.CSSProperties;
  header: React.CSSProperties;
  title: React.CSSProperties;
  subtitle: React.CSSProperties;
  input: React.CSSProperties;
  button: React.CSSProperties;
  switchButton: React.CSSProperties;
  error: React.CSSProperties;
  roleGrid: React.CSSProperties;
  roleButton: React.CSSProperties;
  roleLabel: React.CSSProperties;
}

export const authPageStyles: AuthPageStylesType = {
  container: {
    minHeight: '100vh',
    background: `
      linear-gradient(
        135deg, 
        rgba(251, 146, 60, 0.3) 0%, 
        rgba(239, 68, 68, 0.3) 100%
      ),
      url('/images/AuthBG.png')
    `,
    backgroundSize: 'cover',
    backgroundPosition: 'center top', // Show upper part of image (face area)
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'scroll', // Use scroll for better mobile compatibility
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative' as const,
  },
  formContainer: {
    // Advanced Glassmorphism Effect
    background: `
      linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.25) 0%,
        rgba(255, 255, 255, 0.15) 50%,
        rgba(255, 255, 255, 0.1) 100%
      )
    `,
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)', // Safari support
    borderRadius: '24px',
    padding: '40px',
    width: '100%',
    maxWidth: '500px',
    // Multi-layer glass borders
    border: `1px solid rgba(255, 255, 255, 0.4)`,
    borderTop: `1px solid rgba(255, 255, 255, 0.6)`,
    borderLeft: `1px solid rgba(255, 255, 255, 0.6)`,
    // Advanced glass shadows
    boxShadow: `
      0 8px 32px rgba(0, 0, 0, 0.12),
      0 2px 6px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.6),
      inset 0 -1px 0 rgba(255, 255, 255, 0.1)
    `,
    margin: 'auto',
    position: 'relative' as const,
    // Performance optimization
    willChange: 'transform',
    transform: 'translateZ(0)', // GPU acceleration
    // Glass reflection effect
    '::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '50%',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
      borderRadius: '24px 24px 0 0',
      pointerEvents: 'none',
    }
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    // Metallic red bright - solid color, no gradient overlay
    color: '#dc2626', // Clean bright red
    marginBottom: '8px',
    // Metallic effect with multiple text shadows
    textShadow: `
      0 1px 0 #b91c1c,
      0 2px 0 #991b1b,
      0 3px 0 #7f1d1d,
      0 4px 6px rgba(0, 0, 0, 0.3),
      0 0 10px rgba(220, 38, 38, 0.5)
    `,
    // Remove any background that could create rectangles
    background: 'none',
    WebkitBackgroundClip: 'initial',
    WebkitTextFillColor: 'initial',
  },
  subtitle: {
    // Clean black for maximum contrast
    color: '#000000', // Pure black
    fontSize: '16px',
    fontWeight: '600', // Bolder for better visibility
    textShadow: '0 1px 2px rgba(255, 255, 255, 0.9)', // Strong white shadow
  },
  input: {
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    // Glass input effect
    background: `
      linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.2) 0%,
        rgba(255, 255, 255, 0.1) 100%
      )
    `,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderTop: '1px solid rgba(255, 255, 255, 0.6)',
    // Much stronger text color for glass background
    color: '#111827', // Very dark gray for maximum contrast
    fontSize: '16px', // Keep 16px to prevent zoom on iOS
    fontWeight: '500', // Slightly bolder for better visibility
    marginBottom: '16px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    boxSizing: 'border-box' as const,
    // Enhanced glass input shadows
    boxShadow: `
      0 4px 6px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.1)
    `,
    // Much darker placeholder for better visibility on glass
    '::placeholder': {
      color: '#1f2937', // Very dark gray, almost black
      fontWeight: '600', // Bolder weight for better visibility
      opacity: '1', // Ensure full opacity
    }
  },
  button: {
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    // Enhanced high-contrast button with stronger StatJam gradient
    background: `
      linear-gradient(135deg, #ea580c 0%, #dc2626 50%, #b91c1c 100%)
    `,
    // Subtle glass overlay for depth without compromising visibility
    '::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 50%)',
      borderRadius: '12px',
      pointerEvents: 'none',
    },
    backdropFilter: 'blur(5px)', // Reduced blur for better color visibility
    WebkitBackdropFilter: 'blur(5px)',
    color: 'white',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)', // Text shadow for better readability
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderTop: '1px solid rgba(255, 255, 255, 0.5)',
    fontSize: '16px',
    fontWeight: '700', // Bolder text
    cursor: 'pointer',
    marginBottom: '16px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    // Clean shadows without glow
    boxShadow: `
      0 4px 12px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.3)
    `,
    minHeight: '52px',
    touchAction: 'manipulation',
    position: 'relative' as const,
    overflow: 'hidden',
    // Glass shine effect
    '::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
      transition: 'left 0.5s',
    },
    ':hover::before': {
      left: '100%',
    }
  },
  switchButton: {
    // Clean black text for maximum contrast
    color: '#000000', // Pure black
    background: 'none', // No background
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontWeight: '600', // Bolder text
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    textShadow: '0 1px 2px rgba(255, 255, 255, 0.9)', // Strong white shadow
  },
  error: {
    // Enhanced error visibility
    color: '#dc2626',
    backgroundColor: 'rgba(220, 38, 38, 0.1)', // Background for better visibility
    border: '1px solid rgba(220, 38, 38, 0.2)',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    textAlign: 'center' as const,
    fontWeight: '500',
    textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
  },
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '8px',
    marginBottom: '8px'
  },
  roleButton: {
    padding: '12px 8px',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    textAlign: 'center' as const,
    minHeight: '48px',
    touchAction: 'manipulation',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  roleLabel: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151'
  }
};

/**
 * CSS-in-JS styles that need to be injected as <style jsx>
 * These include animations, pseudo-selectors, and responsive breakpoints
 */
export const authPageCSSStyles = `
  /* Enhanced Glassmorphism Animations */
  .auth-form {
    animation: glassFloat 6s ease-in-out infinite;
  }
  
  @keyframes glassFloat {
    0%, 100% { transform: translateY(0px) rotateX(0deg); }
    50% { transform: translateY(-5px) rotateX(1deg); }
  }
  
  .auth-form::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%);
    border-radius: 24px 24px 0 0;
    pointer-events: none;
    z-index: 1;
  }
  
  .auth-form:hover {
    transform: translateY(-2px) scale(1.01);
    box-shadow: 
      0 12px 40px rgba(0, 0, 0, 0.15),
      0 4px 8px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.7),
      inset 0 -1px 0 rgba(255, 255, 255, 0.15) !important;
  }
  
  /* Enhanced Glass Input Focus Effects */
  .auth-input:focus {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.3) 100%) !important;
    border: 1px solid #ea580c !important;
    box-shadow: 
      0 0 0 3px rgba(234, 88, 12, 0.25),
      0 8px 16px rgba(0, 0, 0, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.6) !important;
    transform: translateY(-2px);
    color: #111827 !important;
  }
  
  /* Enhanced Placeholder Styling for All Browsers */
  .auth-input::placeholder {
    color: #1f2937 !important;
    font-weight: 600 !important;
    opacity: 1 !important;
  }
  
  .auth-input::-webkit-input-placeholder {
    color: #1f2937 !important;
    font-weight: 600 !important;
    opacity: 1 !important;
  }
  
  .auth-input::-moz-placeholder {
    color: #1f2937 !important;
    font-weight: 600 !important;
    opacity: 1 !important;
  }
  
  .auth-input:-ms-input-placeholder {
    color: #1f2937 !important;
    font-weight: 600 !important;
    opacity: 1 !important;
  }
  
  /* Clean Button Hover Effects - No Glow */
  .auth-button:hover {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%) !important;
    transform: translateY(-2px) scale(1.02) !important;
    box-shadow: 
      0 6px 20px rgba(0, 0, 0, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.4) !important;
  }
  
  .auth-button:active {
    transform: translateY(-1px) scale(0.99) !important;
    background: linear-gradient(135deg, #b91c1c 0%, #991b1b 50%, #7f1d1d 100%) !important;
  }
  
  /* Clean Role Selection - No Glassmorphism */
  .role-button-selected {
    background: #dc2626 !important; /* Solid red background */
    border: 2px solid #dc2626 !important;
    color: white !important;
    font-weight: 700 !important;
    text-shadow: none !important; /* Remove text shadow */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important; /* Simple shadow */
    transform: none; /* No scaling */
  }
  
  .role-button-unselected {
    background: white !important; /* Clean white background */
    border: 2px solid #e5e7eb !important; /* Light gray border */
    color: #374151 !important; /* Dark text */
    font-weight: 600 !important;
    text-shadow: none !important; /* Remove text shadow */
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important; /* Subtle shadow */
  }
  
  .role-button-unselected:hover {
    background: #f9fafb !important; /* Very light gray on hover */
    border: 2px solid #dc2626 !important; /* Red border on hover */
    color: #dc2626 !important; /* Red text on hover */
    transform: none; /* No transform animations */
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12) !important;
  }

  /* Responsive Background Positioning */
  .auth-container {
    background-position: center top !important; /* Desktop: show face area */
  }
  
  @media (max-width: 768px) {
    .auth-container {
      padding: 16px !important;
      background-position: center 20% !important; /* Mobile: adjust for better framing */
    }
    .auth-form {
      padding: 24px !important;
      border-radius: 20px !important;
      max-width: 100% !important;
      backdrop-filter: blur(15px) saturate(150%) !important;
    }
    .auth-form::before {
      border-radius: 20px 20px 0 0 !important;
    }
    .auth-header {
      margin-bottom: 24px !important;
    }
    .auth-title {
      font-size: 30px !important;
    }
    .auth-subtitle {
      font-size: 14px !important;
    }
    .auth-input {
      padding: 14px !important;
      margin-bottom: 12px !important;
      backdrop-filter: blur(8px) !important;
    }
    .auth-button {
      padding: 14px !important;
      margin-bottom: 12px !important;
      font-size: 15px !important;
      min-height: 48px !important;
      backdrop-filter: blur(8px) !important;
    }
    .role-grid {
      grid-template-columns: 1fr !important;
      gap: 12px !important;
      margin-bottom: 12px !important;
    }
    .role-button {
      padding: 16px 12px !important;
      font-size: 15px !important;
      backdrop-filter: blur(8px) !important;
    }
  }
  @media (max-width: 480px) {
    .auth-container {
      background-position: center 15% !important; /* Small mobile: fine-tune positioning */
    }
    .auth-form {
      padding: 20px !important;
      border-radius: 16px !important;
      backdrop-filter: blur(12px) saturate(140%) !important;
    }
    .auth-form::before {
      border-radius: 16px 16px 0 0 !important;
    }
    .auth-title {
      font-size: 28px !important;
    }
  }
  
  /* Large Desktop Optimization */
  @media (min-width: 1200px) {
    .auth-container {
      background-position: center 10% !important; /* Large screens: show more of the top */
    }
  }
  
  /* Performance optimizations - only for animated elements */
  .auth-form {
    transform: translateZ(0);
  }
`;

/**
 * Role button event handlers for consistent styling
 */
export const roleButtonHandlers = {
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>, isSelected: boolean) => {
    if (!isSelected) {
      const target = e.target as HTMLButtonElement;
      target.style.borderColor = '#f97316';
      target.style.background = 'rgba(251, 146, 60, 0.05)';
    }
  },
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>, isSelected: boolean) => {
    if (!isSelected) {
      const target = e.target as HTMLButtonElement;
      target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
      target.style.background = 'rgba(255, 255, 255, 0.8)';
    }
  }
};

/**
 * Input focus/blur handlers for consistent styling
 */
export const inputHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    target.style.borderColor = '#f97316';
    target.style.boxShadow = '0 0 0 3px rgba(251, 146, 60, 0.1)';
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    target.style.borderColor = 'rgba(251, 146, 60, 0.2)';
    target.style.boxShadow = 'none';
  }
};
