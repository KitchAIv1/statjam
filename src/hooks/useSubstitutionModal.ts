'use client';

import { useState, useEffect } from 'react';
import { notify } from '@/lib/services/notificationService';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  is_custom_player?: boolean;
}

type ModalStep = 'team-selection' | 'player-out-selection' | 'player-in-selection';

interface UseSubstitutionModalProps {
  isOpen: boolean;
  teamAOnCourt: Player[];
  teamABench: Player[];
  teamBOnCourt: Player[];
  teamBBench: Player[];
}

export function useSubstitutionModal({
  isOpen,
  teamAOnCourt,
  teamABench,
  teamBOnCourt,
  teamBBench
}: UseSubstitutionModalProps) {
  const [currentStep, setCurrentStep] = useState<ModalStep>('team-selection');
  const [selectedTeam, setSelectedTeam] = useState<'teamA' | 'teamB' | null>(null);
  const [selectedPlayerOut, setSelectedPlayerOut] = useState<string | null>(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedPlayersIn, setSelectedPlayersIn] = useState<Set<string>>(new Set());
  const [localPlayers, setLocalPlayers] = useState<{ onCourt: Player[]; bench: Player[] }>({
    onCourt: [],
    bench: []
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('team-selection');
      setSelectedTeam(null);
      setSelectedPlayerOut(null);
      setSelectedPlayersIn(new Set());
      setMultiSelectMode(false);
      setLocalPlayers({ onCourt: [], bench: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedTeam) {
      if (selectedTeam === 'teamA') {
        setLocalPlayers({
          onCourt: teamAOnCourt,
          bench: teamABench
        });
      } else {
        setLocalPlayers({
          onCourt: teamBOnCourt,
          bench: teamBBench
        });
      }
    }
  }, [selectedTeam, teamAOnCourt, teamABench, teamBOnCourt, teamBBench]);

  const handleTeamSelect = (teamId: 'teamA' | 'teamB') => {
    setSelectedTeam(teamId);
    setCurrentStep('player-out-selection');
  };

  const handlePlayerOutSelect = (playerId: string) => {
    setSelectedPlayerOut(playerId);
    setCurrentStep('player-in-selection');
    
    const filteredOnCourt = localPlayers.onCourt.filter(p => p.id !== playerId);
    const filteredBench = localPlayers.bench.filter(p => p.id !== playerId);
    setLocalPlayers({
      onCourt: filteredOnCourt,
      bench: filteredBench
    });
  };

  const handlePlayerInClick = (playerId: string) => {
    // ✅ In single-select mode, just select the player (don't auto-close)
    // ✅ In multi-select mode, toggle selection
    if (multiSelectMode) {
      setSelectedPlayersIn(prev => {
        const next = new Set(prev);
        if (next.has(playerId)) {
          next.delete(playerId);
        } else {
          next.add(playerId);
        }
        return next;
      });
    } else {
      // Single-select mode: replace selection (only one player at a time)
      setSelectedPlayersIn(new Set([playerId]));
    }
  };

  const handleSelectAllBench = () => {
    const allBenchIds = new Set(localPlayers.bench.map(p => p.id));
    setSelectedPlayersIn(allBenchIds);
  };

  const handleDeselectAll = () => {
    setSelectedPlayersIn(new Set());
  };

  const handleConfirm = (onConfirm: (playerOutId: string, playerInIds: string[]) => void, onClose: () => void) => {
    // ✅ Validation: Check if player out is selected
    if (!selectedPlayerOut) {
      notify.error('No Player Selected', 'Please select a player coming out first');
      return;
    }
    
    // ✅ Validation: Check if at least one player in is selected
    if (selectedPlayersIn.size === 0) {
      notify.warning('No Players Selected', 'Please select at least one player to substitute in');
      return;
    }

    // ✅ Validation: Ensure player coming in is not the same as player coming out
    if (selectedPlayersIn.has(selectedPlayerOut)) {
      notify.error('Invalid Selection', 'The player coming in cannot be the same as the player coming out');
      return;
    }

    // ✅ Validation: Check minimum players on court (at least 5)
    const playersComingIn = selectedPlayersIn.size;
    const playersComingOut = 1; // Always one player out
    const currentOnCourtCount = localPlayers.onCourt.length;
    const finalOnCourtCount = currentOnCourtCount - playersComingOut + playersComingIn;
    
    if (finalOnCourtCount < 5) {
      notify.error(
        'Invalid Substitution', 
        `At least 5 players must remain on the court. Current: ${currentOnCourtCount}, After sub: ${finalOnCourtCount}`
      );
      return;
    }

    // ✅ Validation: Ensure selected players exist in available lists
    const allAvailablePlayers = [...localPlayers.onCourt, ...localPlayers.bench];
    const invalidPlayers = Array.from(selectedPlayersIn).filter(
      playerId => !allAvailablePlayers.some(p => p.id === playerId)
    );
    
    if (invalidPlayers.length > 0) {
      notify.error('Invalid Selection', 'One or more selected players are not available');
      console.error('Invalid player IDs:', invalidPlayers);
      return;
    }

    // ✅ All validations passed - proceed with substitution
    try {
      onConfirm(selectedPlayerOut, Array.from(selectedPlayersIn));
      onClose();
    } catch (error) {
      console.error('❌ Error confirming substitution:', error);
      notify.error('Substitution Failed', 'An error occurred while processing the substitution');
    }
  };

  const handleBack = (teamAOnCourt: Player[], teamABench: Player[], teamBOnCourt: Player[], teamBBench: Player[]) => {
    if (currentStep === 'player-in-selection') {
      setCurrentStep('player-out-selection');
      setSelectedPlayersIn(new Set());
      setMultiSelectMode(false);
      
      if (selectedTeam === 'teamA') {
        const allPlayers = [...teamAOnCourt, ...teamABench];
        const playerOut = allPlayers.find(p => p.id === selectedPlayerOut);
        if (playerOut) {
          const isOnCourt = teamAOnCourt.some(p => p.id === selectedPlayerOut);
          setLocalPlayers({
            onCourt: isOnCourt ? teamAOnCourt : [...teamAOnCourt, playerOut],
            bench: isOnCourt ? [...teamABench, playerOut] : teamABench
          });
        }
      } else {
        const allPlayers = [...teamBOnCourt, ...teamBBench];
        const playerOut = allPlayers.find(p => p.id === selectedPlayerOut);
        if (playerOut) {
          const isOnCourt = teamBOnCourt.some(p => p.id === selectedPlayerOut);
          setLocalPlayers({
            onCourt: isOnCourt ? teamBOnCourt : [...teamBOnCourt, playerOut],
            bench: isOnCourt ? [...teamBBench, playerOut] : teamBBench
          });
        }
      }
    } else if (currentStep === 'player-out-selection') {
      setCurrentStep('team-selection');
      setSelectedTeam(null);
      setSelectedPlayerOut(null);
      setLocalPlayers({ onCourt: [], bench: [] });
    }
  };

  const handleJerseyUpdate = (playerId: string, updatedPlayer: Player) => {
    setLocalPlayers(prev => ({
      onCourt: prev.onCourt.map(p => p.id === playerId ? updatedPlayer : p),
      bench: prev.bench.map(p => p.id === playerId ? updatedPlayer : p)
    }));
  };

  return {
    currentStep,
    selectedTeam,
    selectedPlayerOut,
    multiSelectMode,
    setMultiSelectMode,
    selectedPlayersIn,
    setSelectedPlayersIn,
    localPlayers,
    setLocalPlayers,
    handleTeamSelect,
    handlePlayerOutSelect,
    handlePlayerInClick,
    handleSelectAllBench,
    handleDeselectAll,
    handleConfirm,
    handleBack,
    handleJerseyUpdate
  };
}

