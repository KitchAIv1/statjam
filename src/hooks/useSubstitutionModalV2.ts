'use client';

import { useState, useEffect } from 'react';
import { notify } from '@/lib/services/notificationService';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  is_custom_player?: boolean;
}

interface UseSubstitutionModalV2Props {
  isOpen: boolean;
  teamAOnCourt: Player[];
  teamABench: Player[];
  teamBOnCourt: Player[];
  teamBBench: Player[];
  initialTeam?: 'teamA' | 'teamB' | null; // Optional: pre-select team based on context
}

export function useSubstitutionModalV2({
  isOpen,
  teamAOnCourt,
  teamABench,
  teamBOnCourt,
  teamBBench,
  initialTeam = null
}: UseSubstitutionModalV2Props) {
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedPlayersOut, setSelectedPlayersOut] = useState<Set<string>>(new Set()); // On-court players coming out
  const [selectedPlayersIn, setSelectedPlayersIn] = useState<Set<string>>(new Set()); // Bench players coming in
  const [activeTeam, setActiveTeam] = useState<'teamA' | 'teamB' | null>(initialTeam);
  const [previewSubstitutions, setPreviewSubstitutions] = useState<Map<string, string>>(new Map()); // playerOutId -> playerInId

  useEffect(() => {
    if (isOpen) {
      setMultiSelectMode(false);
      setSelectedPlayersOut(new Set());
      setSelectedPlayersIn(new Set());
      setPreviewSubstitutions(new Map());
      // If no initial team, default to teamA
      setActiveTeam(initialTeam || 'teamA');
    }
  }, [isOpen, initialTeam]);

  // Get current team's players
  const getCurrentTeamPlayers = () => {
    if (activeTeam === 'teamA') {
      return { onCourt: teamAOnCourt, bench: teamABench };
    } else if (activeTeam === 'teamB') {
      return { onCourt: teamBOnCourt, bench: teamBBench };
    }
    return { onCourt: [], bench: [] };
  };

  const handleOnCourtPlayerClick = (playerId: string) => {
    if (multiSelectMode) {
      // Multi-select: toggle selection
      setSelectedPlayersOut(prev => {
        const next = new Set(prev);
        if (next.has(playerId)) {
          next.delete(playerId);
          // Remove from preview if exists
          setPreviewSubstitutions(prevMap => {
            const nextMap = new Map(prevMap);
            nextMap.delete(playerId);
            return nextMap;
          });
        } else {
          next.add(playerId);
        }
        return next;
      });
    } else {
      // Single-select: replace selection
      setSelectedPlayersOut(new Set([playerId]));
      setSelectedPlayersIn(new Set());
      setPreviewSubstitutions(new Map());
    }
  };

  const handleBenchPlayerClick = (playerId: string) => {
    const { onCourt } = getCurrentTeamPlayers();
    
    if (multiSelectMode) {
      // Multi-select: need to match count exactly
      if (selectedPlayersOut.size === 0) {
        notify.warning('Select On-Court Players First', 'Please select on-court players before selecting bench players');
        return;
      }

      // Check if we've already selected enough bench players
      if (selectedPlayersIn.size >= selectedPlayersOut.size) {
        notify.warning('Too Many Players Selected', `You can only select ${selectedPlayersOut.size} bench player(s) to match ${selectedPlayersOut.size} on-court player(s)`);
        return;
      }

      // Add to selection
      setSelectedPlayersIn(prev => {
        const next = new Set(prev);
        if (next.has(playerId)) {
          next.delete(playerId);
          // Remove from preview
          setPreviewSubstitutions(prevMap => {
            const nextMap = new Map(prevMap);
            // Find which on-court player was paired with this bench player
            const playerOutId = Array.from(prevMap.entries()).find(([_, inId]) => inId === playerId)?.[0];
            if (playerOutId) {
              nextMap.delete(playerOutId);
            }
            return nextMap;
          });
        } else {
          next.add(playerId);
          // Add to preview - pair with next unpaired on-court player
          setPreviewSubstitutions(prevMap => {
            const nextMap = new Map(prevMap);
            // ✅ FIX: Check if on-court player (KEY) is already paired, not if bench player (VALUE) exists
            const unpairedOut = Array.from(selectedPlayersOut).find(
              outId => !prevMap.has(outId)
            );
            if (unpairedOut) {
              nextMap.set(unpairedOut, playerId);
            }
            return nextMap;
          });
        }
        return next;
      });
    } else {
      // Single-select: immediate preview
      if (selectedPlayersOut.size === 0) {
        notify.warning('Select On-Court Player First', 'Please select an on-court player before selecting a bench player');
        return;
      }

      const playerOutId = Array.from(selectedPlayersOut)[0];
      setSelectedPlayersIn(new Set([playerId]));
      setPreviewSubstitutions(new Map([[playerOutId, playerId]]));
    }
  };

  const handleDeselectOnCourt = (playerId: string) => {
    // Remove from preview first to get the paired bench player
    setPreviewSubstitutions(prevMap => {
      const nextMap = new Map(prevMap);
      const benchPlayerId = prevMap.get(playerId);
      if (benchPlayerId) {
        // Remove corresponding bench player from selection
        setSelectedPlayersIn(prev => {
          const next = new Set(prev);
          next.delete(benchPlayerId);
          return next;
        });
      }
      nextMap.delete(playerId);
      return nextMap;
    });
    // Remove from on-court selection
    setSelectedPlayersOut(prev => {
      const next = new Set(prev);
      next.delete(playerId);
      return next;
    });
  };

  const handleDeselectBench = (playerId: string) => {
    // Remove from preview first to find the paired on-court player
    setPreviewSubstitutions(prevMap => {
      const nextMap = new Map(prevMap);
      const playerOutId = Array.from(prevMap.entries()).find(([_, inId]) => inId === playerId)?.[0];
      if (playerOutId) {
        nextMap.delete(playerOutId);
      }
      return nextMap;
    });
    // Remove from selection
    setSelectedPlayersIn(prev => {
      const next = new Set(prev);
      next.delete(playerId);
      return next;
    });
  };

  const handleConfirm = (
    onConfirm: (substitutions: Array<{ playerOutId: string; playerInId: string }>) => void,
    onClose: () => void
  ) => {
    const { onCourt } = getCurrentTeamPlayers();

    // ✅ Validation: Check if on-court players are selected
    if (selectedPlayersOut.size === 0) {
      notify.error('No Players Selected', 'Please select at least one on-court player to substitute out');
      return;
    }

    // ✅ Validation: Check if bench players are selected
    if (selectedPlayersIn.size === 0) {
      notify.error('No Bench Players Selected', 'Please select bench players to substitute in');
      return;
    }

    // ✅ Validation: Counts must match exactly in multi-select mode
    if (multiSelectMode && selectedPlayersOut.size !== selectedPlayersIn.size) {
      notify.error(
        'Count Mismatch',
        `You selected ${selectedPlayersOut.size} on-court player(s) but ${selectedPlayersIn.size} bench player(s). Counts must match exactly.`
      );
      return;
    }

    // ✅ Validation: Ensure all pairs are valid
    if (previewSubstitutions.size !== selectedPlayersOut.size) {
      notify.error('Incomplete Pairing', 'Please ensure all on-court players are paired with bench players');
      return;
    }

    // ✅ Validation: Check minimum players on court (at least 5)
    const playersComingIn = selectedPlayersIn.size;
    const playersComingOut = selectedPlayersOut.size;
    const currentOnCourtCount = onCourt.length;
    const finalOnCourtCount = currentOnCourtCount - playersComingOut + playersComingIn;

    if (finalOnCourtCount < 5) {
      notify.error(
        'Invalid Substitution',
        `At least 5 players must remain on the court. Current: ${currentOnCourtCount}, After sub: ${finalOnCourtCount}`
      );
      return;
    }

    // ✅ Validation: Ensure selected players exist
    const allOnCourtIds = new Set(onCourt.map(p => p.id));
    const allBenchIds = new Set(getCurrentTeamPlayers().bench.map(p => p.id));
    
    const invalidOut = Array.from(selectedPlayersOut).filter(id => !allOnCourtIds.has(id));
    const invalidIn = Array.from(selectedPlayersIn).filter(id => !allBenchIds.has(id));

    if (invalidOut.length > 0 || invalidIn.length > 0) {
      notify.error('Invalid Selection', 'One or more selected players are not available');
      console.error('Invalid player IDs - Out:', invalidOut, 'In:', invalidIn);
      return;
    }

    // ✅ Convert preview to array format
    const substitutions = Array.from(previewSubstitutions.entries()).map(([playerOutId, playerInId]) => ({
      playerOutId,
      playerInId
    }));

    // ✅ All validations passed - proceed with substitution
    try {
      onConfirm(substitutions);
      onClose();
    } catch (error) {
      console.error('❌ Error confirming substitution:', error);
      notify.error('Substitution Failed', 'An error occurred while processing the substitution');
    }
  };

  const handleTeamSwitch = (team: 'teamA' | 'teamB') => {
    setActiveTeam(team);
    // Clear selections when switching teams
    setSelectedPlayersOut(new Set());
    setSelectedPlayersIn(new Set());
    setPreviewSubstitutions(new Map());
  };

  return {
    multiSelectMode,
    setMultiSelectMode,
    selectedPlayersOut,
    setSelectedPlayersOut,
    selectedPlayersIn,
    setSelectedPlayersIn,
    previewSubstitutions,
    setPreviewSubstitutions,
    activeTeam,
    handleOnCourtPlayerClick,
    handleBenchPlayerClick,
    handleDeselectOnCourt,
    handleDeselectBench,
    handleConfirm,
    handleTeamSwitch,
    getCurrentTeamPlayers
  };
}

