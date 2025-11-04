/**
 * ThemeToggle Component
 * 
 * Theme switcher button for game viewer
 * Single responsibility: Toggle light/dark theme
 * Follows .cursorrules: <100 lines, single purpose
 * 
 * @module ThemeToggle
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { GameViewerTheme } from '../hooks/useGameViewerTheme';

interface ThemeToggleProps {
  theme: GameViewerTheme;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * ThemeToggle - Light/Dark mode switcher
 * 
 * Features:
 * - Animated icon transition
 * - Tooltip
 * - Responsive sizing
 * - Smooth theme switching
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  theme, 
  onToggle,
  size = 'md'
}) => {
  
  const isDark = theme === 'dark';
  
  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-2.5'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={`
        ${sizeClasses[size]}
        rounded-lg
        ${isDark 
          ? 'bg-slate-800 hover:bg-slate-700 text-orange-400' 
          : 'bg-orange-100 hover:bg-orange-200 text-orange-600'}
        transition-all duration-200
        flex items-center justify-center
        border
        ${isDark ? 'border-slate-700' : 'border-orange-300'}
        shadow-sm
        group
        relative
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Icon with rotation animation */}
      <motion.div
        key={theme}
        initial={{ rotate: -180, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 180, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center"
      >
        {isDark ? (
          <Moon className={`${iconSizes[size]} stroke-2`} />
        ) : (
          <Sun className={`${iconSizes[size]} stroke-2`} />
        )}
      </motion.div>
      
      {/* Tooltip */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {isDark ? 'Light mode' : 'Dark mode'}
      </div>
    </motion.button>
  );
};

