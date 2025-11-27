/**
 * MilestoneBadge Component
 * 
 * Displays milestone achievement badges on play entries
 * 
 * @module MilestoneBadge
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Milestone } from '@/lib/engines/milestoneEngine';

interface MilestoneBadgeProps {
  milestones: Milestone[];
  isDark?: boolean;
}

const colorClasses: Record<Milestone['color'], { bg: string; text: string; border: string }> = {
  blue: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/50'
  },
  purple: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    border: 'border-purple-500/50'
  },
  orange: {
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    border: 'border-orange-500/50'
  },
  gold: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/50'
  },
  teal: {
    bg: 'bg-teal-500/20',
    text: 'text-teal-400',
    border: 'border-teal-500/50'
  },
  red: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/50'
  }
};

const lightColorClasses: Record<Milestone['color'], { bg: string; text: string; border: string }> = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300'
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300'
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-300'
  },
  gold: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-400'
  },
  teal: {
    bg: 'bg-teal-100',
    text: 'text-teal-700',
    border: 'border-teal-300'
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300'
  }
};

export function MilestoneBadge({ milestones, isDark = true }: MilestoneBadgeProps) {
  if (!milestones || milestones.length === 0) return null;

  const colors = isDark ? colorClasses : lightColorClasses;

  return (
    <div className="flex flex-col gap-1 items-end">
      {milestones.map((milestone, index) => {
        const colorClass = colors[milestone.color];
        const isLegendary = milestone.type === 'TRIPLE_DOUBLE' || milestone.type === 'DOUBLE_DOUBLE';
        
        return (
          <motion.div
            key={milestone.type}
            initial={{ opacity: 0, scale: 0.8, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ 
              delay: index * 0.1, 
              duration: 0.3,
              type: 'spring',
              stiffness: 200
            }}
            className={`
              flex items-center gap-1.5 px-2 py-1 rounded-lg border
              ${colorClass.bg} ${colorClass.border}
              ${isLegendary ? 'animate-pulse' : ''}
            `}
          >
            <span className="text-sm">{milestone.icon}</span>
            <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide ${colorClass.text}`}>
              {milestone.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

