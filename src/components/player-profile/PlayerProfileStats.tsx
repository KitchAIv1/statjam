"use client";

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Trophy } from 'lucide-react';
import type { TournamentStat } from '@/lib/services/publicPlayerProfileService';

interface PlayerProfileStatsProps {
  careerStats?: { ppg: number; rpg: number; apg: number; fgPct: number; threePct: number; ftPct: number; mpg: number };
  gamesPlayed?: number;
  tournamentStats?: TournamentStat[];
  variant?: 'light' | 'dark';
  initialTournament?: string;
  onTournamentChange?: (tournamentName: string) => void;
}

/**
 * PlayerProfileStats - Career and tournament stats display
 * Supports light (cream) and dark variants
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function PlayerProfileStats({
  careerStats, gamesPlayed, tournamentStats, variant = 'light', initialTournament, onTournamentChange
}: PlayerProfileStatsProps) {
  const defaultTournament = initialTournament && tournamentStats?.find(t => t.tournamentName === initialTournament)
    ? initialTournament : tournamentStats?.[0]?.tournamentName || '';
  const [selectedTournament, setSelectedTournament] = useState<string>(defaultTournament);
  
  useEffect(() => {
    if (defaultTournament && onTournamentChange) onTournamentChange(defaultTournament);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  const handleTournamentChange = (name: string) => { setSelectedTournament(name); onTournamentChange?.(name); };
  const isDark = variant === 'dark';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-500';
  const textMuted = isDark ? 'text-gray-500' : 'text-gray-400';

  // Tournament stats view
  if (tournamentStats && tournamentStats.length > 0) {
    const current = tournamentStats.find(t => t.tournamentName === selectedTournament) || tournamentStats[0];
    return (
      <div>
        {/* Tournament Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className={`text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Tournament Stats</h2>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-white/20">
              {current.tournamentLogo ? <AvatarImage src={current.tournamentLogo} alt={current.tournamentName} className="object-contain" /> : null}
              <AvatarFallback className="bg-white/10"><Trophy className="h-5 w-5 text-white/50" /></AvatarFallback>
            </Avatar>
            {tournamentStats.length > 1 ? (
              <Select value={selectedTournament} onValueChange={handleTournamentChange}>
                <SelectTrigger className={`w-full sm:w-64 ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-200'}`}>
                  <SelectValue placeholder="Select tournament" />
                </SelectTrigger>
                <SelectContent>
                  {tournamentStats.map(t => <SelectItem key={t.tournamentName} value={t.tournamentName}>{t.tournamentName}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <span className={`text-sm font-semibold ${textPrimary}`}>{current.tournamentName}</span>
            )}
          </div>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-4 sm:gap-2">
          <StatCell value={current.ppg.toFixed(1)} label="PPG" isDark={isDark} />
          <StatCell value={current.rpg.toFixed(1)} label="RPG" isDark={isDark} />
          <StatCell value={current.apg.toFixed(1)} label="APG" isDark={isDark} />
          <StatCell value={current.spg.toFixed(1)} label="SPG" isDark={isDark} />
          <StatCell value={current.bpg.toFixed(1)} label="BPG" isDark={isDark} />
          <StatCell value={current.topg.toFixed(1)} label="TOV" isDark={isDark} />
          <StatCell value={`${current.fgPct.toFixed(0)}%`} label={`FG (${current.fgm}-${current.fga})`} isDark={isDark} small />
          <StatCell value={`${current.threePct.toFixed(0)}%`} label={`3P (${current.tpm}-${current.tpa})`} isDark={isDark} small />
          <StatCell value={`${current.ftPct.toFixed(0)}%`} label={`FT (${current.ftm}-${current.fta})`} isDark={isDark} small />
          <StatCell value={current.mpg.toFixed(1)} label="MPG" isDark={isDark} />
        </div>
        <p className={`text-sm mt-4 ${textMuted}`}>{current.gamesPlayed} game{current.gamesPlayed !== 1 ? 's' : ''} played</p>
      </div>
    );
  }

  // Career stats view (ESPN-style container)
  if (!careerStats) return null;
  return (
    <section className="py-8">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-[#FF6B35] px-4 py-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white">Career Stats</h2>
        </div>
        <div className="bg-white px-4 py-4">
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 text-center">
            <ESPNCell value={careerStats.ppg.toFixed(1)} label="PTS" />
            <ESPNCell value={careerStats.rpg.toFixed(1)} label="REB" />
            <ESPNCell value={careerStats.apg.toFixed(1)} label="AST" />
            <ESPNCell value={`${careerStats.fgPct.toFixed(1)}%`} label="FG%" />
            <ESPNCell value={`${careerStats.threePct.toFixed(1)}%`} label="3P%" className="hidden sm:block" />
            <ESPNCell value={`${careerStats.ftPct.toFixed(1)}%`} label="FT%" className="hidden sm:block" />
          </div>
          <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            {gamesPlayed !== undefined && gamesPlayed > 0 && <span>{gamesPlayed} GP</span>}
            {careerStats.mpg > 0 && <><span className="text-gray-300">|</span><span>{careerStats.mpg.toFixed(1)} MPG</span></>}
          </div>
        </div>
      </div>
    </section>
  );
}

// Helper: ESPN-style stat cell
function ESPNCell({ value, label, className = '' }: { value: string; label: string; className?: string }) {
  return (
    <div className={className}>
      <div className="text-xl sm:text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

// Helper: Tournament stat cell
function StatCell({ value, label, isDark, small }: { value: string; label: string; isDark: boolean; small?: boolean }) {
  return (
    <div className="text-center">
      <div className={`${small ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'} font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</div>
      <div className={`${small ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs'} uppercase tracking-wider mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</div>
    </div>
  );
}
