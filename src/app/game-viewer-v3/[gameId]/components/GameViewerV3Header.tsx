'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { Trophy } from 'lucide-react';
import { useGameViewerV3Context, GameViewerV3APIResponse } from '@/providers/GameViewerV3Provider';

/** Compute scores from stats - single source of truth */
function computeScoresFromStats(
  stats: GameViewerV3APIResponse['stats'],
  teamAId: string,
  teamBId: string
): { homeScore: number; awayScore: number } {
  let homeScore = 0;
  let awayScore = 0;

  for (const stat of stats) {
    if (stat.modifier !== 'made') continue;
    
    let points = 0;
    if (stat.stat_type === 'field_goal') points = 2;
    else if (stat.stat_type === 'three_pointer') points = 3;
    else if (stat.stat_type === 'free_throw') points = 1;
    
    if (points > 0) {
      if (stat.team_id === teamAId) homeScore += points;
      else if (stat.team_id === teamBId) awayScore += points;
    }
  }

  return { homeScore, awayScore };
}

export function GameViewerV3Header() {
  const { gameData, isDark } = useGameViewerV3Context();

  if (!gameData) return null;

  const { game, teams } = gameData;
  const teamA = teams.find((t) => t.id === game.team_a_id);
  const teamB = teams.find((t) => t.id === game.team_b_id);

  // Compute scores from stats (single source of truth) - memoized
  const { homeScore, awayScore } = useMemo(
    () => computeScoresFromStats(gameData.stats, game.team_a_id, game.team_b_id),
    [gameData.stats, game.team_a_id, game.team_b_id]
  );
  
  // Access game phase from game object
  const gameRecord = game as Record<string, unknown>;
  const gamePhase = gameRecord.game_phase as string | undefined;

  const formatClock = (minutes: number, seconds: number): string => {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isLive = game.status === 'in_progress' || game.status === 'overtime';
  const isPlayoffs = gamePhase === 'playoffs';
  const isFinals = gamePhase === 'finals';

  return (
    <header className={isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-white border-b border-orange-200 shadow-sm'}>
      {/* Finals Banner */}
      {isFinals && (
        <div className="relative w-full overflow-hidden bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 py-2 border-b border-amber-700">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
          <div className="relative z-10 max-w-6xl mx-auto px-4 flex items-center justify-center gap-2">
            <Trophy className="w-4 h-4 text-amber-900" />
            <span className="text-sm font-black text-amber-900 uppercase tracking-[0.15em]">
              Championship Game
            </span>
            {isLive && (
              <div className="flex items-center gap-1 ml-2 px-2 py-0.5 bg-amber-900/20 rounded">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                </span>
                <span className="text-[10px] font-bold text-amber-900 uppercase">Live</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Playoffs Badge */}
      {isPlayoffs && !isFinals && (
        <div className="bg-purple-600/20 border-b border-purple-500/30 py-1.5">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-2">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
              🏆 Playoffs
            </span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Team A */}
          <TeamDisplay
            name={teamA?.name || 'Team A'}
            logoUrl={teamA?.logo_url}
            score={homeScore}
            isHome
            isLeading={homeScore > awayScore}
            isWinner={game.status === 'completed' && homeScore > awayScore}
            isCompleted={game.status === 'completed'}
            isDark={isDark}
          />

          {/* Game Info (Center) */}
          <div className="flex flex-col items-center">
            {/* Status Badge */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${
              isLive 
                ? 'bg-red-500/20 text-red-400' 
                : game.status === 'completed' 
                  ? 'bg-green-500/20 text-green-400'
                  : isDark ? 'bg-gray-700 text-gray-400' : 'bg-orange-100 text-gray-600'
            }`}>
              {isLive && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
              {game.status === 'completed' ? 'Final' : isLive ? `Q${game.quarter}` : 'Scheduled'}
            </div>
            
            {/* Clock */}
            {isLive && (
              <div className={`text-3xl font-mono font-bold mt-2 ${game.is_clock_running ? 'text-green-400' : isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatClock(game.game_clock_minutes, game.game_clock_seconds)}
              </div>
            )}
            
            {isLive && (
              <div className={`text-[10px] font-semibold uppercase tracking-wide mt-1 ${game.is_clock_running ? 'text-green-400' : isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                {game.is_clock_running ? 'Running' : 'Stopped'}
              </div>
            )}
          </div>

          {/* Team B */}
          <TeamDisplay
            name={teamB?.name || 'Team B'}
            logoUrl={teamB?.logo_url}
            score={awayScore}
            isHome={false}
            isLeading={awayScore > homeScore}
            isWinner={game.status === 'completed' && awayScore > homeScore}
            isCompleted={game.status === 'completed'}
            isDark={isDark}
          />
        </div>
      </div>
    </header>
  );
}

interface TeamDisplayProps {
  name: string;
  logoUrl?: string;
  score: number;
  isHome: boolean;
  isLeading?: boolean;
  isWinner?: boolean;
  isCompleted?: boolean;
  isDark?: boolean;
}

function TeamDisplay({ name, logoUrl, score, isHome, isLeading, isWinner, isCompleted, isDark = true }: TeamDisplayProps) {
  // Determine ring color: amber for winner, orange for leading (live game), none otherwise
  const ringClass = isWinner 
    ? 'ring-2 ring-amber-400' 
    : isLeading && !isCompleted 
      ? 'ring-2 ring-orange-400' 
      : '';

  // Determine score color: amber for winner, orange for leading, default based on theme
  const scoreColorClass = isWinner 
    ? 'text-amber-400' 
    : isLeading 
      ? 'text-orange-400' 
      : isDark ? 'text-white' : 'text-gray-900';

  // Team name color
  const nameColorClass = isWinner 
    ? 'text-amber-400' 
    : isDark ? 'text-gray-300' : 'text-gray-700';

  return (
    <div className={`flex items-center gap-4 ${isHome ? 'flex-row' : 'flex-row-reverse'}`}>
      {/* Team Logo with Trophy Badge */}
      <div className="relative">
        <div className={`w-16 h-16 rounded-full overflow-hidden flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-orange-100'} ${ringClass}`}>
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${name} logo`}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className={`text-2xl font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        {/* Trophy badge for winner */}
        {isWinner && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
            <Trophy className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>

      {/* Team Name & Score */}
      <div className={`${isHome ? 'text-left' : 'text-right'}`}>
        <div className={`font-medium text-sm truncate max-w-[120px] ${nameColorClass}`}>
          {name}
        </div>
        <div className={`text-4xl font-bold ${scoreColorClass}`}>{score}</div>
        {/* Winner label */}
        {isWinner && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mt-0.5">
            Winner
          </div>
        )}
      </div>
    </div>
  );
}
