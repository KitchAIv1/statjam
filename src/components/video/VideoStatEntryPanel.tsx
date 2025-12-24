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
}

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
}

export function VideoStatEntryPanel({
  gameId, videoId, currentVideoTimeMs, gameClock,
  onStatRecorded, onBeforeRecord, onRegisterHandlers,
}: VideoStatEntryPanelProps) {
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState<any>(null);
  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<'A' | 'B'>('A');
  const [isRecording, setIsRecording] = useState(false);
  
  const { promptType, lastEvent, showAssistPrompt, showReboundPrompt, showTurnoverPrompt, showTurnoverTypePrompt, showFoulTypePrompt, closePrompt } = useVideoStatPrompts();

  // Load game and player data
  useEffect(() => {
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
        
        setTeamAPlayers(playersA.map((p: any) => ({
          id: p.id, name: p.name || 'Unknown',
          jerseyNumber: p.jerseyNumber || p.jersey_number,
          teamId: game.team_a_id,
        })));
        setTeamBPlayers(playersB.map((p: any) => ({
          id: p.id, name: p.name || 'Unknown',
          jerseyNumber: p.jerseyNumber || p.jersey_number,
          teamId: game.team_b_id,
        })));
      } catch (error) {
        console.error('Error loading game data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadGameData();
  }, [gameId]);

  const handlePlayerSelect = useCallback((playerId: string) => {
    // If there's a prompt active, this selection is for the prompt
    if (promptType) return;
    setSelectedPlayer(playerId);
    const isTeamA = teamAPlayers.some(p => p.id === playerId);
    setSelectedTeam(isTeamA ? 'A' : 'B');
  }, [teamAPlayers, promptType]);

  const handlePlayerSelectByIndex = useCallback((index: number) => {
    // If there's a prompt active, don't change player selection
    if (promptType) return;
    const allPlayers = [...teamAPlayers, ...teamBPlayers];
    if (index >= 0 && index < allPlayers.length) {
      handlePlayerSelect(allPlayers[index].id);
    }
  }, [teamAPlayers, teamBPlayers, handlePlayerSelect, promptType]);

  const handleStatRecord = useCallback(async (statType: string, modifier?: string) => {
    console.log('📊 Recording stat:', { 
      hasPlayer: !!selectedPlayer, 
      hasGameData: !!gameData, 
      gameClock,
      currentVideoTimeMs 
    });
    if (!selectedPlayer || !gameData || !gameClock) return;
    onBeforeRecord?.();
    
    try {
      setIsRecording(true);
      const teamId = selectedTeam === 'A' ? gameData.team_a_id : gameData.team_b_id;
      const playerData = [...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer);
      
      console.log('💾 Saving stat with clock:', {
        quarter: gameClock.quarter,
        minutes: gameClock.minutesRemaining,
        seconds: gameClock.secondsRemaining,
        videoMs: currentVideoTimeMs
      });
      
      const statId = await VideoStatService.recordVideoStat({
        gameId, videoId, playerId: selectedPlayer, teamId, statType, modifier,
        videoTimestampMs: currentVideoTimeMs,
        quarter: gameClock.quarter,
        gameTimeMinutes: gameClock.minutesRemaining,
        gameTimeSeconds: gameClock.secondsRemaining,
      });
      
      onStatRecorded?.(statType, statId);
      
      // Show inline prompts for auto-sequences (non-blocking)
      if (modifier === 'made' && (statType === 'field_goal' || statType === 'three_pointer')) {
        // Made shot → Assist prompt
        showAssistPrompt({
          playerId: selectedPlayer,
          playerName: playerData?.name || 'Player',
          teamId,
          statType,
          shotValue: getShotValue(statType),
          videoTimestampMs: currentVideoTimeMs,
        });
      } else if (modifier === 'missed') {
        // Missed shot → Rebound prompt
        showReboundPrompt({
          playerId: selectedPlayer,
          playerName: playerData?.name || 'Player',
          teamId,
          statType,
          shotValue: 0,
          videoTimestampMs: currentVideoTimeMs,
        });
      } else if (statType === 'steal') {
        // Steal → Turnover prompt (for opposing team)
        showTurnoverPrompt({
          playerId: selectedPlayer,
          playerName: playerData?.name || 'Player',
          teamId,
          statType,
          shotValue: 0,
          videoTimestampMs: currentVideoTimeMs,
        });
      } else if (statType === 'block') {
        // Block → Rebound prompt (blocked shot = loose ball)
        showReboundPrompt({
          playerId: selectedPlayer,
          playerName: playerData?.name || 'Player',
          teamId,
          statType: 'block',
          shotValue: 0,
          videoTimestampMs: currentVideoTimeMs,
        });
      }
      
      setSelectedPlayer(null);
    } catch (error) {
      console.error('Error recording stat:', error);
    } finally {
      setIsRecording(false);
    }
  }, [selectedPlayer, gameData, gameClock, selectedTeam, gameId, videoId, currentVideoTimeMs, onStatRecorded, onBeforeRecord, teamAPlayers, teamBPlayers, showAssistPrompt, showReboundPrompt, showTurnoverPrompt]);

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
    
    try {
      setIsRecording(true);
      const statId = await VideoStatService.recordVideoStat({
        gameId, videoId, playerId: lastEvent.playerId, teamId: lastEvent.teamId,
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
  }, [lastEvent, gameClock, gameId, videoId, onStatRecorded, closePrompt]);

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
    
    try {
      setIsRecording(true);
      const statId = await VideoStatService.recordVideoStat({
        gameId, videoId, playerId: lastEvent.playerId, teamId: lastEvent.teamId,
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
  }, [lastEvent, gameClock, gameId, videoId, onStatRecorded, closePrompt]);

  // Handle inline prompt player selection
  const handlePromptPlayerSelect = useCallback(async (playerId: string) => {
    if (!gameData || !gameClock || !lastEvent) return;
    
    const player = [...teamAPlayers, ...teamBPlayers].find(p => p.id === playerId);
    const playerTeamId = player?.teamId || lastEvent.teamId;
    let statId: string | undefined;
    
    if (promptType === 'assist') {
      statId = await VideoStatService.recordVideoStat({
        gameId, videoId, playerId, teamId: lastEvent.teamId,
        statType: 'assist', modifier: undefined,
        videoTimestampMs: lastEvent.videoTimestampMs,
        quarter: gameClock.quarter,
        gameTimeMinutes: gameClock.minutesRemaining,
        gameTimeSeconds: gameClock.secondsRemaining,
      });
    } else if (promptType === 'rebound') {
      // For missed shots: shooter's team = lastEvent.teamId
      // For blocks: blocker's team = lastEvent.teamId (opposite of shooter)
      // Offensive rebound = same team as the shooter
      let isOffensive: boolean;
      if (lastEvent.statType === 'block') {
        // Block: blocker's team is defensive, so offensive = DIFFERENT from blocker
        isOffensive = playerTeamId !== lastEvent.teamId;
      } else {
        // Missed shot: offensive = SAME as shooter
        isOffensive = playerTeamId === lastEvent.teamId;
      }
      
      statId = await VideoStatService.recordVideoStat({
        gameId, videoId, playerId, teamId: playerTeamId,
        statType: 'rebound', modifier: isOffensive ? 'offensive' : 'defensive',
        videoTimestampMs: lastEvent.videoTimestampMs,
        quarter: gameClock.quarter,
        gameTimeMinutes: gameClock.minutesRemaining,
        gameTimeSeconds: gameClock.secondsRemaining,
      });
    } else if (promptType === 'turnover') {
      // Turnover is recorded for the opposing team player (who lost the ball)
      statId = await VideoStatService.recordVideoStat({
        gameId, videoId, playerId, teamId: playerTeamId,
        statType: 'turnover', modifier: 'steal',
        videoTimestampMs: lastEvent.videoTimestampMs,
        quarter: gameClock.quarter,
        gameTimeMinutes: gameClock.minutesRemaining,
        gameTimeSeconds: gameClock.secondsRemaining,
      });
    }
    
    onStatRecorded?.(promptType || 'stat', statId);
    closePrompt();
  }, [gameData, gameClock, lastEvent, promptType, gameId, videoId, teamAPlayers, teamBPlayers, onStatRecorded, closePrompt]);

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
      selectPlayerByIndex: handlePlayerSelectByIndex,
    });
  }, [onRegisterHandlers, handleStatRecord, handlePlayerSelectByIndex, handleInitiateTurnover, handleInitiateFoul]);

  if (loading) {
    return <div className="flex items-center justify-center h-full p-8"><Loader2 className="w-6 h-6 text-orange-500 animate-spin" /></div>;
  }
  if (!gameData) {
    return <div className="p-4 text-center text-gray-500"><p>Unable to load game data</p></div>;
  }

  const selectedPlayerData = selectedPlayer ? [...teamAPlayers, ...teamBPlayers].find(p => p.id === selectedPlayer) : null;
  
  // Get players for prompt based on prompt type
  const getPromptPlayers = () => {
    if (!lastEvent) return [];
    
    if (promptType === 'assist') {
      // Assist = same team players minus the scorer
      const sameTeamPlayers = lastEvent.teamId === gameData.team_a_id ? teamAPlayers : teamBPlayers;
      return sameTeamPlayers.filter(p => p.id !== lastEvent.playerId);
    } else if (promptType === 'turnover') {
      // Turnover = opposing team players (who lost the ball to the stealer)
      return lastEvent.teamId === gameData.team_a_id ? teamBPlayers : teamAPlayers;
    } else {
      // Rebound = all players from both teams
      return [...teamAPlayers, ...teamBPlayers];
    }
  };
  const promptPlayers = getPromptPlayers();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <VideoPlayerRoster
        teamAPlayers={teamAPlayers}
        teamBPlayers={teamBPlayers}
        teamAName={gameData.team_a?.name || 'Team A'}
        teamBName={gameData.team_b?.name || 'Team B'}
        selectedPlayerId={selectedPlayer}
        onPlayerSelect={handlePlayerSelect}
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
        
        {/* Inline Prompt (shows after shots/steals) */}
        {promptType && promptType !== 'turnover_type' && lastEvent && (
          <div className="mb-3">
            <VideoInlinePrompt
              promptType={promptType}
              playerName={lastEvent.playerName}
              eventResult={lastEvent.statType === 'steal' ? 'steal' : (lastEvent.shotValue > 0 ? 'made' : 'missed')}
              eventDescription={lastEvent.statType === 'steal' ? 'Steal' : `${getShotTypeLabel(lastEvent.statType)} ${lastEvent.shotValue > 0 ? 'made' : 'missed'}`}
              players={promptPlayers}
              onSelectPlayer={handlePromptPlayerSelect}
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
