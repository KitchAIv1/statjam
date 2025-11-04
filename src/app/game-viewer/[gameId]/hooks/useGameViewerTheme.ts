/**
 * useGameViewerTheme Hook
 * 
 * Manages theme state for game viewer
 * Single responsibility: Theme preference management
 * Follows .cursorrules: <50 lines, single purpose
 * 
 * @module useGameViewerTheme
 */

'use client';

import { useState, useEffect } from 'react';

export type GameViewerTheme = 'light' | 'dark';

interface UseGameViewerThemeReturn {
  theme: GameViewerTheme;
  isDark: boolean;
  isLight: boolean;
  toggleTheme: () => void;
  setTheme: (theme: GameViewerTheme) => void;
}

/**
 * Hook to manage game viewer theme preference
 * Persists to localStorage
 */
export function useGameViewerTheme(): UseGameViewerThemeReturn {
  const [theme, setThemeState] = useState<GameViewerTheme>('light'); // ✅ FIX: Light mode as default

  // Load theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('gameViewerTheme') as GameViewerTheme;
    if (saved === 'light' || saved === 'dark') {
      setThemeState(saved);
    }
  }, []);

  // Save theme to localStorage when changed
  const setTheme = (newTheme: GameViewerTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('gameViewerTheme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    toggleTheme,
    setTheme
  };
}

