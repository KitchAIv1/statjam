"use client";

import { useState, useCallback } from 'react';

export interface GameStats {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
}

/**
 * Hook to manage PlayerProfileModal state
 * 
 * Usage:
 * ```tsx
 * const { openModal, closeModal, isOpen, playerId, gameStats, gameId, awardType } = usePlayerProfileModal();
 * 
 * // Open modal for a player (regular)
 * <button onClick={() => openModal('player-id-123')}>View Profile</button>
 * 
 * // Open modal with game-specific stats (from awards)
 * <button onClick={() => openModal('player-id-123', { gameId: 'game-123', stats: {...}, awardType: 'player_of_the_game' })}>View Award</button>
 * 
 * // Render modal
 * <PlayerProfileModal 
 *   isOpen={isOpen} 
 *   onClose={closeModal} 
 *   playerId={playerId || ''} 
 *   gameStats={gameStats}
 *   gameId={gameId}
 *   awardType={awardType}
 * />
 * ```
 */
export function usePlayerProfileModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isCustomPlayer, setIsCustomPlayer] = useState<boolean>(false);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [awardType, setAwardType] = useState<'player_of_the_game' | 'hustle_player' | null>(null);

  const openModal = useCallback((id: string, options?: { gameId?: string; stats?: GameStats; awardType?: 'player_of_the_game' | 'hustle_player'; isCustomPlayer?: boolean }) => {
    setPlayerId(id);
    setIsCustomPlayer(options?.isCustomPlayer || false);
    setGameId(options?.gameId || null);
    setGameStats(options?.stats || null);
    setAwardType(options?.awardType || null);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Clear state after animation completes
    setTimeout(() => {
      setPlayerId(null);
      setIsCustomPlayer(false);
      setGameId(null);
      setGameStats(null);
      setAwardType(null);
    }, 200);
  }, []);

  return {
    isOpen,
    playerId,
    isCustomPlayer,
    gameStats,
    gameId,
    awardType,
    openModal,
    closeModal,
  };
}

