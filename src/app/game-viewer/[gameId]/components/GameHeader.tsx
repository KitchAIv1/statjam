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
import { Shield, Clock, AlertCircle } from 'lucide-react';

interface GameHeaderProps {
  theme: GameViewerTheme;
  onThemeToggle: () => void;
  game?: {
    id: string;
    teamAName: string;
    teamBName: string;
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

      {/* Main Header - Scores */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-6 max-w-7xl mx-auto">
        {/* Away Team */}
        <TeamDisplay
          teamName={game.teamBName}
          score={game.awayScore}
          isLeading={game.awayScore > game.homeScore}
          side="right"
        />

        {/* Center - Quarter & Status */}
        <div className="flex flex-col items-center gap-2 min-w-[120px] text-center">
          <div className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            {game.quarter <= 4 ? `Q${game.quarter}` : `OT${game.quarter - 4}`}
          </div>
          {game.status === 'completed' && (
            <div className="text-2xl font-extrabold text-green-500">
              FINAL
            </div>
          )}
        </div>

        {/* Home Team */}
        <TeamDisplay
          teamName={game.teamAName}
          score={game.homeScore}
          isLeading={game.homeScore > game.awayScore}
          side="left"
        />
      </div>

      {/* Stats Bar */}
      <div className={`flex flex-wrap items-center justify-center gap-6 sm:gap-8 px-5 py-4 border-t ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-orange-50/30 border-orange-200'}`}>
        <StatItem
          icon={Clock}
          label="Clock"
          value={game.isClockRunning ? 'RUNNING' : 'STOPPED'}
          color={game.isClockRunning ? 'text-green-400' : 'text-gray-400'}
          isDark={isDark}
        />
        <StatItem
          icon={AlertCircle}
          label="Fouls"
          value={`${game.teamAFouls || 0} - ${game.teamBFouls || 0}`}
          isDark={isDark}
        />
        <StatItem
          icon={Clock}
          label="Timeouts"
          value={`${game.teamATimeouts || 7} - ${game.teamBTimeouts || 7}`}
          isDark={isDark}
        />
      </div>
    </motion.div>
  );
};

/**
 * TeamDisplay - Individual team score display
 * Reusable sub-component
 */
function TeamDisplay({ 
  teamName, 
  score, 
  isLeading, 
  side 
}: { 
  teamName: string; 
  score: number; 
  isLeading: boolean; 
  side: 'left' | 'right';
}) {
  const flexDirection = side === 'left' ? 'flex-row' : 'flex-row-reverse';
  
  return (
    <div className={`flex ${flexDirection} items-center gap-4 min-w-[160px]`}>
      {/* Team Logo */}
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-orange-500/20">
        {teamName.charAt(0).toUpperCase()}
      </div>
      
      {/* Team Info */}
      <div className={`flex flex-col ${side === 'right' ? 'items-end' : 'items-start'}`}>
        <div className={`text-3xl font-extrabold ${isLeading ? 'text-foreground' : 'text-muted-foreground'}`}>
          {score}
        </div>
        <div className="text-lg font-bold text-foreground">
          {teamName}
        </div>
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
