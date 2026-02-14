'use client';

import { Sun, Moon } from 'lucide-react';
import { useTournamentTheme } from '@/contexts/TournamentThemeContext';

export function TournamentThemeToggle() {
  const { theme, toggleTheme } = useTournamentTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`
        flex h-9 w-9 shrink-0 items-center justify-center rounded-full
        transition-colors
        ${isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}
      `}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? (
        <Sun className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2]" />
      ) : (
        <Moon className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2]" />
      )}
    </button>
  );
}
