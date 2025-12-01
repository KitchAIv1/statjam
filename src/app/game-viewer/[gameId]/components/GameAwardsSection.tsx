/**
 * GameAwardsSection Component
 * 
 * Displays Player of the Game and Hustle Player awards for completed games
 * ✅ OPTIMIZED: Accepts prefetched data for instant display
 * ✅ REFACTORED: Uses reusable AwardDisplayCard component
 * 
 * @module GameAwardsSection
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { AwardedPlayer } from '@/hooks/useGameAwards';
import { AwardDisplayCard } from '@/components/tournament/AwardDisplayCard';
import { usePlayerProfileModal } from '@/hooks/usePlayerProfileModal';
import { PlayerProfileModal } from '@/components/player/PlayerProfileModal';

interface GameAwardsSectionProps {
  isDark?: boolean;
  // ✅ OPTIMIZED: Accept prefetched data
  prefetchedData?: {
    playerOfTheGame: AwardedPlayer | null;
    hustlePlayer: AwardedPlayer | null;
  };
  loading?: boolean;
  gameId: string; // Required for modal
}

export function GameAwardsSection({ 
  isDark = true,
  prefetchedData,
  loading = false,
  gameId
}: GameAwardsSectionProps) {
  const playerOfTheGame = prefetchedData?.playerOfTheGame || null;
  const hustlePlayer = prefetchedData?.hustlePlayer || null;
  
  // ✅ Modal state management
  const { isOpen, playerId, isCustomPlayer, gameStats, gameId: modalGameId, awardType, openModal, closeModal } = usePlayerProfileModal();

  if (loading) {
    return (
      <div className={`rounded-lg p-6 ${isDark ? 'bg-slate-800' : 'bg-white'} animate-pulse`}>
        <div className="h-6 w-32 bg-gray-300 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-40 bg-gray-200 rounded-lg" />
          <div className="h-40 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!playerOfTheGame && !hustlePlayer) {
    return null; // No awards to display
  }

  return (
    <>
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
            <AwardDisplayCard
              playerId={playerOfTheGame.id}
              playerName={playerOfTheGame.name}
              awardType="player_of_the_game"
              stats={playerOfTheGame.stats}
              profilePhotoUrl={playerOfTheGame.photoUrl}
              onClick={() => openModal(playerOfTheGame.id, {
                gameId,
                stats: playerOfTheGame.stats,
                awardType: 'player_of_the_game',
                isCustomPlayer: playerOfTheGame.isCustomPlayer
              })}
            />
          )}

          {/* Hustle Player */}
          {hustlePlayer && (
            <AwardDisplayCard
              playerId={hustlePlayer.id}
              playerName={hustlePlayer.name}
              awardType="hustle_player"
              stats={hustlePlayer.stats}
              profilePhotoUrl={hustlePlayer.photoUrl}
              onClick={() => openModal(hustlePlayer.id, {
                gameId,
                stats: hustlePlayer.stats,
                awardType: 'hustle_player',
                isCustomPlayer: hustlePlayer.isCustomPlayer
              })}
            />
          )}
        </div>
      </motion.div>

      {/* Player Profile Modal */}
      <PlayerProfileModal
        isOpen={isOpen}
        onClose={closeModal}
        playerId={playerId || ''}
        isCustomPlayer={isCustomPlayer}
        gameStats={gameStats}
        gameId={modalGameId}
        awardType={awardType}
      />
    </>
  );
}

