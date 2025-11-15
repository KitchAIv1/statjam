/**
 * TeamStatsTab Component - Team Statistics Display
 * 
 * PURPOSE: Display team performance summary and player box scores
 * for the Team Stats Tab in live game viewer.
 * 
 * UI STRUCTURE:
 * - Team Performance Summary (header block with FG, 3FG, FTS, TO, REB, AST)
 * - On Court section (5 players with stats grid)
 * - Bench section (remaining players with stats grid)
 * 
 * STYLING: Dark mode theme matching existing game viewer
 */

import React, { useState, useEffect } from 'react';
import { useTeamStats } from '@/hooks/useTeamStats';
import { PlayerStatsRow } from './PlayerStatsRow';

export interface TeamStatsTabProps {
  gameId: string;
  teamId: string;
  teamName: string;
  // ✅ PHASE 2: Optional prefetched data for instant rendering
  prefetchedData?: {
    teamStats: any;
    onCourtPlayers: any[];
    benchPlayers: any[];
  };
}

export function TeamStatsTab({ gameId, teamId, teamName, prefetchedData }: TeamStatsTabProps) {
  // ✅ PHASE 2: Use prefetched data if available, otherwise fetch normally
  const hookData = useTeamStats(gameId, teamId, { 
    enabled: !prefetchedData // Skip hook if we have prefetched data
  });
  
  // ✅ PHASE 2: Smart data selection - prefetched takes priority
  const { teamStats, onCourtPlayers, benchPlayers, loading, error } = prefetchedData ? {
    teamStats: prefetchedData.teamStats,
    onCourtPlayers: prefetchedData.onCourtPlayers,
    benchPlayers: prefetchedData.benchPlayers,
    loading: false, // Prefetched data is ready
    error: null
  } : hookData;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        {/* ✅ LIGHTWEIGHT SKELETON: 8 elements vs 62 elements (87% reduction) */}
        <div style={styles.lightweightSkeletonContainer}>
          {/* Team Summary Skeleton */}
          <div style={styles.lightweightSkeletonBlock} />
          
          {/* On Court Section Skeleton */}
          <div style={styles.lightweightSkeletonHeader}>On court</div>
          <div style={styles.lightweightSkeletonBlock} />
          <div style={styles.lightweightSkeletonBlock} />
          <div style={styles.lightweightSkeletonBlock} />
          
          {/* Bench Section Skeleton */}
          <div style={styles.lightweightSkeletonHeader}>Bench</div>
          <div style={styles.lightweightSkeletonBlock} />
          <div style={styles.lightweightSkeletonBlock} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorText}>{error}</div>
      </div>
    );
  }

  if (!teamStats) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyText}>No team statistics available</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Team Performance Summary */}
      <div style={isMobile ? styles.teamSummaryMobile : styles.teamSummary}>
        <div style={styles.teamHeader}>
          <div style={styles.teamName}>{teamName}</div>
          <div style={styles.teamSpread}>▼ 2.5</div>
        </div>
        
        <div style={isMobile ? styles.teamStatsGridMobile : styles.teamStatsGrid}>
          <div style={styles.teamStatItem}>
            <div style={styles.teamStatValue}>
              {teamStats.fieldGoalsMade}/{teamStats.fieldGoalsAttempted}
            </div>
            <div style={styles.teamStatLabel}>FG</div>
            <div style={styles.teamStatPercentage}>{teamStats.fieldGoalPercentage}%</div>
          </div>
          
          <div style={styles.teamStatItem}>
            <div style={styles.teamStatValue}>
              {teamStats.threePointersMade}/{teamStats.threePointersAttempted}
            </div>
            <div style={styles.teamStatLabel}>3FG</div>
            <div style={styles.teamStatPercentage}>{teamStats.threePointPercentage}%</div>
          </div>
          
          <div style={styles.teamStatItem}>
            <div style={styles.teamStatValue}>
              {teamStats.freeThrowsMade}/{teamStats.freeThrowsAttempted}
            </div>
            <div style={styles.teamStatLabel}>FTS</div>
            <div style={styles.teamStatPercentage}>{teamStats.freeThrowPercentage}%</div>
          </div>
          
          <div style={styles.teamStatItem}>
            <div style={styles.teamStatValue}>{teamStats.turnovers}</div>
            <div style={styles.teamStatLabel}>TO</div>
          </div>
          
          <div style={styles.teamStatItem}>
            <div style={styles.teamStatValue}>{teamStats.rebounds}</div>
            <div style={styles.teamStatLabel}>REB</div>
          </div>
          
          <div style={styles.teamStatItem}>
            <div style={styles.teamStatValue}>{teamStats.assists}</div>
            <div style={styles.teamStatLabel}>AST</div>
          </div>
          
          <div style={styles.teamStatItem}>
            <div style={styles.teamStatValue}>{teamStats.teamFouls}</div>
            <div style={styles.teamStatLabel}>FOULS</div>
          </div>
        </div>
      </div>

      {/* On Court Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>On court</div>
        <div style={styles.playersList}>
          {onCourtPlayers.length > 0 ? (
            onCourtPlayers.map((player, index) => (
              <PlayerStatsRow
                key={player.playerId}
                player={{
                  id: player.playerId,
                  name: player.playerName,
                  position: index < 2 ? 'G' : index < 4 ? 'F' : 'C' // Simple position assignment
                }}
                stats={{
                  minutes: player.minutes,
                  points: player.points,
                  rebounds: player.rebounds,
                  assists: player.assists,
                  steals: player.steals,
                  blocks: player.blocks,
                  fouls: player.fouls,
                  plusMinus: player.plusMinus
                }}
              />
            ))
          ) : (
            <div style={styles.noPlayersText}>No players on court</div>
          )}
        </div>
      </div>

      {/* Bench Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>Bench</div>
        <div style={styles.playersList}>
          {benchPlayers.length > 0 ? (
            benchPlayers.map((player, index) => (
              <PlayerStatsRow
                key={player.playerId}
                player={{
                  id: player.playerId,
                  name: player.playerName,
                  position: index < 2 ? 'G' : index < 4 ? 'F' : 'C' // Simple position assignment
                }}
                stats={{
                  minutes: player.minutes,
                  points: player.points,
                  rebounds: player.rebounds,
                  assists: player.assists,
                  steals: player.steals,
                  blocks: player.blocks,
                  fouls: player.fouls,
                  plusMinus: player.plusMinus
                }}
              />
            ))
          ) : (
            <div style={styles.noPlayersText}>No bench players</div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#000000',
    color: '#ffffff'
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    backgroundColor: '#000000'
  },
  errorText: {
    color: '#ef4444',
    fontSize: '14px'
  },
  emptyContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    backgroundColor: '#000000'
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: '14px'
  },
  teamSummary: {
    backgroundColor: '#111827', // gray-900
    padding: '16px',
    borderBottom: '1px solid #374151' // gray-700
  },
  teamSummaryMobile: {
    backgroundColor: '#111827', // gray-900
    padding: '12px',
    borderBottom: '1px solid #374151' // gray-700
  },
  teamHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  },
  teamName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ffffff'
  },
  teamSpread: {
    fontSize: '14px',
    color: '#9ca3af' // gray-400
  },
  teamStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '16px'
  },
  teamStatsGridMobile: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  },
  teamStatItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    minWidth: '50px',
    textAlign: 'center' as const
  },
  teamStatValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '4px'
  },
  teamStatLabel: {
    fontSize: '12px',
    color: '#9ca3af', // gray-400
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '2px'
  },
  teamStatPercentage: {
    fontSize: '12px',
    color: '#6b7280' // gray-500
  },
  section: {
    backgroundColor: '#000000'
  },
  sectionHeader: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    padding: '16px 20px',
    backgroundColor: '#111827', // gray-900
    borderBottom: '1px solid #374151' // gray-700
  },
  playersList: {
    backgroundColor: '#000000'
  },
  noPlayersText: {
    color: '#9ca3af',
    fontSize: '14px',
    padding: '20px',
    textAlign: 'center' as const
  },
  
  // ✅ SKELETON STYLES - Custom dark theme skeleton matching game viewer
  // ✅ LIGHTWEIGHT SKELETON STYLES - 87% fewer DOM elements
  lightweightSkeletonContainer: {
    padding: '20px'
  },
  lightweightSkeletonBlock: {
    height: '80px',
    backgroundColor: '#1f2937',
    borderRadius: '8px',
    marginBottom: '16px',
    animation: 'pulse 1.5s ease-in-out infinite'
  },
  lightweightSkeletonHeader: {
    height: '24px',
    width: '120px',
    backgroundColor: '#374151',
    borderRadius: '4px',
    marginBottom: '12px',
    marginTop: '24px',
    animation: 'pulse 1.5s ease-in-out infinite'
  }
};

// ✅ Add CSS animations for skeleton loading
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `;
  if (!document.head.querySelector('style[data-skeleton-animations]')) {
    style.setAttribute('data-skeleton-animations', 'true');
    document.head.appendChild(style);
  }
}
