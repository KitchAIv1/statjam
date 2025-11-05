/**
 * PlayerAvatarCard Component
 * 
 * Displays player avatar with team indicator
 * Single responsibility: Show player visual identity
 * Follows .cursorrules: <200 lines, single purpose
 * 
 * @module PlayerAvatarCard
 */

'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

interface PlayerAvatarCardProps {
  playerName: string;
  teamName: string;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  animate?: boolean;
  className?: string;
}

/**
 * PlayerAvatarCard - Player avatar display
 * 
 * Features:
 * - Square avatar with photo or initials
 * - Team badge
 * - Responsive sizing
 * - Optional animation
 * - Optimized for performance (memoized)
 */
const PlayerAvatarCardComponent: React.FC<PlayerAvatarCardProps> = ({ 
  playerName,
  teamName,
  photoUrl,
  size = 'md',
  animate = true,
  className = ''
}) => {
  
  const initial = playerName ? playerName.charAt(0).toUpperCase() : '?';
  const teamInitial = teamName.substring(0, 3).toUpperCase();
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-[84px] h-[84px] text-2xl'
  };

  const badgeSizes = {
    sm: 'text-[10px] px-1',
    md: 'text-xs px-1.5',
    lg: 'text-xs px-2',
    xl: 'text-sm px-2.5',
    '2xl': 'text-base px-3'
  };

  // Explicit pixel dimensions for image optimization
  const sizePixels = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    '2xl': 84
  };

  const Component = animate ? motion.div : 'div';
  const animationProps = animate ? {
    initial: { scale: 0, rotate: -180 },
    animate: { scale: 1, rotate: 0 },
    transition: { type: 'spring', stiffness: 260, damping: 20 }
  } : {};

  return (
    <Component
      {...animationProps}
      className={`flex flex-col items-center gap-1 ${className}`}
    >
      {/* Avatar Square */}
      <div className={`
        ${sizeClasses[size]}
        rounded-lg
        bg-gradient-to-br from-orange-500 to-red-500
        flex items-center justify-center
        font-bold text-white
        shadow-lg shadow-orange-500/20
        ring-2 ring-white/20
        overflow-hidden
      `}>
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt={playerName}
            width={sizePixels[size]}
            height={sizePixels[size]}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            className="w-full h-full object-cover"
          />
        ) : initial === '?' ? (
          <User className="w-1/2 h-1/2" />
        ) : (
          initial
        )}
      </div>
      
      {/* Team Badge */}
      <div className={`
        ${badgeSizes[size]}
        bg-slate-700/80 backdrop-blur-sm
        text-slate-300
        rounded
        font-semibold
        tracking-tight
      `}>
        {teamInitial}
      </div>
    </Component>
  );
};

/**
 * Memoized export: Only re-render if props change
 * Improves performance in play-by-play feed with many avatars
 */
export const PlayerAvatarCard = memo(PlayerAvatarCardComponent);

