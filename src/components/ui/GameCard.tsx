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
  showTeamLabels?: boolean;
}

export function GameCard({
  homeTeam,
  awayTeam,
  status,
  time,
  venue,
  className,
  onClick,
  showTeamLabels = true
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

  // Determine context (landing vs dashboard)
  const isLandingPage = className?.includes('landing') || !className?.includes('dashboard');
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        isLandingPage ? 'landing-game-card' : 'dashboard-game-card',
        'cursor-pointer',
        className
      )}
    >
      {/* Status and Time Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          'px-3 py-1 rounded-full text-xs font-bold tracking-wide',
          status === 'live' ? 'bg-red-500 text-white animate-pulse' :
          status === 'upcoming' ? 'bg-blue-500 bg-opacity-20 text-blue-400' :
          'bg-gray-500 bg-opacity-20 text-gray-400'
        )}>
          {statusLabels[status]}
        </div>
        {time && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            {time}
          </div>
        )}
      </div>

      {/* Teams Matchup */}
      <div className="flex-1 space-y-4">
        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {awayTeam.logo && (
              <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 border border-gray-600">
                <img src={awayTeam.logo} alt={awayTeam.name} className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-white truncate text-base">
                {awayTeam.name}
              </div>
              {showTeamLabels && (
                <div className="text-xs text-gray-400">Away</div>
              )}
            </div>
          </div>
          {awayTeam.score !== undefined && (
            <div className="text-3xl font-bold text-white ml-4">
              {awayTeam.score}
            </div>
          )}
        </div>

        {/* VS Separator */}
        <div className="flex items-center justify-center py-2">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent flex-1"></div>
          <div className="px-4 text-xs font-medium text-gray-500 bg-gray-800 rounded-full">VS</div>
          <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent flex-1"></div>
        </div>

        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {homeTeam.logo && (
              <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 border border-gray-600">
                <img src={homeTeam.logo} alt={homeTeam.name} className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-white truncate text-base">
                {homeTeam.name}
              </div>
              {showTeamLabels && (
                <div className="text-xs text-gray-400">Home</div>
              )}
            </div>
          </div>
          {homeTeam.score !== undefined && (
            <div className="text-3xl font-bold text-white ml-4">
              {homeTeam.score}
            </div>
          )}
        </div>
      </div>

      {/* Venue Footer */}
      {venue && (
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-4 pt-4 border-t border-gray-700 border-opacity-50">
          <MapPin className="w-3 h-3" />
          <span>{venue}</span>
        </div>
      )}
    </motion.div>
  );
}