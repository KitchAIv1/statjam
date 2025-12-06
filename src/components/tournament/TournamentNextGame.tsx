"use client";

import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Shield, Clock, Trophy, Calendar, Zap } from 'lucide-react';
import { useNextTournamentGame, TournamentGameState } from '@/hooks/useNextTournamentGame';

interface TournamentNextGameProps {
  tournamentId: string;
  tournamentStartDate?: string | null;
  tournamentEndDate?: string | null;
  tournamentStatus?: string;
  onLiveClick?: () => void;
  className?: string;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateCountdown(targetDate: Date): CountdownTime {
  const now = new Date().getTime();
  const target = targetDate.getTime();
  const diff = Math.max(0, target - now);

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000)
  };
}

function CountdownDisplay({ targetDate }: { targetDate: Date }) {
  const [countdown, setCountdown] = useState<CountdownTime>(() => calculateCountdown(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(calculateCountdown(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  // Compact format based on time remaining
  if (countdown.days > 0) {
    return (
      <div className="flex items-center gap-1 text-xs text-white/80">
        <span className="font-bold text-white">{countdown.days}d</span>
        <span className="font-bold text-white">{countdown.hours}h</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 font-mono text-sm text-white">
      <span className="bg-white/10 rounded px-1.5 py-0.5">{String(countdown.hours).padStart(2, '0')}</span>
      <span className="text-white/50">:</span>
      <span className="bg-white/10 rounded px-1.5 py-0.5">{String(countdown.minutes).padStart(2, '0')}</span>
      <span className="text-white/50">:</span>
      <span className="bg-white/10 rounded px-1.5 py-0.5">{String(countdown.seconds).padStart(2, '0')}</span>
    </div>
  );
}

function TeamLogo({ logo, name }: { logo?: string; name: string }) {
  return (
    <Avatar className="h-8 w-8 border border-white/20">
      {logo ? (
        <AvatarImage src={logo} alt={name} className="object-cover" />
      ) : null}
      <AvatarFallback className="bg-white/10 text-[10px] text-white">
        <Shield className="h-3 w-3" />
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * TournamentNextGame - Reusable next game countdown component
 * 
 * States:
 * - next_game: Shows team logos + countdown
 * - live_now: Pulsing live indicator with game count
 * - starts_soon: Tournament start countdown
 * - completed: Tournament complete message
 * - no_schedule: Schedule coming soon
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function TournamentNextGame({
  tournamentId,
  tournamentStartDate,
  tournamentEndDate,
  tournamentStatus,
  onLiveClick,
  className = ''
}: TournamentNextGameProps) {
  const { state, loading } = useNextTournamentGame(tournamentId, {
    tournamentStartDate,
    tournamentEndDate,
    tournamentStatus
  });

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-16 rounded-lg bg-white/5" />
      </div>
    );
  }

  return (
    <div className={className}>
      {state.type === 'live_now' && (
        <button
          onClick={onLiveClick}
          className="w-full flex items-center justify-between p-3 rounded-lg bg-[#FF3B30]/10 border border-[#FF3B30]/30 hover:bg-[#FF3B30]/20 transition-colors group"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF3B30] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF3B30]" />
            </span>
            <span className="text-sm font-semibold text-[#FF3B30]">LIVE NOW</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-[#FF3B30]" />
            <span className="text-lg font-bold text-white">{state.count}</span>
            <span className="text-xs text-white/60">game{state.count > 1 ? 's' : ''}</span>
          </div>
        </button>
      )}

      {state.type === 'next_game' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-white/50">
              <Clock className="h-3 w-3" />
              <span>Next Game</span>
            </div>
            <CountdownDisplay targetDate={state.data.startTime} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TeamLogo logo={state.data.teamA.logo} name={state.data.teamA.name} />
              <span className="text-xs font-medium text-white truncate max-w-[60px]">
                {state.data.teamA.name}
              </span>
            </div>
            <span className="text-xs font-bold text-white/40">VS</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white truncate max-w-[60px] text-right">
                {state.data.teamB.name}
              </span>
              <TeamLogo logo={state.data.teamB.logo} name={state.data.teamB.name} />
            </div>
          </div>
        </div>
      )}

      {state.type === 'starts_soon' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-white/50" />
            <span className="text-xs text-white/70">Tournament Starts</span>
          </div>
          <CountdownDisplay targetDate={state.startDate} />
        </div>
      )}

      {state.type === 'completed' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">Tournament Complete</span>
          </div>
          {state.champion && (
            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              {state.championLogo && (
                <Avatar className="h-8 w-8 border border-amber-500/30">
                  <AvatarImage src={state.championLogo} alt={state.champion} className="object-cover" />
                  <AvatarFallback className="bg-amber-500/20 text-[8px] text-amber-400">
                    <Shield className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                <div className="text-[10px] uppercase tracking-wide text-amber-400/70">Champion</div>
                <div className="text-sm font-bold text-white">{state.champion}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {state.type === 'no_schedule' && (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-white/40" />
          <span className="text-xs text-white/50">Schedule Coming Soon</span>
        </div>
      )}
    </div>
  );
}

