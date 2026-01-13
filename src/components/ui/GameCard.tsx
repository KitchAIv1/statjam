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

  // --- Mock team logo generator (SVG) ---
  const palettes: Array<[string, string]> = [
    ['#1E90FF', '#0047AB'], // blue
    ['#FF3B30', '#B00020'], // red
    ['#34C759', '#0B8F2F'], // green
    ['#A78BFA', '#5B21B6'], // purple
    ['#F59E0B', '#B45309'], // amber
    ['#60A5FA', '#1D4ED8'], // light blue
  ];

  const pickPalette = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    return palettes[hash % palettes.length];
  };

  const initialsOf = (name: string) => {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const second = parts.length > 1 ? parts[1]?.[0] || '' : '';
    return (first + second).toUpperCase();
  };

  const TeamLogo: React.FC<{ name: string; logoUrl?: string; align?: 'left' | 'right'; size?: number }> = ({ name, logoUrl, align = 'left', size = 34 }) => {
    if (logoUrl) {
      return (
        <div className={`rounded-full border border-white/15 bg-white/5 flex items-center justify-center ${align === 'left' ? 'mr-2' : 'ml-2'}`} style={{ width: size, height: size }}>
          <img src={logoUrl} alt={`${name} logo`} className="w-[70%] h-[70%] object-contain" loading="eager" fetchPriority="high" />
        </div>
      );
    }
    const [c1, c2] = pickPalette(name);
    const id = `g-${name.replace(/\s+/g, '-')}`;
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" className={`${align === 'left' ? 'mr-2' : 'ml-2'}`} aria-hidden>
        <defs>
          <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="22" fill={`url(#${id}-grad)`} stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
        <circle cx="24" cy="24" r="23" fill="none" stroke="rgba(255,255,0,0.25)" strokeWidth="1" />
        <text x="24" y="28" textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff" style={{ letterSpacing: '1px' }}>{initialsOf(name)}</text>
      </svg>
    );
  };
  
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
      <div className="flex items-baseline justify-center gap-3 md:gap-4 mb-2 select-none">
        <motion.span
          key={`away-${awayScore}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-3xl md:text-4xl font-extrabold text-white tracking-tight"
        >
          {awayScore ?? '—'}
        </motion.span>
        <span className="text-gray-500">—</span>
        <motion.span
          key={`home-${homeScore}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-3xl md:text-4xl font-extrabold text-white tracking-tight"
        >
          {homeScore ?? '—'}
        </motion.span>
      </div>

      {/* Teams Row with logos above names */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <TeamLogo name={awayTeam.name} logoUrl={awayTeam.logo} align="left" />
          <div className="truncate">
            <div className="text-[13px] font-medium text-white truncate">{awayTeam.name}</div>
            {showTeamLabels && <div className="text-[9px] text-gray-400">Away</div>}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 min-w-0">
          <div className="truncate text-right">
            <div className="text-[13px] font-medium text-white truncate">{homeTeam.name}</div>
            {showTeamLabels && <div className="text-[9px] text-gray-400">Home</div>}
          </div>
          <TeamLogo name={homeTeam.name} logoUrl={homeTeam.logo} align="right" />
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