'use client';

import React from 'react';
import { useTeamStats } from '@/hooks/useTeamStats';
import { useOpponentStats } from '@/hooks/useOpponentStats';
import { PlayerStatsRow } from '@/app/game-viewer/[gameId]/components/PlayerStatsRow';

interface OpponentStatsPanelProps {
  gameId: string;
  teamId: string;
  teamName: string;
  opponentName: string;
}

/**
 * OpponentStatsPanel - Real-time team stats display for coach mode
 * 
 * PURPOSE: Shows live COACH'S TEAM player statistics in coach tracker
 * Displays the coach's own team players and their stats
 * 
 * FEATURES:
 * - Coach's team player box scores with live updates
 * - Coach's team aggregate stats (FG, 3FG, FTS, TO, REB, AST)
 * - Opponent team aggregate stats at bottom
 * - Compact design to fit in split panel
 * 
 * Follows .cursorrules: <200 lines, reuses existing components
 */
export function OpponentStatsPanel({
  gameId,
  teamId,
  teamName,
  opponentName
}: OpponentStatsPanelProps) {
  
  const { teamStats, onCourtPlayers, benchPlayers, loading, error } = useTeamStats(gameId, teamId);
  const { teamStats: opponentTeamStats } = useOpponentStats(gameId);

  // Combine all players (on-court + bench)
  const allPlayers = [...onCourtPlayers, ...benchPlayers];
  
  // Debug logging
  console.log('🎯 OpponentStatsPanel: Data loaded', {
    gameId,
    teamId,
    teamName,
    loading,
    error,
    onCourtPlayers: onCourtPlayers.length,
    benchPlayers: benchPlayers.length,
    allPlayers: allPlayers.length,
    onCourtPlayersData: onCourtPlayers,
    benchPlayersData: benchPlayers,
    teamStats: !!teamStats,
    opponentTeamStats: !!opponentTeamStats
  });

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingText}>Loading stats...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorText}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Scrollable Player Stats Section */}
      <div style={styles.scrollableContent} className="opponent-stats-scroll">
        {/* Player Stats */}
        <div style={styles.playersSubsection}>
          <div style={styles.subsectionTitle}>{teamName} Players</div>
          {allPlayers.length > 0 ? (
            allPlayers.map((player, index) => (
              <PlayerStatsRow
                key={player.playerId}
                player={{
                  id: player.playerId,
                  name: player.playerName,
                  position: index < 2 ? 'G' : index < 4 ? 'F' : 'C'
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
            <div style={styles.emptyText}>No player stats available yet</div>
          )}
        </div>
      </div>

      {/* Fixed Team Aggregates at Bottom */}
      <div style={styles.fixedAggregatesContainer}>
        {/* Coach's Team Summary - Compact Row */}
        {teamStats && (
          <div style={styles.teamSummaryRow}>
            <div style={styles.teamRowLabel}>{teamName}</div>
            <div style={styles.teamRowStats}>
              <span style={styles.statCompact}>
                {teamStats.fieldGoalsMade}/{teamStats.fieldGoalsAttempted} FG ({teamStats.fieldGoalPercentage}%)
              </span>
              <span style={styles.statCompact}>
                {teamStats.threePointersMade}/{teamStats.threePointersAttempted} 3PT ({teamStats.threePointPercentage}%)
              </span>
              <span style={styles.statCompact}>
                {teamStats.freeThrowsMade}/{teamStats.freeThrowsAttempted} FT ({teamStats.freeThrowPercentage}%)
              </span>
              <span style={styles.statCompact}>{teamStats.rebounds} REB</span>
              <span style={styles.statCompact}>{teamStats.assists} AST</span>
              <span style={styles.statCompact}>{teamStats.turnovers} TO</span>
            </div>
          </div>
        )}

        {/* Opponent Summary - Compact Row */}
        {opponentTeamStats && (
          <div style={styles.opponentSummaryRow}>
            <div style={styles.opponentRowLabel}>{opponentName}</div>
            <div style={styles.teamRowStats}>
              <span style={styles.statCompact}>
                {opponentTeamStats.fieldGoalsMade}/{opponentTeamStats.fieldGoalsAttempted} FG ({opponentTeamStats.fieldGoalPercentage}%)
              </span>
              <span style={styles.statCompact}>
                {opponentTeamStats.threePointersMade}/{opponentTeamStats.threePointersAttempted} 3PT ({opponentTeamStats.threePointPercentage}%)
              </span>
              <span style={styles.statCompact}>
                {opponentTeamStats.freeThrowsMade}/{opponentTeamStats.freeThrowsAttempted} FT ({opponentTeamStats.freeThrowPercentage}%)
              </span>
              <span style={styles.statCompact}>{opponentTeamStats.rebounds} REB</span>
              <span style={styles.statCompact}>{opponentTeamStats.assists} AST</span>
              <span style={styles.statCompact}>{opponentTeamStats.turnovers} TO</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#111827',
    color: '#ffffff',
    borderRadius: '12px',
    overflow: 'hidden',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: '14px'
  },
  errorText: {
    color: '#ef4444',
    fontSize: '14px',
    padding: '16px',
    textAlign: 'center' as const
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: '12px',
    padding: '12px',
    textAlign: 'center' as const
  },
  scrollableContent: {
    flex: 1,
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    // Custom scrollbar styling
    scrollbarWidth: 'thin' as const,
    scrollbarColor: '#4b5563 #1f2937',
    // Webkit scrollbar styling
    WebkitOverflowScrolling: 'touch' as const,
    cursor: 'default'
  },
  playersSubsection: {
    marginBottom: '0'
  },
  subsectionTitle: {
    fontSize: '10px',
    fontWeight: '600' as const,
    color: '#60a5fa',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    padding: '6px 10px',
    backgroundColor: '#1f2937',
    borderBottom: '1px solid #374151'
  },
  fixedAggregatesContainer: {
    flexShrink: 0,
    borderTop: '2px solid #374151'
  },
  teamSummaryRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '6px 10px',
    backgroundColor: '#1f2937',
    borderBottom: '1px solid #374151'
  },
  opponentSummaryRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '6px 10px',
    backgroundColor: '#1e293b'
  },
  teamRowLabel: {
    fontSize: '10px',
    fontWeight: '700' as const,
    color: '#60a5fa',
    marginBottom: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  },
  opponentRowLabel: {
    fontSize: '10px',
    fontWeight: '700' as const,
    color: '#f87171',
    marginBottom: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  },
  teamRowStats: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
    fontSize: '9px'
  },
  statCompact: {
    color: '#e5e7eb',
    fontSize: '9px',
    whiteSpace: 'nowrap' as const
  }
};

