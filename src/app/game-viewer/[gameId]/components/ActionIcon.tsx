/**
 * ActionIcon Component
 * 
 * Reusable icon for play-by-play actions
 * Single responsibility: Display action type visually
 * Follows .cursorrules: <200 lines, single purpose
 * 
 * @module ActionIcon
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Zap,
  XCircle,
  Users,
  AlertCircle,
  Clock,
  Trophy,
  Shield,
  TrendingUp,
  ArrowRight,
  Circle
} from 'lucide-react';

interface ActionIconProps {
  type: string;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

/**
 * ActionIcon - Visual indicator for play types
 * 
 * Features:
 * - Color-coded by action
 * - Icon mapped to action type
 * - Optional entrance animation
 * - Responsive sizing
 */
export const ActionIcon: React.FC<ActionIconProps> = ({ 
  type, 
  size = 'md',
  animate = true
}) => {
  
  const config = getActionConfig(type);
  
  const sizeClasses = {
    sm: 'w-6 h-6 p-1',
    md: 'w-8 h-8 p-1.5',
    lg: 'w-10 h-10 p-2'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
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
      className={`
        ${sizeClasses[size]}
        ${config.bgClass}
        ${config.textClass}
        rounded-full
        flex items-center justify-center
        backdrop-blur-sm border border-white/20
        shadow-lg
      `}
    >
      <config.Icon className={iconSizes[size]} />
    </Component>
  );
};

/**
 * Map action type to icon and colors
 * Pure function - no side effects
 */
function getActionConfig(type: string) {
  const typeLower = type.toLowerCase();
  
  // Scoring plays
  if (typeLower.includes('2pt') || typeLower.includes('layup') || typeLower.includes('dunk')) {
    return {
      Icon: Target,
      bgClass: 'bg-green-500/90',
      textClass: 'text-white'
    };
  }
  
  if (typeLower.includes('3pt') || typeLower.includes('three')) {
    return {
      Icon: Zap,
      bgClass: 'bg-orange-500/90',
      textClass: 'text-white'
    };
  }
  
  if (typeLower.includes('free_throw') || typeLower === 'ft') {
    return {
      Icon: Circle,
      bgClass: 'bg-blue-500/90',
      textClass: 'text-white'
    };
  }
  
  // Missed shots
  if (typeLower.includes('miss')) {
    return {
      Icon: XCircle,
      bgClass: 'bg-red-500/90',
      textClass: 'text-white'
    };
  }
  
  // Defensive plays
  if (typeLower.includes('block') || typeLower.includes('steal')) {
    return {
      Icon: Shield,
      bgClass: 'bg-purple-500/90',
      textClass: 'text-white'
    };
  }
  
  if (typeLower.includes('rebound')) {
    return {
      Icon: TrendingUp,
      bgClass: 'bg-indigo-500/90',
      textClass: 'text-white'
    };
  }
  
  // Fouls
  if (typeLower.includes('foul')) {
    return {
      Icon: AlertCircle,
      bgClass: 'bg-yellow-500/90',
      textClass: 'text-gray-900'
    };
  }
  
  // Turnovers
  if (typeLower.includes('turnover')) {
    return {
      Icon: XCircle,
      bgClass: 'bg-orange-600/90',
      textClass: 'text-white'
    };
  }
  
  // Assists
  if (typeLower.includes('assist')) {
    return {
      Icon: ArrowRight,
      bgClass: 'bg-cyan-500/90',
      textClass: 'text-white'
    };
  }
  
  // Substitutions
  if (typeLower.includes('sub')) {
    return {
      Icon: Users,
      bgClass: 'bg-gray-500/90',
      textClass: 'text-white'
    };
  }
  
  // Timeout
  if (typeLower.includes('timeout')) {
    return {
      Icon: Clock,
      bgClass: 'bg-slate-600/90',
      textClass: 'text-white'
    };
  }
  
  // Default
  return {
    Icon: Trophy,
    bgClass: 'bg-gray-600/90',
    textClass: 'text-white'
  };
}

