/**
 * CompactPlayByPlayFeed - Sidebar Play Feed
 * 
 * PURPOSE: Display a condensed play-by-play feed for the Command Center sidebar.
 * Reuses existing components for consistency with public game viewer.
 * 
 * @module CompactPlayByPlayFeed
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PlayByPlayEntry } from '@/lib/types/playByPlay';
import { ListVideo, Clock } from 'lucide-react';
import { PlayerAvatarCard } from '@/app/game-viewer/[gameId]/components/PlayerAvatarCard';
import { ActionIcon } from '@/app/game-viewer/[gameId]/components/ActionIcon';
import { PlayClipButton } from '@/app/game-viewer/[gameId]/components/PlayClipButton';
import { formatGameTime, getScoringInfo, getEnhancedPlayDescription } from '@/lib/utils/gameViewerUtils';
import { GeneratedClip } from '@/lib/services/clipService';

interface CompactPlayByPlayFeedProps {
  plays: PlayByPlayEntry[];
  teamAName: string;
  teamBName: string;
  isLive: boolean;
  /** Map of stat_event_id to clip for quick lookup */
  clipMap?: Map<string, GeneratedClip>;
}

// Get background color for stat type (light theme, compact badges)
const getStatBadgeStyles = (statType: string, modifier?: string): string => {
  if (statType === 'field_goal' || statType === 'three_pointer' || statType === 'free_throw') {
    return modifier === 'made' 
      ? 'bg-green-100 text-green-700 border-green-200' 
      : 'bg-red-50 text-red-600 border-red-200';
  }
  const styles: Record<string, string> = {
    rebound: 'bg-blue-100 text-blue-700 border-blue-200',
    assist: 'bg-purple-100 text-purple-700 border-purple-200',
    steal: 'bg-teal-100 text-teal-700 border-teal-200',
    block: 'bg-red-100 text-red-700 border-red-200',
    turnover: 'bg-amber-100 text-amber-700 border-amber-200',
    foul: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    substitution: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  };
  return styles[statType] || 'bg-gray-100 text-gray-600 border-gray-200';
};

export function CompactPlayByPlayFeed({ plays, teamAName, teamBName, isLive, clipMap }: CompactPlayByPlayFeedProps) {
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
      {/* Header with Score */}
      <div className="sticky top-0 z-10 bg-white border-b border-orange-200">
        <div className="px-3 py-2 flex items-center gap-2">
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
        {/* Score Bar */}
        {plays.length > 0 && plays[0].scoreAfter && (
          <div className="px-3 py-1.5 bg-orange-50 border-t border-orange-100 flex items-center justify-center gap-3 text-xs">
            <span className="font-semibold text-gray-700">{teamAName}</span>
            <span className="font-bold text-orange-600">{plays[0].scoreAfter.home}</span>
            <span className="text-gray-400">-</span>
            <span className="font-bold text-gray-600">{plays[0].scoreAfter.away}</span>
            <span className="font-semibold text-gray-700">{teamBName}</span>
          </div>
        )}
      </div>

      {/* Plays List */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-orange-100">
          {plays.map((play, index) => {
            const isLatest = index === 0;
            const scoringInfo = getScoringInfo(play.statType || '', play.modifier);
            const clip = clipMap?.get(play.id);
            
            return (
              <motion.div
                key={play.id || index}
                initial={isLatest && isLive ? { opacity: 0, x: -10 } : false}
                animate={{ opacity: 1, x: 0 }}
                className={`px-3 py-2.5 hover:bg-orange-50 transition-colors ${
                  isLatest ? 'bg-orange-50 border-l-2 border-l-orange-500' : 'bg-white'
                }`}
              >
                {/* Time Row */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-[10px] font-bold">
                    Q{play.quarter}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span className="font-medium">{formatGameTime(play.gameTimeMinutes, play.gameTimeSeconds)}</span>
                  </div>
                  {isLatest && (
                    <span className="ml-auto text-[9px] font-bold text-orange-500 uppercase">Latest</span>
                  )}
                </div>

                {/* Main Content Row */}
                <div className="flex items-start gap-2">
                  {/* Player Avatar */}
                  <PlayerAvatarCard
                    playerName={play.playerName || 'Unknown'}
                    teamName={play.teamName || ''}
                    photoUrl={play.playerPhotoUrl}
                    size="sm"
                    animate={false}
                  />

                  {/* Play Details */}
                  <div className="flex-1 min-w-0">
                    {/* Action + Description */}
                    <div className="flex items-start gap-1.5">
                      <ActionIcon type={play.statType || 'unknown'} size="sm" animate={false} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 leading-tight">
                          {getEnhancedPlayDescription(play.description, play.statType, play.modifier)}
                        </p>
                        <p className="text-[10px] text-orange-600 font-medium truncate">
                          {play.playerName || 'Unknown'} • {play.teamName}
                        </p>
                      </div>
                    </div>

                    {/* Stat Badge + Score */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getStatBadgeStyles(play.statType || '', play.modifier)}`}>
                        {play.statType?.replace(/_/g, ' ').toUpperCase() || 'EVENT'}
                        {play.modifier && play.modifier !== 'made' && play.modifier !== 'missed' && (
                          <span className="ml-1 opacity-75">({play.modifier})</span>
                        )}
                      </span>
                      {/* Score After */}
                      {play.scoreAfter && (
                        <span className="text-[10px] text-gray-500">
                          {play.scoreAfter.home}-{play.scoreAfter.away}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Points Indicator (Right) */}
                  <div className="flex-shrink-0 flex flex-col items-end">
                    {scoringInfo && (
                      <>
                        <span className={`text-lg font-extrabold leading-none ${
                          play.statType === 'three_pointer' ? 'text-orange-600' :
                          play.statType === 'field_goal' ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          +{scoringInfo.points}
                        </span>
                        <span className={`text-[8px] font-bold uppercase ${
                          play.statType === 'three_pointer' ? 'text-orange-500' :
                          play.statType === 'field_goal' ? 'text-green-500' : 'text-blue-500'
                        }`}>
                          {scoringInfo.points === 1 ? 'PT' : 'PTS'}
                        </span>
                      </>
                    )}
                    {/* Miss Indicator */}
                    {!scoringInfo && ['field_goal', 'three_pointer', 'free_throw'].includes(play.statType || '') && (
                      <span className="text-xs font-bold text-gray-400 uppercase">MISS</span>
                    )}
                    {/* Clip Button - Below score/miss */}
                    {clip && (
                      <div className="mt-1">
                        <PlayClipButton clip={clip} playerName={play.playerName} isDark={false} />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

