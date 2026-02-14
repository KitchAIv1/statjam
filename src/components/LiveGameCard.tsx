'use client';

import React from 'react';
import Link from 'next/link';
import { figmaColors, figmaTypography, figmaSpacing, figmaRadius, figmaShadows } from '@/lib/design/figmaTokens';

interface LiveGameCardProps {
  gameId: string;
  /** Team names - use teamLeft/teamRight for optional links when ids + tournamentId provided */
  teamLeftName?: string;
  teamRightName?: string;
  teamLeft?: { id?: string; name: string };
  teamRight?: { id?: string; name: string };
  tournamentId?: string;
  leftScore: number;
  rightScore: number;
  timeLabel: string; // e.g., Q2 05:32 or OT1 02:11
  onClick: () => void;
  isLive?: boolean;
}

// Lightweight, tokenized Figma-style live card
export const LiveGameCard: React.FC<LiveGameCardProps> = React.memo(({ gameId, teamLeftName, teamRightName, teamLeft, teamRight, tournamentId, leftScore, rightScore, timeLabel, onClick, isLive = true }) => {
  const leftName = teamLeft?.name ?? teamLeftName ?? 'Team A';
  const rightName = teamRight?.name ?? teamRightName ?? 'Team B';
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open live game ${leftName} vs ${rightName}`}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      style={styles.card}
    >
      {/* Header: LIVE pill + time */}
      <div style={styles.headerRow}>
        {isLive ? (
          <div style={styles.livePill}>
            <span style={styles.liveDot} />
            LIVE
          </div>
        ) : (
          <div style={styles.scheduledPill}>SCHEDULED</div>
        )}
        <div style={styles.timePill}>{timeLabel}</div>
      </div>

      {/* Scores */}
      <div style={styles.scoresRow}>
        <span style={styles.score} className="sj-score-left">{leftScore}</span>
        <span style={styles.scoreDash}>—</span>
        <span style={styles.score} className="sj-score-right">{rightScore}</span>
      </div>

      {/* Teams */}
      <div style={styles.teamsRow}>
        {tournamentId && teamLeft?.id ? (
          <Link href={`/t/${tournamentId}/team/${teamLeft.id}`} style={styles.teamName} className="sj-team-left" onClick={(e) => e.stopPropagation()}>{leftName}</Link>
        ) : (
          <div style={styles.teamName} className="sj-team-left">{leftName}</div>
        )}
        {tournamentId && teamRight?.id ? (
          <Link href={`/t/${tournamentId}/team/${teamRight.id}`} style={styles.teamName} className="sj-team-right" onClick={(e) => e.stopPropagation()}>{rightName}</Link>
        ) : (
          <div style={styles.teamName} className="sj-team-right">{rightName}</div>
        )}
      </div>
    </div>
  );
});

const styles = {
  card: {
    width: '100%',
    textAlign: 'left' as const,
    backgroundColor: figmaColors.secondary,
    border: `1px solid ${figmaColors.border.primary}`,
    borderRadius: figmaRadius.xl,
    boxShadow: figmaShadows.base,
    padding: figmaSpacing[4],
    cursor: 'pointer',
    transition: 'transform .15s ease, box-shadow .15s ease',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: figmaSpacing[3],
  },
  livePill: {
    display: 'flex',
    alignItems: 'center',
    gap: figmaSpacing[1],
    padding: `${figmaSpacing[1]} ${figmaSpacing[2]}`,
    borderRadius: figmaRadius.full,
    backgroundColor: figmaColors.status.live,
    color: figmaColors.text.primary,
    fontSize: figmaTypography.fontSize.xs,
    fontWeight: figmaTypography.fontWeight.extrabold,
    letterSpacing: '0.05em',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: figmaRadius.full,
    background: figmaColors.text.primary,
  },
  timePill: {
    padding: `${figmaSpacing[1]} ${figmaSpacing[2]}`,
    borderRadius: figmaRadius.full,
    backgroundColor: figmaColors.primary,
    border: `1px solid ${figmaColors.border.primary}`,
    color: figmaColors.text.muted,
    fontSize: figmaTypography.fontSize.xs,
    fontFamily: figmaTypography.fontFamily.mono,
  },
  scheduledPill: {
    padding: `${figmaSpacing[1]} ${figmaSpacing[2]}`,
    borderRadius: figmaRadius.full,
    backgroundColor: figmaColors.secondary,
    border: `1px solid ${figmaColors.border.primary}`,
    color: figmaColors.text.muted,
    fontSize: figmaTypography.fontSize.xs,
    fontWeight: figmaTypography.fontWeight.bold,
    letterSpacing: '0.04em',
  },
  scoresRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: figmaSpacing[3],
    marginBottom: figmaSpacing[2],
  },
  score: {
    fontSize: '1.75rem',
    fontWeight: figmaTypography.fontWeight.extrabold,
    color: figmaColors.text.primary,
    transition: 'opacity .2s ease, transform .2s ease',
  },
  scoreDash: {
    color: figmaColors.text.muted,
    fontSize: figmaTypography.fontSize.base,
  },
  teamsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: figmaSpacing[2],
  },
  teamName: {
    color: figmaColors.text.primary,
    fontSize: figmaTypography.fontSize.sm,
    fontWeight: figmaTypography.fontWeight.semibold,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    maxWidth: '47%',
  },
};

export default LiveGameCard;


