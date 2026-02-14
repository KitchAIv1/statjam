'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

export type TournamentTheme = 'light' | 'dark';

const STORAGE_KEY = 'tournamentTheme';

interface TournamentThemeContextValue {
  theme: TournamentTheme;
  isDark: boolean;
  isLight: boolean;
  toggleTheme: () => void;
  setTheme: (theme: TournamentTheme) => void;
}

const TournamentThemeContext = createContext<TournamentThemeContextValue | null>(null);

export function TournamentThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<TournamentTheme>('dark');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as TournamentTheme | null;
    if (saved === 'light' || saved === 'dark') setThemeState(saved);
  }, []);

  const setTheme = useCallback((newTheme: TournamentTheme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return (
    <TournamentThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        isLight: theme === 'light',
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </TournamentThemeContext.Provider>
  );
}

const DEFAULT_THEME: TournamentTheme = 'dark';

const defaultContextValue: TournamentThemeContextValue = {
  theme: DEFAULT_THEME,
  isDark: true,
  isLight: false,
  toggleTheme: () => {},
  setTheme: () => {},
};

/** Returns theme context. When outside TournamentThemeProvider, returns default (dark) to avoid crashes. */
export function useTournamentTheme(): TournamentThemeContextValue {
  const ctx = useContext(TournamentThemeContext);
  return ctx ?? defaultContextValue;
}
