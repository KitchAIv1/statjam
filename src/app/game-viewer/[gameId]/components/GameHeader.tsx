'use client';

import React from 'react';

interface GameHeaderProps {
  game: {
    id: string;
    teamAName: string;
    teamBName: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overtime';
    startTime: string;
    quarter: number;
    gameClockMinutes: number;
    gameClockSeconds: number;
    isClockRunning: boolean;
    homeScore: number;
    awayScore: number;
  };
  isLive: boolean;
  lastUpdated: string;
  isMobile?: boolean;
}

/**
 * NBA-Style Game Header Component
 * 
 * Premium header showing live scores, team info, and game status.
 * Inspired by NBA.com game headers with clean, professional design.
 */
const GameHeader: React.FC<GameHeaderProps> = ({ game, isLive, lastUpdated, isMobile = false }) => {
  
  /**
   * Format game time for display
   */
  const formatGameTime = (minutes: number, seconds: number): string => {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  /**
   * Format game status for display
   */
  const getGameStatus = (): string => {
    if (game.status === 'completed') {
      return 'Final';
    } else if (game.status === 'in_progress' || game.status === 'overtime') {
      if (game.quarter <= 4) {
        return `Q${game.quarter}`;
      } else {
        return `OT${game.quarter - 4}`;
      }
    } else if (game.status === 'scheduled') {
      return formatGameDate(game.startTime);
    }
    return game.status.toUpperCase();
  };

  /**
   * Get status indicator color
   */
  const getStatusColor = (): string => {
    if (isLive) return '#ff0000';
    if (game.status === 'completed') return '#00ff88';
    return '#b3b3b3';
  };

  /**
   * Format date for display
   */
  const formatGameDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div style={styles.container}>
      {/* Status Bar */}
      <div style={styles.statusBar}>
        <div style={{...styles.statusIndicator, background: getStatusColor()}} />
        <span style={styles.statusText}>
          {isLive ? 'LIVE' : getGameStatus()}
        </span>
        <span style={styles.gameDate}>
          {formatGameDate(game.startTime)}
        </span>
      </div>

      {/* Main Header */}
      <div style={styles.header}>
        {/* Away Team */}
        <div style={{...styles.teamContainer, justifyContent: 'flex-end'}}>
          <div style={styles.teamInfo}>
            <div style={styles.teamDetails}>
              <div style={styles.teamScore}>{game.awayScore}</div>
              <div style={styles.teamName}>{game.teamBName}</div>
            </div>
            <div style={styles.teamLogo}>
              {game.teamBName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Center - Status Only (No Time Clock) */}
        <div style={styles.centerSection}>
          <div style={styles.gameStatus}>{getGameStatus()}</div>
          {game.status === 'completed' && (
            <div style={styles.finalStatus}>FINAL</div>
          )}
        </div>

        {/* Home Team */}
        <div style={{...styles.teamContainer, justifyContent: 'flex-start'}}>
          <div style={styles.teamInfo}>
            <div style={styles.teamLogo}>
              {game.teamAName.charAt(0).toUpperCase()}
            </div>
            <div style={styles.teamDetails}>
              <div style={styles.teamScore}>{game.homeScore}</div>
              <div style={styles.teamName}>{game.teamAName}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={styles.statsBar}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Quarter:</span>
          <span style={styles.statValue}>
            {game.quarter <= 4 ? `Q${game.quarter}` : `OT${game.quarter - 4}`}
          </span>
        </div>

        <div style={styles.statItem}>
          <span style={styles.statLabel}>Status:</span>
          <span style={styles.statValue}>
            {game.isClockRunning ? 'RUNNING' : 'STOPPED'}
          </span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
    borderBottom: '1px solid #333',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    borderBottom: '1px solid #333'
  },
  statusIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    animation: 'pulse 2s infinite'
  },
  statusText: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#ffffff'
  },
  gameDate: {
    fontSize: '12px',
    color: '#b3b3b3',
    marginLeft: 'auto'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 12px',
    gap: '32px',
    maxWidth: '600px',
    margin: '0 auto'
  },
  teamContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: '140px'
  },
  teamInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  teamLogo: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    background: '#4B0082',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '700'
  },
  teamDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px'
  },
  teamName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff'
  },
  teamRecord: {
    fontSize: '12px',
    color: '#b3b3b3'
  },
  teamScore: {
    fontSize: '28px',
    fontWeight: '900',
    color: '#ffffff',
    minWidth: '60px',
    textAlign: 'center' as const
  },
  centerSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    minWidth: '100px',
    textAlign: 'center' as const
  },
  gameStatus: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#FFD700'
  },
  gameTime: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff'
  },
  finalStatus: {
    fontSize: '20px',
    fontWeight: '900',
    color: '#00ff88'
  },
  statsBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '32px',
    padding: '16px 20px',
    background: 'rgba(0, 0, 0, 0.3)'
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statLabel: {
    fontSize: '12px',
    color: '#b3b3b3'
  },
  statValue: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#ffffff'
  }
};

export default GameHeader;