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
import type { SequenceAutomationFlags } from '@/lib/types/automation';

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

/**
 * Default sequence flags - ALL auto-prompts ENABLED (for backward compatibility)
 * Manual mode = all flags FALSE
 */
export const DEFAULT_SEQUENCE_FLAGS: SequenceAutomationFlags = {
  enabled: true,
  promptAssists: true,
  promptRebounds: true,
  promptBlocks: true,
  linkEvents: false, // Not used in video tracker
  freeThrowSequence: true,
};

/**
 * Manual mode flags - ALL auto-prompts DISABLED
 * User must manually record each stat type
 */
export const MANUAL_MODE_FLAGS: SequenceAutomationFlags = {
  enabled: false,
  promptAssists: false,
  promptRebounds: false,
  promptBlocks: false,
  linkEvents: false,
  freeThrowSequence: false,
};

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
  /**
   * ✅ NEW: Sequence automation flags for manual mode control
   * Controls which auto-prompts are shown after stat recording
   * When undefined, defaults to all prompts enabled (backward compatible)
   */
  sequenceFlags?: SequenceAutomationFlags;
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
  showReboundTypePrompt: (e: LastEventInfo) => void;
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
    sequenceFlags = DEFAULT_SEQUENCE_FLAGS, // ✅ Default: all auto-prompts enabled
    setIsRecording, setSelectedPlayer, setShowSubModal,
    setOnCourtA, setBenchA, setOnCourtB, setBenchB,
    onStatRecorded, onBeforeRecord,
    showAssistPrompt, showReboundPrompt, showReboundTypePrompt, showTurnoverPrompt,
    showTurnoverTypePrompt, showFoulTypePrompt, showBlockedShotPrompt,
    showBlockedShooterPrompt, showFreeThrowPrompt, showFouledPlayerPrompt,
    showShotMadeMissedPrompt, closePrompt,
  } = props;

  // ✅ Derived flags for easy access in callbacks
  const autoPromptAssists = sequenceFlags.enabled && sequenceFlags.promptAssists;
  const autoPromptRebounds = sequenceFlags.enabled && sequenceFlags.promptRebounds;
  const autoPromptBlocks = sequenceFlags.enabled && sequenceFlags.promptBlocks;
  const autoFreeThrowSequence = sequenceFlags.enabled && sequenceFlags.freeThrowSequence;

  // Core stat recording - ✅ OPTIMIZED: Fire-and-forget pattern for instant UI response
  // ✅ SHOT TRACKER: Now accepts optional location data for court-based shot tracking
  const handleStatRecord = useCallback((
    statType: string, 
    modifier?: string,
    locationData?: { shotLocationX?: number; shotLocationY?: number; shotZone?: string }
  ) => {
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

    // ✅ FIRE-AND-FORGET: Fire DB write, update UI immediately
    // ✅ PERFORMANCE: skipPostUpdates prevents COUNT query + games table UPDATE per stat
    VideoStatService.recordVideoStat({
        gameId, videoId, playerId, customPlayerId, isOpponentStat, teamId, statType, modifier,
        videoTimestampMs: currentVideoTimeMs, quarter: gameClock.quarter,
        gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
        shotLocationX: locationData?.shotLocationX,
        shotLocationY: locationData?.shotLocationY,
        shotZone: locationData?.shotZone,
      skipPostUpdates: true,
    })
      .then((statId) => {
        onStatRecorded?.(statType, statId);
      })
      .catch((error) => {
        console.error('Error recording stat:', error);
      });
    
    // ✅ UI updates happen IMMEDIATELY (no await)
    // ✅ AUTO-SEQUENCE PROMPTS - Controlled by sequenceFlags for manual mode support
    if (isOpponentStat) {
      // OPPONENT STATS: Opponent missed shot → rebound prompt, opponent steal → turnover prompt, etc.
      if (modifier === 'missed' && autoPromptRebounds) {
        // Sequence #12: Opponent missed shot → Rebound Prompt
        showReboundPrompt({ playerId: selectedPlayer, playerName, teamId, statType, shotValue: 0, videoTimestampMs: currentVideoTimeMs, isOpponentStat: true });
      } else if (statType === 'steal' && autoPromptRebounds) {
        // Sequence #13: Opponent steal → Turnover Prompt (linked to rebound flag for simplicity)
        showTurnoverPrompt({ playerId: selectedPlayer, playerName: opponentName || 'Opponent', teamId, statType: 'steal', shotValue: 0, videoTimestampMs: currentVideoTimeMs, isOpponentStat: true });
      } else if (statType === 'block' && autoPromptBlocks) {
        // Sequence #14: Opponent block → Blocked Shot Prompt
        showBlockedShotPrompt({ playerId: selectedPlayer, playerName: opponentName || 'Opponent', teamId, statType: 'block', shotValue: 0, videoTimestampMs: currentVideoTimeMs, isOpponentStat: true });
      }
    } else {
      // COACH'S TEAM STATS: Made shot → assist prompt, missed shot → rebound prompt, etc.
      if (modifier === 'made' && (statType === 'field_goal' || statType === 'three_pointer') && autoPromptAssists) {
        // Sequence #1-2: Made shot (2PT/3PT) → Assist Prompt
        showAssistPrompt({ playerId: selectedPlayer, playerName, teamId, statType, shotValue: getShotValue(statType), videoTimestampMs: currentVideoTimeMs });
      } else if (modifier === 'missed' && autoPromptRebounds) {
        // Sequence #3-4: Missed shot (2PT/3PT) → Rebound Prompt
        showReboundPrompt({ playerId: selectedPlayer, playerName, teamId, statType, shotValue: 0, videoTimestampMs: currentVideoTimeMs, isOpponentStat: false });
      } else if (statType === 'steal') {
        // Sequence #6: Steal → Turnover Prompt (or auto-record in coach mode)
        if (isCoachMode) {
          // ✅ Coach mode: Auto-record opponent turnover (not affected by manual mode - it's a linked stat)
          onStatRecorded?.('turnover');
          VideoStatService.recordVideoStat({
            gameId, videoId, playerId: userId, isOpponentStat: true, teamId: gameData.team_a_id,
            statType: 'turnover', modifier: 'steal', videoTimestampMs: currentVideoTimeMs,
            quarter: gameClock.quarter, gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
            skipPostUpdates: true,
          })
            .catch((error) => console.error('Error recording auto turnover:', error));
        } else if (autoPromptRebounds) {
          // Non-coach mode: Prompt for who turned it over (linked to rebound flag for simplicity)
          showTurnoverPrompt({ playerId: selectedPlayer, playerName, teamId, statType, shotValue: 0, videoTimestampMs: currentVideoTimeMs });
        }
      } else if (statType === 'block' && autoPromptBlocks) {
        // Sequence #7: Block → Blocked Shot Type Prompt
        showBlockedShotPrompt({ playerId: selectedPlayer, playerName, teamId, statType: 'block', shotValue: 0, videoTimestampMs: currentVideoTimeMs, isOpponentStat: false });
      }
    }

    setSelectedPlayer(null);
  }, [selectedPlayer, gameData, gameClock, selectedTeam, gameId, videoId, currentVideoTimeMs, onStatRecorded, onBeforeRecord, teamAPlayers, teamBPlayers, showAssistPrompt, showReboundPrompt, showTurnoverPrompt, showBlockedShotPrompt, isCoachMode, userId, opponentName, setSelectedPlayer, autoPromptAssists, autoPromptRebounds, autoPromptBlocks]);

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

  // ✅ OPTIMIZED: Fire-and-forget pattern
  const handleTurnoverTypeSelect = useCallback((turnoverType: string) => {
    if (!lastEvent || !gameClock || !gameData) return;
    const modifier = turnoverType === 'other' ? undefined : turnoverType;
    
    const isOpponentStat = lastEvent.isOpponentStat === true;
    let playerId: string | undefined = lastEvent.playerId;
    let customPlayerId: string | undefined;
    let teamId = lastEvent.teamId;
    
    if (isOpponentStat) {
      playerId = userId;
      teamId = gameData.team_a_id;
    } else if (isCoachMode) {
      const playerData = teamAPlayers.find(p => p.id === lastEvent.playerId);
      const isCustomPlayer = playerData?.is_custom_player || lastEvent.playerId.startsWith('custom-');
      if (isCustomPlayer) { customPlayerId = lastEvent.playerId; playerId = undefined; }
    }
    
    // ✅ OPTIMIZED: Trigger timeline refresh immediately
    onStatRecorded?.('turnover');
    
    // Fire-and-forget
    VideoStatService.recordVideoStat({
        gameId, videoId, playerId, customPlayerId, isOpponentStat, teamId,
        statType: 'turnover', modifier, videoTimestampMs: lastEvent.videoTimestampMs,
        quarter: gameClock.quarter, gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
        skipPostUpdates: true,
    })
      .catch((error) => console.error('Error recording turnover:', error));
    
    // UI updates immediately
      setSelectedPlayer(null);
      closePrompt();
  }, [lastEvent, gameClock, gameData, gameId, videoId, onStatRecorded, closePrompt, isCoachMode, userId, teamAPlayers, setSelectedPlayer]);

  // Rebound handlers (standalone R key press - not sequence after missed shot)
  const handleInitiateRebound = useCallback(() => {
    if (!selectedPlayer || !gameData || !gameClock) return;
    onBeforeRecord?.();
    
    const isOpponentStat = isCoachMode && selectedPlayer === OPPONENT_TEAM_ID;
    const playerData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer);
    const playerName = isOpponentStat ? (opponentName || 'Opponent') : (playerData?.name || 'Player');
    const teamId = isOpponentStat ? gameData.team_a_id : (selectedTeam === 'A' ? gameData.team_a_id : gameData.team_b_id);
    
    showReboundTypePrompt({ 
      playerId: selectedPlayer, 
      playerName, 
      teamId, 
      statType: 'rebound', 
      shotValue: 0, 
      videoTimestampMs: currentVideoTimeMs,
      isOpponentStat,
    });
  }, [selectedPlayer, gameData, gameClock, selectedTeam, teamAPlayers, teamBPlayers, currentVideoTimeMs, onBeforeRecord, showReboundTypePrompt, isCoachMode, opponentName]);

  // ✅ OPTIMIZED: Fire-and-forget pattern
  const handleReboundTypeSelect = useCallback((reboundType: 'offensive' | 'defensive') => {
    if (!lastEvent || !gameClock || !gameData) return;
    
    const isOpponentStat = lastEvent.isOpponentStat === true;
    let playerId: string | undefined = lastEvent.playerId;
    let customPlayerId: string | undefined;
    let teamId = lastEvent.teamId;
    
    if (isOpponentStat) {
      playerId = userId;
      teamId = gameData.team_a_id;
    } else if (isCoachMode) {
      const playerData = teamAPlayers.find(p => p.id === lastEvent.playerId);
      const isCustomPlayer = playerData?.is_custom_player || lastEvent.playerId.startsWith('custom-');
      if (isCustomPlayer) { customPlayerId = lastEvent.playerId; playerId = undefined; }
    }
    
    // ✅ OPTIMIZED: Trigger timeline refresh immediately
    onStatRecorded?.('rebound');
    
    // Fire-and-forget
    VideoStatService.recordVideoStat({
        gameId, videoId, playerId, customPlayerId, isOpponentStat, teamId,
        statType: 'rebound', modifier: reboundType, videoTimestampMs: lastEvent.videoTimestampMs,
        quarter: gameClock.quarter, gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
        skipPostUpdates: true,
    })
      .catch((error) => console.error('Error recording rebound:', error));
    
    // UI updates immediately
      setSelectedPlayer(null);
      closePrompt();
  }, [lastEvent, gameClock, gameData, gameId, videoId, onStatRecorded, closePrompt, isCoachMode, userId, teamAPlayers, setSelectedPlayer]);

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

  // ✅ OPTIMIZED: Fire-and-forget pattern
  const handleFoulTypeSelect = useCallback((foulType: string, ftCount: number = 0) => {
    if (!lastEvent || !gameClock || !gameData) return;
    
    const isOpponentStat = lastEvent.isOpponentStat === true;
    let playerId: string | undefined = lastEvent.playerId;
    let customPlayerId: string | undefined;
    let teamId = lastEvent.teamId;
    
    if (isOpponentStat) {
      playerId = userId;
      teamId = gameData.team_a_id;
    } else if (isCoachMode) {
      const playerData = teamAPlayers.find(p => p.id === lastEvent.playerId);
      const isCustomPlayer = playerData?.is_custom_player || lastEvent.playerId.startsWith('custom-');
      if (isCustomPlayer) { customPlayerId = lastEvent.playerId; playerId = undefined; }
    }
    
    // ✅ OPTIMIZED: Trigger timeline refresh immediately
    onStatRecorded?.('foul');
    
    // Fire-and-forget
    VideoStatService.recordVideoStat({
        gameId, videoId, playerId, customPlayerId, isOpponentStat, teamId,
        statType: 'foul', modifier: foulType, videoTimestampMs: lastEvent.videoTimestampMs,
        quarter: gameClock.quarter, gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
        skipPostUpdates: true,
    })
      .catch((error) => console.error('Error recording foul:', error));
      
    // ✅ SEQUENCE #10-11: Shooting fouls → FT sequence (controlled by autoFreeThrowSequence)
    if (ftCount > 0 && autoFreeThrowSequence) {
      if (isOpponentStat) {
        // Sequence #10: Opponent shooting foul → Fouled Player Prompt
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
        // Coach's player committed shooting foul → FT sequence for other team (not typical in coach mode)
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
      return;
    }

    // No follow-up prompt needed (either ftCount=0 or manual mode)
    setSelectedPlayer(null);
    closePrompt();
  }, [lastEvent, gameClock, gameData, gameId, videoId, onStatRecorded, closePrompt, showFreeThrowPrompt, showFouledPlayerPrompt, isCoachMode, userId, opponentName, teamAPlayers, setSelectedPlayer, autoFreeThrowSequence]);

  // Free throw handler - ✅ OPTIMIZED: Batch inserts with Promise.all
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
      
      // ✅ OPTIMIZATION: Batch all FT inserts with Promise.all (skip post-updates per insert)
      const ftPromises = results.map(result => 
        VideoStatService.recordVideoStat({
          gameId, videoId, playerId, customPlayerId, teamId: lastEvent.teamId,
          statType: 'free_throw', modifier: result.made ? 'made' : 'missed',
          videoTimestampMs: lastEvent.videoTimestampMs, quarter: gameClock.quarter,
          gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
          skipPostUpdates: true, // ✅ Skip per-insert updates, do batch cleanup below
        })
      );
      
      await Promise.all(ftPromises);
      
      // ✅ OPTIMIZATION: Single batch cleanup after all FTs recorded
      await Promise.all([
        VideoStatService.updateStatsCount(gameId),
        VideoStatService.updateGameClockState(gameId, gameClock.quarter, gameClock.minutesRemaining, gameClock.secondsRemaining),
      ]);
      
      // Notify UI for each FT recorded
      results.forEach(() => onStatRecorded?.('free_throw'));
      
      const lastResult = results[results.length - 1];
      // ✅ SEQUENCE #5: Missed last FT → Rebound Prompt (controlled by autoPromptRebounds)
      if (!lastResult.made && autoPromptRebounds) {
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
  }, [lastEvent, gameClock, gameId, videoId, onStatRecorded, closePrompt, showReboundPrompt, isCoachMode, teamAPlayers, setIsRecording, setSelectedPlayer, autoPromptRebounds]);

  // Shot made/missed handler (for shooting fouls - and-1 logic) - ✅ OPTIMIZED: Fire-and-forget
  const handleShotMadeMissed = useCallback((made: boolean) => {
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
    
    // If shot was made (and-1), record the made shot (fire-and-forget)
    if (made) {
      const statTypeName = shotType === '3pt' ? 'three_pointer' : 'field_goal';
      
      // ✅ OPTIMIZED: Trigger timeline refresh immediately
      onStatRecorded?.(statTypeName);
      
      VideoStatService.recordVideoStat({
          gameId, videoId, 
          playerId: actualPlayerId, 
          customPlayerId,
        teamId: gameData.team_a_id,
        statType: statTypeName,
          modifier: 'made',
          videoTimestampMs: lastEvent.videoTimestampMs,
          quarter: gameClock.quarter,
          gameTimeMinutes: gameClock.minutesRemaining,
          gameTimeSeconds: gameClock.secondsRemaining,
          skipPostUpdates: true,
      })
        .catch((error) => console.error('Error recording and-1 shot:', error));
      }
      
    // UI updates immediately
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
      isOpponentStat: false,
    });
  }, [lastEvent, gameClock, gameData, gameId, videoId, teamAPlayers, isCoachMode, onStatRecorded, closePrompt, showFreeThrowPrompt]);

  // Block handlers - ✅ OPTIMIZED: Fire-and-forget
  const handleBlockedShotTypeSelect = useCallback((shotType: 'field_goal' | 'three_pointer') => {
    if (!lastEvent || !gameClock || !gameData) return;
    const wasOpponentBlock = lastEvent.isOpponentStat === true;
    
    // ✅ SEQUENCE #8: Opponent block → Blocked Shooter Prompt (controlled by autoPromptBlocks)
    if (wasOpponentBlock && isCoachMode && autoPromptBlocks) {
      closePrompt();
      showBlockedShooterPrompt({ playerId: lastEvent.playerId, playerName: lastEvent.playerName, teamId: lastEvent.teamId, statType: 'block', shotValue: 0, videoTimestampMs: lastEvent.videoTimestampMs, isOpponentStat: true, blockedShotType: shotType });
      return;
    }
    
    // ✅ OPTIMIZED: Trigger timeline refresh immediately
    onStatRecorded?.(shotType);
    
    // Fire-and-forget: Coach's player blocked opponent's shot: record opponent's missed shot
    VideoStatService.recordVideoStat({
      gameId, videoId, playerId: isCoachMode ? userId : undefined, isOpponentStat: true,
      teamId: gameData.team_a_id, statType: shotType, modifier: 'missed',
      videoTimestampMs: lastEvent.videoTimestampMs, quarter: gameClock.quarter,
      gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
      skipPostUpdates: true,
    })
      .catch((error) => console.error('Error recording blocked shot:', error));
    
    closePrompt();
    
    // ✅ SEQUENCE #9: Blocked shot → Rebound Prompt (controlled by autoPromptRebounds)
    if (autoPromptRebounds) {
      showReboundPrompt({ playerId: lastEvent.playerId, playerName: lastEvent.playerName, teamId: lastEvent.teamId, statType: 'block', shotValue: 0, videoTimestampMs: lastEvent.videoTimestampMs, isOpponentStat: true });
    }
  }, [lastEvent, gameClock, gameData, gameId, videoId, onStatRecorded, closePrompt, showReboundPrompt, showBlockedShooterPrompt, isCoachMode, userId, autoPromptBlocks, autoPromptRebounds]);

  // Prompt player selection handler - ✅ OPTIMIZED: Fire-and-forget pattern
  const handlePromptPlayerSelect = useCallback((playerId: string) => {
    if (!gameData || !gameClock || !lastEvent) return;
    const player = [...teamAPlayers, ...teamBPlayers].find(p => p.id === playerId);
    const playerTeamId = player?.teamId || lastEvent.teamId;
    
    let actualPlayerId: string | undefined = playerId;
    let customPlayerId: string | undefined;
    
    if (isCoachMode) {
      const isCustomPlayer = player?.is_custom_player || playerId.startsWith('custom-');
      if (isCustomPlayer) { customPlayerId = playerId; actualPlayerId = undefined; }
    }
    
    // Handle fouled_player case (no DB write, just show prompt)
    if (promptType === 'fouled_player') {
      const ftCount = lastEvent.ftCount || 2;
      const foulType = lastEvent.foulType || 'shooting';
      closePrompt();
      
      if (foulType === 'shooting' && (ftCount === 2 || ftCount === 3)) {
        showShotMadeMissedPrompt({
          playerId: playerId,
          playerName: player?.name || 'Player',
          teamId: gameData.team_a_id,
          statType: 'foul',
          shotValue: 0,
          videoTimestampMs: lastEvent.videoTimestampMs,
          ftCount,
          foulType,
          isOpponentStat: false,
          shootingFoulShotType: ftCount === 3 ? '3pt' : '2pt',
          victimPlayerId: playerId,
          victimPlayerName: player?.name || 'Player',
        });
        return;
      }
      
      showFreeThrowPrompt({
        playerId: playerId,
        playerName: player?.name || 'Player',
        teamId: gameData.team_a_id,
        statType: 'free_throw',
        shotValue: 1,
        videoTimestampMs: lastEvent.videoTimestampMs,
        ftCount,
        foulType,
        isOpponentStat: false,
      });
      return;
    }
    
    // Handle blocked_shooter case - fire-and-forget then optionally show rebound prompt
    if (promptType === 'blocked_shooter') {
      const shotType = lastEvent.blockedShotType || 'field_goal';
      
      // ✅ OPTIMIZED: Trigger timeline refresh immediately
      onStatRecorded?.(shotType);
      
      VideoStatService.recordVideoStat({
        gameId, videoId, playerId: actualPlayerId, customPlayerId, isOpponentStat: false,
        teamId: gameData.team_a_id, statType: shotType, modifier: 'missed',
        videoTimestampMs: lastEvent.videoTimestampMs, quarter: gameClock.quarter,
        gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
        skipPostUpdates: true,
      })
        .catch((error) => console.error('Error recording blocked shooter:', error));
      
      closePrompt();
      
      // ✅ SEQUENCE #9 (variant): Blocked shooter recorded → Rebound Prompt (controlled by autoPromptRebounds)
      if (autoPromptRebounds) {
        showReboundPrompt({ playerId, playerName: player?.name || 'Player', teamId: gameData.team_a_id, statType: 'block', shotValue: 0, videoTimestampMs: lastEvent.videoTimestampMs, isOpponentStat: false });
      }
      return;
    }
    
    // Handle assist, rebound, turnover - fire-and-forget
    // ✅ OPTIMIZED: Trigger timeline refresh immediately for all stat types
    if (promptType === 'assist') {
      onStatRecorded?.('assist');
      VideoStatService.recordVideoStat({
        gameId, videoId, playerId: actualPlayerId, customPlayerId, teamId: lastEvent.teamId,
        statType: 'assist', videoTimestampMs: lastEvent.videoTimestampMs,
        quarter: gameClock.quarter, gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
        skipPostUpdates: true,
      })
        .catch((error) => console.error('Error recording assist:', error));
    } else if (promptType === 'rebound') {
      onStatRecorded?.('rebound');
      const isOpponentRebound = isCoachMode && playerId === OPPONENT_TEAM_ID;
      const wasOpponentShot = lastEvent.isOpponentStat === true;
      let isOffensive: boolean;
      
      if (isOpponentRebound) {
        isOffensive = lastEvent.statType === 'block' || wasOpponentShot;
        VideoStatService.recordVideoStat({
          gameId, videoId, playerId: userId, isOpponentStat: true, teamId: gameData.team_a_id,
          statType: 'rebound', modifier: isOffensive ? 'offensive' : 'defensive',
          videoTimestampMs: lastEvent.videoTimestampMs, quarter: gameClock.quarter,
          gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
          skipPostUpdates: true,
        })
          .catch((error) => console.error('Error recording opponent rebound:', error));
      } else {
        isOffensive = lastEvent.statType === 'block' ? false : (wasOpponentShot ? false : true);
        VideoStatService.recordVideoStat({
          gameId, videoId, playerId: actualPlayerId, customPlayerId, teamId: playerTeamId,
          statType: 'rebound', modifier: isOffensive ? 'offensive' : 'defensive',
          videoTimestampMs: lastEvent.videoTimestampMs, quarter: gameClock.quarter,
          gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
          skipPostUpdates: true,
        })
          .catch((error) => console.error('Error recording rebound:', error));
      }
    } else if (promptType === 'turnover') {
      onStatRecorded?.('turnover');
      if (isCoachMode && lastEvent.isOpponentStat) {
        VideoStatService.recordVideoStat({
          gameId, videoId, playerId: actualPlayerId, customPlayerId, isOpponentStat: false,
          teamId: gameData.team_a_id, statType: 'turnover', modifier: 'steal',
          videoTimestampMs: lastEvent.videoTimestampMs, quarter: gameClock.quarter,
          gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
          skipPostUpdates: true,
        })
          .catch((error) => console.error('Error recording turnover:', error));
      } else {
        VideoStatService.recordVideoStat({
          gameId, videoId, playerId: actualPlayerId, customPlayerId, teamId: playerTeamId,
          statType: 'turnover', modifier: 'steal', videoTimestampMs: lastEvent.videoTimestampMs,
          quarter: gameClock.quarter, gameTimeMinutes: gameClock.minutesRemaining, gameTimeSeconds: gameClock.secondsRemaining,
          skipPostUpdates: true,
        })
          .catch((error) => console.error('Error recording turnover:', error));
      }
    }
    
    // UI updates immediately
    closePrompt();
  }, [gameData, gameClock, lastEvent, promptType, gameId, videoId, teamAPlayers, teamBPlayers, onStatRecorded, closePrompt, showReboundPrompt, showFreeThrowPrompt, showShotMadeMissedPrompt, isCoachMode, userId, autoPromptRebounds]);

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
    handleInitiateRebound, handleReboundTypeSelect,
    handleInitiateTurnover, handleTurnoverTypeSelect,
    handleInitiateFoul, handleFoulTypeSelect, handleFreeThrowComplete,
    handleShotMadeMissed,
    handleBlockedShotTypeSelect, handlePromptPlayerSelect,
    handleOpenSubModal, handleSubConfirm,
  };
}

