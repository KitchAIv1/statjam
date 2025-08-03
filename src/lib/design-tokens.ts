// StatJam Design System - Core tokens
export const colors = {
  primary: {
    purple: '#4B0082',
    gold: '#FFD700',
  },
  background: {
    dark: '#121212',
    card: '#1a1a1a',
    hover: '#2a2a2a',
  },
  text: {
    primary: '#ffffff',
    secondary: '#b3b3b3',
    muted: '#666666',
  },
  accent: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  }
} as const;

export const typography = {
  fonts: {
    header: ['Anton', 'system-ui', 'sans-serif'],
    body: ['Poppins', 'system-ui', 'sans-serif'],
  },
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  }
} as const;

export const spacing = {
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
} as const;

export const borderRadius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  full: '9999px',
} as const;