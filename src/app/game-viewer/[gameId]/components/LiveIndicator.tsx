/**
 * LiveIndicator Component
 * 
 * Reusable live broadcast indicator
 * Single responsibility: Show live game status
 * Follows .cursorrules: <200 lines, single purpose
 * 
 * @module LiveIndicator
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Radio } from 'lucide-react';

interface LiveIndicatorProps {
  show: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * LiveIndicator - Animated live broadcast badge
 * 
 * Features:
 * - Pulsing animation
 * - Customizable position
 * - Responsive sizing
 * - Auto-hide when not live
 */
export const LiveIndicator: React.FC<LiveIndicatorProps> = ({ 
  show,
  position = 'bottom-right',
  size = 'md'
}) => {
  
  if (!show) return null;
  
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-2 text-sm gap-2',
    lg: 'px-4 py-3 text-base gap-3'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className={`
        fixed ${positionClasses[position]}
        z-50
        flex items-center
        ${sizeClasses[size]}
        bg-red-600 text-white
        rounded-full
        font-bold uppercase tracking-wider
        shadow-lg shadow-red-500/50
        backdrop-blur-sm
      `}
    >
      {/* Pulsing dot */}
      <motion.div
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [1, 0.7, 1]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 2,
          ease: "easeInOut"
        }}
        className={`${dotSizes[size]} bg-white rounded-full`}
      />
      
      {/* Radio icon */}
      <Radio className={`${iconSizes[size]} animate-pulse`} />
      
      {/* Text */}
      <span>LIVE</span>
      
      {/* Glow effect */}
      <motion.div
        animate={{
          opacity: [0.5, 0.8, 0.5],
          scale: [1, 1.1, 1]
        }}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: "easeInOut"
        }}
        className="absolute inset-0 rounded-full bg-red-500/30 blur-md -z-10"
      />
    </motion.div>
  );
};

