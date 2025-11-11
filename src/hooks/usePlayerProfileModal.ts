"use client";

import { useState, useCallback } from 'react';

/**
 * Hook to manage PlayerProfileModal state
 * 
 * Usage:
 * ```tsx
 * const { openModal, closeModal, isOpen, playerId } = usePlayerProfileModal();
 * 
 * // Open modal for a player
 * <button onClick={() => openModal('player-id-123')}>View Profile</button>
 * 
 * // Render modal
 * <PlayerProfileModal isOpen={isOpen} onClose={closeModal} playerId={playerId || ''} />
 * ```
 */
export function usePlayerProfileModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);

  const openModal = useCallback((id: string) => {
    setPlayerId(id);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Clear playerId after animation completes
    setTimeout(() => setPlayerId(null), 200);
  }, []);

  return {
    isOpen,
    playerId,
    openModal,
    closeModal,
  };
}

