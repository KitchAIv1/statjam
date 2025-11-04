/**
 * PlayByPlayFeed Component (MODERNIZED)
 * 
 * Live play-by-play feed display
 * Single responsibility: List all plays
 * Follows .cursorrules: <200 lines
 * 
 * @module PlayByPlayFeed
 */

'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { PlayByPlayEntry } from '@/lib/types/playByPlay';
import PlayEntry from './PlayEntry';
import { ListVideo, Radio } from 'lucide-react';

interface PlayerStats {
  fieldGoalMade: number;
  fieldGoalAttempts: number;
  threePointerMade: number;
  threePointerAttempts: number;
  freeThrowMade: number;
  freeThrowAttempts: number;
}

interface PlayByPlayFeedProps {
  playByPlay: PlayByPlayEntry[];
  game: {
    teamAName: string;
    teamBName: string;
    homeScore: number;
    awayScore: number;
  };
  isLive: boolean;
  isMobile?: boolean;
  calculatePlayerStats?: (currentPlayIndex: number, playerId?: string) => PlayerStats | undefined;
  calculatePlayerPoints?: (currentPlayIndex: number, playerId?: string) => number | undefined;
}

/**
 * PlayByPlayFeed - Live game feed
 * 
 * Features:
 * - Stagger animations
 * - Empty state
 * - Live indicator
 * - Responsive
 * 
 * Optimized with React.memo
 */
const PlayByPlayFeed: React.FC<PlayByPlayFeedProps> = ({ 
  playByPlay, 
  game, 
  isLive,
  isMobile = false,
  calculatePlayerStats,
  calculatePlayerPoints
}) => {

  // Empty state
  if (playByPlay.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 px-6 text-center"
      >
        <div className="w-20 h-20 mb-6 bg-slate-800 rounded-full flex items-center justify-center">
          <span className="text-4xl">🏀</span>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          {isLive ? 'Game Starting Soon' : 'No Game Activity Yet'}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {isLive 
            ? 'Play-by-play will appear here once the game begins'
            : 'Stats and plays will be shown here during the game'}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-0 bg-slate-900">
      {/* Feed Header */}
      <div className="sticky top-0 z-50 bg-slate-900 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ListVideo className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-foreground">Play-by-Play</h2>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{playByPlay.length} {playByPlay.length === 1 ? 'play' : 'plays'}</span>
            {isLive && (
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold uppercase tracking-wider"
              >
                <Radio className="w-3 h-3 animate-pulse" />
                LIVE
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Score Separator */}
      <div className="flex items-center gap-4 px-6 py-3 bg-slate-800/50">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
        <div className="text-sm font-semibold text-muted-foreground">
          {game.teamAName} {game.homeScore} - {game.awayScore} {game.teamBName}
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
      </div>

      {/* Play Entries with Stagger Animation */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.05
            }
          }
        }}
        className="space-y-0"
      >
        {playByPlay.map((play, index) => {
          const isLatest = index === 0;
          const playerStats = calculatePlayerStats?.(index, play.playerId);
          const playerPoints = calculatePlayerPoints?.(index, play.playerId);
          
          return (
            <motion.div
              key={play.id || `play-${index}`}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <PlayEntry
                play={play}
                isLatest={isLatest}
                teamAName={game.teamAName}
                teamBName={game.teamBName}
                playerStats={playerStats}
                playerPoints={playerPoints}
              />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

/**
 * Memoization: Only re-render if props change
 */
export default memo(PlayByPlayFeed, (prevProps, nextProps) => {
  return (
    prevProps.playByPlay.length === nextProps.playByPlay.length &&
    prevProps.game.homeScore === nextProps.game.homeScore &&
    prevProps.game.awayScore === nextProps.game.awayScore &&
    prevProps.isLive === nextProps.isLive
  );
});
