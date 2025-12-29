'use client';

/**
 * useVideoStatHandlers - Stat recording handlers for video tracker
 * 
 * Extracted from useVideoStatEntry for .cursorrules compliance.
 * Contains all stat recording callback functions.
 * 
 * @module useVideoStatHandlers
 */

import { useCallback } from 'react';
import { VideoStatService } from '@/lib/services/videoStatService';
import { GameService } from '@/lib/services/gameService';
import { getShotValue } from '@/hooks/useVideoStatPrompts';
import type { GameClock } from '@/lib/types/video';

export interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  teamId?: string;
  is_custom_player?: boolean;
}

export const OPPONENT_TEAM_ID = 'opponent-team';

interface LastEventInfo {
  playerId: string;
  playerName: string;
  teamId: string;
  statType: string;
  shotValue: number;
  videoTimestampMs: number;
  isOpponentStat?: boolean;
  blockedShotType?: 'field_goal' | 'three_pointer';
  ftCount?: number;
  foulType?: string;
  shootingFoulShotType?: '2pt' | '3pt';  // For shot_made_missed: what shot was fouled on
  victimPlayerId?: string;  // For shooting foul: who was fouled (shoots FTs)
  victimPlayerName?: string;  // For shooting foul: victim's name
}

interface UseVideoStatHandlersProps {
  gameId: string;
  videoId: string;
  currentVideoTimeMs: number;
  gameClock: GameClock | null;
  gameData: any;
  selectedPlayer: string | null;
  selectedTeam: 'A' | 'B' | 'opponent';
  teamAPlayers: Player[];
  teamBPlayers: Player[];
  isCoachMode: boolean;
  userId?: string;
  opponentName?: string;
  lastEvent: LastEventInfo | null;
  promptType: string | null;
  onCourtA: Player[];
  benchA: Player[];
  onCourtB: Player[];
  benchB: Player[];
  // Callbacks
  setIsRecording: (v: boolean) => void;
  setSelectedPlayer: (v: string | null) => void;
  setShowSubModal: (v: boolean) => void;
  setOnCourtA: React.Dispatch<React.SetStateAction<Player[]>>;
  setBenchA: React.Dispatch<React.SetStateAction<Player[]>>;
  setOnCourtB: React.Dispatch<React.SetStateAction<Player[]>>;
  setBenchB: React.Dispatch<React.SetStateAction<Player[]>>;
  onStatRecorded?: (statType: string, statId?: string) => void;
  onBeforeRecord?: () => void;
  // Prompt functions
  showAssistPrompt: (e: LastEventInfo) => void;
  showReboundPrompt: (e: LastEventInfo) => void;
  showTurnoverPrompt: (e: LastEventInfo) => void;
  showTurnoverTypePrompt: (e: LastEventInfo) => void;
  showFoulTypePrompt: (e: LastEventInfo) => void;
  showBlockedShotPrompt: (e: LastEventInfo) => void;
  showBlockedShooterPrompt: (e: LastEventInfo) => void;
  showFreeThrowPrompt: (e: LastEventInfo) => void;
  showFouledPlayerPrompt: (e: LastEventInfo) => void;
  showShotMadeMissedPrompt: (e: LastEventInfo) => void;
  closePrompt: () => void;
}

