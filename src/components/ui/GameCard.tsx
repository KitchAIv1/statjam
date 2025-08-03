'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Clock, MapPin } from 'lucide-react';

interface Team {
  name: string;
  logo?: string;
  score?: number;
}

interface GameCardProps {
  homeTeam: Team;
  awayTeam: Team;
  status: 'upcoming' | 'live' | 'finished';
  time?: string;
  venue?: string;
  className?: string;
  onClick?: () => void;
}

export function GameCard({
  homeTeam,
  awayTeam,
  status,
  time,
  venue,
  className,
  onClick
}: GameCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return '#b3b3b3';
      case 'live': return '#ef4444';
      case 'finished': return '#ffffff';
      default: return '#b3b3b3';
    }
  };

  const statusLabels = {
    upcoming: 'UPCOMING',
    live: 'LIVE',
    finished: 'FINAL',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn('game-card-constrained rounded-lg p-6 border transition-all duration-200 cursor-pointer', className)}
      style={{
        backgroundColor: '#1a1a1a',
        borderColor: '#1f2937',
        borderWidth: '1px',
      }}
    >
      {/* Status and Time */}
      <div className="flex items-center justify-between mb-4">
        <span 
          className="text-xs font-bold tracking-wide"
          style={{ 
            color: getStatusColor(status),
            animation: status === 'live' ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
          }}
        >
          {statusLabels[status]}
        </span>
        {time && (
          <div className="flex items-center gap-1 text-xs" style={{ color: '#b3b3b3' }}>
            <Clock className="w-3 h-3" />
            {time}
          </div>
        )}
      </div>

      {/* Teams */}
      <div className="space-y-3">
        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {awayTeam.logo && (
              <div className="w-8 h-8 bg-background-hover rounded-full flex items-center justify-center">
                <img src={awayTeam.logo} alt={awayTeam.name} className="w-6 h-6" />
              </div>
            )}
            <span className="font-medium" style={{ color: '#ffffff' }}>{awayTeam.name}</span>
          </div>
          {awayTeam.score !== undefined && (
            <span className="text-2xl font-bold" style={{ color: '#ffffff' }}>{awayTeam.score}</span>
          )}
        </div>

        {/* VS or @ */}
        <div className="text-center text-xs" style={{ color: '#666666' }}>VS</div>

        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {homeTeam.logo && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2a2a2a' }}>
                <img src={homeTeam.logo} alt={homeTeam.name} className="w-6 h-6" />
              </div>
            )}
            <span className="font-medium" style={{ color: '#ffffff' }}>{homeTeam.name}</span>
          </div>
          {homeTeam.score !== undefined && (
            <span className="text-2xl font-bold" style={{ color: '#ffffff' }}>{homeTeam.score}</span>
          )}
        </div>
      </div>

      {/* Venue */}
      {venue && (
        <div className="flex items-center gap-1 text-xs mt-4 pt-3 border-t" style={{ color: '#b3b3b3', borderColor: '#1f2937' }}>
          <MapPin className="w-3 h-3" />
          {venue}
        </div>
      )}
    </motion.div>
  );
}