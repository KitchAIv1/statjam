/**
 * TeamMatchupCard - Reusable Matchup Display Component
 * 
 * PURPOSE: Display team matchup with split-screen design
 * - Shows completed games with scores and winner trophy
 * - Shows scheduled games with "VS" and game time
 * - Shows in-progress games with live scores
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Trophy, Clock } from 'lucide-react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { PhaseRibbon } from './PhaseRibbon';

export interface TeamMatchupCardProps {
  teamA: {
    id?: string;
    name: string;
    logo?: string;
    score?: number;
    bgColor?: string;
    textColor?: string;
  };
  teamB: {
    id?: string;
    name: string;
    logo?: string;
    score?: number;
    bgColor?: string;
    textColor?: string;
  };
  /** When provided with team ids, team sections become clickable links */
  tournamentId?: string;
  gameId: string;
  gameStatus: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  gameDate?: string;
  gamePhase?: 'regular' | 'playoffs' | 'finals';
  onClick?: () => void;
}

export function TeamMatchupCard({
  teamA,
  teamB,
  tournamentId,
  gameStatus,
  gameDate,
  gamePhase,
  onClick
}: TeamMatchupCardProps) {
  const isCompleted = gameStatus === 'completed';
  const isScheduled = gameStatus === 'scheduled';
  const isInProgress = gameStatus === 'in_progress';
  const isCancelled = gameStatus === 'cancelled';

  // Determine winner for completed games
  const teamAScore = teamA.score ?? 0;
  const teamBScore = teamB.score ?? 0;
  const teamAWins = isCompleted && teamAScore > teamBScore;
  const teamBWins = isCompleted && teamBScore > teamAScore;
  const isTie = isCompleted && teamAScore === teamBScore;

  // Default colors
  const teamABg = teamA.bgColor || '#000000';
  const teamBBg = teamB.bgColor || '#FFFFFF';
  const teamAText = teamA.textColor || '#FFFFFF';
  const teamBText = teamB.textColor || '#000000';

  // Format game date/time for all game statuses (always shows date + time)
  const formatGameDateTime = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  // Phase-based styling - FINALS gets championship glow, PLAYOFFS gets intensity border
  const isFinals = gamePhase === 'finals';
  const isPlayoffs = gamePhase === 'playoffs';
  
  const borderClass = isFinals 
    ? 'border-amber-400 border-[3px] animate-championship-glow' 
    : isPlayoffs 
      ? 'border-orange-500 border-2 animate-playoffs-intensity'
      : 'border-2 border-white/20';

  return (
    <div
      onClick={onClick}
      className={`relative flex h-48 w-80 flex-shrink-0 overflow-hidden rounded-xl transition-transform duration-200 hover:scale-[1.02] hover:shadow-xl ${
        onClick ? 'cursor-pointer' : ''
      } ${isCancelled ? 'opacity-60' : ''} ${borderClass}`}
      style={{ aspectRatio: '16/9' }}
    >
      {/* Phase Ribbon - Corner badge, doesn't break split-screen layout */}
      <PhaseRibbon phase={gamePhase} position="top-left" />
      
      {/* Team A Section (Left) - Side by side with Team B */}
      {tournamentId && teamA.id ? (
        <Link
          href={`/t/${tournamentId}/team/${teamA.id}`}
          className="relative flex flex-1 items-center justify-center overflow-hidden hover:opacity-90 transition-opacity"
          style={{ backgroundColor: teamABg, color: teamAText }}
          onClick={(e) => e.stopPropagation()}
        >
          {teamA.logo ? (
            <ImageWithFallback
              src={teamA.logo}
              alt={teamA.name}
              className="h-full w-full object-cover"
              fallback={
                <div className="flex h-full w-full items-center justify-center bg-white/10 text-4xl font-bold">
                  {teamA.name.substring(0, 2).toUpperCase()}
                </div>
              }
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/10 text-4xl font-bold">
              {teamA.name.substring(0, 2).toUpperCase()}
            </div>
          )}
        </Link>
      ) : (
        <div
          className="relative flex flex-1 items-center justify-center overflow-hidden"
          style={{ backgroundColor: teamABg, color: teamAText }}
        >
          {teamA.logo ? (
            <ImageWithFallback
              src={teamA.logo}
              alt={teamA.name}
              className="h-full w-full object-cover"
              fallback={
                <div className="flex h-full w-full items-center justify-center bg-white/10 text-4xl font-bold">
                  {teamA.name.substring(0, 2).toUpperCase()}
                </div>
              }
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/10 text-4xl font-bold">
              {teamA.name.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Score Badge (Floating) - Compact rectangle */}
      {!isScheduled && !isCancelled && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded bg-[#FF5757] px-5 py-1 shadow-lg min-w-[140px]">
          {/* Trophy on Winner Side */}
          {teamAWins && (
            <Trophy className="h-5 w-5 text-yellow-300 drop-shadow-md flex-shrink-0" />
          )}
          
          {/* Score Display */}
          <div className="flex items-center gap-3 font-mono text-xl font-black text-white">
            <span>{teamAScore}</span>
            <span className="opacity-75">-</span>
            <span>{teamBScore}</span>
          </div>

          {/* Trophy on Winner Side */}
          {teamBWins && (
            <Trophy className="h-5 w-5 text-yellow-300 drop-shadow-md flex-shrink-0" />
          )}
        </div>
      )}


      {/* Cancelled Badge - Compact rectangle */}
      {isCancelled && (
        <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded bg-gray-800/90 px-3 py-1 text-xs text-white shadow-lg">
          CANCELLED
        </div>
      )}

      {/* Date/Time Badge - Top Center (for all statuses) - Compact rectangle */}
      {gameDate && (
        <div className="absolute top-2 left-1/2 z-10 -translate-x-1/2 flex items-center gap-1 rounded bg-black/70 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white shadow-lg">
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span>{formatGameDateTime(gameDate)}</span>
        </div>
      )}

      {/* Live Indicator for In-Progress - Compact rectangle */}
      {isInProgress && (
        <div className="absolute top-2 right-2 z-10 rounded bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
          LIVE
        </div>
      )}

      {/* Team B Section (Right) */}
      {tournamentId && teamB.id ? (
        <Link
          href={`/t/${tournamentId}/team/${teamB.id}`}
          className="relative flex flex-1 items-center justify-center overflow-hidden hover:opacity-90 transition-opacity"
          style={{ backgroundColor: teamBBg, color: teamBText }}
          onClick={(e) => e.stopPropagation()}
        >
          {teamB.logo ? (
            <ImageWithFallback
              src={teamB.logo}
              alt={teamB.name}
              className="h-full w-full object-cover"
              fallback={
                <div className="flex h-full w-full items-center justify-center bg-black/10 text-4xl font-bold">
                  {teamB.name.substring(0, 2).toUpperCase()}
                </div>
              }
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-black/10 text-4xl font-bold">
              {teamB.name.substring(0, 2).toUpperCase()}
            </div>
          )}
        </Link>
      ) : (
        <div
          className="relative flex flex-1 items-center justify-center overflow-hidden"
          style={{ backgroundColor: teamBBg, color: teamBText }}
        >
          {teamB.logo ? (
            <ImageWithFallback
              src={teamB.logo}
              alt={teamB.name}
              className="h-full w-full object-cover"
              fallback={
                <div className="flex h-full w-full items-center justify-center bg-black/10 text-4xl font-bold">
                  {teamB.name.substring(0, 2).toUpperCase()}
                </div>
              }
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-black/10 text-4xl font-bold">
              {teamB.name.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

