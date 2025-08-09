/**
 * Figma Design System Tokens
 * 
 * Extracted from TournamentViewer component to ensure consistent
 * design language across all game viewer components.
 */

export const figmaColors = {
  // Background Colors
  primary: '#111827',        // bg-gray-900 - Main background
  secondary: '#1f2937',      // bg-gray-800 - Cards, headers
  surface: '#374151',        // bg-gray-700 - Elevated surfaces
  
  // Border Colors
  border: {
    primary: '#374151',      // border-gray-700 - Main borders
    secondary: '#4b5563',    // border-gray-600 - Subtle borders
  },
  
  // Text Colors
  text: {
    primary: '#ffffff',      // text-white - Primary text
    secondary: '#d1d5db',    // text-gray-300 - Secondary text
    muted: '#9ca3af',        // text-gray-400 - Muted text
    subtle: '#6b7280',       // text-gray-500 - Subtle text
  },
  
  // Accent Colors
  accent: {
    blue: '#3b82f6',         // text-blue-500 - Primary accent
    blueLight: '#60a5fa',    // text-blue-400 - Active states
    purple: '#8b5cf6',       // bg-purple-600 - Team colors
    teal: '#14b8a6',         // bg-teal-600 - Team colors
  },
  
  // Status Colors
  status: {
    live: '#ef4444',         // Red for live indicators
    success: '#10b981',      // Green for positive stats
    warning: '#f59e0b',      // Yellow for warnings
    error: '#ef4444',        // Red for errors
  },
  
  // Interactive States
  interactive: {
    hover: '#374151',        // hover:bg-gray-700
    active: '#4b5563',       // active states
    focus: '#3b82f6',        // focus rings
  }
} as const;

export const figmaTypography = {
  // Font Families
  fontFamily: {
    primary: 'Inter, system-ui, sans-serif',
    mono: 'ui-monospace, monospace',
  },
  
  // Font Sizes (from Tailwind classes observed)
  fontSize: {
    xs: '0.75rem',     // text-xs
    sm: '0.875rem',    // text-sm  
    base: '1rem',      // text-base
    lg: '1.125rem',    // text-lg
    xl: '1.25rem',     // text-xl
    '2xl': '1.5rem',   // text-2xl
    '3xl': '1.875rem', // text-3xl
    '4xl': '2.25rem',  // text-4xl
  },
  
  // Font Weights
  fontWeight: {
    normal: '400',     // font-normal
    medium: '500',     // font-medium
    semibold: '600',   // font-semibold
    bold: '700',       // font-bold
    extrabold: '800',  // font-extrabold
  },
  
  // Line Heights
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  }
} as const;

export const figmaSpacing = {
  // Padding/Margin values (from Tailwind classes)
  px: '1px',
  0.5: '0.125rem',  // p-0.5
  1: '0.25rem',     // p-1
  2: '0.5rem',      // p-2
  3: '0.75rem',     // p-3
  4: '1rem',        // p-4
  5: '1.25rem',     // p-5
  6: '1.5rem',      // p-6
  8: '2rem',        // p-8
  12: '3rem',       // p-12
  16: '4rem',       // p-16
} as const;

export const figmaRadius = {
  none: '0',
  sm: '0.125rem',    // rounded-sm
  base: '0.25rem',   // rounded
  md: '0.375rem',    // rounded-md
  lg: '0.5rem',      // rounded-lg
  xl: '0.75rem',     // rounded-xl
  '2xl': '1rem',     // rounded-2xl
  full: '9999px',    // rounded-full
} as const;

export const figmaShadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

// Helper function to create consistent component styles
export const createFigmaStyles = (overrides: Record<string, any> = {}) => ({
  // Container styles
  container: {
    backgroundColor: figmaColors.primary,
    color: figmaColors.text.primary,
    fontFamily: figmaTypography.fontFamily.primary,
    ...overrides.container,
  },
  
  // Card styles
  card: {
    backgroundColor: figmaColors.secondary,
    borderColor: figmaColors.border.primary,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: figmaRadius.lg,
    padding: figmaSpacing[4],
    ...overrides.card,
  },
  
  // Button styles
  button: {
    backgroundColor: figmaColors.accent.blue,
    color: figmaColors.text.primary,
    borderRadius: figmaRadius.md,
    padding: `${figmaSpacing[2]} ${figmaSpacing[4]}`,
    fontWeight: figmaTypography.fontWeight.medium,
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    border: 'none',
    ...overrides.button,
  },
  
  // Text styles
  heading: {
    color: figmaColors.text.primary,
    fontWeight: figmaTypography.fontWeight.bold,
    lineHeight: figmaTypography.lineHeight.tight,
    ...overrides.heading,
  },
  
  bodyText: {
    color: figmaColors.text.secondary,
    fontSize: figmaTypography.fontSize.base,
    lineHeight: figmaTypography.lineHeight.normal,
    ...overrides.bodyText,
  },
  
  mutedText: {
    color: figmaColors.text.muted,
    fontSize: figmaTypography.fontSize.sm,
    ...overrides.mutedText,
  },
});
