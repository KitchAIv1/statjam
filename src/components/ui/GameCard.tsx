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
  const statusLabels = {
    upcoming: 'UPCOMING',
    live: 'LIVE',
    finished: 'FINAL',
  };

  // Determine context (landing vs dashboard)
  const isLandingPage = className?.includes('landing') || !className?.includes('dashboard');
  const homeScore = homeTeam.score ?? undefined;
  const awayScore = awayTeam.score ?? undefined;
  
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 10px 30px rgba(255, 255, 0, 0.08)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        isLandingPage ? 'landing-game-card' : 'dashboard-game-card',
        // Glass card surface + subtle glow
        'cursor-pointer rounded-xl p-4 md:p-5 backdrop-blur-md bg-white/5 border border-white/10 transition-all',
        className
      )}
      style={{
        backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.00))'
      }}
    >
      {/* Status and Time Header */}
      <div className="flex items-center justify-between mb-4">
        {/* LIVE pill with pulsing dot */}
        <div
          className={cn(
            'flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider',
            status === 'live' ? 'bg-visible-yellow text-black' :
            status === 'upcoming' ? 'bg-white/10 text-gray-300' : 'bg-white/10 text-gray-200'
          )}
          aria-label={statusLabels[status]}
        >
          <span className="relative inline-flex">
            <span className={cn(
              'inline-block w-1.5 h-1.5 rounded-full',
              status === 'live' ? 'bg-black' : 'bg-gray-400'
            )} />
            {status === 'live' && (
              <span className="absolute inline-flex h-3 w-3 rounded-full bg-black/40 opacity-75 animate-ping -left-1 -top-1" />
            )}
          </span>
          {statusLabels[status]}
        </div>

        {/* Quarter / Time pill */}
        {time && (
          <div className="flex items-center gap-1 text-[11px] text-gray-300 bg-white/5 border border-white/10 px-2 py-1 rounded-full font-mono tabular-nums">
            <Clock className="w-3 h-3 opacity-70" />
            {time}
          </div>
        )}
      </div>

      {/* Primary Score */}
      <div className="flex items-baseline justify-center gap-4 md:gap-6 mb-3 select-none">
        <motion.span
          key={`away-${awayScore}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-4xl md:text-5xl font-extrabold text-white tracking-tight"
        >
          {awayScore ?? '—'}
        </motion.span>
        <span className="text-gray-500">—</span>
        <motion.span
          key={`home-${homeScore}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-4xl md:text-5xl font-extrabold text-white tracking-tight"
        >
          {homeScore ?? '—'}
        </motion.span>
      </div>

      {/* Teams Row */}
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-bold text-gray-200">
            {awayTeam.logo ? (
              <img src={awayTeam.logo} alt={awayTeam.name} className="w-5 h-5" />
            ) : (
              <span>{awayTeam.name?.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="truncate">
            <div className="text-sm font-medium text-white truncate">{awayTeam.name}</div>
            {showTeamLabels && <div className="text-[10px] text-gray-400">Away</div>}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 min-w-0">
          <div className="truncate text-right">
            <div className="text-sm font-medium text-white truncate">{homeTeam.name}</div>
            {showTeamLabels && <div className="text-[10px] text-gray-400">Home</div>}
          </div>
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-bold text-gray-200">
            {homeTeam.logo ? (
              <img src={homeTeam.logo} alt={homeTeam.name} className="w-5 h-5" />
            ) : (
              <span>{homeTeam.name?.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Venue Footer */}
      {venue && (
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-4 pt-4 border-t border-white/10">
          <MapPin className="w-3 h-3" />
          <span>{venue}</span>
        </div>
      )}
    </motion.div>
  );
}