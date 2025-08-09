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
  playerStats
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
              <span style={styles.scoringText}>{scoringInfo.description}</span>
            ) : (
              <span style={styles.nonScoringText}>{play.statType?.toUpperCase()}</span>
            )}
            <span style={styles.scoreAtPlay}>Score: {play.scoreAfter.home}-{play.scoreAfter.away}</span>
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
    background: '#1a1a1a',
    borderBottom: '1px solid #333',
    padding: '16px 20px',
    transition: 'all 0.2s ease',
    position: 'relative' as const
  },
  latestPlay: {
    background: 'rgba(255, 215, 0, 0.05)',
    borderLeft: '4px solid #FFD700'
  },
  timeSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px'
  },
  quarter: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#FFD700',
    background: 'rgba(255, 215, 0, 0.1)',
    padding: '4px 8px',
    borderRadius: '4px'
  },
  gameTime: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#ffffff'
  },
  relativeTime: {
    fontSize: '12px',
    color: '#b3b3b3',
    marginLeft: 'auto'
  },
  playContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px'
  },
  playerAvatar: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px'
  },
  avatarCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#4B0082',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '700'
  },
  teamIndicator: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#b3b3b3'
  },
  playDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  playDescription: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: '1.4',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  playIcon: {
    fontSize: '18px'
  },
  playerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  playerName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#FFD700'
  },
  teamName: {
    fontSize: '12px',
    color: '#b3b3b3'
  },
  scoringImpact: {
    display: 'flex',
    alignItems: 'center'
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  scoringText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#00ff88',
    background: 'rgba(0, 255, 136, 0.1)',
    padding: '2px 8px',
    borderRadius: '4px'
  },
  nonScoringText: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#89b4ff',
    background: 'rgba(137, 180, 255, 0.12)',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  scoreAtPlay: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#b3b3b3'
  },
  statsSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '4px'
  },
  currentScore: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff'
  },
  pointsAdded: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#00ff88'
  },
  latestIndicator: {
    position: 'absolute' as const,
    top: '8px',
    right: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  latestDot: {
    width: '6px',
    height: '6px',
    background: '#FFD700',
    borderRadius: '50%',
    animation: 'pulse 2s infinite'
  },
  latestText: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#FFD700'
  }
};

export default PlayEntry;