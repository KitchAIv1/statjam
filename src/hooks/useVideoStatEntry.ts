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
import { TeamServiceV3 } from '@/lib/services/teamServiceV3';
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
          showReboundTypePrompt, showTurnoverPrompt, showTurnoverTypePrompt, showFoulTypePrompt,
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
    showAssistPrompt, showReboundPrompt, showReboundTypePrompt, showTurnoverPrompt,
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

        // Use getTeamPlayersWithSubstitutions to get roster with substitutions applied
        // Returns players in order: on-court first (0-4), then bench (5+)
        const [playersA, playersB] = await Promise.all([
          TeamServiceV3.getTeamPlayersWithSubstitutions(game.team_a_id, gameId),
          game.team_b_id ? TeamServiceV3.getTeamPlayersWithSubstitutions(game.team_b_id, gameId) : Promise.resolve([])
        ]);
        
        const mappedA = playersA.map((p: any) => ({ 
          id: p.id, 
          name: p.name, 
          jerseyNumber: p.jersey_number, 
          teamId: game.team_a_id,
          is_custom_player: p.is_custom_player 
        }));
        const mappedB = playersB.map((p: any) => ({ 
          id: p.id, 
          name: p.name, 
          jerseyNumber: p.jersey_number, 
          teamId: game.team_b_id,
          is_custom_player: p.is_custom_player 
        }));
        
        setTeamAPlayers(mappedA);
        setTeamBPlayers(mappedB);
        // First 5 are on-court (already ordered by getTeamPlayersWithSubstitutions)
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
    // Coach mode: key 0 (index 9) = opponent
    if (isCoachMode && index === 9) {
      handlePlayerSelect(OPPONENT_TEAM_ID);
      return;
    }
    
    // Keys 1-5 (indices 0-4) → Team A on-court
    if (index < 5) {
      if (index < onCourtA.length) {
        handlePlayerSelect(onCourtA[index].id);
      }
      return;
    }
    
    // Keys 6-0 (indices 5-9) → Team B on-court (organizer mode only)
    if (!isCoachMode) {
      const teamBIndex = index - 5;  // 5→0, 6→1, 7→2, 8→3, 9→4
      if (teamBIndex < onCourtB.length) {
        handlePlayerSelect(onCourtB[teamBIndex].id);
      }
    }
  }, [onCourtA, onCourtB, handlePlayerSelect, isCoachMode]);

  // Helpers - Use on-court players for prompts (not full roster)
  const getPromptPlayers = useCallback(() => {
    if (!lastEvent) return [];
    if (promptType === 'assist') {
      // Assist: same team on-court players (excluding the scorer)
      if (isCoachMode) return onCourtA.filter(p => p.id !== lastEvent.playerId);
      const sameTeam = lastEvent.teamId === gameData?.team_a_id ? onCourtA : onCourtB;
      return sameTeam.filter(p => p.id !== lastEvent.playerId);
    } else if (promptType === 'turnover') {
      // Turnover: opposing team's on-court players
      if (isCoachMode) return lastEvent.isOpponentStat ? onCourtA : [];
      return lastEvent.teamId === gameData?.team_a_id ? onCourtB : onCourtA;
    } else if (promptType === 'rebound') {
      // Rebound: all on-court players (both teams)
      if (isCoachMode) {
        return [...onCourtA, { id: OPPONENT_TEAM_ID, name: opponentName || 'Opponent', teamId: 'opponent' }];
      }
      return [...onCourtA, ...onCourtB];
    } else if (promptType === 'blocked_shooter') {
      // Blocked shooter: opposing team's on-court players
      if (isCoachMode) return onCourtA;
      return lastEvent.teamId === gameData?.team_a_id ? onCourtB : onCourtA;
    } else if (promptType === 'fouled_player') {
      // Opponent fouled someone: show coach's on-court players to select who shoots FTs
      return onCourtA;
    }
    return isCoachMode ? onCourtA : [...onCourtA, ...onCourtB];
  }, [lastEvent, promptType, gameData, onCourtA, onCourtB, isCoachMode, opponentName]);

  const getSelectedPlayerData = useCallback(() => {
    if (!selectedPlayer) return null;
    if (selectedPlayer === OPPONENT_TEAM_ID) return { id: OPPONENT_TEAM_ID, name: opponentName || 'Opponent' };
    // Look in on-court players first (current state), then fallback to full roster
    return [...onCourtA, ...onCourtB, ...benchA, ...benchB].find(p => p.id === selectedPlayer)
      || [...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer);
  }, [selectedPlayer, teamAPlayers, teamBPlayers, onCourtA, onCourtB, benchA, benchB, opponentName]);

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
