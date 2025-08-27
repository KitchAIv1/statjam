'use client';

import React from 'react';
import { PlayByPlayEntry } from '@/lib/types/playByPlay';
import PlayEntry from './PlayEntry';
import { figmaColors, figmaTypography, figmaSpacing, figmaRadius } from '@/lib/design/figmaTokens';

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
 * NBA-Style Play-by-Play Feed Component
 * 
 * Live feed showing real-time game actions.
 * Matches NBA.com play-by-play design with premium styling.
 */
const PlayByPlayFeed: React.FC<PlayByPlayFeedProps> = ({ 
  playByPlay, 
  game, 
  isLive,
  isMobile = false,
  calculatePlayerStats,
  calculatePlayerPoints
}) => {

  // Reduced logging for performance
  if (process.env.NODE_ENV !== 'production') {
    console.log('🎮 PlayByPlayFeed: Updated', playByPlay.length, 'plays, scores:', `${game.homeScore}-${game.awayScore}`);
  }



  if (playByPlay.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🏀</div>
          <div style={styles.emptyTitle}>
            {isLive ? 'Game Starting Soon' : 'No Game Activity Yet'}
          </div>
          <div style={styles.emptySubtitle}>
            {isLive 
              ? 'Play-by-play will appear here once the game begins'
              : 'Stats and plays will be shown here during the game'
            }
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Feed Header */}
      <div style={styles.feedHeader}>
        <div style={styles.feedTitle}>Play-by-Play</div>
        <div style={styles.feedSubtitle}>
          {playByPlay.length} {playByPlay.length === 1 ? 'play' : 'plays'}
          {isLive && (
            <span style={styles.liveIndicator}>
              <span style={styles.liveDot} />
              LIVE
            </span>
          )}
        </div>
      </div>

      {/* Quarter Separator */}
      <div style={styles.quarterSeparator}>
        <div style={styles.quarterLine} />
        <div style={styles.quarterLabel}>
          Current Score: {game.teamAName} {game.homeScore} - {game.awayScore} {game.teamBName}
        </div>
        <div style={styles.quarterLine} />
      </div>

      {/* Play Entries */}
      <div style={styles.feedContainer}>
        {playByPlay.map((play, index) => {
          // Calculate player stats up to this point in the game (if function provided)
          const playerStats = calculatePlayerStats ? calculatePlayerStats(index, play.playerId) : undefined;
          const playerPoints = calculatePlayerPoints ? calculatePlayerPoints(index, play.playerId) : undefined;
          
          return (
            <PlayEntry
              key={play.id}
              play={play}
              isLatest={index === 0}
              teamAName={game.teamAName}
              teamBName={game.teamBName}
              playerStats={playerStats}
              playerPoints={playerPoints}
            />
          );
        })}
      </div>

      {/* Load More Placeholder */}
      {playByPlay.length > 10 && (
        <div style={styles.loadMore}>
          <button style={styles.loadMoreButton}>
            Load Earlier Plays
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: figmaColors.primary,
    minHeight: '60vh',
    color: figmaColors.text.primary,
    fontFamily: figmaTypography.fontFamily.primary,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${figmaSpacing[8]} ${figmaSpacing[4]}`,
    textAlign: 'center' as const
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: figmaSpacing[3],
    opacity: 0.5
  },
  emptyTitle: {
    fontSize: figmaTypography.fontSize.xl,
    fontWeight: figmaTypography.fontWeight.bold,
    color: figmaColors.text.primary,
    marginBottom: figmaSpacing[2]
  },
  emptySubtitle: {
    fontSize: figmaTypography.fontSize.sm,
    color: figmaColors.text.muted,
    lineHeight: figmaTypography.lineHeight.relaxed,
    maxWidth: '420px'
  },
  feedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${figmaSpacing[5]} ${figmaSpacing[4]} ${figmaSpacing[3]}`,
    borderBottom: `1px solid ${figmaColors.border.primary}`,
    backgroundColor: figmaColors.secondary
  },
  feedTitle: {
    fontSize: figmaTypography.fontSize.lg,
    fontWeight: figmaTypography.fontWeight.bold,
    color: figmaColors.text.primary
  },
  feedSubtitle: {
    display: 'flex',
    alignItems: 'center',
    gap: figmaSpacing[3],
    fontSize: figmaTypography.fontSize.sm,
    color: figmaColors.text.muted
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: figmaSpacing[1],
    fontSize: figmaTypography.fontSize.xs,
    fontWeight: figmaTypography.fontWeight.bold,
    color: figmaColors.status.live
  },
  liveDot: {
    width: '6px',
    height: '6px',
    background: figmaColors.status.live,
    borderRadius: figmaRadius.full,
    animation: 'pulse 2s infinite'
  },
  quarterSeparator: {
    display: 'flex',
    alignItems: 'center',
    padding: `${figmaSpacing[4]} ${figmaSpacing[4]}`,
    gap: figmaSpacing[4],
    background: 'rgba(96, 165, 250, 0.08)'
  },
  quarterLine: {
    flex: 1,
    height: '1px',
    background: figmaColors.accent.blue,
    opacity: 0.3
  },
  quarterLabel: {
    fontSize: figmaTypography.fontSize.sm,
    fontWeight: figmaTypography.fontWeight.semibold,
    color: figmaColors.accent.blueLight,
    whiteSpace: 'nowrap' as const
  },
  feedContainer: {
    display: 'flex',
    flexDirection: 'column' as const
  },
  loadMore: {
    padding: `${figmaSpacing[5]} ${figmaSpacing[4]}`,
    textAlign: 'center' as const
  },
  loadMoreButton: {
    background: 'transparent',
    border: `1px solid ${figmaColors.accent.blue}`,
    color: figmaColors.accent.blue,
    padding: `${figmaSpacing[3]} ${figmaSpacing[4]}`,
    borderRadius: figmaRadius.md,
    fontSize: figmaTypography.fontSize.sm,
    fontWeight: figmaTypography.fontWeight.semibold,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};

export default PlayByPlayFeed;