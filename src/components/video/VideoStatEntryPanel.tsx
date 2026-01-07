'use client';

/**
 * VideoStatEntryPanel - Stat entry panel for video stat tracker
 * 
 * Integrates roster, stat buttons, and inline prompts for video review.
 * Uses useVideoStatEntry hook for all logic (per .cursorrules).
 * 
 * @module VideoStatEntryPanel
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, Zap, Hand } from 'lucide-react';
import { VideoPlayerRoster } from '@/components/video/VideoPlayerRoster';
import { VideoStatButtons } from '@/components/video/VideoStatButtons';
import { VideoStatPromptRenderer } from '@/components/video/VideoStatPromptRenderer';
import { SubstitutionModalV4 } from '@/components/tracker-v3/SubstitutionModalV4';
import { useVideoStatEntry, type VideoStatHandlers, type Player, DEFAULT_SEQUENCE_FLAGS, MANUAL_MODE_FLAGS } from '@/hooks/useVideoStatEntry';
import type { GameClock } from '@/lib/types/video';
import type { SequenceAutomationFlags } from '@/lib/types/automation';

// Re-export types for consumers
export type { VideoStatHandlers, Player };

interface VideoStatEntryPanelProps {
  gameId: string;
  videoId: string;
  currentVideoTimeMs: number;
  gameClock: GameClock | null;
  onStatRecorded?: (statType: string, statId?: string) => void;
  onBeforeRecord?: () => void;
  onRegisterHandlers?: (handlers: VideoStatHandlers) => void;
  isCoachMode?: boolean;
  userId?: string;
  opponentName?: string;
  preloadedTeamAPlayers?: Player[];
  preloadedTeamBPlayers?: Player[];
  preloadedGameData?: any;
  /**
   * ✅ NEW: Initial manual mode setting (defaults to false = auto-prompts enabled)
   */
  initialManualMode?: boolean;
  /**
   * ✅ NEW: Callback when manual mode changes
   */
  onManualModeChange?: (isManual: boolean) => void;
}

