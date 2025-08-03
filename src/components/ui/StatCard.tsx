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

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.98 }}
      className={cn('stat-card-constrained rounded-xl p-6 border transition-all duration-300 shadow-lg', className)}
      style={{
        backgroundColor: '#1a1a1a',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: '1px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div className="flex items-start justify-between">
        <h3 className="text-base font-semibold uppercase tracking-wider" style={{ color: '#b3b3b3' }}>
          {title}
        </h3>
        {icon && <div style={{ color: '#FFD700' }}>{icon}</div>}
      </div>
      
      <div className="text-left">
        <div className="text-5xl font-bold mb-1" style={{ color: '#ffffff' }}>
          {value}
        </div>
        {subtitle && (
          <p className={cn(
            'text-base font-medium',
            trend ? trendColors[trend] : 'text-gray-400'
          )}>
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
}