'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { TeamLogo, PossessionIndicator, JumpBallArrow, FoulCountBadge, TimeoutIndicator } from './ScoreOverlayComponents';

/**
 * Tournament Header Section
 */
export function TournamentHeader({
  tournamentName,
  tournamentLogo,
  venue,
}: {
  tournamentName?: string;
  tournamentLogo?: string;
  venue?: string;
}) {
  if (!tournamentName && !tournamentLogo) return null;

  return (
    <div className="bg-gradient-to-b from-black/90 to-transparent backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-2">
        <div className="flex items-center justify-center gap-2">
          {tournamentLogo && (
            <div className="relative w-6 h-6">
              <Image
                src={tournamentLogo}
                alt={tournamentName || 'Tournament'}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}
          {tournamentName && (
            <span className="text-xs text-gray-300 font-medium">
              {tournamentName}
            </span>
          )}
          {venue && (
            <span className="text-xs text-gray-400">
              • {venue}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Score Display Component (responsive with CSS variables)
 */
function ScoreDisplay({ score }: { score: number }) {
  return (
    <motion.div
      className="font-black text-white tabular-nums tracking-tight"
      style={{ fontSize: 'var(--score-size, 2.5rem)' }}
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 0.3,
        ease: 'easeOut',
      }}
      key={score}
    >
      {score}
    </motion.div>
  );
}

/**
 * Team Badge Header Component
 */
function TeamBadgeHeader({
  isHome,
  hasPossession,
  hasArrow,
  teamColor,
}: {
  isHome: boolean;
  hasPossession: boolean;
  hasArrow: boolean;
  teamColor: string;
}) {
  return (
    <div className={`flex items-center gap-2 mb-1 ${isHome ? 'justify-end' : ''}`}>
      {isHome && (
        <>
          <JumpBallArrow hasArrow={hasArrow} teamColor={teamColor} />
          <PossessionIndicator hasPossession={hasPossession} teamColor={teamColor} />
        </>
      )}
      <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
        {isHome ? 'Home' : 'Away'}
      </div>
      {!isHome && (
        <>
          <PossessionIndicator hasPossession={hasPossession} teamColor={teamColor} />
          <JumpBallArrow hasArrow={hasArrow} teamColor={teamColor} />
        </>
      )}
    </div>
  );
}

/**
 * Team Badge Stats Component
 */
function TeamBadgeStats({
  fouls,
  timeouts,
  isBonus,
  isHome,
}: {
  fouls: number;
  timeouts: number;
  isBonus: boolean;
  isHome: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 mt-1.5 ${isHome ? 'justify-end' : ''}`}>
      {isHome ? (
        <>
          <TimeoutIndicator remaining={timeouts} />
          <FoulCountBadge count={fouls} isBonus={isBonus} />
        </>
      ) : (
        <>
          <FoulCountBadge count={fouls} isBonus={isBonus} />
          <TimeoutIndicator remaining={timeouts} />
        </>
      )}
    </div>
  );
}

/**
 * Team Badge Component
 */
function TeamBadge({
  teamName,
  fouls,
  timeouts,
  isBonus,
  hasPossession,
  hasArrow,
  teamColor,
  primaryColor,
  isHome,
}: {
  teamName: string;
  fouls: number;
  timeouts: number;
  isBonus: boolean;
  hasPossession: boolean;
  hasArrow: boolean;
  teamColor: string;
  primaryColor?: string;
  isHome: boolean;
}) {
  return (
    <div
      className="bg-white/10 backdrop-blur-sm rounded-lg border transition-colors duration-300"
      style={{
        borderColor: primaryColor
          ? `${primaryColor}80`
          : 'rgba(255, 255, 255, 0.2)',
        padding: 'var(--padding, 1rem)',
      }}
    >
      <TeamBadgeHeader
        isHome={isHome}
        hasPossession={hasPossession}
        hasArrow={hasArrow}
        teamColor={teamColor}
      />
      <div
        className={`font-black text-white truncate max-w-[200px] ${isHome ? 'text-right' : ''}`}
        style={{ fontSize: 'var(--team-name-size, 1.25rem)' }}
      >
        {teamName}
      </div>
      <TeamBadgeStats
        fouls={fouls}
        timeouts={timeouts}
        isBonus={isBonus}
        isHome={isHome}
      />
    </div>
  );
}

/**
 * Team Section Component
 */
export function TeamSection({
  teamName,
  teamLogo,
  score,
  fouls,
  timeouts,
  isBonus,
  hasPossession,
  hasArrow,
  teamColor,
  primaryColor,
  isHome = false,
}: {
  teamName: string;
  teamLogo?: string;
  score: number;
  fouls: number;
  timeouts: number;
  isBonus: boolean;
  hasPossession: boolean;
  hasArrow: boolean;
  teamColor: string;
  primaryColor?: string;
  isHome?: boolean;
}) {
  if (isHome) {
    return (
      <div
        className="flex items-center flex-1 justify-end"
        style={{ gap: 'var(--gap, 1rem)' }}
      >
        <ScoreDisplay score={score} />
        <TeamBadge
          teamName={teamName}
          fouls={fouls}
          timeouts={timeouts}
          isBonus={isBonus}
          hasPossession={hasPossession}
          hasArrow={hasArrow}
          teamColor={teamColor}
          primaryColor={primaryColor}
          isHome={isHome}
        />
        <TeamLogo logoUrl={teamLogo} teamName={teamName} />
      </div>
    );
  }

  return (
    <div
      className="flex items-center flex-1"
      style={{ gap: 'var(--gap, 1rem)' }}
    >
      <TeamLogo logoUrl={teamLogo} teamName={teamName} />
      <TeamBadge
        teamName={teamName}
        fouls={fouls}
        timeouts={timeouts}
        isBonus={isBonus}
        hasPossession={hasPossession}
        hasArrow={hasArrow}
        teamColor={teamColor}
        primaryColor={primaryColor}
        isHome={isHome}
      />
      <ScoreDisplay score={score} />
    </div>
  );
}

/**
 * Game Clock Section Component
 */
export function GameClockSection({
  gameClockMinutes,
  gameClockSeconds,
  quarter,
  shotClockSeconds,
}: {
  gameClockMinutes: number;
  gameClockSeconds: number;
  quarter: number;
  shotClockSeconds?: number;
}) {
  const gameClockDisplay = `${gameClockMinutes}:${gameClockSeconds.toString().padStart(2, '0')}`;
  const quarterDisplay = quarter > 4 ? `OT${quarter - 4}` : `Q${quarter}`;

  return (
    <div className="flex flex-col items-center gap-2 min-w-[160px]">
      <div className="bg-red-600 rounded-lg px-6 py-2 shadow-lg">
        <div className="text-3xl font-black text-white tabular-nums tracking-wider">
          {gameClockDisplay}
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-1 border border-white/30">
        <div className="text-sm font-bold text-white tracking-wider">
          {quarterDisplay}
        </div>
      </div>
      {shotClockSeconds !== undefined && shotClockSeconds !== null && (
        <motion.div
          className={`rounded-lg px-3 py-1 ${
            shotClockSeconds <= 5 ? 'bg-red-500' : 'bg-orange-500/80'
          }`}
          animate={{
            scale: shotClockSeconds <= 5 ? [1, 1.1, 1] : 1,
          }}
          transition={{
            duration: 0.5,
            repeat: shotClockSeconds <= 5 ? Infinity : 0,
            repeatDelay: 0.5,
          }}
        >
          <div className="text-lg font-bold text-white tabular-nums">
            {shotClockSeconds}
          </div>
        </motion.div>
      )}
    </div>
  );
}

