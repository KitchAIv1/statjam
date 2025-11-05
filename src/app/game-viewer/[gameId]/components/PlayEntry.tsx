/**
 * PlayEntry Component (MODERNIZED)
 * 
 * Individual play-by-play entry
 * Single responsibility: Display one play
 * Follows .cursorrules: <200 lines, uses reusable sub-components
 * 
 * @module PlayEntry
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PlayByPlayEntry } from '@/lib/types/playByPlay';
import { GameViewerTheme } from '../hooks/useGameViewerTheme';
import { getEnhancedPlayDescription, getScoringInfo } from '@/lib/utils/gameViewerUtils';
import { ActionIcon } from './ActionIcon';
import { PlayTimeStamp } from './PlayTimeStamp';
import { PlayerAvatarCard } from './PlayerAvatarCard';
import { PlayScoreCard } from './PlayScoreCard';
import { Heart, MessageCircle, Share2 } from 'lucide-react';

interface PlayerStats {
  fieldGoalMade: number;
  fieldGoalAttempts: number;
  threePointerMade: number;
  threePointerAttempts: number;
  freeThrowMade: number;
  freeThrowAttempts: number;
}

interface PlayEntryProps {
  play: PlayByPlayEntry;
  isLatest: boolean;
  teamAName: string;
  teamBName: string;
  theme: GameViewerTheme;
  playerStats?: PlayerStats;
  playerPoints?: number;
}

/**
 * PlayEntry - NBA-style play display
 * 
 * Features:
 * - Reusable sub-components
 * - Tailwind styling
 * - Framer Motion animations
 * - Latest play indicator
 */
const PlayEntry: React.FC<PlayEntryProps> = ({ 
  play, 
  isLatest, 
  teamAName, 
  teamBName,
  theme,
  playerStats,
  playerPoints
}) => {

  const isDark = theme === 'dark';
  const scoringInfo = getScoringInfo(play.statType, play.modifier);
  const teamName = play.teamName || 'Unknown Team';
  const isSubstitution = play.statType === 'substitution';
  const isTimeout = play.statType === 'timeout';
  const isScoring = scoringInfo !== null;

  // Determine card styling based on play type and theme
  const getCardClasses = () => {
    const darkClasses = {
      latest: 'bg-orange-500/10 border-l-4 border-l-orange-500 hover:bg-orange-500/15',
      substitution: 'bg-indigo-500/10 border-l-4 border-l-indigo-500 hover:bg-indigo-500/15',
      timeout: 'bg-yellow-500/10 border-l-4 border-l-yellow-500 hover:bg-yellow-500/15',
      default: 'bg-slate-800/50 border-l border-l-slate-700 hover:bg-slate-800/70'
    };
    
    const lightClasses = {
      latest: 'bg-orange-100 border-l-4 border-l-orange-500 hover:bg-orange-200',
      substitution: 'bg-indigo-100 border-l-4 border-l-indigo-500 hover:bg-indigo-200',
      timeout: 'bg-yellow-100 border-l-4 border-l-yellow-500 hover:bg-yellow-200',
      default: 'bg-white border-l-2 border-l-orange-300 hover:bg-orange-50 shadow-sm'
    };
    
    const classes = isDark ? darkClasses : lightClasses;
    
    if (isLatest) return classes.latest;
    if (isSubstitution) return classes.substitution;
    if (isTimeout) return classes.timeout;
    return classes.default;
  };

  return (
    <div
      key={`${play.id}-${theme}`}
      className={`
        relative p-4 rounded-lg transition-all duration-300 border-b
        ${getCardClasses()}
        ${isDark ? 'border-slate-700/50' : 'border-orange-200/50'}
      `}
    >
      {/* Time Stamp */}
      <PlayTimeStamp
        quarter={play.quarter}
        gameTimeMinutes={play.gameTimeMinutes}
        gameTimeSeconds={play.gameTimeSeconds}
        timestamp={play.timestamp}
      />

      {/* Main Content */}
      <div className="flex items-start gap-4">
        {/* Player Avatar */}
        <PlayerAvatarCard
          playerName={play.playerName || 'Unknown Player'}
          teamName={teamName}
          photoUrl={play.playerPhotoUrl}
          size="2xl"
        />

        {/* Play Details */}
        <div className="flex-1 space-y-2">
          {/* Play Description with Icon */}
          <div className="flex items-start gap-3">
            <ActionIcon type={play.statType} size="md" animate={false} />
            <div className="flex-1">
              <p className={`text-base font-bold leading-tight ${isDark ? 'text-foreground' : 'text-gray-900'}`}>
                {getEnhancedPlayDescription(play.description, play.statType, play.modifier, playerStats)}
                {typeof playerPoints === 'number' && scoringInfo && (
                  <span className="ml-2 px-2 py-0.5 bg-orange-500/20 text-orange-600 rounded text-sm font-bold">
                    ({playerPoints} PTS)
                  </span>
                )}
                {isTimeout && play.modifier && (
                  <span className="ml-2 text-xs text-yellow-600 opacity-80">
                    ({play.modifier === 'full' ? '60s' : '30s'})
                  </span>
                )}
              </p>
              
              {/* Player & Team Info */}
              <div className="flex items-center gap-3 mt-1 text-sm">
                <span className={`font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{play.playerName || 'Unknown Player'}</span>
                <span className={isDark ? 'text-muted-foreground' : 'text-gray-500'}>•</span>
                <span className={isDark ? 'text-muted-foreground' : 'text-gray-600'}>{teamName}</span>
              </div>
            </div>
          </div>

          {/* Scoring/Type Badge & Score */}
          <div className="flex items-center justify-between gap-3">
            {/* Badge */}
            {scoringInfo ? (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-md text-sm font-bold uppercase tracking-wide">
                {scoringInfo.description}
              </span>
            ) : isSubstitution ? (
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-md text-xs font-bold uppercase tracking-wide">
                SUBSTITUTION
              </span>
            ) : (
              <span className={`px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wide ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>
                {play.statType?.replace(/_/g, ' ')}
              </span>
            )}
            
            {/* Score Card */}
            <PlayScoreCard
              teamAName={teamAName}
              teamBName={teamBName}
              scoreAfter={play.scoreAfter}
              isScoring={isScoring}
              animate={false}
            />
          </div>

          {/* Reactions Row */}
          <div className={`flex items-center gap-4 text-xs ${isDark ? 'text-muted-foreground' : 'text-gray-500'}`}>
            <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
              <Heart className="w-3.5 h-3.5" /> 0
            </button>
            <button className="flex items-center gap-1 hover:text-orange-600 transition-colors">
              <MessageCircle className="w-3.5 h-3.5" /> 0
            </button>
            <button className="flex items-center gap-1 hover:text-orange-600 transition-colors">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
          </div>
        </div>
      </div>

      {/* Latest Play Indicator */}
      {isLatest && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 flex items-center gap-1.5"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-2 h-2 bg-orange-500 rounded-full"
          />
          <span className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
            Latest
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default PlayEntry;
