/**
 * GameHeader Component (MODERNIZED)
 * 
 * NBA-style game header with scores and status
 * Single responsibility: Display game overview
 * Follows .cursorrules: <200 lines, reusable components
 * 
 * @module GameHeader
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { formatGameDate } from '@/lib/utils/gameViewerUtils';
import { StatusBadge } from './StatusBadge';
import { ThemeToggle } from './ThemeToggle';
import { GameViewerTheme } from '../hooks/useGameViewerTheme';
import { Clock, AlertCircle, Trophy } from 'lucide-react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { PhaseBanner } from '@/components/tournament/PhaseBanner';

interface GameHeaderProps {
  theme: GameViewerTheme;
  onThemeToggle: () => void;
  game?: {
    id: string;
    teamAName: string;
    teamBName: string;
    teamALogo?: string;
    teamBLogo?: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overtime';
    startTime: string;
    quarter: number;
    gameClockMinutes: number;
    gameClockSeconds: number;
    isClockRunning: boolean;
    homeScore: number;
    awayScore: number;
    teamAFouls?: number;
    teamBFouls?: number;
    teamATimeouts?: number;
    teamBTimeouts?: number;
    gamePhase?: 'regular' | 'playoffs' | 'finals';
  };
  isLive: boolean;
  lastUpdated: string;
  isMobile?: boolean;
}

/**
 * GameHeader - Game overview with scores
 * 
 * Features:
 * - Live status badge
 * - Team scores
 * - Game stats bar
 * - Responsive layout
 */
const GameHeader: React.FC<GameHeaderProps> = ({ theme, onThemeToggle, game, isLive, isMobile = false }) => {
  
  if (!game) return null;
  const isDark = theme === 'dark';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`sticky top-0 z-100 border-b transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-700 shadow-xl' : 'bg-white border-orange-200 shadow-md'}`}
    >
      {/* Phase Banner - FINALS Championship Treatment */}
      <PhaseBanner phase={game.gamePhase} isLive={isLive} />
      
      {/* Status Bar */}
      <div className={`flex items-center justify-between px-6 py-3 border-b ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-orange-50/30 border-orange-200'}`}>
        <StatusBadge
          status={game.status}
          isLive={isLive}
          size="md"
        />
        <div className="flex items-center gap-3">
          <span className={`text-xs ${isDark ? 'text-muted-foreground' : 'text-gray-600'}`}>
            {formatGameDate(game.startTime)}
          </span>
          <ThemeToggle theme={theme} onToggle={onThemeToggle} size="sm" />
        </div>
      </div>

      {/* Main Header - Scores - Responsive padding and gaps */}
      <div className="flex items-center justify-center gap-6 sm:gap-12 px-4 sm:px-10 py-4 sm:py-6 max-w-6xl mx-auto">
        {/* Away Team */}
        <div className="flex-1 flex justify-end">
          <TeamDisplay
            teamName={game.teamBName}
            logoUrl={game.teamBLogo}
            score={game.awayScore}
            isLeading={game.awayScore > game.homeScore}
            side="right"
            isCompleted={game.status === 'completed'}
            isWinner={game.status === 'completed' && game.awayScore > game.homeScore}
          />
        </div>

        {/* Center - Game Clock, Quarter & Status - NBA-Style */}
        <div className="flex flex-col items-center gap-1.5 sm:gap-2 min-w-[80px] sm:min-w-[140px] text-center flex-shrink-0">
          {/* Game Clock - Prominent Display */}
          {game.status === 'completed' ? (
            <div className="text-lg sm:text-2xl font-extrabold text-green-500">
              FINAL
            </div>
          ) : (
            <>
              <div 
                className={`text-2xl sm:text-3xl md:text-4xl font-mono font-black tabular-nums tracking-wider ${
                  game.isClockRunning 
                    ? 'text-green-500' 
                    : 'text-red-500'
                }`}
              >
                {String(game.gameClockMinutes || 0).padStart(2, '0')}:{String(game.gameClockSeconds || 0).padStart(2, '0')}
              </div>
              {/* Quarter Badge */}
              <div className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-md text-xs sm:text-sm font-bold tracking-wider ${
                isDark 
                  ? 'bg-orange-500/20 text-orange-400' 
                  : 'bg-orange-100 text-orange-600'
              }`}>
                {game.quarter <= 4 ? `Q${game.quarter}` : `OT${game.quarter - 4}`}
              </div>
              {/* Clock Status */}
              <div className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${
                game.isClockRunning 
                  ? isDark ? 'text-green-400' : 'text-green-600'
                  : isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {game.isClockRunning ? 'RUNNING' : 'STOPPED'}
              </div>
            </>
          )}
        </div>

        {/* Home Team */}
        <div className="flex-1 flex justify-start">
          <TeamDisplay
            teamName={game.teamAName}
            logoUrl={game.teamALogo}
            score={game.homeScore}
            isLeading={game.homeScore > game.awayScore}
            side="left"
            isCompleted={game.status === 'completed'}
            isWinner={game.status === 'completed' && game.homeScore > game.awayScore}
          />
        </div>
      </div>

      {/* Stats Bar */}
      <div className={`flex flex-wrap items-center justify-center gap-6 sm:gap-8 px-5 py-4 border-t ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-orange-50/30 border-orange-200'}`}>
        <StatItem
          icon={AlertCircle}
          label="Fouls"
          value={`${game.teamAFouls || 0} - ${game.teamBFouls || 0}`}
          isDark={isDark}
        />
        <StatItem
          icon={Clock}
          label="Timeouts"
          value={`${game.teamATimeouts || 5} - ${game.teamBTimeouts || 5}`}
          isDark={isDark}
        />
      </div>
    </motion.div>
  );
};

