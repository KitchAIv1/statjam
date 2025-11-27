/**
 * GameAwardsSection Component
 * 
 * Displays Player of the Game and Hustle Player awards for completed games
 * ✅ OPTIMIZED: Accepts prefetched data for instant display
 * 
 * @module GameAwardsSection
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Star } from 'lucide-react';
import { AwardedPlayer } from '@/hooks/useGameAwards';

interface GameAwardsSectionProps {
  isDark?: boolean;
  // ✅ OPTIMIZED: Accept prefetched data
  prefetchedData?: {
    playerOfTheGame: AwardedPlayer | null;
    hustlePlayer: AwardedPlayer | null;
  };
  loading?: boolean;
}

export function GameAwardsSection({ 
  isDark = true,
  prefetchedData,
  loading = false
}: GameAwardsSectionProps) {
  const playerOfTheGame = prefetchedData?.playerOfTheGame || null;
  const hustlePlayer = prefetchedData?.hustlePlayer || null;

  if (loading) {
    return (
      <div className={`rounded-lg p-6 ${isDark ? 'bg-slate-800' : 'bg-white'} animate-pulse`}>
        <div className="h-6 w-32 bg-gray-300 rounded mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-40 bg-gray-200 rounded-lg" />
          <div className="h-40 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!playerOfTheGame && !hustlePlayer) {
    return null; // No awards to display
  }

  const getInitials = (name: string) => {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return words.map(w => w[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`rounded-lg p-6 space-y-4 ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-orange-200 shadow-sm'
      } border`}
    >
      <h3 className={`text-xl font-bold pb-3 border-b flex items-center gap-2 ${
        isDark ? 'text-foreground border-slate-700' : 'text-gray-900 border-orange-200'
      }`}>
        <Star className="w-5 h-5 text-amber-500" />
        Game Awards
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Player of the Game */}
        {playerOfTheGame && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className={`relative overflow-hidden rounded-xl p-4 ${
              isDark 
                ? 'bg-gradient-to-br from-amber-600/20 to-yellow-600/10 border border-amber-500/30' 
                : 'bg-gradient-to-br from-amber-100 to-yellow-50 border border-amber-300'
            }`}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className={`text-sm font-bold uppercase tracking-wider ${
                isDark ? 'text-amber-400' : 'text-amber-700'
              }`}>
                Player of the Game
              </span>
            </div>

            {/* Player Info */}
            <div className="flex items-center gap-4">
              {/* Photo */}
              <div className="relative">
                {playerOfTheGame.photoUrl ? (
                  <img
                    src={playerOfTheGame.photoUrl}
                    alt={playerOfTheGame.name}
                    className="w-16 h-16 rounded-full object-cover border-3 border-amber-500 shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {getInitials(playerOfTheGame.name)}
                  </div>
                )}
                {playerOfTheGame.jerseyNumber && (
                  <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    #{playerOfTheGame.jerseyNumber}
                  </div>
                )}
              </div>

              {/* Name & Stats */}
              <div className="flex-1">
                <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {playerOfTheGame.name}
                </h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  <StatBadge label="PTS" value={playerOfTheGame.stats.points} isDark={isDark} highlight />
                  <StatBadge label="REB" value={playerOfTheGame.stats.rebounds} isDark={isDark} />
                  <StatBadge label="AST" value={playerOfTheGame.stats.assists} isDark={isDark} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Hustle Player */}
        {hustlePlayer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className={`relative overflow-hidden rounded-xl p-4 ${
              isDark 
                ? 'bg-gradient-to-br from-teal-600/20 to-cyan-600/10 border border-teal-500/30' 
                : 'bg-gradient-to-br from-teal-100 to-cyan-50 border border-teal-300'
            }`}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-teal-500" />
              <span className={`text-sm font-bold uppercase tracking-wider ${
                isDark ? 'text-teal-400' : 'text-teal-700'
              }`}>
                Hustle Player
              </span>
            </div>

            {/* Player Info */}
            <div className="flex items-center gap-4">
              {/* Photo */}
              <div className="relative">
                {hustlePlayer.photoUrl ? (
                  <img
                    src={hustlePlayer.photoUrl}
                    alt={hustlePlayer.name}
                    className="w-16 h-16 rounded-full object-cover border-3 border-teal-500 shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {getInitials(hustlePlayer.name)}
                  </div>
                )}
                {hustlePlayer.jerseyNumber && (
                  <div className="absolute -bottom-1 -right-1 bg-teal-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    #{hustlePlayer.jerseyNumber}
                  </div>
                )}
              </div>

              {/* Name & Stats */}
              <div className="flex-1">
                <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {hustlePlayer.name}
                </h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  <StatBadge label="STL" value={hustlePlayer.stats.steals} isDark={isDark} highlight />
                  <StatBadge label="BLK" value={hustlePlayer.stats.blocks} isDark={isDark} highlight />
                  <StatBadge label="REB" value={hustlePlayer.stats.rebounds} isDark={isDark} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Small stat badge component
function StatBadge({ 
  label, 
  value, 
  isDark,
  highlight = false 
}: { 
  label: string; 
  value: number; 
  isDark: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`px-2 py-1 rounded-md text-xs font-semibold ${
      highlight
        ? isDark 
          ? 'bg-white/20 text-white' 
          : 'bg-gray-900/10 text-gray-900'
        : isDark 
          ? 'bg-white/10 text-white/70' 
          : 'bg-gray-900/5 text-gray-600'
    }`}>
      <span className="font-bold">{value}</span>
      <span className="ml-1 opacity-70">{label}</span>
    </div>
  );
}

