/**
 * Game Viewer Theme Configuration
 * 
 * Theme color constants and utilities
 * Single responsibility: Theme styling definitions
 * Follows .cursorrules: <100 lines, single purpose
 * 
 * @module gameViewerTheme
 */

export type GameViewerTheme = 'light' | 'dark';

/**
 * Theme class configurations
 */
export const themeClasses = {
  // Main containers
  mainBg: {
    dark: 'bg-slate-950',
    light: 'bg-gradient-to-br from-orange-50/50 via-background to-red-50/30'
  },
  
  // Cards and containers
  cardBg: {
    dark: 'bg-slate-900',
    light: 'bg-white'
  },
  
  subCardBg: {
    dark: 'bg-slate-800',
    light: 'bg-orange-50/30'
  },
  
  playCardBg: {
    dark: 'bg-slate-800/50',
    light: 'bg-white'
  },
  
  // Borders
  border: {
    dark: 'border-slate-700',
    light: 'border-orange-200/50'
  },
  
  divider: {
    dark: 'border-slate-700',
    light: 'border-orange-200'
  },
  
  // Text colors
  text: {
    dark: 'text-foreground',
    light: 'text-gray-900'
  },
  
  textMuted: {
    dark: 'text-muted-foreground',
    light: 'text-gray-600'
  },
  
  // Shadows
  shadow: {
    dark: '',
    light: 'shadow-sm'
  },
  
  cardShadow: {
    dark: '',
    light: 'shadow-md'
  },
  
  // Header specific
  headerBg: {
    dark: 'bg-slate-900 border-slate-700',
    light: 'bg-white border-orange-200 shadow-sm'
  },
  
  headerSubBg: {
    dark: 'bg-slate-800 border-slate-700',
    light: 'bg-orange-50/30 border-orange-200'
  },
  
  // Tab specific
  tabBg: {
    dark: 'bg-slate-800 border-slate-700',
    light: 'bg-white border-orange-200'
  }
};

/**
 * Get theme-specific classes
 */
export function getThemeClass(key: keyof typeof themeClasses, theme: GameViewerTheme): string {
  return themeClasses[key][theme];
}

/**
 * Build className string with theme
 */
export function cn(baseClasses: string, theme: GameViewerTheme, themeKey: keyof typeof themeClasses): string {
  return `${baseClasses} ${getThemeClass(themeKey, theme)}`;
}