/**
 * TeamDisplay - Individual team score display
 * Reusable sub-component
 * ✅ Updated: Winner state with gold styling
 */
function TeamDisplay({ 
  teamName, 
  logoUrl,
  score, 
  isLeading, 
  side,
  isWinner = false,
  isCompleted = false
}: { 
  teamName: string; 
  logoUrl?: string;
  score: number; 
  isLeading: boolean; 
  side: 'left' | 'right';
  isWinner?: boolean;
  isCompleted?: boolean;
}) {
  const flexDirection = side === 'left' ? 'flex-row' : 'flex-row-reverse';
  const teamInitial = teamName?.charAt(0)?.toUpperCase() || 'T';
  const hasLogo = Boolean(logoUrl);
  
  // ✅ Winner gets gold border/glow with subtle pulse animation
  const winnerBorderClass = isWinner 
    ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-background shadow-lg shadow-amber-500/30 animate-winner-glow' 
    : '';
  
  const avatarClasses = hasLogo
    ? `w-[3.75rem] h-[3.75rem] sm:w-[4.5rem] sm:h-[4.5rem] rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 border border-border/40 bg-background shadow-md ${winnerBorderClass}`
    : `w-[3.75rem] h-[3.75rem] sm:w-[4.5rem] sm:h-[4.5rem] rounded-lg bg-gradient-to-br ${isWinner ? 'from-amber-500 to-yellow-500' : 'from-orange-500 to-red-500'} flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-lg ${isWinner ? 'shadow-amber-500/30' : 'shadow-orange-500/20'} flex-shrink-0 ${winnerBorderClass}`;
  
  return (
    <div className={`flex ${flexDirection} items-center gap-2 sm:gap-4`}>
      {/* Team Logo - Responsive size */}
      <div className="relative">
        <div className={avatarClasses}>
          {hasLogo ? (
            <ImageWithFallback
              src={logoUrl!}
              alt={`${teamName} logo`}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span>{teamInitial}</span>
          )}
        </div>
        {/* Trophy badge for winner */}
        {isWinner && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
            <Trophy className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>
      
      {/* Team Info - Score above, name below, same alignment for both teams */}
      <div className="flex flex-col items-center min-w-0">
        <div className={`text-3xl sm:text-4xl font-extrabold ${
          isWinner 
            ? 'text-amber-500' 
            : isLeading 
              ? 'text-foreground' 
              : 'text-muted-foreground'
        }`}>
          {score}
        </div>
        <div className={`text-xs sm:text-sm font-bold truncate max-w-[80px] sm:max-w-[120px] ${
          isWinner ? 'text-amber-600' : 'text-foreground'
        }`}>
          {teamName}
        </div>
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

/**
 * StatItem - Individual stat display
 * Reusable sub-component
 */
function StatItem({ 
  icon: Icon, 
  label, 
  value, 
  color = 'text-foreground',
  isDark
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string; 
  color?: string;
  isDark: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${isDark ? 'text-muted-foreground' : 'text-gray-500'}`} />
      <span className={`text-xs uppercase tracking-wide ${isDark ? 'text-muted-foreground' : 'text-gray-600'}`}>
        {label}:
      </span>
      <span className={`text-sm font-semibold ${color}`}>
        {value}
      </span>
    </div>
  );
}

export default GameHeader;
