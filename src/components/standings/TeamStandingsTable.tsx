// ============================================================================
// TEAM STANDINGS TABLE - Reusable (<150 lines)
// Purpose: Display team record/standings - works for Seasons AND Tournaments
// Follows .cursorrules: Single responsibility, reusable, <200 lines
// ============================================================================

'use client';

import React from 'react';
import { StandingsRecord, formatWinPct, formatPointDiff } from '@/hooks/useStandings';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TeamStandingsTableProps {
  teamName: string;
  teamLogo?: string;
  standings: StandingsRecord;
  primaryColor?: string;
  variant?: 'full' | 'compact';
  className?: string;
}

export function TeamStandingsTable({
  teamName,
  teamLogo,
  standings,
  primaryColor = '#FF6B00',
  variant = 'full',
  className,
}: TeamStandingsTableProps) {
  const { wins, losses, winPct, pointsFor, pointsAgainst, pointDiff, streak, last5 } = standings;
  const totalGames = wins + losses;

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3 p-3 rounded-lg bg-gray-50', className)}>
        {teamLogo && (
          <img src={teamLogo} alt={teamName} className="w-10 h-10 rounded-full object-cover" />
        )}
        <div className="flex-1">
          <p className="font-semibold text-sm">{teamName}</p>
          <p className="text-xs text-gray-500">{wins}-{losses} ({formatWinPct(winPct)})</p>
        </div>
        <div className="text-right">
          <p className={cn('text-sm font-bold', pointDiff >= 0 ? 'text-green-600' : 'text-red-600')}>
            {formatPointDiff(pointDiff)}
          </p>
          <p className="text-[10px] text-gray-400 uppercase">Point Diff</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl overflow-hidden border border-gray-200', className)}>
      {/* Header with team info */}
      <div 
        className="px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: primaryColor }}
      >
        {teamLogo && (
          <img src={teamLogo} alt={teamName} className="w-12 h-12 rounded-full object-cover border-2 border-white/30" />
        )}
        <div className="text-white">
          <h3 className="font-bold text-lg">{teamName}</h3>
          <p className="text-sm opacity-90">{wins}-{losses} • {formatWinPct(winPct)}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 divide-x divide-gray-100 bg-white">
        <StatCell label="W" value={wins} />
        <StatCell label="L" value={losses} />
        <StatCell label="PCT" value={formatWinPct(winPct)} />
        <StatCell 
          label="DIFF" 
          value={formatPointDiff(pointDiff)} 
          positive={pointDiff >= 0}
        />
      </div>

      {/* Points section */}
      <div className="grid grid-cols-2 divide-x divide-gray-100 bg-gray-50 border-t border-gray-100">
        <div className="px-4 py-2 text-center">
          <p className="text-xs text-gray-500 uppercase">Points For</p>
          <p className="font-semibold">{pointsFor}</p>
          <p className="text-[10px] text-gray-400">{totalGames > 0 ? (pointsFor / totalGames).toFixed(1) : 0} PPG</p>
        </div>
        <div className="px-4 py-2 text-center">
          <p className="text-xs text-gray-500 uppercase">Points Against</p>
          <p className="font-semibold">{pointsAgainst}</p>
          <p className="text-[10px] text-gray-400">{totalGames > 0 ? (pointsAgainst / totalGames).toFixed(1) : 0} PPG</p>
        </div>
      </div>

      {/* Streak & Last 5 */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">STREAK</span>
          <StreakBadge streak={streak} />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-2">L5</span>
          {last5.map((result, i) => (
            <span
              key={i}
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white',
                result === 'W' ? 'bg-green-500' : 'bg-red-500'
              )}
            >
              {result}
            </span>
          ))}
          {last5.length === 0 && <span className="text-xs text-gray-400">-</span>}
        </div>
      </div>
    </div>
  );
}

// Sub-components
function StatCell({ label, value, positive }: { label: string; value: string | number; positive?: boolean }) {
  return (
    <div className="px-3 py-2 text-center">
      <p className="text-[10px] text-gray-500 uppercase">{label}</p>
      <p className={cn('font-bold text-lg', positive !== undefined && (positive ? 'text-green-600' : 'text-red-600'))}>
        {value}
      </p>
    </div>
  );
}

function StreakBadge({ streak }: { streak: string }) {
  if (!streak || streak === '-') {
    return <Minus className="w-4 h-4 text-gray-400" />;
  }
  const isWin = streak.startsWith('W');
  return (
    <span className={cn(
      'px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1',
      isWin ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    )}>
      {isWin ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {streak}
    </span>
  );
}

