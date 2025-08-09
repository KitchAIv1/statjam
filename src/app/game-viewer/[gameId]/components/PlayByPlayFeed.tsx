'use client';

import React from 'react';
import { PlayByPlayEntry } from '@/lib/types/playByPlay';
import PlayEntry from './PlayEntry';

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
  isMobile = false 
}) => {

  console.log('🎮 PlayByPlayFeed: Received data:', {
    playByPlayCount: playByPlay.length,
    isLive,
    gameScores: `${game.homeScore}-${game.awayScore}`
  });

  /**
   * Calculate player stats up to a specific play (chronologically)
   */
  const calculatePlayerStats = (currentPlayIndex: number, playerId?: string): PlayerStats | undefined => {
    if (!playerId) return undefined;

    const stats: PlayerStats = {
      fieldGoalMade: 0,
      fieldGoalAttempts: 0,
      threePointerMade: 0,
      threePointerAttempts: 0,
      freeThrowMade: 0,
      freeThrowAttempts: 0,
    };

    // playByPlay is in reverse chronological order (newest first)
    // So we need to process from the end to the current play
    for (let i = playByPlay.length - 1; i >= currentPlayIndex; i--) {
      const play = playByPlay[i];
      
      // Only count stats for this specific player
      if (play.playerId !== playerId) continue;

      switch (play.statType) {
        case 'field_goal':
          stats.fieldGoalAttempts++;
          if (play.modifier === 'made') {
            stats.fieldGoalMade++;
          }
          break;
        case 'three_pointer':
          stats.threePointerAttempts++;
          if (play.modifier === 'made') {
            stats.threePointerMade++;
          }
          break;
        case 'free_throw':
          stats.freeThrowAttempts++;
          if (play.modifier === 'made') {
            stats.freeThrowMade++;
          }
          break;
      }
    }

    return stats;
  };

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
          // Calculate player stats up to this point in the game
          const playerStats = calculatePlayerStats(index, play.playerId);
          
          return (
            <PlayEntry
              key={play.id}
              play={play}
              isLatest={index === 0}
              teamAName={game.teamAName}
              teamBName={game.teamBName}
              playerStats={playerStats}
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
    background: '#121212',
    minHeight: '60vh'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    textAlign: 'center' as const
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '8px'
  },
  emptySubtitle: {
    fontSize: '14px',
    color: '#b3b3b3',
    lineHeight: '1.5',
    maxWidth: '400px'
  },
  feedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 20px 16px',
    borderBottom: '1px solid #333'
  },
  feedTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff'
  },
  feedSubtitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
    color: '#b3b3b3'
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#ff0000'
  },
  liveDot: {
    width: '6px',
    height: '6px',
    background: '#ff0000',
    borderRadius: '50%',
    animation: 'pulse 2s infinite'
  },
  quarterSeparator: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    gap: '16px',
    background: 'rgba(255, 215, 0, 0.05)'
  },
  quarterLine: {
    flex: 1,
    height: '1px',
    background: '#FFD700',
    opacity: 0.3
  },
  quarterLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#FFD700',
    whiteSpace: 'nowrap' as const
  },
  feedContainer: {
    display: 'flex',
    flexDirection: 'column' as const
  },
  loadMore: {
    padding: '24px 20px',
    textAlign: 'center' as const
  },
  loadMoreButton: {
    background: 'transparent',
    border: '1px solid #4B0082',
    color: '#4B0082',
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};

export default PlayByPlayFeed;