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
import { Shield, Clock, AlertCircle } from 'lucide-react';

interface GameHeaderProps {
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
const GameHeader: React.FC<GameHeaderProps> = ({ game, isLive, isMobile = false }) => {
  
  if (!game) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-100 bg-slate-900 border-b border-slate-700 shadow-xl"
    >
      {/* Status Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700">
        <StatusBadge
          status={game.status}
          isLive={isLive}
          size="md"
        />
        <span className="text-xs text-muted-foreground">
          {formatGameDate(game.startTime)}
        </span>
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
          <div className="text-xl font-bold text-blue-400">
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
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 px-5 py-4 bg-slate-800 border-t border-slate-700">
        <StatItem
          icon={Clock}
          label="Clock"
          value={game.isClockRunning ? 'RUNNING' : 'STOPPED'}
          color={game.isClockRunning ? 'text-green-400' : 'text-gray-400'}
        />
        <StatItem
          icon={AlertCircle}
          label="Fouls"
          value={`${game.teamAFouls || 0} - ${game.teamBFouls || 0}`}
        />
        <StatItem
          icon={Clock}
          label="Timeouts"
          value={`${game.teamATimeouts || 7} - ${game.teamBTimeouts || 7}`}
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
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
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
  color = 'text-foreground' 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string; 
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}:
      </span>
      <span className={`text-sm font-semibold ${color}`}>
        {value}
      </span>
    </div>
  );
}

export default GameHeader;
