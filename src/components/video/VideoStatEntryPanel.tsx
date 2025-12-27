'use client';

/**
 * VideoStatEntryPanel - Stat entry panel for video stat tracker
 * 
 * Integrates roster, stat buttons, and inline prompts for video review.
 * Uses non-blocking inline prompts for keyboard-driven workflow.
 * 
 * @module VideoStatEntryPanel
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { VideoPlayerRoster } from '@/components/video/VideoPlayerRoster';
import { VideoStatButtons } from '@/components/video/VideoStatButtons';
import { VideoInlinePrompt } from '@/components/video/VideoInlinePrompt';
import { VideoTurnoverTypePrompt } from '@/components/video/VideoTurnoverTypePrompt';
import { VideoFoulTypePrompt } from '@/components/video/VideoFoulTypePrompt';
import { SubstitutionModalV4 } from '@/components/tracker-v3/SubstitutionModalV4';
import { GameService } from '@/lib/services/gameService';
import { TeamService } from '@/lib/services/tournamentService';
import { VideoStatService } from '@/lib/services/videoStatService';
import { useVideoStatPrompts, getShotValue, getShotTypeLabel } from '@/hooks/useVideoStatPrompts';
import type { GameClock } from '@/lib/types/video';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  teamId?: string;
  is_custom_player?: boolean; // For coach mode custom players
}

// Special ID for opponent team selection in coach mode
const OPPONENT_TEAM_ID = 'opponent-team';

// Handlers exposed to parent for keyboard shortcuts
export interface VideoStatHandlers {
  recordShot2PT: () => void;  // P key
  recordShot3PT: () => void;  // Shift+P key
  recordMiss2PT: () => void;  // M key
  recordMiss3PT: () => void;  // Shift+M key
  recordFTMade: () => void;   // G key
  recordFTMiss: () => void;   // Shift+G key
  recordRebound: () => void;
  recordAssist: () => void;
  recordSteal: () => void;
  recordBlock: () => void;
  recordTurnover: () => void;
  recordFoul: () => void;
  openSubstitutionModal: () => void; // S key
  selectPlayerByIndex: (index: number) => void;
}

interface VideoStatEntryPanelProps {
  gameId: string;
  videoId: string;
  currentVideoTimeMs: number;
  gameClock: GameClock | null;
  onStatRecorded?: (statType: string, statId?: string) => void;
  onBeforeRecord?: () => void;
  onRegisterHandlers?: (handlers: VideoStatHandlers) => void;
  // Coach mode props (optional - if not provided, uses standard game loading)
  isCoachMode?: boolean;
  userId?: string; // Coach's user ID (used as proxy for opponent stats)
  opponentName?: string;
  preloadedTeamAPlayers?: Player[]; // Pre-loaded players for team A (coach's team)
  preloadedGameData?: any; // Pre-loaded game data
}

export function VideoStatEntryPanel({
  gameId, videoId, currentVideoTimeMs, gameClock,
  onStatRecorded, onBeforeRecord, onRegisterHandlers,
  isCoachMode = false, userId, opponentName,
  preloadedTeamAPlayers, preloadedGameData,
}: VideoStatEntryPanelProps) {
  const [loading, setLoading] = useState(!preloadedGameData);
  const [gameData, setGameData] = useState<any>(preloadedGameData || null);
  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>(preloadedTeamAPlayers || []);
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<'A' | 'B' | 'opponent'>('A');
  const [isRecording, setIsRecording] = useState(false);
  
  // Substitution state: on-court and bench rosters
  const [onCourtA, setOnCourtA] = useState<Player[]>([]);
  const [benchA, setBenchA] = useState<Player[]>([]);
  const [onCourtB, setOnCourtB] = useState<Player[]>([]);
  const [benchB, setBenchB] = useState<Player[]>([]);
  const [showSubModal, setShowSubModal] = useState(false);
  
  const { promptType, lastEvent, showAssistPrompt, showReboundPrompt, showTurnoverPrompt, showTurnoverTypePrompt, showFoulTypePrompt, showBlockedShotPrompt, showBlockedShooterPrompt, closePrompt } = useVideoStatPrompts();

  // Load game and player data (skip if preloaded data provided)
  useEffect(() => {
    // If preloaded data exists, use it
    if (preloadedGameData) {
      setGameData(preloadedGameData);
      if (preloadedTeamAPlayers) {
        setTeamAPlayers(preloadedTeamAPlayers);
        // Initialize on-court: first 5 players, rest on bench
        setOnCourtA(preloadedTeamAPlayers.slice(0, 5));
        setBenchA(preloadedTeamAPlayers.slice(5));
      }
      setLoading(false);
      return;
    }
    
    async function loadGameData() {
      try {
        setLoading(true);
        const game = await GameService.getGame(gameId);
        if (!game) return;
        setGameData(game);
        
        const [playersA, playersB] = await Promise.all([
          TeamService.getTeamPlayers(game.team_a_id),
          TeamService.getTeamPlayers(game.team_b_id),
        ]);
        
        const mappedPlayersA = playersA.map((p: any) => ({
          id: p.id, name: p.name || 'Unknown',
          jerseyNumber: p.jerseyNumber || p.jersey_number,
          teamId: game.team_a_id,
        }));
        const mappedPlayersB = playersB.map((p: any) => ({
          id: p.id, name: p.name || 'Unknown',
          jerseyNumber: p.jerseyNumber || p.jersey_number,
          teamId: game.team_b_id,
        }));
        
        setTeamAPlayers(mappedPlayersA);
        setTeamBPlayers(mappedPlayersB);
        
        // Initialize on-court: first 5 players, rest on bench
        setOnCourtA(mappedPlayersA.slice(0, 5));
        setBenchA(mappedPlayersA.slice(5));
        setOnCourtB(mappedPlayersB.slice(0, 5));
        setBenchB(mappedPlayersB.slice(5));
      } catch (error) {
        console.error('Error loading game data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadGameData();
  }, [gameId, preloadedGameData, preloadedTeamAPlayers]);

  const handlePlayerSelect = useCallback((playerId: string) => {
    // If there's a prompt active, this selection is for the prompt
    if (promptType) return;
    setSelectedPlayer(playerId);
    
    // Handle opponent team selection in coach mode
    if (isCoachMode && playerId === OPPONENT_TEAM_ID) {
      setSelectedTeam('opponent');
      return;
    }
    
    const isTeamA = teamAPlayers.some(p => p.id === playerId);
    setSelectedTeam(isTeamA ? 'A' : 'B');
  }, [teamAPlayers, promptType, isCoachMode]);

  const handlePlayerSelectByIndex = useCallback((index: number) => {
    // If there's a prompt active, don't change player selection
    if (promptType) return;
    
    // Coach mode: '0' key (index 9) selects opponent, 1-5 selects on-court players
    if (isCoachMode) {
      if (index === 9) {
        // '0' key = Opponent
        handlePlayerSelect(OPPONENT_TEAM_ID);
        return;
      }
      // Keys 1-5 select on-court players (indexes 0-4)
      if (index >= 0 && index < onCourtA.length) {
        handlePlayerSelect(onCourtA[index].id);
      }
      return;
    }
    
    // Regular mode: 1-5 = Team A on-court, 6-0 = Team B on-court
    if (index >= 0 && index < 5) {
      // Keys 1-5 = Team A (indexes 0-4)
      if (index < onCourtA.length) {
        handlePlayerSelect(onCourtA[index].id);
      }
    } else {
      // Keys 6-0 = Team B (indexes 5-9 map to 0-4)
      const teamBIndex = index - 5;
      if (teamBIndex >= 0 && teamBIndex < onCourtB.length) {
        handlePlayerSelect(onCourtB[teamBIndex].id);
      }
    }
  }, [teamAPlayers, teamBPlayers, onCourtA, onCourtB, handlePlayerSelect, promptType, isCoachMode]);

  const handleStatRecord = useCallback(async (statType: string, modifier?: string) => {
    console.log('📊 Recording stat:', { 
      hasPlayer: !!selectedPlayer, 
      hasGameData: !!gameData, 
      gameClock,
      currentVideoTimeMs,
      isCoachMode,
      selectedTeam
    });
    if (!selectedPlayer || !gameData || !gameClock) return;
    onBeforeRecord?.();
    
    try {
      setIsRecording(true);
      
      // Determine team ID and player info based on mode
      let teamId: string;
      let playerId: string | undefined;
      let customPlayerId: string | undefined;
      let isOpponentStat = false;
      let playerName = 'Player';
      
      if (isCoachMode && selectedTeam === 'opponent') {
        // OPPONENT TEAM STAT (coach mode)
        // Use coach's user ID as proxy player, mark as opponent stat
        teamId = gameData.team_a_id; // Coach's team UUID (required for DB)
        playerId = userId || undefined;
        isOpponentStat = true;
        playerName = opponentName || 'Opponent';
      } else {
        // Regular player or coach's team player
        teamId = selectedTeam === 'A' ? gameData.team_a_id : gameData.team_b_id;
        const playerData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer);
        playerName = playerData?.name || 'Player';
        
        // Check if custom player
        const isCustomPlayer = playerData?.is_custom_player || selectedPlayer.startsWith('custom-');
        if (isCustomPlayer) {
          customPlayerId = selectedPlayer;
          playerId = undefined;
        } else {
          playerId = selectedPlayer;
          customPlayerId = undefined;
        }
      }
      
      console.log('💾 Saving stat with clock:', {
        quarter: gameClock.quarter,
        minutes: gameClock.minutesRemaining,
        seconds: gameClock.secondsRemaining,
        videoMs: currentVideoTimeMs,
        isOpponentStat,
        customPlayerId
      });
      
      const statId = await VideoStatService.recordVideoStat({
        gameId, videoId, playerId, customPlayerId, isOpponentStat, teamId, statType, modifier,
        videoTimestampMs: currentVideoTimeMs,
        quarter: gameClock.quarter,
        gameTimeMinutes: gameClock.minutesRemaining,
        gameTimeSeconds: gameClock.secondsRemaining,
      });
      
      onStatRecorded?.(statType, statId);
      
      // Auto-sequence prompts logic for coach mode edge cases:
      // 1. Opponent made shot → NO assist prompt (opponent has no teammates)
      // 2. Opponent missed shot → Show rebound prompt (only coach's team can rebound)
      // 3. Coach steal → Auto-record opponent turnover (no player selection needed)
      // 4. Coach block → Show rebound prompt (only coach's team)
      
      if (isOpponentStat) {
        // OPPONENT STAT - Special handling for coach mode
        if (modifier === 'missed') {
          // Opponent missed → Rebound prompt (coach's team + opponent option)
          showReboundPrompt({
            playerId: selectedPlayer,
            playerName,
            teamId,
            statType,
            shotValue: 0,
            videoTimestampMs: currentVideoTimeMs,
            isOpponentStat: true,  // Track that this was opponent's miss
          });
        } else if (statType === 'steal') {
          // Opponent steal → Prompt for who turned it over (coach's players)
          showTurnoverPrompt({
            playerId: selectedPlayer,
            playerName: opponentName || 'Opponent',
            teamId,
            statType: 'steal',
            shotValue: 0,
            videoTimestampMs: currentVideoTimeMs,
            isOpponentStat: true,  // Track that steal was by opponent
          });
        } else if (statType === 'block') {
          // Opponent block → Show blocked shot type prompt, then ask who got blocked
          showBlockedShotPrompt({
            playerId: selectedPlayer,
            playerName: opponentName || 'Opponent',
            teamId,
            statType: 'block',
            shotValue: 0,
            videoTimestampMs: currentVideoTimeMs,
            isOpponentStat: true,  // Opponent blocked coach's player
          });
        }
        // Made shots: No assist prompt for opponent (no teammates to select)
      } else {
        // COACH'S TEAM STAT - Normal prompts
        if (modifier === 'made' && (statType === 'field_goal' || statType === 'three_pointer')) {
          // Made shot → Assist prompt
          showAssistPrompt({
            playerId: selectedPlayer,
            playerName,
            teamId,
            statType,
            shotValue: getShotValue(statType),
            videoTimestampMs: currentVideoTimeMs,
          });
        } else if (modifier === 'missed') {
          // Missed shot → Rebound prompt
          showReboundPrompt({
            playerId: selectedPlayer,
            playerName,
            teamId,
            statType,
            shotValue: 0,
            videoTimestampMs: currentVideoTimeMs,
            isOpponentStat: false,  // Coach's team missed
          });
        } else if (statType === 'steal') {
          // Steal → In coach mode, auto-record opponent turnover (no selection needed)
          if (isCoachMode) {
            // Auto-record turnover for opponent immediately
            await VideoStatService.recordVideoStat({
              gameId, videoId,
              playerId: userId,
              isOpponentStat: true,
              teamId: gameData.team_a_id,
              statType: 'turnover', modifier: 'steal',
              videoTimestampMs: currentVideoTimeMs,
              quarter: gameClock.quarter,
              gameTimeMinutes: gameClock.minutesRemaining,
              gameTimeSeconds: gameClock.secondsRemaining,
            });
            onStatRecorded?.('turnover');
          } else {
            // Normal mode: Show turnover prompt for opposing team player selection
            showTurnoverPrompt({
              playerId: selectedPlayer,
              playerName,
              teamId,
              statType,
              shotValue: 0,
              videoTimestampMs: currentVideoTimeMs,
            });
          }
        } else if (statType === 'block') {
          // Block → Show blocked shot type prompt (2PT or 3PT)
          // This will record a missed shot for opponent, then show rebound prompt
          showBlockedShotPrompt({
            playerId: selectedPlayer,
            playerName,
            teamId,
            statType: 'block',
            shotValue: 0,
            videoTimestampMs: currentVideoTimeMs,
            isOpponentStat: false,  // Coach's team blocked (opponent was shooter)
          });
        }
      }
      
      setSelectedPlayer(null);
    } catch (error) {
      console.error('Error recording stat:', error);
    } finally {
      setIsRecording(false);
    }
  }, [selectedPlayer, gameData, gameClock, selectedTeam, gameId, videoId, currentVideoTimeMs, onStatRecorded, onBeforeRecord, teamAPlayers, teamBPlayers, showAssistPrompt, showReboundPrompt, showTurnoverPrompt, showBlockedShotPrompt, isCoachMode, userId, opponentName]);

  // Handler for initiating turnover (shows type selection prompt)
  const handleInitiateTurnover = useCallback(() => {
    if (!selectedPlayer || !gameData || !gameClock) return;
    onBeforeRecord?.();
    
    const playerData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer);
    const teamId = selectedTeam === 'A' ? gameData.team_a_id : gameData.team_b_id;
    
    showTurnoverTypePrompt({
      playerId: selectedPlayer,
      playerName: playerData?.name || 'Player',
      teamId,
      statType: 'turnover',
      shotValue: 0,
      videoTimestampMs: currentVideoTimeMs,
    });
  }, [selectedPlayer, gameData, gameClock, selectedTeam, teamAPlayers, teamBPlayers, currentVideoTimeMs, onBeforeRecord, showTurnoverTypePrompt]);

  // Handler for when turnover type is selected
  const handleTurnoverTypeSelect = useCallback(async (turnoverType: string) => {
    if (!lastEvent || !gameClock) return;
    
    // Map 'other' to null (generic turnover) per v3 tracker pattern
    const modifier = turnoverType === 'other' ? undefined : turnoverType;
    
    // Determine player IDs based on coach mode
    let playerId: string | undefined = lastEvent.playerId;
    let customPlayerId: string | undefined;
    
    if (isCoachMode) {
      const playerData = teamAPlayers.find(p => p.id === lastEvent.playerId);
      const isCustomPlayer = playerData?.is_custom_player || lastEvent.playerId.startsWith('custom-');
      if (isCustomPlayer) {
        customPlayerId = lastEvent.playerId;
        playerId = undefined;
      }
    }
    
    try {
      setIsRecording(true);
      const statId = await VideoStatService.recordVideoStat({
        gameId, videoId, playerId, customPlayerId, teamId: lastEvent.teamId,
        statType: 'turnover', modifier,
        videoTimestampMs: lastEvent.videoTimestampMs,
        quarter: gameClock.quarter,
        gameTimeMinutes: gameClock.minutesRemaining,
        gameTimeSeconds: gameClock.secondsRemaining,
      });
      
      onStatRecorded?.('turnover', statId);
      setSelectedPlayer(null);
    } catch (error) {
      console.error('Error recording turnover:', error);
    } finally {
      setIsRecording(false);
      closePrompt();
    }
  }, [lastEvent, gameClock, gameId, videoId, onStatRecorded, closePrompt, isCoachMode, teamAPlayers]);

  // Handler for substitution modal open
  const handleOpenSubModal = useCallback(() => {
    // Don't open if a prompt is active or in opponent mode (opponent has no roster)
    if (promptType || (isCoachMode && selectedTeam === 'opponent')) return;
    setShowSubModal(true);
  }, [promptType, isCoachMode, selectedTeam]);

  // Handler for substitution confirmation
  const handleSubConfirm = useCallback(async (substitutions: Array<{ playerOutId: string; playerInId: string }>) => {
    if (!gameData || substitutions.length === 0) return;
    
    try {
      // Group substitutions by team
      for (const sub of substitutions) {
        const isTeamAPlayer = onCourtA.some(p => p.id === sub.playerOutId);
        
        if (isTeamAPlayer) {
          const playerOut = onCourtA.find(p => p.id === sub.playerOutId);
          const playerIn = benchA.find(p => p.id === sub.playerInId);
          if (!playerOut || !playerIn) continue;
          
          // Determine if custom players
          const isCustomPlayerOut = playerOut.is_custom_player || sub.playerOutId.startsWith('custom-');
          const isCustomPlayerIn = playerIn.is_custom_player || sub.playerInId.startsWith('custom-');
          
          // Record to database
          await GameService.recordSubstitution({
            gameId,
            teamId: gameData.team_a_id,
            playerInId: sub.playerInId,
            playerOutId: sub.playerOutId,
            quarter: gameClock?.quarter || 1,
            gameTimeMinutes: gameClock?.minutesRemaining || 0,
            gameTimeSeconds: gameClock?.secondsRemaining || 0,
            isCustomPlayerIn,
            isCustomPlayerOut,
          });
          
          // Update local state
          setOnCourtA(prev => prev.map(p => p.id === sub.playerOutId ? playerIn : p));
          setBenchA(prev => prev.map(p => p.id === sub.playerInId ? playerOut : p));
        } else {
          // Team B substitution (only for non-coach mode)
          const playerOut = onCourtB.find(p => p.id === sub.playerOutId);
          const playerIn = benchB.find(p => p.id === sub.playerInId);
          if (!playerOut || !playerIn) continue;
          
          await GameService.recordSubstitution({
            gameId,
            teamId: gameData.team_b_id,
            playerInId: sub.playerInId,
            playerOutId: sub.playerOutId,
            quarter: gameClock?.quarter || 1,
            gameTimeMinutes: gameClock?.minutesRemaining || 0,
            gameTimeSeconds: gameClock?.secondsRemaining || 0,
            isCustomPlayerIn: false,
            isCustomPlayerOut: false,
          });
          
          setOnCourtB(prev => prev.map(p => p.id === sub.playerOutId ? playerIn : p));
          setBenchB(prev => prev.map(p => p.id === sub.playerInId ? playerOut : p));
        }
      }
      
      setShowSubModal(false);
      console.log('✅ Substitution(s) recorded:', substitutions.length);
    } catch (error) {
      console.error('❌ Substitution failed:', error);
    }
  }, [gameData, gameId, gameClock, onCourtA, benchA, onCourtB, benchB]);

  // Handler for initiating foul (shows type selection prompt)
  const handleInitiateFoul = useCallback(() => {
    if (!selectedPlayer || !gameData || !gameClock) return;
    onBeforeRecord?.();
    
    const playerData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer);
    const teamId = selectedTeam === 'A' ? gameData.team_a_id : gameData.team_b_id;
    
    showFoulTypePrompt({
      playerId: selectedPlayer,
      playerName: playerData?.name || 'Player',
      teamId,
      statType: 'foul',
      shotValue: 0,
      videoTimestampMs: currentVideoTimeMs,
    });
  }, [selectedPlayer, gameData, gameClock, selectedTeam, teamAPlayers, teamBPlayers, currentVideoTimeMs, onBeforeRecord, showFoulTypePrompt]);

  // Handler for when foul type is selected
  const handleFoulTypeSelect = useCallback(async (foulType: string) => {
    if (!lastEvent || !gameClock) return;
    
    // Determine player IDs based on coach mode
    let playerId: string | undefined = lastEvent.playerId;
    let customPlayerId: string | undefined;
    
    if (isCoachMode) {
      const playerData = teamAPlayers.find(p => p.id === lastEvent.playerId);
      const isCustomPlayer = playerData?.is_custom_player || lastEvent.playerId.startsWith('custom-');
      if (isCustomPlayer) {
        customPlayerId = lastEvent.playerId;
        playerId = undefined;
      }
    }
    
    try {
      setIsRecording(true);
      const statId = await VideoStatService.recordVideoStat({
        gameId, videoId, playerId, customPlayerId, teamId: lastEvent.teamId,
        statType: 'foul', modifier: foulType,
        videoTimestampMs: lastEvent.videoTimestampMs,
        quarter: gameClock.quarter,
        gameTimeMinutes: gameClock.minutesRemaining,
        gameTimeSeconds: gameClock.secondsRemaining,
      });
      
      onStatRecorded?.('foul', statId);
      setSelectedPlayer(null);
    } catch (error) {
      console.error('Error recording foul:', error);
    } finally {
      setIsRecording(false);
      closePrompt();
    }
  }, [lastEvent, gameClock, gameId, videoId, onStatRecorded, closePrompt, isCoachMode, teamAPlayers]);

  // Handler for when blocked shot type is selected (2PT or 3PT)
  // Two flows based on who blocked:
  // 1. Coach blocks → auto-record opponent missed shot → rebound prompt
  // 2. Opponent blocks → prompt for who got blocked → record missed shot → rebound prompt
  const handleBlockedShotTypeSelect = useCallback(async (shotType: 'field_goal' | 'three_pointer') => {
    if (!lastEvent || !gameClock) return;
    
    const wasOpponentBlock = lastEvent.isOpponentStat === true;
    console.log('🏀 Blocked shot type selected:', shotType, 'by', lastEvent.playerName, 'opponent block:', wasOpponentBlock);
    
    if (wasOpponentBlock && isCoachMode) {
      // Opponent blocked coach's player → Need to ask who got blocked
      closePrompt();
      showBlockedShooterPrompt({
        playerId: lastEvent.playerId,
        playerName: lastEvent.playerName,
        teamId: lastEvent.teamId,
        statType: 'block',
        shotValue: 0,
        videoTimestampMs: lastEvent.videoTimestampMs,
        isOpponentStat: true,
        blockedShotType: shotType,  // Store for next step
      });
      return;
    }
    
    // Coach blocked opponent → Auto-record missed shot for opponent
    try {
      setIsRecording(true);
      
      await VideoStatService.recordVideoStat({
        gameId, videoId,
        playerId: isCoachMode ? userId : undefined, // Proxy for opponent in coach mode
        customPlayerId: undefined,
        isOpponentStat: true, // Opponent was the shooter
        teamId: isCoachMode ? 'opponent' : lastEvent.teamId,
        statType: shotType,
        modifier: 'missed',
        videoTimestampMs: lastEvent.videoTimestampMs,
        quarter: gameClock.quarter,
        gameTimeMinutes: gameClock.minutesRemaining,
        gameTimeSeconds: gameClock.secondsRemaining,
      });
      
      onStatRecorded?.(shotType);
      
      // Now show rebound prompt (blocked shot = loose ball)
      closePrompt();
      showReboundPrompt({
        playerId: lastEvent.playerId,
        playerName: lastEvent.playerName,
        teamId: lastEvent.teamId,
        statType: 'block',
        shotValue: 0,
        videoTimestampMs: lastEvent.videoTimestampMs,
        isOpponentStat: true, // The missed shot was by opponent
      });
      
    } catch (error) {
      console.error('Error recording blocked shot:', error);
      closePrompt();
    } finally {
      setIsRecording(false);
    }
  }, [lastEvent, gameClock, gameId, videoId, onStatRecorded, closePrompt, showReboundPrompt, showBlockedShooterPrompt, isCoachMode, userId]);

  // Handle inline prompt player selection
  const handlePromptPlayerSelect = useCallback(async (playerId: string) => {
    if (!gameData || !gameClock || !lastEvent) return;
    
    const player = [...teamAPlayers, ...teamBPlayers].find(p => p.id === playerId);
    const playerTeamId = player?.teamId || lastEvent.teamId;
    
    // Handle custom players in coach mode
    let actualPlayerId: string | undefined = playerId;
    let customPlayerId: string | undefined;
    
    if (isCoachMode) {
      const isCustomPlayer = player?.is_custom_player || playerId.startsWith('custom-');
      if (isCustomPlayer) {
        customPlayerId = playerId;
        actualPlayerId = undefined;
      }
    }
    
    let statId: string | undefined;
    
    if (promptType === 'assist') {
      statId = await VideoStatService.recordVideoStat({
        gameId, videoId, playerId: actualPlayerId, customPlayerId, teamId: lastEvent.teamId,
        statType: 'assist', modifier: undefined,
        videoTimestampMs: lastEvent.videoTimestampMs,
        quarter: gameClock.quarter,
        gameTimeMinutes: gameClock.minutesRemaining,
        gameTimeSeconds: gameClock.secondsRemaining,
      });
    } else if (promptType === 'rebound') {
      // Check if opponent was selected (coach mode)
      const isOpponentRebound = isCoachMode && playerId === OPPONENT_TEAM_ID;
      // Was the original shot/block from opponent?
      const wasOpponentShot = lastEvent.isOpponentStat === true;
      
      // Offensive rebound = rebounder is on SAME team as shooter
      // Defensive rebound = rebounder is on OPPOSITE team as shooter
      let isOffensive: boolean;
      
      if (isOpponentRebound) {
        // Opponent selected to get the rebound
        if (lastEvent.statType === 'block') {
          // Coach blocked opponent's shot → opponent (original shooter) gets OFFENSIVE rebound
          isOffensive = true;
        } else if (wasOpponentShot) {
          // Opponent missed their own shot → opponent gets OFFENSIVE rebound
          isOffensive = true;
        } else {
          // Coach's team missed → opponent gets DEFENSIVE rebound
          isOffensive = false;
        }
        
        statId = await VideoStatService.recordVideoStat({
          gameId, videoId,
          playerId: userId, // Use coach's userId as proxy
          isOpponentStat: true,
          teamId: gameData.team_a_id,
          statType: 'rebound', modifier: isOffensive ? 'offensive' : 'defensive',
          videoTimestampMs: lastEvent.videoTimestampMs,
          quarter: gameClock.quarter,
          gameTimeMinutes: gameClock.minutesRemaining,
          gameTimeSeconds: gameClock.secondsRemaining,
        });
      } else {
        // Coach's team player selected to get the rebound
        if (lastEvent.statType === 'block') {
          // Coach blocked opponent's shot → coach's team gets DEFENSIVE rebound
          isOffensive = false;
        } else if (wasOpponentShot) {
          // Opponent missed → coach's team gets DEFENSIVE rebound
          isOffensive = false;
        } else {
          // Coach's team missed → coach's team gets OFFENSIVE rebound
          isOffensive = true;
        }
        
        statId = await VideoStatService.recordVideoStat({
          gameId, videoId, playerId: actualPlayerId, customPlayerId, teamId: playerTeamId,
          statType: 'rebound', modifier: isOffensive ? 'offensive' : 'defensive',
          videoTimestampMs: lastEvent.videoTimestampMs,
          quarter: gameClock.quarter,
          gameTimeMinutes: gameClock.minutesRemaining,
          gameTimeSeconds: gameClock.secondsRemaining,
        });
      }
    } else if (promptType === 'turnover') {
      // Turnover = who lost the ball after a steal
      // Coach mode with opponent steal: coach's player (selected) turned it over
      // Coach mode with coach steal: auto-recorded, shouldn't reach here
      // Normal mode: opposing team player turns it over
      if (isCoachMode && lastEvent.isOpponentStat) {
        // Opponent stole → selected coach's player turned it over (NOT opponent stat)
        statId = await VideoStatService.recordVideoStat({
          gameId, videoId, 
          playerId: actualPlayerId,
          customPlayerId: customPlayerId,
          isOpponentStat: false, // Coach's player turned it over
          teamId: gameData.team_a_id,
          statType: 'turnover', modifier: 'steal',
          videoTimestampMs: lastEvent.videoTimestampMs,
          quarter: gameClock.quarter,
          gameTimeMinutes: gameClock.minutesRemaining,
          gameTimeSeconds: gameClock.secondsRemaining,
        });
      } else {
        // Normal mode or coach stole (shouldn't reach)
        statId = await VideoStatService.recordVideoStat({
          gameId, videoId, 
          playerId: actualPlayerId,
          customPlayerId: customPlayerId,
          isOpponentStat: false,
          teamId: playerTeamId,
          statType: 'turnover', modifier: 'steal',
          videoTimestampMs: lastEvent.videoTimestampMs,
          quarter: gameClock.quarter,
          gameTimeMinutes: gameClock.minutesRemaining,
          gameTimeSeconds: gameClock.secondsRemaining,
        });
      }
    } else if (promptType === 'blocked_shooter') {
      // Opponent blocked coach's player → record missed shot for selected coach player → rebound prompt
      const shotType = lastEvent.blockedShotType || 'field_goal';
      
      statId = await VideoStatService.recordVideoStat({
        gameId, videoId, 
        playerId: actualPlayerId,
        customPlayerId: customPlayerId,
        isOpponentStat: false, // Coach's player got blocked (their missed shot)
        teamId: gameData.team_a_id,
        statType: shotType, modifier: 'missed',
        videoTimestampMs: lastEvent.videoTimestampMs,
        quarter: gameClock.quarter,
        gameTimeMinutes: gameClock.minutesRemaining,
        gameTimeSeconds: gameClock.secondsRemaining,
      });
      
      onStatRecorded?.(shotType, statId);
      
      // Now show rebound prompt
      closePrompt();
      showReboundPrompt({
        playerId: playerId, // The blocked shooter
        playerName: player?.name || 'Player',
        teamId: gameData.team_a_id,
        statType: 'block',
        shotValue: 0,
        videoTimestampMs: lastEvent.videoTimestampMs,
        isOpponentStat: false, // Coach's team missed (was blocked)
      });
      return; // Don't close prompt yet - rebound prompt is now open
    }
    
    onStatRecorded?.(promptType || 'stat', statId);
    closePrompt();
  }, [gameData, gameClock, lastEvent, promptType, gameId, videoId, teamAPlayers, teamBPlayers, onStatRecorded, closePrompt, showReboundPrompt, isCoachMode, userId]);

  // Register handlers
  useEffect(() => {
    if (!onRegisterHandlers) return;
    onRegisterHandlers({
      recordShot2PT: () => handleStatRecord('field_goal', 'made'),
      recordShot3PT: () => handleStatRecord('three_pointer', 'made'),
      recordMiss2PT: () => handleStatRecord('field_goal', 'missed'),
      recordMiss3PT: () => handleStatRecord('three_pointer', 'missed'),
      recordFTMade: () => handleStatRecord('free_throw', 'made'),
      recordFTMiss: () => handleStatRecord('free_throw', 'missed'),
      recordRebound: () => handleStatRecord('rebound'),
      recordAssist: () => handleStatRecord('assist'),
      recordSteal: () => handleStatRecord('steal'),
      recordBlock: () => handleStatRecord('block'),
      recordTurnover: handleInitiateTurnover, // Shows type prompt first
      recordFoul: handleInitiateFoul, // Shows type prompt first
      openSubstitutionModal: handleOpenSubModal, // S key
      selectPlayerByIndex: handlePlayerSelectByIndex,
    });
  }, [onRegisterHandlers, handleStatRecord, handlePlayerSelectByIndex, handleInitiateTurnover, handleInitiateFoul, handleOpenSubModal]);

  if (loading) {
    return <div className="flex items-center justify-center h-full p-8"><Loader2 className="w-6 h-6 text-orange-500 animate-spin" /></div>;
  }
  if (!gameData) {
    return <div className="p-4 text-center text-gray-500"><p>Unable to load game data</p></div>;
  }

  // Get selected player display name
  const getSelectedPlayerDisplay = () => {
    if (!selectedPlayer) return null;
    if (isCoachMode && selectedPlayer === OPPONENT_TEAM_ID) {
      return { name: opponentName || 'Opponent' };
    }
    return [...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer);
  };
  const selectedPlayerData = getSelectedPlayerDisplay();
  
  // Get players for prompt based on prompt type
  const getPromptPlayers = () => {
    if (!lastEvent) return [];
    
    if (promptType === 'assist') {
      // Assist = same team players minus the scorer
      // In coach mode, only coach's team players can assist
      if (isCoachMode) {
        return teamAPlayers.filter(p => p.id !== lastEvent.playerId);
      }
      const sameTeamPlayers = lastEvent.teamId === gameData.team_a_id ? teamAPlayers : teamBPlayers;
      return sameTeamPlayers.filter(p => p.id !== lastEvent.playerId);
    } else if (promptType === 'turnover') {
      // Turnover = who lost the ball
      // Coach mode: If opponent stole → show coach's team players (who turned it over)
      // Normal mode: Show opposing team players
      if (isCoachMode) {
        // Opponent stole → coach's team turned it over
        if (lastEvent.isOpponentStat) {
          return teamAPlayers; // Coach's team players
        }
        return []; // Coach stole → auto-recorded, shouldn't reach here
      }
      return lastEvent.teamId === gameData.team_a_id ? teamBPlayers : teamAPlayers;
    } else if (promptType === 'rebound') {
      // Rebound = all players from both teams
      // In coach mode, show coach's team players + "Opponent" option
      if (isCoachMode) {
        const opponentOption: Player = {
          id: OPPONENT_TEAM_ID,
          name: opponentName || 'Opponent',
          jerseyNumber: undefined,
          teamId: 'opponent',
        };
        return [...teamAPlayers, opponentOption];
      }
      return [...teamAPlayers, ...teamBPlayers];
    } else if (promptType === 'blocked_shooter') {
      // Blocked shooter = who got blocked (coach's team players when opponent blocks)
      if (isCoachMode) {
        return teamAPlayers; // Coach's team players who could have been blocked
      }
      // Normal mode: opposite team of blocker
      return lastEvent.teamId === gameData.team_a_id ? teamBPlayers : teamAPlayers;
    } else {
      // Default: all players
      if (isCoachMode) return teamAPlayers;
      return [...teamAPlayers, ...teamBPlayers];
    }
  };
  const promptPlayers = getPromptPlayers();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Substitution Modal (reused from tracker-v3) */}
      <SubstitutionModalV4
        isOpen={showSubModal}
        onClose={() => setShowSubModal(false)}
        teamAName={gameData.team_a?.name || gameData.teamAName || 'My Team'}
        teamBName={isCoachMode ? (opponentName || 'Opponent') : (gameData.team_b?.name || gameData.teamBName || 'Team B')}
        teamAOnCourt={onCourtA}
        teamABench={benchA}
        teamBOnCourt={isCoachMode ? [] : onCourtB}
        teamBBench={isCoachMode ? [] : benchB}
        onConfirm={handleSubConfirm}
        initialTeam={isCoachMode ? 'teamA' : (selectedTeam === 'B' ? 'teamB' : 'teamA')}
      />
      
      <VideoPlayerRoster
        teamAPlayers={onCourtA}
        teamBPlayers={isCoachMode ? [] : onCourtB}
        teamAName={gameData.team_a?.name || gameData.teamAName || 'My Team'}
        teamBName={gameData.team_b?.name || gameData.teamBName || 'Team B'}
        selectedPlayerId={selectedPlayer}
        onPlayerSelect={handlePlayerSelect}
        isCoachMode={isCoachMode}
        opponentName={opponentName}
        onCourtA={onCourtA}
        benchA={benchA}
        onCourtB={onCourtB}
        benchB={benchB}
        onSubstitutionClick={handleOpenSubModal}
      />
      
      <div className="flex-1 overflow-y-auto p-3">
        {/* Turnover Type Prompt (shows when T is pressed) */}
        {promptType === 'turnover_type' && lastEvent && (
          <div className="mb-3">
            <VideoTurnoverTypePrompt
              playerName={lastEvent.playerName}
              onSelectType={handleTurnoverTypeSelect}
              onSkip={closePrompt}
            />
          </div>
        )}
        
        {/* Foul Type Prompt (shows when F is pressed) */}
        {promptType === 'foul_type' && lastEvent && (
          <div className="mb-3">
            <VideoFoulTypePrompt
              playerName={lastEvent.playerName}
              onSelectType={handleFoulTypeSelect}
              onSkip={closePrompt}
            />
          </div>
        )}
        
        {/* Inline Prompt (shows after shots/steals/blocks) */}
        {promptType && promptType !== 'turnover_type' && promptType !== 'foul_type' && lastEvent && (
          <div className="mb-3">
            <VideoInlinePrompt
              promptType={promptType}
              playerName={lastEvent.playerName}
              eventResult={lastEvent.statType === 'steal' ? 'steal' : (lastEvent.shotValue > 0 ? 'made' : 'missed')}
              eventDescription={
                promptType === 'blocked_shot' 
                  ? 'Block' 
                  : lastEvent.statType === 'steal' 
                    ? 'Steal' 
                    : lastEvent.statType === 'block'
                      ? 'Block'
                      : `${getShotTypeLabel(lastEvent.statType)} ${lastEvent.shotValue > 0 ? 'made' : 'missed'}`
              }
              players={promptPlayers}
              onSelectPlayer={handlePromptPlayerSelect}
              onSelectShotType={handleBlockedShotTypeSelect}
              onSkip={closePrompt}
            />
          </div>
        )}
        
        {/* Normal stat entry UI */}
        {!promptType && (
          <>
            <div className="text-sm font-medium text-gray-700 mb-3">
              {selectedPlayer ? (
                <>Recording for: <span className="text-orange-600">{selectedPlayerData?.name}</span>{isRecording && <span className="text-gray-400 ml-2">(saving...)</span>}</>
              ) : (<span className="text-gray-400">Select a player first (1-0)</span>)}
            </div>
            <VideoStatButtons 
              onStatRecord={(statType, modifier) => {
                // Turnover and Foul require type selection first
                if (statType === 'turnover') {
                  handleInitiateTurnover();
                } else if (statType === 'foul') {
                  handleInitiateFoul();
                } else {
                  handleStatRecord(statType, modifier);
                }
              }} 
              disabled={!selectedPlayer || isRecording} 
            />
          </>
        )}
      </div>
      
      {gameClock && (
        <div className="border-t p-2 bg-gray-50 text-center">
          <span className="text-xs text-gray-500">Recording at: </span>
          <span className="text-xs font-mono font-medium">Q{gameClock.quarter} {gameClock.minutesRemaining}:{gameClock.secondsRemaining.toString().padStart(2, '0')}</span>
        </div>
      )}
    </div>
  );
}
