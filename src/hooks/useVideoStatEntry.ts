'use client';

/**
 * useVideoStatEntry - Custom hook for video stat entry
 * 
 * Manages state and delegates handlers to useVideoStatHandlers.
 * Follows .cursorrules: <200 lines for hooks.
 * 
 * @module useVideoStatEntry
 */

import { useState, useEffect, useCallback } from 'react';
import { GameService } from '@/lib/services/gameService';
import { TeamService } from '@/lib/services/tournamentService';
import { useVideoStatPrompts } from '@/hooks/useVideoStatPrompts';
import { useVideoStatHandlers, OPPONENT_TEAM_ID, type Player } from '@/hooks/useVideoStatHandlers';
import type { GameClock } from '@/lib/types/video';

// Re-export types
export { OPPONENT_TEAM_ID, type Player };

export interface VideoStatHandlers {
  recordShot2PT: () => void;
  recordShot3PT: () => void;
  recordMiss2PT: () => void;
  recordMiss3PT: () => void;
  recordFTMade: () => void;
  recordFTMiss: () => void;
  recordRebound: () => void;
  recordAssist: () => void;
  recordSteal: () => void;
  recordBlock: () => void;
  recordTurnover: () => void;
  recordFoul: () => void;
  openSubstitutionModal: () => void;
  selectPlayerByIndex: (index: number) => void;
}

interface UseVideoStatEntryProps {
  gameId: string;
  videoId: string;
  currentVideoTimeMs: number;
  gameClock: GameClock | null;
  onStatRecorded?: (statType: string, statId?: string) => void;
  onBeforeRecord?: () => void;
  isCoachMode?: boolean;
  userId?: string;
  opponentName?: string;
  preloadedTeamAPlayers?: Player[];
  preloadedGameData?: any;
}

