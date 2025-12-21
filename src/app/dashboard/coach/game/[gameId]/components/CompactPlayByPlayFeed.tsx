/**
 * CompactPlayByPlayFeed - Sidebar Play Feed
 * 
 * PURPOSE: Display a condensed play-by-play feed for the Command Center sidebar.
 * Compact cards with essential info, always visible, scrollable.
 * 
 * @module CompactPlayByPlayFeed
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PlayByPlayEntry } from '@/lib/types/playByPlay';
import { ListVideo } from 'lucide-react';

interface CompactPlayByPlayFeedProps {
  plays: PlayByPlayEntry[];
  teamAName: string;
  teamBName: string;
  isLive: boolean;
}

// Stat type to display text mapping
const getStatDisplay = (statType: string, modifier?: string): string => {
  const displays: Record<string, string> = {
    field_goal: modifier === 'made' ? '2PT' : '2PT MISS',
    three_pointer: modifier === 'made' ? '3PT' : '3PT MISS',
    free_throw: modifier === 'made' ? 'FT' : 'FT MISS',
    rebound: 'REB',
    assist: 'AST',
    steal: 'STL',
    block: 'BLK',
    turnover: 'TO',
    foul: 'FOUL',
    substitution: 'SUB',
  };
  return displays[statType] || statType.toUpperCase();
};

// Get color for stat type (light theme)
const getStatColor = (statType: string, modifier?: string): string => {
  if (statType === 'field_goal' || statType === 'three_pointer' || statType === 'free_throw') {
    return modifier === 'made' ? 'text-green-600' : 'text-red-500';
  }
  const colors: Record<string, string> = {
    rebound: 'text-blue-600',
    assist: 'text-purple-600',
    steal: 'text-yellow-600',
    block: 'text-orange-600',
    turnover: 'text-red-500',
    foul: 'text-amber-600',
    substitution: 'text-gray-500',
  };
  return colors[statType] || 'text-gray-500';
};

export function CompactPlayByPlayFeed({ plays, teamAName, teamBName, isLive }: CompactPlayByPlayFeedProps) {
  if (plays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center bg-orange-50/30">
        <div className="w-12 h-12 mb-4 rounded-full bg-orange-100 flex items-center justify-center">
          <span className="text-2xl">🏀</span>
        </div>
        <h3 className="text-sm font-semibold text-gray-700 mb-1">
          {isLive ? 'Game Starting...' : 'No Activity'}
        </h3>
        <p className="text-xs text-gray-500">
          Plays will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-orange-200 px-3 py-2 flex items-center gap-2">
        <ListVideo className="w-4 h-4 text-orange-500" />
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          Play-by-Play
        </span>
        {isLive && (
          <span className="ml-auto flex items-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
            </span>
            <span className="text-[10px] text-red-500 font-medium">LIVE</span>
          </span>
        )}
      </div>

      {/* Plays List */}
      <div className="flex-1 overflow-y-auto bg-orange-50/20">
        <div className="divide-y divide-orange-100">
          {plays.map((play, index) => (
            <motion.div
              key={play.id || index}
              initial={index === 0 && isLive ? { opacity: 0, x: -10 } : false}
              animate={{ opacity: 1, x: 0 }}
              className="px-3 py-2 hover:bg-orange-50 transition-colors bg-white"
            >
              <div className="flex items-start gap-2">
                {/* Stat Badge */}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 ${getStatColor(play.statType, play.modifier)}`}>
                  {getStatDisplay(play.statType, play.modifier)}
                </span>
                
                {/* Player & Description */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-900 font-medium truncate">
                    {play.playerName || 'Unknown'}
                  </div>
                  {play.description && (
                    <div className="text-[10px] text-gray-500 truncate">
                      {play.description}
                    </div>
                  )}
                </div>

                {/* Points (if scoring play) */}
                {play.points && play.points > 0 && (
                  <span className="text-xs font-bold text-green-600">
                    +{play.points}
                  </span>
                )}
              </div>

              {/* Quarter & Time */}
              <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400">
                <span>Q{play.quarter}</span>
                <span>•</span>
                <span>{play.gameClockDisplay || '--:--'}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

