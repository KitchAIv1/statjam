'use client';

import React from 'react';
import { PlayByPlayEntry } from '@/lib/types/playByPlay';
import { 
  formatGameTime, 
  formatQuarter, 
  getRelativeTime,
  getEnhancedPlayDescription,
  getScoringInfo,
  getPlayIcon 
} from '@/lib/utils/gameViewerUtils';
import { figmaColors, figmaTypography, figmaSpacing, figmaRadius } from '@/lib/design/figmaTokens';

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
  playerStats?: PlayerStats; // Optional player stats for the current play
  playerPoints?: number; // Player points up to this play
}

/**
 * NBA-Style Individual Play Entry Component
 * 
 * Single play entry matching NBA.com feed design.
 * Shows player info, play description, timing, and score impact.
 */
const PlayEntry: React.FC<PlayEntryProps> = ({ 
  play, 
  isLatest, 
  teamAName, 
  teamBName,
  playerStats,
  playerPoints
}) => {



  /**
   * Get team name from play data
   */
  const getTeamName = (): string => {
    // Use the teamName from the play data (already resolved)
    return play.teamName || 'Unknown Team';
  };



  /**
   * Get field goal statistics for the player (made/attempts)
   */
  const getFieldGoalStats = (): string | null => {
    if (!playerStats) return null;
    
    switch (play.statType) {
      case 'field_goal':
        return `${playerStats.fieldGoalMade}/${playerStats.fieldGoalAttempts}`;
      case 'three_pointer':
        return `${playerStats.threePointerMade}/${playerStats.threePointerAttempts}`;
      case 'free_throw':
        return `${playerStats.freeThrowMade}/${playerStats.freeThrowAttempts}`;
      default:
        return null;
    }
  };



  const scoringInfo = getScoringInfo(play.statType, play.modifier);
  const teamName = getTeamName();

  return (
    <div style={{
      ...styles.container,
      ...(isLatest ? styles.latestPlay : {})
    }}>
      {/* Time and Quarter Info */}
        <div style={styles.timeSection}>
        <div style={styles.quarter}>
          {formatQuarter(play.quarter)}
        </div>
        <div style={styles.gameTime}>
          {formatGameTime(play.gameTimeMinutes, play.gameTimeSeconds)}
        </div>
        <div style={styles.relativeTime}>
          {getRelativeTime(play.timestamp)}
        </div>
      </div>

      {/* Main Play Content */}
      <div style={styles.playContent}>
        {/* Player Avatar */}
        <div style={styles.playerAvatar}>
          <div style={styles.avatarCircle}>
            {play.playerName ? play.playerName.charAt(0).toUpperCase() : '?'}
          </div>
          <div style={styles.teamIndicator}>
            {teamName.substring(0, 3).toUpperCase()}
          </div>
        </div>

        {/* Play Details */}
        <div style={styles.playDetails}>
                  <div style={styles.playDescription}>
          <span style={styles.playIcon}>{getPlayIcon(play.statType)}</span>
          {getEnhancedPlayDescription(play.description, play.statType, play.modifier, playerStats)}
        </div>
          
          {/* Player and Team Info */}
          <div style={styles.playerInfo}>
            <span style={styles.playerName}>
              {play.playerName || 'Unknown Player'}
            </span>
            <span style={styles.teamName}>
              {teamName}
            </span>
          </div>

          {/* Scoring or Non-scoring Badge */}
          <div style={styles.badgeRow}>
            {scoringInfo ? (
              <span style={styles.scoringTextLarge}>{scoringInfo.description}</span>
            ) : (
              <span style={styles.nonScoringText}>{play.statType?.toUpperCase()}</span>
            )}
            <span style={styles.scoreAtPlay}>Score: {play.scoreAfter.home}-{play.scoreAfter.away}</span>
            {typeof playerPoints === 'number' && (
              <div style={styles.playerPointsContainer}>
                <div style={styles.playerPointsValue}>{playerPoints}</div>
                <div style={styles.playerPointsLabel}>POINTS</div>
              </div>
            )}
          </div>

          {/* Social Reactions Placeholder */}
          <div style={styles.reactionsRow}>
            <span style={styles.reactionItem}>❤️ 0</span>
            <span style={styles.reactionItem}>💬 0</span>
            <span style={styles.reactionItem}>↗️ Share</span>
          </div>
        </div>

        {/* Score and Stats (removed bottom score display to avoid duplication) */}
      </div>

      {/* Latest Play Indicator */}
      {isLatest && (
        <div style={styles.latestIndicator}>
          <div style={styles.latestDot} />
          <span style={styles.latestText}>Latest</span>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: figmaColors.secondary,
    borderBottom: `1px solid ${figmaColors.border.primary}`,
    padding: `${figmaSpacing[4]} ${figmaSpacing[4]}`,
    transition: 'all 0.2s ease',
    position: 'relative' as const
  },
  latestPlay: {
    backgroundColor: 'rgba(96, 165, 250, 0.08)',
    borderLeft: `4px solid ${figmaColors.accent.blue}`
  },
  timeSection: {
    display: 'flex',
    alignItems: 'center',
    gap: figmaSpacing[3],
    marginBottom: figmaSpacing[3]
  },
  quarter: {
    fontSize: figmaTypography.fontSize.xs,
    fontWeight: figmaTypography.fontWeight.bold,
    color: figmaColors.accent.blueLight,
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
    padding: `${figmaSpacing[1]} ${figmaSpacing[2]}`,
    borderRadius: figmaRadius.base,
    letterSpacing: '0.05em'
  },
  gameTime: {
    fontSize: figmaTypography.fontSize.xs,
    fontWeight: figmaTypography.fontWeight.semibold,
    color: figmaColors.text.primary
  },
  relativeTime: {
    fontSize: figmaTypography.fontSize.xs,
    color: figmaColors.text.muted,
    marginLeft: 'auto'
  },
  playContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: figmaSpacing[4]
  },
  playerAvatar: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: figmaSpacing[1]
  },
  avatarCircle: {
    width: '40px',
    height: '40px',
    borderRadius: figmaRadius.full,
    backgroundColor: figmaColors.accent.purple,
    color: figmaColors.text.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: figmaTypography.fontSize.base,
    fontWeight: figmaTypography.fontWeight.bold
  },
  teamIndicator: {
    fontSize: figmaTypography.fontSize.xs,
    fontWeight: figmaTypography.fontWeight.semibold,
    color: figmaColors.text.muted
  },
  playDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: figmaSpacing[2]
  },
  playDescription: {
    fontSize: figmaTypography.fontSize.lg,
    fontWeight: figmaTypography.fontWeight.bold,
    color: figmaColors.text.primary,
    lineHeight: '1.4',
    display: 'flex',
    alignItems: 'center',
    gap: figmaSpacing[2]
  },
  playIcon: {
    fontSize: '18px'
  },
  playerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: figmaSpacing[3]
  },
  playerName: {
    fontSize: figmaTypography.fontSize.sm,
    fontWeight: figmaTypography.fontWeight.semibold,
    color: figmaColors.accent.blueLight
  },
  teamName: {
    fontSize: figmaTypography.fontSize.xs,
    color: figmaColors.text.muted
  },
  scoringImpact: {
    display: 'flex',
    alignItems: 'center'
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: figmaSpacing[2]
  },
  scoringText: {
    fontSize: figmaTypography.fontSize.xs,
    fontWeight: figmaTypography.fontWeight.semibold,
    color: figmaColors.status.success,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: `${figmaSpacing[0.5]} ${figmaSpacing[2]}`,
    borderRadius: figmaRadius.base
  },
  scoringTextLarge: {
    fontSize: figmaTypography.fontSize.lg,
    fontWeight: figmaTypography.fontWeight.extrabold,
    color: figmaColors.status.success,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: `${figmaSpacing[1]} ${figmaSpacing[3]}`,
    borderRadius: figmaRadius.base
  },
  nonScoringText: {
    fontSize: figmaTypography.fontSize.xs,
    fontWeight: figmaTypography.fontWeight.semibold,
    color: figmaColors.accent.blueLight,
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
    padding: `${figmaSpacing[0.5]} ${figmaSpacing[2]}`,
    borderRadius: figmaRadius.base
  },
  scoreAtPlay: {
    fontSize: figmaTypography.fontSize.xs,
    fontWeight: figmaTypography.fontWeight.semibold,
    color: figmaColors.text.muted
  },
  playerPointsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    marginLeft: 'auto'
  },
  playerPointsValue: {
    fontSize: '1.75rem', // ~x3 of base size visually
    lineHeight: '1',
    fontWeight: figmaTypography.fontWeight.extrabold,
    color: figmaColors.text.primary,
  },
  playerPointsLabel: {
    marginTop: '2px',
    fontSize: figmaTypography.fontSize.xs,
    letterSpacing: '0.06em',
    color: figmaColors.text.muted,
  },
  statsSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: figmaSpacing[1]
  },
  currentScore: {
    fontSize: figmaTypography.fontSize.base,
    fontWeight: figmaTypography.fontWeight.bold,
    color: figmaColors.text.primary
  },
  pointsAdded: {
    fontSize: figmaTypography.fontSize.xs,
    fontWeight: figmaTypography.fontWeight.bold,
    color: figmaColors.status.success
  },
  latestIndicator: {
    position: 'absolute' as const,
    top: '8px',
    right: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: figmaSpacing[1]
  },
  latestDot: {
    width: '6px',
    height: '6px',
    backgroundColor: figmaColors.accent.blue,
    borderRadius: figmaRadius.full,
    animation: 'pulse 2s infinite'
  },
  latestText: {
    fontSize: figmaTypography.fontSize.xs,
    fontWeight: figmaTypography.fontWeight.bold,
    color: figmaColors.accent.blue
  },
  reactionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: figmaSpacing[4],
    marginTop: figmaSpacing[2],
    color: figmaColors.text.muted
  },
  reactionItem: {
    fontSize: figmaTypography.fontSize.xs,
    cursor: 'pointer'
  }
};

export default PlayEntry;