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
import { getEnhancedPlayDescription, getScoringInfo, formatShootingStats } from '@/lib/utils/gameViewerUtils';
import { ActionIcon } from './ActionIcon';
import { PlayTimeStamp } from './PlayTimeStamp';
import { PlayerAvatarCard } from './PlayerAvatarCard';
import { PlayScoreCard } from './PlayScoreCard';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { MilestoneBadge } from './MilestoneBadge';
import { detectNewMilestones, PlayerStatsForMilestone } from '@/lib/engines/milestoneEngine';
import { PlayClipButton } from './PlayClipButton';
import { GeneratedClip } from '@/lib/services/clipService';

interface PlayerStats {
  fieldGoalMade: number;
  fieldGoalAttempts: number;
  threePointerMade: number;
  threePointerAttempts: number;
  freeThrowMade: number;
  freeThrowAttempts: number;
  // ✅ Non-scoring stats
  assists: number;
  rebounds: number;
  blocks: number;
  steals: number;
  turnovers: number;
  fouls: number;
}

interface PlayEntryProps {
  play: PlayByPlayEntry;
  isLatest: boolean;
  teamAName: string;
  teamBName: string;
  theme: GameViewerTheme;
  playerStats?: PlayerStats;
  playerPoints?: number;
  /** Optional clip associated with this play (matched via stat_event_id) */
  clip?: GeneratedClip;
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
  playerPoints,
  clip
}) => {

  const isDark = theme === 'dark';
  const scoringInfo = getScoringInfo(play.statType, play.modifier);
  const teamName = play.teamName || 'Unknown Team';
  const isSubstitution = play.statType === 'substitution';
  const isTimeout = play.statType === 'timeout';
  const isScoring = scoringInfo !== null;

  // Calculate milestones achieved on this specific play
  const milestones = React.useMemo(() => {
    if (!playerStats) return [];
    
    // Calculate what the stats were BEFORE this play
    const prevStats: PlayerStatsForMilestone = {
      points: (playerPoints || 0) - (scoringInfo?.points || 0),
      rebounds: (playerStats.rebounds || 0) - (play.statType === 'rebound' ? 1 : 0),
      assists: (playerStats.assists || 0) - (play.statType === 'assist' ? 1 : 0),
      steals: (playerStats.steals || 0) - (play.statType === 'steal' ? 1 : 0),
      blocks: (playerStats.blocks || 0) - (play.statType === 'block' ? 1 : 0),
    };
    
    // Current stats (after this play)
    const currentStats: PlayerStatsForMilestone = {
      points: playerPoints || 0,
      rebounds: playerStats.rebounds || 0,
      assists: playerStats.assists || 0,
      steals: playerStats.steals || 0,
      blocks: playerStats.blocks || 0,
    };
    
    return detectNewMilestones(prevStats, currentStats, play.statType);
  }, [playerStats, playerPoints, scoringInfo, play.statType]);

  // Determine card styling based on play type and theme
  const getCardClasses = () => {
    const darkClasses = {
      latest: 'bg-orange-500/10 border-l-4 border-l-orange-500 hover:bg-orange-500/15',
      substitution: 'bg-indigo-500/10 border-l-4 border-l-indigo-500 hover:bg-indigo-500/15',
      timeout: 'bg-yellow-500/10 border-l-4 border-l-yellow-500 hover:bg-yellow-500/15',
      default: 'bg-slate-800/30 border-l border-l-slate-700 hover:bg-slate-800/40'
    };
    
    const lightClasses = {
      latest: 'bg-orange-100 border-l-4 border-l-orange-500 hover:bg-orange-200',
      substitution: 'bg-indigo-100 border-l-4 border-l-indigo-500 hover:bg-indigo-200',
      timeout: 'bg-yellow-100 border-l-4 border-l-yellow-500 hover:bg-yellow-200',
      default: 'bg-gray-50 border-l-2 border-l-gray-200 hover:bg-gray-100 shadow-sm'
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
        relative p-2 sm:p-3 rounded-lg transition-all duration-300 border-b
        ${getCardClasses()}
        ${isDark ? 'border-slate-700/50' : 'border-gray-200/50'}
      `}
    >
      {/* Time Stamp */}
      <PlayTimeStamp
        quarter={play.quarter}
        gameTimeMinutes={play.gameTimeMinutes}
        gameTimeSeconds={play.gameTimeSeconds}
        timestamp={play.timestamp}
        isLatest={isLatest}
      />

      {/* Main Content - Three-column layout: Avatar | Content | Points Badge */}
      <div className="flex items-start gap-2 sm:gap-4">
        {/* LEFT: Player Avatar - Responsive size: xl on mobile, 2xl on desktop */}
        <PlayerAvatarCard
          playerName={play.playerName || 'Unknown Player'}
          teamName={teamName}
          photoUrl={play.playerPhotoUrl}
          size="xl"
          className="sm:hidden flex-shrink-0"
          animate={false}
        />
        <PlayerAvatarCard
          playerName={play.playerName || 'Unknown Player'}
          teamName={teamName}
          photoUrl={play.playerPhotoUrl}
          size="2xl"
          className="hidden sm:flex flex-shrink-0"
          animate={false}
        />

        {/* CENTER: Play Details - Flexible content area */}
        <div className="flex-1 space-y-0.5 sm:space-y-1 min-w-0">
          {/* Play Description with Icon - Responsive gap */}
          <div className="flex items-start gap-2 sm:gap-3">
            <ActionIcon type={play.statType || 'unknown'} size="md" animate={false} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm sm:text-base font-bold leading-tight ${isDark ? 'text-foreground' : 'text-gray-900'}`}>
                {getEnhancedPlayDescription(play.description, play.statType, play.modifier, playerStats)}
                {isTimeout && play.modifier && (
                  <span className="ml-1 sm:ml-2 text-xs text-yellow-600 opacity-80">
                    ({play.modifier === 'full' ? '60s' : '30s'})
                  </span>
                )}
              </p>
              
              {/* Player & Team Info - Responsive */}
              <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm">
                <span className={`font-semibold truncate ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{play.playerName || 'Unknown Player'}</span>
                <span className={isDark ? 'text-muted-foreground' : 'text-gray-500'}>•</span>
                <span className={`truncate ${isDark ? 'text-muted-foreground' : 'text-gray-600'}`}>{teamName}</span>
              </div>

              {/* NBA-Style Shooting Stats - Show for all shooting plays (made + missed) */}
              {typeof playerPoints === 'number' && playerStats && play.statType && 
               ['field_goal', 'three_pointer', 'free_throw'].includes(play.statType) && (
                <div className={`mt-1 text-xs sm:text-sm font-semibold ${isDark ? 'text-muted-foreground' : 'text-gray-600'}`}>
                  {formatShootingStats(playerPoints, playerStats, play.statType)}
                </div>
              )}
            </div>
          </div>

          {/* Badge & Score Row - Compact inline layout */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            {/* Badge - Responsive sizing */}
            {scoringInfo ? (
              <span className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-bold uppercase tracking-wide whitespace-nowrap ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-500/30 text-green-600'}`}>
                {scoringInfo.description}
              </span>
            ) : isSubstitution ? (
              <span className={`px-2 sm:px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide whitespace-nowrap ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-500/30 text-indigo-600'}`}>
                SUBSTITUTION
              </span>
            ) : (
              <span className={`px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>
                {play.statType?.replace(/_/g, ' ')}
              </span>
            )}
            
            {/* Score Card - Inline */}
            <PlayScoreCard
              teamAName={teamAName}
              teamBName={teamBName}
              scoreAfter={play.scoreAfter}
              isScoring={isScoring}
              animate={false}
            />
          </div>

          {/* Reactions Row - Responsive */}
          <div className={`flex items-center gap-3 sm:gap-4 text-xs ${isDark ? 'text-muted-foreground' : 'text-gray-500'}`}>
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

        {/* RIGHT: Indicator Text + Milestone - Stacked vertically */}
        <div className="flex-shrink-0 flex flex-col items-end">
          {scoringInfo ? (
            // Scoring plays: Colorful points text
            <div className="flex flex-col items-end">
              <div className={`text-2xl sm:text-3xl font-extrabold leading-none
                ${play.statType === 'three_pointer' 
                  ? 'text-orange-600' 
                  : play.statType === 'field_goal'
                  ? 'text-green-600'
                  : 'text-blue-600'}
              `}>
                +{scoringInfo.points}
              </div>
              <div className={`text-[10px] sm:text-xs font-bold uppercase tracking-tight
                ${play.statType === 'three_pointer' 
                  ? 'text-orange-500' 
                  : play.statType === 'field_goal'
                  ? 'text-green-500'
                  : 'text-blue-500'}
              `}>
                {scoringInfo.points === 1 ? 'PT' : 'PTS'}
              </div>
            </div>
          ) : (play.statType === 'field_goal' || play.statType === 'three_pointer' || play.statType === 'free_throw') && play.modifier !== 'made' ? (
            // Missed shots: Gray text
            <div className={`text-sm sm:text-base font-bold uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              MISS
            </div>
          ) : play.statType === 'rebound' ? (
            // Rebounds: Orange (offensive) or Blue (defensive) with running total - POSITIVE STAT (larger)
            (() => {
              const modifier = play.modifier?.toString().toLowerCase().trim();
              const isOffensive = modifier === 'offensive';
              const displayType = isOffensive ? 'offensive' : 'defensive';
              const reboundTotal = playerStats?.rebounds || 0;
              
              return (
                <div className="flex flex-col items-end">
                  <div className={`text-2xl sm:text-3xl font-extrabold leading-none
                    ${displayType === 'offensive' ? 'text-orange-600' : 'text-blue-600'}
                  `}>
                    {reboundTotal}
                  </div>
                  <div className={`text-xs sm:text-sm font-bold uppercase tracking-tight
                    ${displayType === 'offensive' ? 'text-orange-500' : 'text-blue-500'}
                  `}>
                    REB
                  </div>
                  <div className={`text-[9px] sm:text-xs font-semibold uppercase
                    ${displayType === 'offensive' ? 'text-orange-400' : 'text-blue-400'}
                  `}>
                    {displayType === 'offensive' ? 'OFF' : 'DEF'}
                  </div>
                </div>
              );
            })()
          ) : play.statType === 'assist' ? (
            // Assists: Purple text with running total - POSITIVE STAT (larger)
            <div className="flex flex-col items-end">
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 leading-none">
                {playerStats?.assists || 0}
              </div>
              <div className="text-xs sm:text-sm font-bold uppercase tracking-tight text-purple-500">
                AST
              </div>
            </div>
          ) : play.statType === 'block' ? (
            // Blocks: Red text with running total - POSITIVE STAT (larger)
            <div className="flex flex-col items-end">
              <div className="text-2xl sm:text-3xl font-extrabold text-red-600 leading-none">
                {playerStats?.blocks || 0}
              </div>
              <div className="text-xs sm:text-sm font-bold uppercase tracking-tight text-red-500">
                BLK
              </div>
            </div>
          ) : play.statType === 'steal' ? (
            // Steals: Teal text with running total - POSITIVE STAT (larger)
            <div className="flex flex-col items-end">
              <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 leading-none">
                {playerStats?.steals || 0}
              </div>
              <div className="text-xs sm:text-sm font-bold uppercase tracking-tight text-teal-500">
                STL
              </div>
            </div>
          ) : play.statType === 'turnover' ? (
            // Turnovers: Amber text with running total - NEGATIVE STAT (smaller)
            <div className="flex flex-col items-end">
              <div className="text-lg sm:text-xl font-bold text-amber-600 leading-none">
                {playerStats?.turnovers || 0}
              </div>
              <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-tight text-amber-500">
                TO
              </div>
            </div>
          ) : play.statType === 'foul' ? (
            // Fouls: Yellow text with running total - NEGATIVE STAT (smaller)
            <div className="flex flex-col items-end">
              <div className={`text-lg sm:text-xl font-bold leading-none ${isDark ? 'text-yellow-500' : 'text-yellow-600'}`}>
                {playerStats?.fouls || 0}
              </div>
              <div className={`text-[10px] sm:text-xs font-semibold uppercase tracking-tight ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`}>
                FOUL
              </div>
            </div>
          ) : null}
          
          {/* Milestone Badge - Below stat indicator */}
          {milestones.length > 0 && (
            <div className="mt-1">
              <MilestoneBadge milestones={milestones} isDark={isDark} />
            </div>
          )}
          {/* Clip Button - Below stat/milestone, aligned right */}
          {clip && (
            <div className="mt-1">
              <PlayClipButton clip={clip} playerName={play.playerName} isDark={isDark} />
            </div>
          )}
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
