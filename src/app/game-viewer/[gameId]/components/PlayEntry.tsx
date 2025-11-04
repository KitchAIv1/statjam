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
  playerStats,
  playerPoints
}) => {

  const scoringInfo = getScoringInfo(play.statType, play.modifier);
  const teamName = play.teamName || 'Unknown Team';
  const isSubstitution = play.statType === 'substitution';
  const isTimeout = play.statType === 'timeout';
  const isScoring = scoringInfo !== null;

  // Determine card styling based on play type
  const getCardClasses = () => {
    if (isLatest) return 'bg-blue-500/10 border-l-4 border-l-blue-500';
    if (isSubstitution) return 'bg-indigo-500/10 border-l-4 border-l-indigo-500';
    if (isTimeout) return 'bg-yellow-500/10 border-l-4 border-l-yellow-500';
    return 'bg-slate-800/50 border-l border-l-slate-700';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        relative p-4 rounded-lg
        ${getCardClasses()}
        hover:bg-slate-800/70 transition-all
        border-b border-slate-700/50
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
          size="md"
        />

        {/* Play Details */}
        <div className="flex-1 space-y-2">
          {/* Play Description with Icon */}
          <div className="flex items-start gap-3">
            <ActionIcon type={play.statType} size="md" animate={false} />
            <div className="flex-1">
              <p className="text-base font-bold text-foreground leading-tight">
                {getEnhancedPlayDescription(play.description, play.statType, play.modifier, playerStats)}
                {typeof playerPoints === 'number' && scoringInfo && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-sm font-bold">
                    ({playerPoints} PTS)
                  </span>
                )}
                {isTimeout && play.modifier && (
                  <span className="ml-2 text-xs text-yellow-400 opacity-80">
                    ({play.modifier === 'full' ? '60s' : '30s'})
                  </span>
                )}
              </p>
              
              {/* Player & Team Info */}
              <div className="flex items-center gap-3 mt-1 text-sm">
                <span className="font-semibold text-blue-400">{play.playerName || 'Unknown Player'}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{teamName}</span>
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
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-md text-xs font-semibold uppercase tracking-wide">
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
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <button className="flex items-center gap-1 hover:text-red-400 transition-colors">
              <Heart className="w-3.5 h-3.5" /> 0
            </button>
            <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
              <MessageCircle className="w-3.5 h-3.5" /> 0
            </button>
            <button className="flex items-center gap-1 hover:text-green-400 transition-colors">
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
            className="w-2 h-2 bg-blue-500 rounded-full"
          />
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">
            Latest
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PlayEntry;
