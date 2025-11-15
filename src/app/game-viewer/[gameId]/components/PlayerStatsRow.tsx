/**
 * PlayerStatsRow Component - Reusable Player Statistics Display
 * 
 * PURPOSE: Display individual player statistics in a consistent row format
 * for both on-court and bench players in the Team Stats Tab.
 * 
 * LAYOUT: Player photo + name + position on left, stats grid on right
 * STATS: MIN, PTS, REB, AST, STL, BLK, +/-
 */

import React, { useState, useEffect } from 'react';

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
    fouls: number;
    plusMinus: number;
  };
}

export function PlayerStatsRow({ player, stats }: PlayerStatsRowProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const { name, position } = player;
  const { minutes, points, rebounds, assists, steals, blocks, fouls, plusMinus } = stats;

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
    <div style={isMobile ? styles.playerRowMobile : styles.playerRow}>
      {/* Left Section: Player Info (Compact - No Avatar) */}
      <div style={isMobile ? styles.playerInfoMobile : styles.playerInfo}>
        <div style={styles.playerName}>
          {name}
          {position && <span style={styles.playerPosition}> ({position})</span>}
        </div>
      </div>

      {/* Right Section: Stats Grid */}
      <div style={isMobile ? styles.statsGridMobile : styles.statsGrid}>
        <div style={styles.statCell}>
          <div style={isMobile ? styles.statValueMobile : styles.statValue}>{minutes}</div>
          <div style={isMobile ? styles.statLabelMobile : styles.statLabel}>MIN</div>
        </div>
        <div style={styles.statCell}>
          <div style={isMobile ? styles.statValueMobile : styles.statValue}>{points}</div>
          <div style={isMobile ? styles.statLabelMobile : styles.statLabel}>PTS</div>
        </div>
        <div style={styles.statCell}>
          <div style={isMobile ? styles.statValueMobile : styles.statValue}>{rebounds}</div>
          <div style={isMobile ? styles.statLabelMobile : styles.statLabel}>REB</div>
        </div>
        <div style={styles.statCell}>
          <div style={isMobile ? styles.statValueMobile : styles.statValue}>{assists}</div>
          <div style={isMobile ? styles.statLabelMobile : styles.statLabel}>AST</div>
        </div>
        <div style={styles.statCell}>
          <div style={isMobile ? styles.statValueMobile : styles.statValue}>{steals}</div>
          <div style={isMobile ? styles.statLabelMobile : styles.statLabel}>STL</div>
        </div>
        <div style={styles.statCell}>
          <div style={isMobile ? styles.statValueMobile : styles.statValue}>{blocks}</div>
          <div style={isMobile ? styles.statLabelMobile : styles.statLabel}>BLK</div>
        </div>
        <div style={styles.statCell}>
          <div style={isMobile ? styles.statValueMobile : styles.statValue}>{fouls}</div>
          <div style={isMobile ? styles.statLabelMobile : styles.statLabel}>FOUL</div>
        </div>
        <div style={styles.statCell}>
          <div style={{ 
            ...(isMobile ? styles.statValueMobile : styles.statValue), 
            color: plusMinusFormatted.color 
          }}>
            {plusMinusFormatted.text}
          </div>
          <div style={isMobile ? styles.statLabelMobile : styles.statLabel}>+/-</div>
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
    padding: '10px 12px',
    borderBottom: '1px solid #374151', // gray-700
    backgroundColor: '#111827', // gray-900
    minHeight: '48px'
  },
  playerRowMobile: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 8px',
    borderBottom: '1px solid #374151', // gray-700
    backgroundColor: '#111827', // gray-900
    minHeight: '44px'
  },
  playerInfo: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: '100px'
  },
  playerInfoMobile: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: '80px'
  },
  playerName: {
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '600',
    lineHeight: '1.3'
  },
  playerPosition: {
    color: '#9ca3af', // gray-400
    fontSize: '12px',
    fontWeight: '400'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: '8px',
    alignItems: 'center',
    minWidth: '320px'
  },
  statsGridMobile: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, minmax(28px, 1fr))',
    gap: '4px',
    alignItems: 'center',
    minWidth: '280px'
  },
  statCell: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    minWidth: '28px',
    textAlign: 'center' as const
  },
  statValue: {
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '600',
    lineHeight: '1.2',
    marginBottom: '2px'
  },
  statValueMobile: {
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '600',
    lineHeight: '1.2',
    marginBottom: '2px'
  },
  statLabel: {
    color: '#9ca3af', // gray-400
    fontSize: '9px',
    fontWeight: '400',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  },
  statLabelMobile: {
    color: '#9ca3af', // gray-400
    fontSize: '8px',
    fontWeight: '400',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  }
};
