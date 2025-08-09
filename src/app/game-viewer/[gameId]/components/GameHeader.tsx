'use client';

import React from 'react';
import { 
  formatGameTime, 
  formatGameDate, 
  getGameStatusText, 
  getStatusColor 
} from '@/lib/utils/gameViewerUtils';
import { figmaColors, figmaTypography, figmaSpacing, figmaRadius } from '@/lib/design/figmaTokens';

interface GameHeaderProps {
  game?: {
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
  // Safety check to prevent render errors
  if (!game) {
    return null;
  }

  return (
    <div style={styles.container}>
      {/* Status Bar */}
      <div style={styles.statusBar}>
        <div style={{...styles.statusIndicator, background: getStatusColor(isLive, game.status)}} />
        <span style={styles.statusText}>
          {isLive ? 'LIVE' : getGameStatusText(game.status, game.quarter, game.startTime)}
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
          <div style={styles.gameStatus}>{getGameStatusText(game.status, game.quarter, game.startTime)}</div>
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
    backgroundColor: figmaColors.secondary,
    borderBottom: `1px solid ${figmaColors.border.primary}`,
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    fontFamily: figmaTypography.fontFamily.primary
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: figmaSpacing[3],
    padding: `${figmaSpacing[3]} ${figmaSpacing[5]}`,
    borderBottom: `1px solid ${figmaColors.border.primary}`,
    backgroundColor: figmaColors.primary
  },
  statusIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: figmaRadius.full,
    animation: 'pulse 2s infinite'
  },
  statusText: {
    fontSize: figmaTypography.fontSize.xs,
    fontWeight: figmaTypography.fontWeight.bold,
    color: figmaColors.text.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em'
  },
  gameDate: {
    fontSize: figmaTypography.fontSize.xs,
    color: figmaColors.text.muted,
    marginLeft: 'auto'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${figmaSpacing[6]} ${figmaSpacing[4]}`,
    maxWidth: '64rem',
    margin: '0 auto',
    backgroundColor: figmaColors.secondary
  },
  teamContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: figmaSpacing[4],
    minWidth: '160px'
  },
  teamInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: figmaSpacing[4]
  },
  teamLogo: {
    width: '48px',
    height: '48px',
    borderRadius: figmaRadius.lg,
    background: figmaColors.accent.purple,
    color: figmaColors.text.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: figmaTypography.fontSize.xl,
    fontWeight: figmaTypography.fontWeight.bold,
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
  },
  teamDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: figmaSpacing[1]
  },
  teamName: {
    fontSize: figmaTypography.fontSize.lg,
    fontWeight: figmaTypography.fontWeight.bold,
    color: figmaColors.text.primary
  },
  teamRecord: {
    fontSize: figmaTypography.fontSize.xs,
    color: figmaColors.text.muted
  },
  teamScore: {
    fontSize: figmaTypography.fontSize['2xl'],
    fontWeight: figmaTypography.fontWeight.extrabold,
    color: figmaColors.text.primary,
    minWidth: '60px',
    textAlign: 'center' as const
  },
  centerSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: figmaSpacing[2],
    minWidth: '120px',
    textAlign: 'center' as const
  },
  gameStatus: {
    fontSize: figmaTypography.fontSize.xl,
    fontWeight: figmaTypography.fontWeight.bold,
    color: figmaColors.accent.blueLight
  },
  gameTime: {
    fontSize: figmaTypography.fontSize.sm,
    fontWeight: figmaTypography.fontWeight.semibold,
    color: figmaColors.text.secondary
  },
  finalStatus: {
    fontSize: figmaTypography.fontSize['2xl'],
    fontWeight: figmaTypography.fontWeight.extrabold,
    color: figmaColors.status.success
  },
  statsBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: figmaSpacing[8],
    padding: `${figmaSpacing[4]} ${figmaSpacing[5]}`,
    backgroundColor: figmaColors.primary,
    borderTop: `1px solid ${figmaColors.border.primary}`
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: figmaSpacing[2]
  },
  statLabel: {
    fontSize: figmaTypography.fontSize.xs,
    color: figmaColors.text.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em'
  },
  statValue: {
    fontSize: figmaTypography.fontSize.sm,
    fontWeight: figmaTypography.fontWeight.semibold,
    color: figmaColors.text.primary
  }
};

export default GameHeader;