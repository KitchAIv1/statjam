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

import React from 'react';
import { useTeamStats } from '@/hooks/useTeamStats';
import { PlayerStatsRow } from './PlayerStatsRow';

export interface TeamStatsTabProps {
  gameId: string;
  teamId: string;
  teamName: string;
}

export function TeamStatsTab({ gameId, teamId, teamName }: TeamStatsTabProps) {
  const { teamStats, onCourtPlayers, benchPlayers, loading, error } = useTeamStats(gameId, teamId);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner} />
        <div style={styles.loadingText}>Loading team statistics...</div>
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
      <div style={styles.teamSummary}>
        <div style={styles.teamHeader}>
          <div style={styles.teamName}>{teamName}</div>
          <div style={styles.teamSpread}>▼ 2.5</div>
        </div>
        
        <div style={styles.teamStatsGrid}>
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
    minHeight: '100vh',
    color: '#ffffff'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    backgroundColor: '#000000'
  },
  loadingSpinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #374151',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: '14px'
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
    padding: '20px',
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
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap' as const
  },
  teamStatItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    minWidth: '60px'
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
  }
};
