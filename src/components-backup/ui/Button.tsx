'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';

// === HERO/LANDING PAGE BUTTONS ===
interface HeroButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export const HeroButton = forwardRef<HTMLButtonElement, HeroButtonProps>(
  ({ className, variant = 'primary', children, ...props }, ref) => {
    const isPrimary = variant === 'primary';

    return (
      <motion.button
        whileHover={{ y: -1, boxShadow: isPrimary ? '0 12px 28px rgba(252, 211, 77, 0.35)' : '0 10px 24px rgba(91, 33, 182, 0.35)' }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 rounded-full transition-all duration-300 select-none',
          'h-[52px] md:h-[56px] px-7 md:px-9 text-lg md:text-xl font-extrabold tracking-wide',
          isPrimary
            ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 text-black border border-yellow-300/60'
            : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border border-violet-500/40',
          className
        )}
        ref={ref}
        {...props}
      >
        {/* Soft highlight */}
        <span className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]" />
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </motion.button>
    );
  }
);

// === DASHBOARD ACTION BUTTONS ===
interface DashboardButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export const DashboardButton = forwardRef<HTMLButtonElement, DashboardButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseClasses = cn(
      'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200',
      size === 'sm' ? 'px-3 py-2 text-sm' : 'px-4 py-3 text-base',
      className
    );

    const variantStyles = {
      primary: 'bg-yellow-400 text-gray-900 hover:bg-yellow-300 shadow-lg hover:shadow-xl',
      secondary: 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl',
      outline: 'border-2 border-gray-600 text-gray-300 hover:border-yellow-400 hover:text-yellow-400 bg-transparent'
    };

    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(baseClasses, variantStyles[variant])}
        ref={ref}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

// === NAVIGATION BUTTONS ===
interface NavButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'active';
  children: React.ReactNode;
}

export const NavButton = forwardRef<HTMLButtonElement, NavButtonProps>(
  ({ className, variant = 'ghost', children, ...props }, ref) => {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'px-4 py-2 rounded-lg font-medium transition-all duration-200',
          variant === 'active' 
            ? 'bg-yellow-400 text-gray-900' 
            : 'text-gray-300 hover:text-yellow-400 hover:bg-gray-800',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

// === FORM BUTTONS ===
interface FormButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'submit' | 'cancel' | 'outline';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const FormButton = forwardRef<HTMLButtonElement, FormButtonProps>(
  ({ className, variant = 'submit', isLoading, children, ...props }, ref) => {
    const variantStyles = {
      submit: 'bg-yellow-400 text-gray-900 hover:bg-yellow-300 shadow-lg',
      cancel: 'bg-gray-600 text-white hover:bg-gray-700',
      outline: 'border-2 border-gray-600 text-gray-300 hover:border-yellow-400 hover:text-yellow-400 bg-transparent'
    };

    return (
      <motion.button
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        className={cn(
          'px-6 py-3 rounded-lg font-semibold transition-all duration-200 min-w-[120px]',
          isLoading && 'opacity-70 cursor-not-allowed',
          variantStyles[variant],
          className
        )}
        disabled={isLoading}
        ref={ref}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Loading...
          </div>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

// === CARD ACTION BUTTONS ===
interface CardButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'xs';
  children: React.ReactNode;
}

export const CardButton = forwardRef<HTMLButtonElement, CardButtonProps>(
  ({ className, variant = 'primary', size = 'sm', children, ...props }, ref) => {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'rounded-md font-medium transition-all duration-200',
          size === 'xs' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm',
          variant === 'primary' 
            ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300' 
            : 'text-gray-400 hover:text-yellow-400 hover:bg-gray-800',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

// Export legacy Button for compatibility (will be removed after migration)
export const Button = HeroButton;

HeroButton.displayName = 'HeroButton';
DashboardButton.displayName = 'DashboardButton';
NavButton.displayName = 'NavButton';
FormButton.displayName = 'FormButton';
CardButton.displayName = 'CardButton';