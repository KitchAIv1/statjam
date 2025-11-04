/**
 * StatusBadge Component
 * 
 * Reusable status indicator badge with animations
 * Single responsibility: Display game status visually
 * Follows .cursorrules: <200 lines, single purpose
 * 
 * @module StatusBadge
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Radio, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Clock
} from 'lucide-react';

interface StatusBadgeProps {
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overtime' | string;
  isLive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

/**
 * StatusBadge - Visual game status indicator
 * 
 * Features:
 * - Color-coded by status
 * - Animated pulse for live games
 * - Icon support
 * - Responsive sizing
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  isLive = false,
  size = 'md',
  showIcon = true
}) => {
  
  // Get status config (color, icon, label)
  const config = getStatusConfig(status, isLive);
  
  // Size variants
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`
        inline-flex items-center justify-center
        rounded-full font-semibold uppercase tracking-wide
        ${sizeClasses[size]}
        ${config.bgClass}
        ${config.textClass}
        ${config.borderClass}
        border backdrop-blur-sm
        transition-all duration-200
      `}
    >
      {/* Icon */}
      {showIcon && (
        <config.Icon className={`${iconSizes[size]} ${isLive ? 'animate-pulse' : ''}`} />
      )}
      
      {/* Label */}
      <span>{config.label}</span>
      
      {/* Live pulse dot */}
      {isLive && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ 
            repeat: Infinity, 
            duration: 2,
            ease: "easeInOut"
          }}
          className="w-1.5 h-1.5 bg-white rounded-full"
        />
      )}
    </motion.div>
  );
};

/**
 * Get status configuration
 * Pure function - no side effects
 */
function getStatusConfig(status: string, isLive: boolean) {
  const statusLower = status.toLowerCase();
  
  if (isLive || statusLower.includes('live') || statusLower.includes('progress')) {
    return {
      Icon: Radio,
      label: 'LIVE',
      bgClass: 'bg-red-500/90',
      textClass: 'text-white',
      borderClass: 'border-red-400'
    };
  }
  
  if (statusLower === 'overtime') {
    return {
      Icon: Clock,
      label: 'OT',
      bgClass: 'bg-purple-500/90',
      textClass: 'text-white',
      borderClass: 'border-purple-400'
    };
  }
  
  if (statusLower === 'completed') {
    return {
      Icon: CheckCircle,
      label: 'FINAL',
      bgClass: 'bg-green-500/90',
      textClass: 'text-white',
      borderClass: 'border-green-400'
    };
  }
  
  if (statusLower === 'cancelled') {
    return {
      Icon: XCircle,
      label: 'CANCELLED',
      bgClass: 'bg-gray-500/90',
      textClass: 'text-white',
      borderClass: 'border-gray-400'
    };
  }
  
  // Default: Scheduled (StatJam Orange)
  return {
    Icon: Calendar,
    label: 'SCHEDULED',
    bgClass: 'bg-orange-500/90',
    textClass: 'text-white',
    borderClass: 'border-orange-400'
  };
}

