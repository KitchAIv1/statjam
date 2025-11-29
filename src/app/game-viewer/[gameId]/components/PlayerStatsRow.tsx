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
    // ✅ NBA-style shooting stats
    fieldGoalsMade?: number;
    fieldGoalsAttempted?: number;
    threePointersMade?: number;
    threePointersAttempted?: number;
    freeThrowsMade?: number;
    freeThrowsAttempted?: number;
  };
}

export function PlayerStatsRow({ player, stats }: PlayerStatsRowProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const { name, position } = player;
  const { 
    minutes, points, rebounds, assists, steals, blocks, fouls, plusMinus,
    fieldGoalsMade = 0, fieldGoalsAttempted = 0,
    threePointersMade = 0, threePointersAttempted = 0,
    freeThrowsMade = 0, freeThrowsAttempted = 0
  } = stats;

  // Format shooting stats as "made/attempted"
  const fgDisplay = `${fieldGoalsMade}/${fieldGoalsAttempted}`;
  const threePtDisplay = `${threePointersMade}/${threePointersAttempted}`;
  const ftDisplay = `${freeThrowsMade}/${freeThrowsAttempted}`;

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

  // ✅ Hover highlight: subtle background change for interactivity
  const rowStyle = {
    ...(isMobile ? styles.playerRowMobile : styles.playerRow),
    backgroundColor: isHovered ? '#1f2937' : '#111827', // gray-800 on hover, gray-900 default
    transition: 'background-color 150ms ease-in-out',
    cursor: 'default'
  };

  return (
    <div 
      style={rowStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left Section: Player Info - STICKY */}
      <div style={isMobile ? styles.playerInfoMobile : styles.playerInfo}>
        <div style={isMobile ? styles.playerNameMobile : styles.playerName}>
          {name}
        </div>
      </div>

      {/* Right Section: Stats Grid - SCROLLABLE on mobile */}
      <div 
        style={isMobile ? styles.statsScrollContainer : undefined}
        className={isMobile ? 'scrollbar-hide' : undefined}
      >
        <div style={isMobile ? styles.statsGridMobile : styles.statsGrid}>
          {/* MIN */}
          <div style={isMobile ? styles.statCellMobile : styles.statCell}>
            <div style={isMobile ? styles.statValueMobile : styles.statValue}>{minutes}</div>
            <div style={isMobile ? styles.statLabelMobile : styles.statLabel}>MIN</div>
          </div>
          {/* FG */}
          <div style={isMobile ? styles.statCellWideMobile : styles.statCellWide}>
            <div style={isMobile ? styles.statValueMobile : styles.statValue}>{fgDisplay}</div>
            <div style={isMobile ? styles.statLabelMobile : styles.statLabel}>FG</div>
          </div>
          {/* 3P */}
          <div style={isMobile ? styles.statCellWideMobile : styles.statCellWide}>
            <div style={isMobile ? styles.statValueMobile : styles.statValue}>{threePtDisplay}</div>
            <div style={isMobile ? styles.statLabelMobile : styles.statLabel}>3P</div>
          </div>
          {/* FT */}
          <div style={isMobile ? styles.statCellWideMobile : styles.statCellWide}>
            <div style={isMobile ? styles.statValueMobile : styles.statValue}>{ftDisplay}</div>
            <div style={isMobile ? styles.statLabelMobile : styles.statLabel}>FT</div>
          </div>
          {/* PTS */}
          <div style={isMobile ? styles.statCellMobile : styles.statCell}>
            <div style={{ ...(isMobile ? styles.statValueMobile : styles.statValue), color: '#a855f7' }}>{points}</div>
            <div style={isMobile ? styles.statLabelMobile : styles.statLabel}>PTS</div>
          </div>
          {/* REB */}
          <div style={isMobile ? styles.statCellMobile : styles.statCell}>
            <div style={isMobile ? styles.statValueMobile : styles.statValue}>{rebounds}</div>
            <div style={isMobile ? styles.statLabelMobile : styles.statLabel}>REB</div>
          </div>
          {/* AST */}
          <div style={isMobile ? styles.statCellMobile : styles.statCell}>
            <div style={isMobile ? styles.statValueMobile : styles.statValue}>{assists}</div>
            <div style={isMobile ? styles.statLabelMobile : styles.statLabel}>AST</div>
          </div>
          {/* STL */}
          <div style={isMobile ? styles.statCellMobile : styles.statCell}>
            <div style={isMobile ? styles.statValueMobile : styles.statValue}>{steals}</div>
            <div style={isMobile ? styles.statLabelMobile : styles.statLabel}>STL</div>
          </div>
          {/* BLK */}
          <div style={isMobile ? styles.statCellMobile : styles.statCell}>
            <div style={isMobile ? styles.statValueMobile : styles.statValue}>{blocks}</div>
            <div style={isMobile ? styles.statLabelMobile : styles.statLabel}>BLK</div>
          </div>
          {/* PF */}
          <div style={isMobile ? styles.statCellMobile : styles.statCell}>
            <div style={isMobile ? styles.statValueMobile : styles.statValue}>{fouls}</div>
            <div style={isMobile ? styles.statLabelMobile : styles.statLabel}>PF</div>
          </div>
          {/* +/- */}
          <div style={isMobile ? styles.statCellMobile : styles.statCell}>
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
    </div>
  );
}

const styles = {
  playerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderBottom: '1px solid #374151',
    backgroundColor: '#111827',
    minHeight: '48px'
  },
  playerRowMobile: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 6px',
    borderBottom: '1px solid #374151',
    backgroundColor: '#111827',
    minHeight: '36px'
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
    minWidth: '60px',
    maxWidth: '60px',
    flexShrink: 0,
    paddingRight: '4px'
  },
  playerName: {
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '600',
    lineHeight: '1.3'
  },
  playerNameMobile: {
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '600',
    lineHeight: '1.2',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const
  },
  playerPosition: {
    color: '#9ca3af',
    fontSize: '12px',
    fontWeight: '400'
  },
  // ✅ Horizontal scroll container for mobile
  statsScrollContainer: {
    flex: 1,
    overflowX: 'auto' as const,
    overflowY: 'hidden' as const,
    WebkitOverflowScrolling: 'touch' as const
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(11, 1fr)',
    gap: '6px',
    alignItems: 'center',
    minWidth: '440px'
  },
  statsGridMobile: {
    display: 'grid',
    gridTemplateColumns: 'repeat(11, 1fr)',
    gap: '2px',
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
  statCellMobile: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    minWidth: '22px',
    textAlign: 'center' as const
  },
  statCellWide: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    minWidth: '36px',
    textAlign: 'center' as const
  },
  statCellWideMobile: {
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
    fontSize: '10px',
    fontWeight: '600',
    lineHeight: '1.1',
    marginBottom: '1px'
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: '9px',
    fontWeight: '400',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  },
  statLabelMobile: {
    color: '#9ca3af',
    fontSize: '7px',
    fontWeight: '400',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px'
  }
};
