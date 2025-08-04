'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  icon?: React.ReactNode;
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  className, 
  icon 
}: StatCardProps) {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400',
  };

  // Determine if this is for landing page (based on className or a prop)
  const isLandingPage = className?.includes('landing') || title.includes('Live') || title.includes('Active');
  
  if (isLandingPage) {
    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className={cn('landing-stat-card', className)}
      >
        {/* Header */}
        <div className="flex items-start justify-between relative z-10">
          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">
              {title}
            </h3>
            {subtitle && (
              <p className={cn(
                'text-xs font-medium',
                trend ? trendColors[trend] : 'text-gray-500'
              )}>
                {subtitle}
              </p>
            )}
          </div>
          {icon && (
            <div className="text-yellow-400 w-8 h-8 flex items-center justify-center bg-yellow-400 bg-opacity-10 rounded-lg">
              {icon}
            </div>
          )}
        </div>
        
        {/* Value - Hero Display */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl font-bold text-white leading-none mb-2 font-mono">
              {value}
            </div>
            <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 mx-auto rounded-full"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Dashboard version - compact
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn('dashboard-stat-card', className)}
    >
      <div className="flex items-start justify-between">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {title}
        </h3>
        {icon && <div className="text-yellow-400 w-4 h-4">{icon}</div>}
      </div>
      
      <div className="mt-auto">
        <div className="text-2xl font-bold text-white mb-1">
          {value}
        </div>
        {subtitle && (
          <p className={cn(
            'text-xs',
            trend ? trendColors[trend] : 'text-gray-500'
          )}>
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
}