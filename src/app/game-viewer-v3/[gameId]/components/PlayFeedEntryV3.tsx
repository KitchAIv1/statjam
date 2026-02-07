'use client';

import Image from 'next/image';

export interface PlayerRunningStats {
  points: number;
  fgMade: number;
  fgAttempted: number;
  threeMade: number;
  threeAttempted: number;
  ftMade: number;
  ftAttempted: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
}

export interface PlayEntry {
  id: string;
  quarter?: number;
  clockMinutes?: number;
  clockSeconds?: number;
  teamId: string;
  teamName: string;
  playerName: string;
  playerPhotoUrl?: string;
  statType: string;
  modifier?: string;
  description: string;
  points?: number;
  createdAt: string;
  scoreAfter: { teamA: number; teamB: number };
  playerStats: PlayerRunningStats;
}

interface PlayFeedEntryV3Props {
  play: PlayEntry;
  isTeamA: boolean;
  isLatest: boolean;
  isDark?: boolean;
}

export function PlayFeedEntryV3({ play, isTeamA, isLatest, isDark = true }: PlayFeedEntryV3Props) {
  const formatClock = (minutes?: number, seconds?: number): string => {
    const mins = minutes ?? 0;
    const secs = seconds ?? 0;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatColor = () => {
    switch (play.statType) {
      case 'three_pointer': return { bg: 'bg-orange-500/20', text: 'text-orange-400' };
      case 'field_goal': return { bg: 'bg-green-500/20', text: 'text-green-400' };
      case 'free_throw': return { bg: 'bg-blue-500/20', text: 'text-blue-400' };
      case 'rebound': return { bg: 'bg-purple-500/20', text: 'text-purple-400' };
      case 'assist': return { bg: 'bg-cyan-500/20', text: 'text-cyan-400' };
      case 'steal': return { bg: 'bg-teal-500/20', text: 'text-teal-400' };
      case 'block': return { bg: 'bg-red-500/20', text: 'text-red-400' };
      case 'turnover': return { bg: 'bg-amber-500/20', text: 'text-amber-400' };
      case 'foul': return { bg: 'bg-yellow-500/20', text: 'text-yellow-400' };
      default: return { bg: 'bg-gray-500/20', text: 'text-gray-400' };
    }
  };

  const colors = getStatColor();

  // Format player shooting stats for display (NBA style)
  const getShootingLine = (): string | null => {
    const { playerStats: ps, statType } = play;
    if (['field_goal', 'three_pointer', 'free_throw'].includes(statType)) {
      const totalFGM = ps.fgMade + ps.threeMade;
      const totalFGA = ps.fgAttempted + ps.threeAttempted;
      return `${ps.points} PTS • ${totalFGM}-${totalFGA} FG`;
    }
    if (statType === 'rebound') return `${ps.rebounds} REB`;
    if (statType === 'assist') return `${ps.assists} AST`;
    if (statType === 'steal') return `${ps.steals} STL`;
    if (statType === 'block') return `${ps.blocks} BLK`;
    return null;
  };

  const shootingLine = getShootingLine();

  const cardBg = isDark 
    ? isLatest ? 'bg-gray-800/80' : 'bg-gray-800/40 hover:bg-gray-800/60'
    : isLatest ? 'bg-orange-100' : 'bg-white hover:bg-orange-50/50 shadow-sm border border-orange-200/50';

  return (
    <div className={`relative rounded-lg px-4 py-3 transition-all ${cardBg}`}>
      {/* Latest Badge */}
      {isLatest && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wide">Live</span>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Player Avatar - 48px */}
        <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ${isDark ? 'bg-gray-700' : 'bg-orange-100'}`}>
          {play.playerPhotoUrl ? (
            <Image src={play.playerPhotoUrl} alt={play.playerName} width={48} height={48} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-base font-bold ${isDark ? 'text-gray-400' : 'text-orange-400'}`}>
              {play.playerName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Player Name & Stat Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-orange-400 font-semibold truncate">{play.playerName}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${colors.bg} ${colors.text}`}>
              {play.description}
            </span>
          </div>
          
          {/* Player Running Stats - NBA style */}
          {shootingLine && (
            <div className={`text-sm font-medium mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {shootingLine}
            </div>
          )}
          
          {/* Team & Time */}
          <div className={`flex items-center gap-2 mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            <span className="truncate">{play.teamName}</span>
            <span>•</span>
            <span>Q{play.quarter ?? 1} {formatClock(play.clockMinutes, play.clockSeconds)}</span>
          </div>
        </div>

        {/* Score & Points */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {/* Points Badge */}
          {play.points && play.points > 0 && (
            <div className={`px-3 py-1.5 rounded-lg font-bold text-xl ${colors.bg} ${colors.text}`}>
              +{play.points}
            </div>
          )}
          
          {/* Running Score */}
          <div className={`text-sm font-mono px-2 py-1 rounded ${isDark ? 'bg-gray-900/50' : 'bg-orange-50'}`}>
            <span className={isTeamA ? 'text-orange-400 font-bold' : isDark ? 'text-gray-400' : 'text-gray-600'}>{play.scoreAfter.teamA}</span>
            <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>-</span>
            <span className={!isTeamA ? 'text-orange-400 font-bold' : isDark ? 'text-gray-400' : 'text-gray-600'}>{play.scoreAfter.teamB}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