export function useVideoStatHandlers(props: UseVideoStatHandlersProps) {
  const {
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
  } = props;

  // Core stat recording
  const handleStatRecord = useCallback(async (statType: string, modifier?: string) => {
    if (!selectedPlayer || !gameData || !gameClock) return;
    onBeforeRecord?.();

    const isOpponentStat = isCoachMode && selectedPlayer === OPPONENT_TEAM_ID;
    const playerData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer);
    const playerName = isOpponentStat ? (opponentName || 'Opponent') : (playerData?.name || 'Player');
    
    let teamId = selectedTeam === 'A' ? gameData.team_a_id : 
                 selectedTeam === 'opponent' ? 'opponent' : gameData.team_b_id;
    let playerId: string | undefined = selectedPlayer;
    let customPlayerId: string | undefined;

    if (isCoachMode) {
      if (isOpponentStat) {
        playerId = userId;
        teamId = gameData.team_a_id;
      } else {
        const isCustomPlayer = playerData?.is_custom_player || selectedPlayer.startsWith('custom-');
        if (isCustomPlayer) { customPlayerId = selectedPlayer; playerId = undefined; }
      }
    }

    try {
      setIsRecording(true);
      const statId = await VideoStatService.recordVideoStat({
        gameId, videoId, playerId, customPlayerId, isOpponentStat, teamId, statType, modifier,
        videoTimestampMs: currentVideoTimeMs, quarter: gameClock.quarter,
        gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
      });
      
      onStatRecorded?.(statType, statId);
      
      // Auto-sequence prompts
      if (isOpponentStat) {
        if (modifier === 'missed') {
          showReboundPrompt({ playerId: selectedPlayer, playerName, teamId, statType, shotValue: 0, videoTimestampMs: currentVideoTimeMs, isOpponentStat: true });
        } else if (statType === 'steal') {
          showTurnoverPrompt({ playerId: selectedPlayer, playerName: opponentName || 'Opponent', teamId, statType: 'steal', shotValue: 0, videoTimestampMs: currentVideoTimeMs, isOpponentStat: true });
        } else if (statType === 'block') {
          showBlockedShotPrompt({ playerId: selectedPlayer, playerName: opponentName || 'Opponent', teamId, statType: 'block', shotValue: 0, videoTimestampMs: currentVideoTimeMs, isOpponentStat: true });
        }
      } else {
        if (modifier === 'made' && (statType === 'field_goal' || statType === 'three_pointer')) {
          showAssistPrompt({ playerId: selectedPlayer, playerName, teamId, statType, shotValue: getShotValue(statType), videoTimestampMs: currentVideoTimeMs });
        } else if (modifier === 'missed') {
          showReboundPrompt({ playerId: selectedPlayer, playerName, teamId, statType, shotValue: 0, videoTimestampMs: currentVideoTimeMs, isOpponentStat: false });
        } else if (statType === 'steal') {
          if (isCoachMode) {
            await VideoStatService.recordVideoStat({
              gameId, videoId, playerId: userId, isOpponentStat: true, teamId: gameData.team_a_id,
              statType: 'turnover', modifier: 'steal', videoTimestampMs: currentVideoTimeMs,
              quarter: gameClock.quarter, gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
            });
            onStatRecorded?.('turnover');
          } else {
            showTurnoverPrompt({ playerId: selectedPlayer, playerName, teamId, statType, shotValue: 0, videoTimestampMs: currentVideoTimeMs });
          }
        } else if (statType === 'block') {
          showBlockedShotPrompt({ playerId: selectedPlayer, playerName, teamId, statType: 'block', shotValue: 0, videoTimestampMs: currentVideoTimeMs, isOpponentStat: false });
        }
      }
      
      setSelectedPlayer(null);
    } catch (error) {
      console.error('Error recording stat:', error);
    } finally {
      setIsRecording(false);
    }
  }, [selectedPlayer, gameData, gameClock, selectedTeam, gameId, videoId, currentVideoTimeMs, onStatRecorded, onBeforeRecord, teamAPlayers, teamBPlayers, showAssistPrompt, showReboundPrompt, showTurnoverPrompt, showBlockedShotPrompt, isCoachMode, userId, opponentName, setIsRecording, setSelectedPlayer]);

  // Turnover handlers
  const handleInitiateTurnover = useCallback(() => {
    if (!selectedPlayer || !gameData || !gameClock) return;
    onBeforeRecord?.();
    
    const isOpponentStat = isCoachMode && selectedPlayer === OPPONENT_TEAM_ID;
    const playerData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer);
    const playerName = isOpponentStat ? (opponentName || 'Opponent') : (playerData?.name || 'Player');
    const teamId = isOpponentStat ? gameData.team_a_id : (selectedTeam === 'A' ? gameData.team_a_id : gameData.team_b_id);
    
    showTurnoverTypePrompt({ 
      playerId: selectedPlayer, 
      playerName, 
      teamId, 
      statType: 'turnover', 
      shotValue: 0, 
      videoTimestampMs: currentVideoTimeMs,
      isOpponentStat,
    });
  }, [selectedPlayer, gameData, gameClock, selectedTeam, teamAPlayers, teamBPlayers, currentVideoTimeMs, onBeforeRecord, showTurnoverTypePrompt, isCoachMode, opponentName]);

  const handleTurnoverTypeSelect = useCallback(async (turnoverType: string) => {
    if (!lastEvent || !gameClock || !gameData) return;
    const modifier = turnoverType === 'other' ? undefined : turnoverType;
    
    const isOpponentStat = lastEvent.isOpponentStat === true;
    let playerId: string | undefined = lastEvent.playerId;
    let customPlayerId: string | undefined;
    let teamId = lastEvent.teamId;
    
    if (isOpponentStat) {
      // Opponent turnover: use userId as proxy, team is coach's team
      playerId = userId;
      teamId = gameData.team_a_id;
    } else if (isCoachMode) {
      const playerData = teamAPlayers.find(p => p.id === lastEvent.playerId);
      const isCustomPlayer = playerData?.is_custom_player || lastEvent.playerId.startsWith('custom-');
      if (isCustomPlayer) { customPlayerId = lastEvent.playerId; playerId = undefined; }
    }
    
    try {
      setIsRecording(true);
      await VideoStatService.recordVideoStat({
        gameId, videoId, playerId, customPlayerId, isOpponentStat, teamId,
        statType: 'turnover', modifier, videoTimestampMs: lastEvent.videoTimestampMs,
        quarter: gameClock.quarter, gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
      });
      onStatRecorded?.('turnover');
      setSelectedPlayer(null);
    } catch (error) {
      console.error('Error recording turnover:', error);
    } finally {
      setIsRecording(false);
      closePrompt();
    }
  }, [lastEvent, gameClock, gameData, gameId, videoId, onStatRecorded, closePrompt, isCoachMode, userId, teamAPlayers, setIsRecording, setSelectedPlayer]);

  // Foul handlers
  const handleInitiateFoul = useCallback(() => {
    if (!selectedPlayer || !gameData || !gameClock) return;
    onBeforeRecord?.();
    
    const isOpponentStat = isCoachMode && selectedPlayer === OPPONENT_TEAM_ID;
    const playerData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer);
    const playerName = isOpponentStat ? (opponentName || 'Opponent') : (playerData?.name || 'Player');
    const teamId = isOpponentStat ? gameData.team_a_id : (selectedTeam === 'A' ? gameData.team_a_id : gameData.team_b_id);
    
    showFoulTypePrompt({ 
      playerId: selectedPlayer, 
      playerName, 
      teamId, 
      statType: 'foul', 
      shotValue: 0, 
      videoTimestampMs: currentVideoTimeMs,
      isOpponentStat,
    });
  }, [selectedPlayer, gameData, gameClock, selectedTeam, teamAPlayers, teamBPlayers, currentVideoTimeMs, onBeforeRecord, showFoulTypePrompt, isCoachMode, opponentName]);

  const handleFoulTypeSelect = useCallback(async (foulType: string, ftCount: number = 0) => {
    if (!lastEvent || !gameClock || !gameData) return;
    
    const isOpponentStat = lastEvent.isOpponentStat === true;
    let playerId: string | undefined = lastEvent.playerId;
    let customPlayerId: string | undefined;
    let teamId = lastEvent.teamId;
    
    if (isOpponentStat) {
      // Opponent foul: use userId as proxy, team is coach's team
      playerId = userId;
      teamId = gameData.team_a_id;
    } else if (isCoachMode) {
      const playerData = teamAPlayers.find(p => p.id === lastEvent.playerId);
      const isCustomPlayer = playerData?.is_custom_player || lastEvent.playerId.startsWith('custom-');
      if (isCustomPlayer) { customPlayerId = lastEvent.playerId; playerId = undefined; }
    }
    
    try {
      setIsRecording(true);
      await VideoStatService.recordVideoStat({
        gameId, videoId, playerId, customPlayerId, isOpponentStat, teamId,
        statType: 'foul', modifier: foulType, videoTimestampMs: lastEvent.videoTimestampMs,
        quarter: gameClock.quarter, gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
      });
      onStatRecorded?.('foul');
      setIsRecording(false);
      
      // For shooting fouls, trigger FT sequence
      if (ftCount > 0) {
        if (isOpponentStat) {
          // Opponent shooting foul: ask which coach's player was fouled (shoots FTs)
          showFouledPlayerPrompt({ 
            playerId: lastEvent.playerId, 
            playerName: opponentName || 'Opponent', 
            teamId: gameData.team_a_id, 
            statType: 'foul', 
            shotValue: 0, 
            videoTimestampMs: lastEvent.videoTimestampMs, 
            ftCount, 
            foulType,
            isOpponentStat: true,
          });
        } else {
          // Coach's player fouled: direct FT sequence for the fouling player
          showFreeThrowPrompt({ 
            playerId: lastEvent.playerId, 
            playerName: lastEvent.playerName, 
            teamId: lastEvent.teamId, 
            statType: 'free_throw', 
            shotValue: 1, 
            videoTimestampMs: lastEvent.videoTimestampMs, 
            ftCount, 
            foulType 
          });
        }
        // Don't close prompt - we just opened a new one
        return;
      }
      
      // No follow-up prompt needed
      setSelectedPlayer(null);
      closePrompt();
    } catch (error) {
      console.error('Error recording foul:', error);
      setIsRecording(false);
      closePrompt();
    }
  }, [lastEvent, gameClock, gameData, gameId, videoId, onStatRecorded, closePrompt, showFreeThrowPrompt, showFouledPlayerPrompt, isCoachMode, userId, opponentName, teamAPlayers, setIsRecording, setSelectedPlayer]);

  // Free throw handler
  const handleFreeThrowComplete = useCallback(async (results: { made: boolean }[]) => {
    if (!lastEvent || !gameClock) return;
    let playerId: string | undefined = lastEvent.playerId;
    let customPlayerId: string | undefined;
    
    if (isCoachMode) {
      const playerData = teamAPlayers.find(p => p.id === lastEvent.playerId);
      const isCustomPlayer = playerData?.is_custom_player || lastEvent.playerId.startsWith('custom-');
      if (isCustomPlayer) { customPlayerId = lastEvent.playerId; playerId = undefined; }
    }
    
    try {
      setIsRecording(true);
      for (const result of results) {
        await VideoStatService.recordVideoStat({
          gameId, videoId, playerId, customPlayerId, teamId: lastEvent.teamId,
          statType: 'free_throw', modifier: result.made ? 'made' : 'missed',
          videoTimestampMs: lastEvent.videoTimestampMs, quarter: gameClock.quarter,
          gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
        });
        onStatRecorded?.('free_throw');
      }
      
      const lastResult = results[results.length - 1];
      if (!lastResult.made) {
        closePrompt();
        showReboundPrompt({ playerId: lastEvent.playerId, playerName: lastEvent.playerName, teamId: lastEvent.teamId, statType: 'free_throw', shotValue: 1, videoTimestampMs: lastEvent.videoTimestampMs, isOpponentStat: false });
        setIsRecording(false);
        return;
      }
      setSelectedPlayer(null);
    } catch (error) {
      console.error('Error recording free throws:', error);
    } finally {
      setIsRecording(false);
      closePrompt();
    }
  }, [lastEvent, gameClock, gameId, videoId, onStatRecorded, closePrompt, showReboundPrompt, isCoachMode, teamAPlayers, setIsRecording, setSelectedPlayer]);

  // Shot made/missed handler (for shooting fouls - and-1 logic)
  const handleShotMadeMissed = useCallback(async (made: boolean) => {
    if (!lastEvent || !gameClock || !gameData) return;
    
    const victimPlayerId = lastEvent.victimPlayerId || lastEvent.playerId;
    const victimPlayerName = lastEvent.victimPlayerName || lastEvent.playerName;
    const originalFtCount = lastEvent.ftCount || 2;
    const shotType = lastEvent.shootingFoulShotType || '2pt';
    
    // Determine victim player details
    const victimPlayer = teamAPlayers.find(p => p.id === victimPlayerId);
    let actualPlayerId: string | undefined = victimPlayerId;
    let customPlayerId: string | undefined;
    
    if (isCoachMode) {
      const isCustomPlayer = victimPlayer?.is_custom_player || victimPlayerId.startsWith('custom-');
      if (isCustomPlayer) { customPlayerId = victimPlayerId; actualPlayerId = undefined; }
    }
    
    try {
      setIsRecording(true);
      
      // If shot was made (and-1), record the made shot first
      if (made) {
        const statType = shotType === '3pt' ? 'three_pointer' : 'field_goal';
        await VideoStatService.recordVideoStat({
          gameId, videoId, 
          playerId: actualPlayerId, 
          customPlayerId,
          teamId: gameData.team_a_id,  // Victim is coach's player
          statType,
          modifier: 'made',
          videoTimestampMs: lastEvent.videoTimestampMs,
          quarter: gameClock.quarter,
          gameTimeMinutes: gameClock.minutesRemaining,
          gameTimeSeconds: gameClock.secondsRemaining,
        });
        onStatRecorded?.(statType);
      }
      
      setIsRecording(false);
      closePrompt();
      
      // Determine FT count: made = 1 FT (and-1), missed = original FT count
      const ftCount = made ? 1 : originalFtCount;
      
      // Trigger FT sequence for the victim
      showFreeThrowPrompt({
        playerId: victimPlayerId,
        playerName: victimPlayerName,
        teamId: gameData.team_a_id,
        statType: 'free_throw',
        shotValue: 1,
        videoTimestampMs: lastEvent.videoTimestampMs,
        ftCount,
        foulType: 'shooting',
        isOpponentStat: false,  // FTs are for coach's player
      });
    } catch (error) {
      console.error('Error recording shot made/missed:', error);
      setIsRecording(false);
      closePrompt();
    }
  }, [lastEvent, gameClock, gameData, gameId, videoId, teamAPlayers, isCoachMode, onStatRecorded, closePrompt, showFreeThrowPrompt, setIsRecording]);

  // Block handlers
  const handleBlockedShotTypeSelect = useCallback(async (shotType: 'field_goal' | 'three_pointer') => {
    if (!lastEvent || !gameClock || !gameData) return;
    const wasOpponentBlock = lastEvent.isOpponentStat === true;
    
    if (wasOpponentBlock && isCoachMode) {
      closePrompt();
      showBlockedShooterPrompt({ playerId: lastEvent.playerId, playerName: lastEvent.playerName, teamId: lastEvent.teamId, statType: 'block', shotValue: 0, videoTimestampMs: lastEvent.videoTimestampMs, isOpponentStat: true, blockedShotType: shotType });
      return;
    }
    
    try {
      setIsRecording(true);
      // Coach's player blocked opponent's shot: record opponent's missed shot
      await VideoStatService.recordVideoStat({
        gameId, videoId, playerId: isCoachMode ? userId : undefined, isOpponentStat: true,
        teamId: gameData.team_a_id, statType: shotType, modifier: 'missed',
        videoTimestampMs: lastEvent.videoTimestampMs, quarter: gameClock.quarter,
        gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
      });
      onStatRecorded?.(shotType);
      closePrompt();
      showReboundPrompt({ playerId: lastEvent.playerId, playerName: lastEvent.playerName, teamId: lastEvent.teamId, statType: 'block', shotValue: 0, videoTimestampMs: lastEvent.videoTimestampMs, isOpponentStat: true });
    } catch (error) {
      console.error('Error recording blocked shot:', error);
      closePrompt();
    } finally {
      setIsRecording(false);
    }
  }, [lastEvent, gameClock, gameData, gameId, videoId, onStatRecorded, closePrompt, showReboundPrompt, showBlockedShooterPrompt, isCoachMode, userId, setIsRecording]);

  // Prompt player selection handler
  const handlePromptPlayerSelect = useCallback(async (playerId: string) => {
    if (!gameData || !gameClock || !lastEvent) return;
    const player = [...teamAPlayers, ...teamBPlayers].find(p => p.id === playerId);
    const playerTeamId = player?.teamId || lastEvent.teamId;
    
    let actualPlayerId: string | undefined = playerId;
    let customPlayerId: string | undefined;
    
    if (isCoachMode) {
      const isCustomPlayer = player?.is_custom_player || playerId.startsWith('custom-');
      if (isCustomPlayer) { customPlayerId = playerId; actualPlayerId = undefined; }
    }
    
    let statId: string | undefined;
    
    if (promptType === 'assist') {
      statId = await VideoStatService.recordVideoStat({
        gameId, videoId, playerId: actualPlayerId, customPlayerId, teamId: lastEvent.teamId,
        statType: 'assist', videoTimestampMs: lastEvent.videoTimestampMs,
        quarter: gameClock.quarter, gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
      });
    } else if (promptType === 'rebound') {
      const isOpponentRebound = isCoachMode && playerId === OPPONENT_TEAM_ID;
      const wasOpponentShot = lastEvent.isOpponentStat === true;
      let isOffensive: boolean;
      
      if (isOpponentRebound) {
        isOffensive = lastEvent.statType === 'block' || wasOpponentShot;
        statId = await VideoStatService.recordVideoStat({
          gameId, videoId, playerId: userId, isOpponentStat: true, teamId: gameData.team_a_id,
          statType: 'rebound', modifier: isOffensive ? 'offensive' : 'defensive',
          videoTimestampMs: lastEvent.videoTimestampMs, quarter: gameClock.quarter,
          gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
        });
      } else {
        isOffensive = lastEvent.statType === 'block' ? false : (wasOpponentShot ? false : true);
        statId = await VideoStatService.recordVideoStat({
          gameId, videoId, playerId: actualPlayerId, customPlayerId, teamId: playerTeamId,
          statType: 'rebound', modifier: isOffensive ? 'offensive' : 'defensive',
          videoTimestampMs: lastEvent.videoTimestampMs, quarter: gameClock.quarter,
          gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
        });
      }
    } else if (promptType === 'turnover') {
      if (isCoachMode && lastEvent.isOpponentStat) {
        statId = await VideoStatService.recordVideoStat({
          gameId, videoId, playerId: actualPlayerId, customPlayerId, isOpponentStat: false,
          teamId: gameData.team_a_id, statType: 'turnover', modifier: 'steal',
          videoTimestampMs: lastEvent.videoTimestampMs, quarter: gameClock.quarter,
          gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
        });
      } else {
        statId = await VideoStatService.recordVideoStat({
          gameId, videoId, playerId: actualPlayerId, customPlayerId, teamId: playerTeamId,
          statType: 'turnover', modifier: 'steal', videoTimestampMs: lastEvent.videoTimestampMs,
          quarter: gameClock.quarter, gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
        });
      }
    } else if (promptType === 'blocked_shooter') {
      const shotType = lastEvent.blockedShotType || 'field_goal';
      statId = await VideoStatService.recordVideoStat({
        gameId, videoId, playerId: actualPlayerId, customPlayerId, isOpponentStat: false,
        teamId: gameData.team_a_id, statType: shotType, modifier: 'missed',
        videoTimestampMs: lastEvent.videoTimestampMs, quarter: gameClock.quarter,
        gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
      });
      onStatRecorded?.(shotType, statId);
      closePrompt();
      showReboundPrompt({ playerId, playerName: player?.name || 'Player', teamId: gameData.team_a_id, statType: 'block', shotValue: 0, videoTimestampMs: lastEvent.videoTimestampMs, isOpponentStat: false });
      return;
    } else if (promptType === 'fouled_player') {
      // Opponent shooting foul: selected player (victim) shoots FTs
      const ftCount = lastEvent.ftCount || 2;
      const foulType = lastEvent.foulType || 'shooting';
      closePrompt();
      
      // For shooting fouls, ask if shot was made before FT sequence
      if (foulType === 'shooting' && (ftCount === 2 || ftCount === 3)) {
        showShotMadeMissedPrompt({
          playerId: playerId,  // Victim who was fouled
          playerName: player?.name || 'Player',
          teamId: gameData.team_a_id,
          statType: 'foul',
          shotValue: 0,
          videoTimestampMs: lastEvent.videoTimestampMs,
          ftCount,
          foulType,
          isOpponentStat: false,  // The victim (FT shooter) is coach's player
          shootingFoulShotType: ftCount === 3 ? '3pt' : '2pt',
          victimPlayerId: playerId,
          victimPlayerName: player?.name || 'Player',
        });
        return;
      }
      
      // For non-shooting fouls (technical, flagrant, etc.), go directly to FT sequence
      showFreeThrowPrompt({
        playerId: playerId,
        playerName: player?.name || 'Player',
        teamId: gameData.team_a_id,
        statType: 'free_throw',
        shotValue: 1,
        videoTimestampMs: lastEvent.videoTimestampMs,
        ftCount,
        foulType,
        isOpponentStat: false,  // FTs are for coach's player
      });
      return;
    }
    
    onStatRecorded?.(promptType || 'stat', statId);
    closePrompt();
  }, [gameData, gameClock, lastEvent, promptType, gameId, videoId, teamAPlayers, teamBPlayers, onStatRecorded, closePrompt, showReboundPrompt, showFreeThrowPrompt, isCoachMode, userId]);

  // Substitution handlers
  const handleOpenSubModal = useCallback(() => {
    if (promptType || (isCoachMode && selectedTeam === 'opponent')) return;
    setShowSubModal(true);
  }, [promptType, isCoachMode, selectedTeam, setShowSubModal]);

  const handleSubConfirm = useCallback(async (substitutions: Array<{ playerOutId: string; playerInId: string }>) => {
    if (!gameData || substitutions.length === 0) return;
    
    // Track if selected player was subbed out
    const subbedOutPlayerIds = substitutions.map(s => s.playerOutId);
    
    for (const sub of substitutions) {
      const isTeamAPlayer = onCourtA.some(p => p.id === sub.playerOutId);
      
      if (isTeamAPlayer) {
        const playerOut = onCourtA.find(p => p.id === sub.playerOutId);
        const playerIn = benchA.find(p => p.id === sub.playerInId);
        if (!playerOut || !playerIn) continue;
        
        const isCustomPlayerOut = playerOut.is_custom_player || sub.playerOutId.startsWith('custom-');
        const isCustomPlayerIn = playerIn.is_custom_player || sub.playerInId.startsWith('custom-');
        
        await GameService.recordSubstitution({
          gameId, teamId: gameData.team_a_id, playerInId: sub.playerInId, playerOutId: sub.playerOutId,
          quarter: gameClock?.quarter || 1, gameTimeMinutes: gameClock?.minutesRemaining || 0,
          gameTimeSeconds: gameClock?.secondsRemaining || 0, isCustomPlayerIn, isCustomPlayerOut,
          videoTimestampMs: Math.round(currentVideoTimeMs),
        });
        
        setOnCourtA(prev => prev.map(p => p.id === sub.playerOutId ? playerIn : p));
        setBenchA(prev => prev.map(p => p.id === sub.playerInId ? playerOut : p));
      } else {
        const playerOut = onCourtB.find(p => p.id === sub.playerOutId);
        const playerIn = benchB.find(p => p.id === sub.playerInId);
        if (!playerOut || !playerIn) continue;
        
        await GameService.recordSubstitution({
          gameId, teamId: gameData.team_b_id, playerInId: sub.playerInId, playerOutId: sub.playerOutId,
          quarter: gameClock?.quarter || 1, gameTimeMinutes: gameClock?.minutesRemaining || 0,
          gameTimeSeconds: gameClock?.secondsRemaining || 0, isCustomPlayerIn: false, isCustomPlayerOut: false,
          videoTimestampMs: Math.round(currentVideoTimeMs),
        });
        
        setOnCourtB(prev => prev.map(p => p.id === sub.playerOutId ? playerIn : p));
        setBenchB(prev => prev.map(p => p.id === sub.playerInId ? playerOut : p));
      }
      
      // Trigger timeline refresh for each substitution
      onStatRecorded?.('substitution');
    }
    
    // ✅ CRITICAL: Clear selectedPlayer if they were subbed out to prevent stale stat attribution
    if (selectedPlayer && subbedOutPlayerIds.includes(selectedPlayer)) {
      console.log('🔄 Clearing selectedPlayer - player was subbed out:', selectedPlayer);
      setSelectedPlayer(null);
    }
    
    setShowSubModal(false);
  }, [gameData, gameId, gameClock, currentVideoTimeMs, onCourtA, benchA, onCourtB, benchB, setOnCourtA, setBenchA, setOnCourtB, setBenchB, setShowSubModal, onStatRecorded, selectedPlayer, setSelectedPlayer]);

  return {
    handleStatRecord,
    handleInitiateTurnover, handleTurnoverTypeSelect,
    handleInitiateFoul, handleFoulTypeSelect, handleFreeThrowComplete,
    handleShotMadeMissed,
    handleBlockedShotTypeSelect, handlePromptPlayerSelect,
    handleOpenSubModal, handleSubConfirm,
  };
}

