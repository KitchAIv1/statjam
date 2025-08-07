'use client';

import React from 'react';
import { PlayByPlayEntry } from '@/lib/types/playByPlay';

interface PlayEntryProps {
  play: PlayByPlayEntry;
  isLatest: boolean;
  teamAName: string;
  teamBName: string;
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
  teamBName 
}) => {

  /**
   * Format game time for display
   */
  const formatGameTime = (minutes: number, seconds: number): string => {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  /**
   * Format quarter display
   */
  const formatQuarter = (quarter: number): string => {
    if (quarter <= 4) {
      return `Q${quarter}`;
    } else {
      return `OT${quarter - 4}`;
    }
  };

  /**
   * Get play icon based on stat type
   */
  const getPlayIcon = (statType?: string): string => {
    switch (statType) {
      case 'three_pointer':
        return '🎯';
      case 'field_goal':
        return '🏀';
      case 'free_throw':
        return '🎯';
      case 'assist':
        return '🤝';
      case 'rebound':
        return '📥';
      case 'steal':
        return '🔥';
      case 'block':
        return '🛡️';
      case 'turnover':
        return '😤';
      case 'foul':
        return '⚠️';
      default:
        return '🏀';
    }
  };

  /**
   * Get team name from play data
   */
  const getTeamName = (): string => {
    // Use the teamName from the play data (already resolved)
    return play.teamName || 'Unknown Team';
  };

  /**
   * Get scoring information
   */
  const getScoringInfo = (): { points: number; description: string } | null => {
    if (play.statType === 'three_pointer' && play.modifier === 'made') {
      return { points: 3, description: '+3 points' };
    } else if (play.statType === 'field_goal' && play.modifier === 'made') {
      return { points: 2, description: '+2 points' };
    } else if (play.statType === 'free_throw' && play.modifier === 'made') {
      return { points: 1, description: '+1 point' };
    }
    return null;
  };

  /**
   * Get relative time
   */
  const getRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const playTime = new Date(timestamp);
    const diffMs = now.getTime() - playTime.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      return playTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      });
    }
  };

  const scoringInfo = getScoringInfo();
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
            {play.description}
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

          {/* Scoring Impact */}
          {scoringInfo && (
            <div style={styles.scoringImpact}>
              <span style={styles.scoringText}>
                {scoringInfo.description}
              </span>
            </div>
          )}
        </div>

        {/* Score and Stats */}
        <div style={styles.statsSection}>
          <div style={styles.currentScore}>
            {play.scoreAfter.home}-{play.scoreAfter.away}
          </div>
          {scoringInfo && (
            <div style={styles.pointsAdded}>
              +{scoringInfo.points}
            </div>
          )}
        </div>
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
  scoringText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#00ff88',
    background: 'rgba(0, 255, 136, 0.1)',
    padding: '2px 8px',
    borderRadius: '4px'
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