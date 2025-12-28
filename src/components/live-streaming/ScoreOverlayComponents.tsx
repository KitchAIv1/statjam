'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

/**
 * Timeout Indicator Component
 * Displays timeouts as dots (filled = used, empty = remaining)
 */
export function TimeoutIndicator({ 
  remaining, 
  max = 7 
}: { 
  remaining: number; 
  max?: number;
}) {
  const used = max - remaining;
  
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, index) => (
        <div
          key={index}
          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
            index < used
              ? 'bg-gray-500/60' // Used timeout
              : 'bg-white/80'     // Remaining timeout
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Foul Count Badge Component
 * Shows foul count with bonus indicator (5+ = red)
 */
export function FoulCountBadge({ 
  count, 
  isBonus 
}: { 
  count: number; 
  isBonus: boolean;
}) {
  return (
    <motion.div
      className={`px-2 py-0.5 rounded text-xs font-bold transition-colors duration-300 ${
        isBonus
          ? 'bg-red-600 text-white' // Bonus (5+ fouls)
          : count >= 4
          ? 'bg-yellow-500/80 text-white' // Warning (4 fouls)
          : 'bg-white/10 text-white' // Normal
      }`}
      animate={{
        scale: isBonus ? [1, 1.05, 1] : 1,
      }}
      transition={{
        duration: 0.3,
        repeat: isBonus ? Infinity : 0,
        repeatDelay: 1,
      }}
    >
      {count}
      {isBonus && (
        <span className="ml-1 text-[10px]">BONUS</span>
      )}
    </motion.div>
  );
}

/**
 * Possession Indicator Component
 * Shows which team has possession
 */
export function PossessionIndicator({ 
  hasPossession,
  teamColor 
}: { 
  hasPossession: boolean;
  teamColor?: string;
}) {
  if (!hasPossession) return null;
  
  return (
    <motion.div
      className="flex items-center justify-center"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div
        className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px]"
        style={{
          borderBottomColor: teamColor || '#3b82f6',
        }}
      />
    </motion.div>
  );
}

/**
 * Jump Ball Arrow Component
 * Shows alternating possession arrow
 */
export function JumpBallArrow({ 
  hasArrow,
  teamColor 
}: { 
  hasArrow: boolean;
  teamColor?: string;
}) {
  if (!hasArrow) return null;
  
  return (
    <motion.div
      className="flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="text-xs font-bold"
        style={{ color: teamColor || '#fbbf24' }}
      >
        ↻
      </div>
    </motion.div>
  );
}

/**
 * Team Logo Fallback Component
 * Renders team initial when logo is unavailable
 */
function TeamLogoFallback({ 
  teamName
}: { 
  teamName: string;
}) {
  return (
    <div 
      className="flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-white font-bold"
      style={{ width: 'var(--logo-size, 2rem)', height: 'var(--logo-size, 2rem)' }}
    >
      <span className="text-xs">{teamName.charAt(0).toUpperCase()}</span>
    </div>
  );
}

/**
 * Team Logo Component
 * Displays team logo with fallback (responsive with CSS variables)
 */
export function TeamLogo({ 
  logoUrl, 
  teamName
}: { 
  logoUrl?: string; 
  teamName: string;
}) {
  if (!logoUrl) {
    return <TeamLogoFallback teamName={teamName} />;
  }
  
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    const parent = target.parentElement;
    if (parent) {
      const fallback = document.createElement('div');
      fallback.className = 'flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-white font-bold w-full h-full';
      fallback.innerHTML = `<span class="text-xs">${teamName.charAt(0).toUpperCase()}</span>`;
      parent.appendChild(fallback);
    }
  };
  
  return (
    <div
      className="relative"
      style={{ width: 'var(--logo-size, 2rem)', height: 'var(--logo-size, 2rem)' }}
    >
      <Image
        src={logoUrl}
        alt={`${teamName} logo`}
        fill
        className="object-contain rounded"
        unoptimized
        onError={handleImageError}
      />
    </div>
  );
}

