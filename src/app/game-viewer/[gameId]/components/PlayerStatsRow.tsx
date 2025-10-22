/**
 * PlayerStatsRow Component - Reusable Player Statistics Display
 * 
 * PURPOSE: Display individual player statistics in a consistent row format
 * for both on-court and bench players in the Team Stats Tab.
 * 
 * LAYOUT: Player photo + name + position on left, stats grid on right
 * STATS: MIN, PTS, REB, AST, STL, BLK, +/-
 */

import React from 'react';

export interface PlayerStatsRowProps {
  player: {
    id: string;
    name: string;
    position?: string;
  };
  stats: {
    minutes: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    plusMinus: number;
  };
}

export function PlayerStatsRow({ player, stats }: PlayerStatsRowProps) {
  const { name, position } = player;
  const { minutes, points, rebounds, assists, steals, blocks, plusMinus } = stats;

  // Format plus/minus with color coding
  const formatPlusMinus = (value: number): { text: string; color: string } => {
    if (value > 0) {
      return { text: `+${value}`, color: '#10b981' }; // green-500
    } else if (value < 0) {
      return { text: `${value}`, color: '#ef4444' }; // red-500
    } else {
      return { text: '0', color: '#6b7280' }; // gray-500
    }
  };

  const plusMinusFormatted = formatPlusMinus(plusMinus);

  return (
    <div style={styles.playerRow}>
      {/* Left Section: Player Info */}
      <div style={styles.playerInfo}>
        <div style={styles.playerPhoto}>
          <div style={styles.playerPhotoPlaceholder}>
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
        <div style={styles.playerDetails}>
          <div style={styles.playerName}>{name}</div>
          {position && (
            <div style={styles.playerPosition}>{position}</div>
          )}
        </div>
      </div>

      {/* Right Section: Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCell}>
          <div style={styles.statValue}>{minutes}</div>
          <div style={styles.statLabel}>MIN</div>
        </div>
        <div style={styles.statCell}>
          <div style={styles.statValue}>{points}</div>
          <div style={styles.statLabel}>PTS</div>
        </div>
        <div style={styles.statCell}>
          <div style={styles.statValue}>{rebounds}</div>
          <div style={styles.statLabel}>REB</div>
        </div>
        <div style={styles.statCell}>
          <div style={styles.statValue}>{assists}</div>
          <div style={styles.statLabel}>AST</div>
        </div>
        <div style={styles.statCell}>
          <div style={styles.statValue}>{steals}</div>
          <div style={styles.statLabel}>STL</div>
        </div>
        <div style={styles.statCell}>
          <div style={styles.statValue}>{blocks}</div>
          <div style={styles.statLabel}>BLK</div>
        </div>
        <div style={styles.statCell}>
          <div style={{ ...styles.statValue, color: plusMinusFormatted.color }}>
            {plusMinusFormatted.text}
          </div>
          <div style={styles.statLabel}>+/-</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  playerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid #374151', // gray-700
    backgroundColor: '#111827', // gray-900
    minHeight: '60px'
  },
  playerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1
  },
  playerPhoto: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0
  },
  playerPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#4b5563', // gray-600
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '600'
  },
  playerDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px'
  },
  playerName: {
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    lineHeight: '1.2'
  },
  playerPosition: {
    color: '#9ca3af', // gray-400
    fontSize: '12px',
    fontWeight: '400'
  },
  statsGrid: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center'
  },
  statCell: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    minWidth: '32px'
  },
  statValue: {
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    lineHeight: '1.2',
    marginBottom: '2px'
  },
  statLabel: {
    color: '#9ca3af', // gray-400
    fontSize: '10px',
    fontWeight: '400',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  }
};
