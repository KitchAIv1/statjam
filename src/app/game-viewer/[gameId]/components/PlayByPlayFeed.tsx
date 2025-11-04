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
import { GameViewerTheme } from '../hooks/useGameViewerTheme';
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
  theme: GameViewerTheme;
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
  theme,
  isMobile = false,
  calculatePlayerStats,
  calculatePlayerPoints
}) => {

  const isDark = theme === 'dark';

  // 🔍 DEBUG: Log what PlayByPlayFeed is receiving
  console.log('🔍 DEBUG PlayByPlayFeed: Received', playByPlay.length, 'plays');
  console.log('🔍 DEBUG PlayByPlayFeed: First 3 plays:', playByPlay.slice(0, 3).map(p => ({
    id: p.id,
    playerId: p.playerId,
    playerName: p.playerName,
    description: p.description
  })));

  // Empty state
  if (playByPlay.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 px-6 text-center"
      >
        <div className={`w-20 h-20 mb-6 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-orange-100'}`}>
          <span className="text-4xl">🏀</span>
        </div>
        <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-foreground' : 'text-gray-900'}`}>
          {isLive ? 'Game Starting Soon' : 'No Game Activity Yet'}
        </h3>
        <p className={`text-sm max-w-md ${isDark ? 'text-muted-foreground' : 'text-gray-600'}`}>
          {isLive 
            ? 'Play-by-play will appear here once the game begins'
            : 'Stats and plays will be shown here during the game'}
        </p>
      </motion.div>
    );
  }

  return (
    <div className={`space-y-0 transition-colors duration-300 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-orange-50/30 to-background'}`}>
      {/* Feed Header */}
      <div className={`sticky top-0 z-50 border-b px-6 py-4 transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-orange-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ListVideo className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Play-by-Play</h2>
          </div>
          <div className={`flex items-center gap-3 text-sm ${isDark ? 'text-muted-foreground' : 'text-gray-600'}`}>
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
      <div className={`flex items-center gap-4 px-6 py-3 transition-colors duration-300 ${isDark ? 'bg-slate-800/50' : 'bg-orange-50'}`}>
        <div className={`flex-1 h-px ${isDark ? 'bg-gradient-to-r from-transparent via-slate-600 to-transparent' : 'bg-gradient-to-r from-transparent via-orange-300 to-transparent'}`} />
        <div className={`text-sm font-semibold ${isDark ? 'text-muted-foreground' : 'text-gray-700'}`}>
          {game.teamAName} {game.homeScore} - {game.awayScore} {game.teamBName}
        </div>
        <div className={`flex-1 h-px ${isDark ? 'bg-gradient-to-r from-transparent via-slate-600 to-transparent' : 'bg-gradient-to-r from-transparent via-orange-300 to-transparent'}`} />
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
                theme={theme}
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
    prevProps.isLive === nextProps.isLive &&
    prevProps.theme === nextProps.theme // ✅ FIX: Check theme changes
  );
});
