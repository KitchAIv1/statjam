'use client';

import React from 'react';
import { TournamentHeader, TeamSection, GameClockSection } from './ScoreOverlaySections';
import { LiveStreamSize } from './LiveStreamPlayer';

/**
 * Enhanced ScoreOverlay Component
 * 
 * Professional basketball broadcast-style overlay with:
 * - Team logos and colors
 * - Foul counts with bonus indicator
 * - Timeout indicators
 * - Possession tracking
 * - Tournament branding
 * - Smooth animations
 * 
 * Uses existing database columns:
 * - teams.logo_url, primary_color, secondary_color
 * - games.team_a_fouls, team_b_fouls
 * - games.team_a_timeouts_remaining, team_b_timeouts_remaining
 * - games.current_possession_team_id, jump_ball_arrow_team_id
 * - games.venue
 * - tournaments.name, tournaments.logo_url
 */

export interface EnhancedScoreOverlayProps {
  // Existing props
  teamAName: string;
  teamBName: string;
  homeScore: number;
  awayScore: number;
  quarter: number;
  gameClockMinutes: number;
  gameClockSeconds: number;
  shotClockSeconds?: number;
  
  // NEW props (from existing DB columns)
  teamALogo?: string;              // teams.logo_url
  teamBLogo?: string;              // teams.logo_url
  teamAPrimaryColor?: string;      // teams.primary_color
  teamBPrimaryColor?: string;      // teams.primary_color
  teamASecondaryColor?: string;    // teams.secondary_color
  teamBSecondaryColor?: string;    // teams.secondary_color
  teamAFouls: number;              // games.team_a_fouls
  teamBFouls: number;              // games.team_b_fouls
  teamATimeouts: number;           // games.team_a_timeouts_remaining
  teamBTimeouts: number;           // games.team_b_timeouts_remaining
  currentPossessionTeamId?: string;// games.current_possession_team_id
  jumpBallArrowTeamId?: string;    // games.jump_ball_arrow_team_id
  teamAId?: string;                // games.team_a_id (for possession comparison)
  teamBId?: string;                // games.team_b_id (for possession comparison)
  venue?: string;                  // games.venue
  tournamentName?: string;         // tournaments.name
  tournamentLogo?: string;         // tournaments.logo_url
  size?: LiveStreamSize;           // Overlay size variant
}

/**
 * Enhanced ScoreOverlay Component
 */
export function EnhancedScoreOverlay({
  teamAName,
  teamBName,
  homeScore,
  awayScore,
  quarter,
  gameClockMinutes,
  gameClockSeconds,
  shotClockSeconds,
  teamALogo,
  teamBLogo,
  teamAPrimaryColor,
  teamBPrimaryColor,
  teamASecondaryColor,
  teamBSecondaryColor,
  teamAFouls,
  teamBFouls,
  teamATimeouts,
  teamBTimeouts,
  currentPossessionTeamId,
  jumpBallArrowTeamId,
  teamAId,
  teamBId,
  venue,
  tournamentName,
  tournamentLogo,
  size = 'expanded',
}: EnhancedScoreOverlayProps) {
  // Size variants for proportional scaling
  const sizeVariants = {
    compact: {
      scoreSize: 'clamp(1.5rem, 8vw, 2.5rem)',
      teamNameSize: 'clamp(0.625rem, 2vw, 0.75rem)',
      logoSize: 'clamp(1rem, 4vw, 1.5rem)',
      padding: 'clamp(0.375rem, 1.5vw, 0.75rem)',
      gap: 'clamp(0.5rem, 1.5vw, 1rem)',
    },
    expanded: {
      scoreSize: 'clamp(2.5rem, 6vw, 4rem)',
      teamNameSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
      logoSize: 'clamp(1.5rem, 3vw, 2rem)',
      padding: 'clamp(0.75rem, 2vw, 1.25rem)',
      gap: 'clamp(1rem, 2vw, 1.5rem)',
    },
    fullscreen: {
      scoreSize: 'clamp(4rem, 5vw, 6rem)',
      teamNameSize: 'clamp(1rem, 1.2vw, 1.25rem)',
      logoSize: 'clamp(2rem, 2.5vw, 3rem)',
      padding: 'clamp(1.25rem, 2vw, 2rem)',
      gap: 'clamp(1.5rem, 2vw, 2rem)',
    },
  };

  const variant = sizeVariants[size];
  
  // Determine possession
  const teamAHasPossession = currentPossessionTeamId === teamAId;
  const teamBHasPossession = currentPossessionTeamId === teamBId;
  const teamAHasArrow = jumpBallArrowTeamId === teamAId;
  const teamBHasArrow = jumpBallArrowTeamId === teamBId;
  
  // Bonus indicators (5+ fouls = bonus)
  const teamAIsBonus = teamAFouls >= 5;
  const teamBIsBonus = teamBFouls >= 5;
  
  // Default colors if not provided
  const teamAColor = teamAPrimaryColor || '#3b82f6';
  const teamBColor = teamBPrimaryColor || '#ef4444';
  
  return (
    <div
      className="absolute top-0 left-0 right-0 pointer-events-none z-10"
      style={{
        '--score-size': variant.scoreSize,
        '--team-name-size': variant.teamNameSize,
        '--logo-size': variant.logoSize,
        '--padding': variant.padding,
        '--gap': variant.gap,
      } as React.CSSProperties}
    >
      <TournamentHeader
        tournamentName={tournamentName}
        tournamentLogo={tournamentLogo}
        venue={venue}
      />
      
      <div className="bg-gradient-to-b from-black/95 via-black/90 to-transparent backdrop-blur-md">
        <div
          className="max-w-7xl mx-auto"
          style={{ padding: 'var(--padding, 1rem)' }}
        >
          <div
            className="flex items-center justify-between"
            style={{ gap: 'var(--gap, 2rem)' }}
          >
            <TeamSection
              teamName={teamAName}
              teamLogo={teamALogo}
              score={awayScore}
              fouls={teamAFouls}
              timeouts={teamATimeouts}
              isBonus={teamAIsBonus}
              hasPossession={teamAHasPossession}
              hasArrow={teamAHasArrow}
              teamColor={teamAColor}
              primaryColor={teamAPrimaryColor}
              isHome={false}
            />
            
            <GameClockSection
              gameClockMinutes={gameClockMinutes}
              gameClockSeconds={gameClockSeconds}
              quarter={quarter}
              shotClockSeconds={shotClockSeconds}
            />
            
            <TeamSection
              teamName={teamBName}
              teamLogo={teamBLogo}
              score={homeScore}
              fouls={teamBFouls}
              timeouts={teamBTimeouts}
              isBonus={teamBIsBonus}
              hasPossession={teamBHasPossession}
              hasArrow={teamBHasArrow}
              teamColor={teamBColor}
              primaryColor={teamBPrimaryColor}
              isHome={true}
            />
          </div>
        </div>
        <div className="h-8 bg-gradient-to-b from-transparent to-transparent"></div>
      </div>
    </div>
  );
}