export function useVideoStatEntry(props: UseVideoStatEntryProps) {
  const {
    gameId, videoId, currentVideoTimeMs, gameClock,
    onStatRecorded, onBeforeRecord,
    isCoachMode = false, userId, opponentName,
    preloadedTeamAPlayers, preloadedGameData,
  } = props;

  // Core state
  const [loading, setLoading] = useState(!preloadedGameData);
  const [gameData, setGameData] = useState<any>(preloadedGameData || null);
  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>(preloadedTeamAPlayers || []);
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<'A' | 'B' | 'opponent'>('A');
  const [isRecording, setIsRecording] = useState(false);
  
  // Substitution state
  const [onCourtA, setOnCourtA] = useState<Player[]>([]);
  const [benchA, setBenchA] = useState<Player[]>([]);
  const [onCourtB, setOnCourtB] = useState<Player[]>([]);
  const [benchB, setBenchB] = useState<Player[]>([]);
  const [showSubModal, setShowSubModal] = useState(false);
  
  // Prompts
  const prompts = useVideoStatPrompts();
  const { promptType, lastEvent, closePrompt, showAssistPrompt, showReboundPrompt, 
          showTurnoverPrompt, showTurnoverTypePrompt, showFoulTypePrompt,
          showBlockedShotPrompt, showBlockedShooterPrompt, showFreeThrowPrompt,
          showFouledPlayerPrompt, showShotMadeMissedPrompt } = prompts;

  // Handlers
  const handlers = useVideoStatHandlers({
    gameId, videoId, currentVideoTimeMs, gameClock, gameData,
    selectedPlayer, selectedTeam, teamAPlayers, teamBPlayers,
    isCoachMode, userId, opponentName, lastEvent, promptType,
    onCourtA, benchA, onCourtB, benchB,
    setIsRecording, setSelectedPlayer, setShowSubModal,
    setOnCourtA, setBenchA, setOnCourtB, setBenchB,
    onStatRecorded, onBeforeRecord,
    showAssistPrompt, showReboundPrompt, showTurnoverPrompt,
    showTurnoverTypePrompt, showFoulTypePrompt, showBlockedShotPrompt,
    showBlockedShooterPrompt, showFreeThrowPrompt, showFouledPlayerPrompt,
    showShotMadeMissedPrompt, closePrompt,
  });

  // Load game data
  useEffect(() => {
    if (preloadedGameData) {
      setGameData(preloadedGameData);
      if (preloadedTeamAPlayers) {
        setTeamAPlayers(preloadedTeamAPlayers);
        setOnCourtA(preloadedTeamAPlayers.slice(0, 5));
        setBenchA(preloadedTeamAPlayers.slice(5));
      }
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const game = await GameService.getGame(gameId);
        if (!game) throw new Error('Game not found');
        setGameData(game);

        const [playersA, playersB] = await Promise.all([
          TeamService.getTeamPlayers(game.team_a_id),
          game.team_b_id ? TeamService.getTeamPlayers(game.team_b_id) : Promise.resolve([])
        ]);
        
        const mappedA = playersA.map((p: any) => ({ id: p.id, name: p.name, jerseyNumber: p.jersey_number, teamId: game.team_a_id }));
        const mappedB = playersB.map((p: any) => ({ id: p.id, name: p.name, jerseyNumber: p.jersey_number, teamId: game.team_b_id }));
        
        setTeamAPlayers(mappedA);
        setTeamBPlayers(mappedB);
        setOnCourtA(mappedA.slice(0, 5));
        setBenchA(mappedA.slice(5));
        setOnCourtB(mappedB.slice(0, 5));
        setBenchB(mappedB.slice(5));
      } catch (error) {
        console.error('Error loading game data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [gameId, preloadedGameData, preloadedTeamAPlayers]);

  // Player selection
  const handlePlayerSelect = useCallback((playerId: string) => {
    if (playerId === OPPONENT_TEAM_ID) {
      setSelectedPlayer(OPPONENT_TEAM_ID);
      setSelectedTeam('opponent');
      return;
    }
    setSelectedPlayer(playerId);
    setSelectedTeam(teamAPlayers.some(p => p.id === playerId) ? 'A' : 'B');
  }, [teamAPlayers]);

  const handlePlayerSelectByIndex = useCallback((index: number) => {
    if (isCoachMode && index === 9) {
      handlePlayerSelect(OPPONENT_TEAM_ID);
      return;
    }
    const allPlayers = [...teamAPlayers, ...teamBPlayers];
    if (index < allPlayers.length) handlePlayerSelect(allPlayers[index].id);
  }, [teamAPlayers, teamBPlayers, handlePlayerSelect, isCoachMode]);

  // Helpers
  const getPromptPlayers = useCallback(() => {
    if (!lastEvent) return [];
    if (promptType === 'assist') {
      if (isCoachMode) return teamAPlayers.filter(p => p.id !== lastEvent.playerId);
      const sameTeam = lastEvent.teamId === gameData?.team_a_id ? teamAPlayers : teamBPlayers;
      return sameTeam.filter(p => p.id !== lastEvent.playerId);
    } else if (promptType === 'turnover') {
      if (isCoachMode) return lastEvent.isOpponentStat ? teamAPlayers : [];
      return lastEvent.teamId === gameData?.team_a_id ? teamBPlayers : teamAPlayers;
    } else if (promptType === 'rebound') {
      if (isCoachMode) {
        return [...teamAPlayers, { id: OPPONENT_TEAM_ID, name: opponentName || 'Opponent', teamId: 'opponent' }];
      }
      return [...teamAPlayers, ...teamBPlayers];
    } else if (promptType === 'blocked_shooter') {
      if (isCoachMode) return teamAPlayers;
      return lastEvent.teamId === gameData?.team_a_id ? teamBPlayers : teamAPlayers;
    } else if (promptType === 'fouled_player') {
      // Opponent fouled someone: show coach's players to select who shoots FTs
      return teamAPlayers;
    }
    return isCoachMode ? teamAPlayers : [...teamAPlayers, ...teamBPlayers];
  }, [lastEvent, promptType, gameData, teamAPlayers, teamBPlayers, isCoachMode, opponentName]);

  const getSelectedPlayerData = useCallback(() => {
    if (!selectedPlayer) return null;
    if (selectedPlayer === OPPONENT_TEAM_ID) return { id: OPPONENT_TEAM_ID, name: opponentName || 'Opponent' };
    return [...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer);
  }, [selectedPlayer, teamAPlayers, teamBPlayers, opponentName]);

  return {
    // State
    loading, gameData, teamAPlayers, teamBPlayers, selectedPlayer, selectedTeam, isRecording,
    onCourtA, benchA, onCourtB, benchB, showSubModal, setShowSubModal,
    promptType, lastEvent, closePrompt,
    // Player handlers
    handlePlayerSelect, handlePlayerSelectByIndex,
    // Stat handlers (from useVideoStatHandlers)
    ...handlers,
    // Helpers
    getPromptPlayers, getSelectedPlayerData,
  };
}