export function VideoStatEntryPanel({
  gameId, videoId, currentVideoTimeMs, gameClock,
  onStatRecorded, onBeforeRecord, onRegisterHandlers,
  isCoachMode = false, userId, opponentName,
  preloadedTeamAPlayers, preloadedTeamBPlayers, preloadedGameData,
  initialManualMode = false,
  onManualModeChange,
}: VideoStatEntryPanelProps) {
  
  // ✅ Manual mode state - controls whether auto-prompts are shown
  const [isManualMode, setIsManualMode] = useState(initialManualMode);
  
  // Derive sequence flags from manual mode state
  const sequenceFlags: SequenceAutomationFlags = isManualMode 
    ? MANUAL_MODE_FLAGS 
    : DEFAULT_SEQUENCE_FLAGS;
  
  // Toggle handler with callback
  const handleToggleManualMode = useCallback(() => {
    const newValue = !isManualMode;
    setIsManualMode(newValue);
    onManualModeChange?.(newValue);
  }, [isManualMode, onManualModeChange]);
  
  const entry = useVideoStatEntry({
    gameId, videoId, currentVideoTimeMs, gameClock,
    onStatRecorded, onBeforeRecord,
    isCoachMode, userId, opponentName,
    preloadedTeamAPlayers, preloadedTeamBPlayers, preloadedGameData,
    sequenceFlags, // ✅ Pass derived sequence flags
  });

  // Register handlers for keyboard shortcuts
  useEffect(() => {
    if (!onRegisterHandlers) return;
    onRegisterHandlers({
      recordShot2PT: () => entry.handleStatRecord('field_goal', 'made'),
      recordShot3PT: () => entry.handleStatRecord('three_pointer', 'made'),
      recordMiss2PT: () => entry.handleStatRecord('field_goal', 'missed'),
      recordMiss3PT: () => entry.handleStatRecord('three_pointer', 'missed'),
      recordFTMade: () => entry.handleStatRecord('free_throw', 'made'),
      recordFTMiss: () => entry.handleStatRecord('free_throw', 'missed'),
      recordRebound: entry.handleInitiateRebound,
      recordAssist: () => entry.handleStatRecord('assist'),
      recordSteal: () => entry.handleStatRecord('steal'),
      recordBlock: () => entry.handleStatRecord('block'),
      recordTurnover: entry.handleInitiateTurnover,
      recordFoul: entry.handleInitiateFoul,
      openSubstitutionModal: entry.handleOpenSubModal,
      selectPlayerByIndex: entry.handlePlayerSelectByIndex,
    });
  }, [onRegisterHandlers, entry]);

  if (entry.loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!entry.gameData) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Unable to load game data</p>
      </div>
    );
  }

  const selectedPlayerData = entry.getSelectedPlayerData();
  const promptPlayers = entry.getPromptPlayers();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Substitution Modal */}
      <SubstitutionModalV4
        isOpen={entry.showSubModal}
        onClose={() => entry.setShowSubModal(false)}
        onConfirm={entry.handleSubConfirm}
        teamAOnCourt={entry.onCourtA}
        teamABench={entry.benchA}
        teamBOnCourt={isCoachMode ? [] : entry.onCourtB}
        teamBBench={isCoachMode ? [] : entry.benchB}
        teamAName={entry.gameData.team_a?.name || entry.gameData.teamAName || 'My Team'}
        teamBName={entry.gameData.team_b?.name || entry.gameData.teamBName || 'Team B'}
        initialTeam={isCoachMode ? 'teamA' : (entry.selectedTeam === 'B' ? 'teamB' : 'teamA')}
      />
      
      {/* Player Roster */}
      <VideoPlayerRoster
        teamAPlayers={entry.onCourtA}
        teamBPlayers={isCoachMode ? [] : entry.onCourtB}
        teamAName={entry.gameData.team_a?.name || entry.gameData.teamAName || 'My Team'}
        teamBName={entry.gameData.team_b?.name || entry.gameData.teamBName || 'Team B'}
        selectedPlayerId={entry.selectedPlayer}
        onPlayerSelect={entry.handlePlayerSelect}
        isCoachMode={isCoachMode}
        opponentName={opponentName}
        onCourtA={entry.onCourtA}
        benchA={entry.benchA}
        onCourtB={entry.onCourtB}
        benchB={entry.benchB}
        onSubstitutionClick={entry.handleOpenSubModal}
      />
      
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Prompt Renderer */}
        <VideoStatPromptRenderer
          promptType={entry.promptType}
          lastEvent={entry.lastEvent}
          promptPlayers={promptPlayers}
          onTurnoverTypeSelect={entry.handleTurnoverTypeSelect}
          onFoulTypeSelect={entry.handleFoulTypeSelect}
          onFreeThrowComplete={entry.handleFreeThrowComplete}
          onPromptPlayerSelect={entry.handlePromptPlayerSelect}
          onBlockedShotTypeSelect={entry.handleBlockedShotTypeSelect}
          onReboundTypeSelect={entry.handleReboundTypeSelect}
          onShotMadeMissed={entry.handleShotMadeMissed}
          onClosePrompt={entry.closePrompt}
          isRecording={entry.isRecording}
        />
        
        {/* Normal stat entry UI (when no prompt active) */}
        {!entry.promptType && (
          <>
            {/* ✅ Manual Mode Toggle */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
              <div className="text-sm font-medium text-gray-700">
                {entry.selectedPlayer ? (
                  <>
                    Recording for: <span className="text-orange-600">{selectedPlayerData?.name}</span>
                    {entry.isRecording && <span className="text-gray-400 ml-2">(saving...)</span>}
                  </>
                ) : (
                  <span className="text-gray-400">Select a player first (1-0)</span>
                )}
              </div>
              
              {/* Manual Mode Toggle Button */}
              <button
                type="button"
                onClick={handleToggleManualMode}
                className={`
                  flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all
                  ${isManualMode 
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }
                `}
                title={isManualMode 
                  ? 'Manual Mode: No auto-prompts after stats' 
                  : 'Auto Mode: Prompts for assists, rebounds, etc.'
                }
              >
                {isManualMode ? (
                  <>
                    <Hand className="w-3.5 h-3.5" />
                    Manual
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    Auto
                  </>
                )}
              </button>
            </div>
            
            <VideoStatButtons 
              onStatRecord={(statType, modifier) => {
                if (statType === 'turnover') {
                  entry.handleInitiateTurnover();
                } else if (statType === 'foul') {
                  entry.handleInitiateFoul();
                } else if (statType === 'rebound') {
                  entry.handleInitiateRebound();
                } else {
                  entry.handleStatRecord(statType, modifier);
                }
              }} 
              disabled={!entry.selectedPlayer || entry.isRecording} 
            />
          </>
        )}
      </div>
    </div>
  );
}
