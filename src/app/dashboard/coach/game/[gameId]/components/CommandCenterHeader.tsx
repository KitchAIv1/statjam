/**
 * CommandCenterHeader - Compact Game Scoreboard
 * 
 * PURPOSE: Display game score, status, and navigation in a compact header
 * for the Coach Command Center split-screen layout.
 * 
 * @module CommandCenterHeader
 */

'use client';

import React from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface CommandCenterHeaderProps {
  game: {
    teamAName: string;
    teamBName: string;
    teamALogo?: string;
    teamBLogo?: string;
    homeScore: number;
    awayScore: number;
    status: string;
    quarter: number;
    gameClockMinutes: number;
    gameClockSeconds: number;
    gamePhase?: string;
  };
  isLive: boolean;
}

export function CommandCenterHeader({ game, isLive }: CommandCenterHeaderProps) {
  const router = useRouter();
  
  const isCompleted = game.status?.toLowerCase() === 'completed';
  const clockDisplay = `${String(game.gameClockMinutes).padStart(2, '0')}:${String(game.gameClockSeconds).padStart(2, '0')}`;
  
  const getStatusLabel = () => {
    if (isCompleted) return 'FINAL';
    if (isLive) return `Q${game.quarter} • ${clockDisplay}`;
    if (game.gamePhase) return game.gamePhase.toUpperCase();
    return game.status?.toUpperCase() || 'SCHEDULED';
  };

  return (
    <header className="bg-white border-b border-orange-200 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Back Navigation */}
        <button
          onClick={() => router.push('/dashboard/coach')}
          className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">Dashboard</span>
        </button>

        {/* Game Score - Center */}
        <div className="flex items-center gap-4 sm:gap-8">
          {/* Team A */}
          <div className="flex items-center gap-2 sm:gap-3">
            {game.teamALogo ? (
              <Image
                src={game.teamALogo}
                alt={game.teamAName}
                width={32}
                height={32}
                className="rounded-full object-cover border-2 border-orange-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center border-2 border-orange-200">
                <span className="text-orange-600 font-bold text-xs">
                  {game.teamAName.charAt(0)}
                </span>
              </div>
            )}
            <div className="text-right">
              <div className="text-gray-900 font-semibold text-sm sm:text-base truncate max-w-[80px] sm:max-w-[120px]">
                {game.teamAName}
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-orange-600 tabular-nums">
              {game.homeScore}
            </div>
          </div>

          {/* Separator */}
          <div className="text-gray-400 text-lg font-light">-</div>

          {/* Team B */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-2xl sm:text-3xl font-bold text-gray-700 tabular-nums">
              {game.awayScore}
            </div>
            <div className="text-left">
              <div className="text-gray-900 font-semibold text-sm sm:text-base truncate max-w-[80px] sm:max-w-[120px]">
                {game.teamBName}
              </div>
            </div>
            {game.teamBLogo ? (
              <Image
                src={game.teamBLogo}
                alt={game.teamBName}
                width={32}
                height={32}
                className="rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                <span className="text-gray-600 font-bold text-xs">
                  {game.teamBName.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status Badge - Right */}
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
          <span className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded ${
            isCompleted 
              ? 'bg-gray-100 text-gray-700 border border-gray-200' 
              : isLive 
                ? 'bg-orange-100 text-orange-600 border border-orange-200' 
                : 'bg-orange-100 text-orange-600 border border-orange-200'
          }`}>
            {getStatusLabel()}
          </span>
        </div>
      </div>
    </header>
  );
}

