/**
 * useVideoStatPrompts - Handles assist/rebound/turnover prompts for video stat tracking
 * 
 * Shows prompts after shots/steals are recorded to capture follow-up stats.
 * 
 * @module useVideoStatPrompts
 */

import { useState, useCallback } from 'react';

export type PromptType = 'assist' | 'rebound' | 'rebound_type' | 'turnover' | 'turnover_type' | 'foul_type' | 'blocked_shot' | 'blocked_shooter' | 'free_throw_sequence' | 'fouled_player' | 'shot_made_missed' | null;

// Turnover type options - must match database constraint game_stats_modifier_check
// Allowed values: bad_pass, travel, offensive_foul, steal, double_dribble, lost_ball, out_of_bounds, null
export const TURNOVER_TYPES = [
  { key: '1', value: 'bad_pass', label: 'Bad Pass' },
  { key: '2', value: 'lost_ball', label: 'Lost Ball' },
  { key: '3', value: 'travel', label: 'Travel' },
  { key: '4', value: 'out_of_bounds', label: 'Out of Bounds' },
  { key: '5', value: 'double_dribble', label: 'Double Dribble' },
  { key: '6', value: 'offensive_foul', label: 'Off. Foul' },
  { key: '7', value: 'other', label: 'Other' },  // Maps to null
] as const;

// Foul type options - aligned with tracker-v3 FoulTypeSelectionModal
// Shooting fouls now specify FT count (2 or 3) to auto-trigger FT sequence
export const FOUL_TYPES = [
  { key: '1', value: 'personal', label: 'Personal', ftCount: 0 },
  { key: '2', value: 'shooting', label: 'Shooting 2FT', ftCount: 2 },  // 2PT shooting foul
  { key: '3', value: 'shooting', label: 'Shooting 3FT', ftCount: 3 },  // 3PT shooting foul
  { key: '4', value: 'offensive', label: 'Offensive', ftCount: 0 },
  { key: '5', value: 'technical', label: 'Technical', ftCount: 1 },
  { key: '6', value: 'flagrant', label: 'Flagrant', ftCount: 2 },
  { key: '7', value: '1-and-1', label: '1-and-1', ftCount: 2 },  // Max 2 FTs
] as const;

interface LastEventInfo {
  playerId: string;
  playerName: string;
  teamId: string;
  statType: string;
  shotValue: number;
  videoTimestampMs: number;
  isOpponentStat?: boolean;  // Coach mode: tracks if this was an opponent stat
  blockedShotType?: 'field_goal' | 'three_pointer';  // For blocked_shooter prompt
  ftCount?: number;  // For free_throw_sequence: total FTs to shoot
  foulType?: string;  // For free_throw_sequence: type of foul that triggered FTs
  shootingFoulShotType?: '2pt' | '3pt';  // For shot_made_missed: what shot was fouled on
  victimPlayerId?: string;  // For shooting foul: who was fouled (shoots FTs)
  victimPlayerName?: string;  // For shooting foul: victim's name
}

interface UseVideoStatPromptsReturn {
  promptType: PromptType;
  lastEvent: LastEventInfo | null;
  showAssistPrompt: (eventInfo: LastEventInfo) => void;
  showReboundPrompt: (eventInfo: LastEventInfo) => void;
  showReboundTypePrompt: (eventInfo: LastEventInfo) => void;
  showTurnoverPrompt: (eventInfo: LastEventInfo) => void;
  showTurnoverTypePrompt: (eventInfo: LastEventInfo) => void;
  showFoulTypePrompt: (eventInfo: LastEventInfo) => void;
  showBlockedShotPrompt: (eventInfo: LastEventInfo) => void;
  showBlockedShooterPrompt: (eventInfo: LastEventInfo) => void;
  showFreeThrowPrompt: (eventInfo: LastEventInfo) => void;
  showFouledPlayerPrompt: (eventInfo: LastEventInfo) => void;
  showShotMadeMissedPrompt: (eventInfo: LastEventInfo) => void;
  closePrompt: () => void;
}

export function useVideoStatPrompts(): UseVideoStatPromptsReturn {
  const [promptType, setPromptType] = useState<PromptType>(null);
  const [lastEvent, setLastEvent] = useState<LastEventInfo | null>(null);

  const showAssistPrompt = useCallback((eventInfo: LastEventInfo) => {
    setLastEvent(eventInfo);
    setPromptType('assist');
  }, []);

  const showReboundPrompt = useCallback((eventInfo: LastEventInfo) => {
    setLastEvent(eventInfo);
    setPromptType('rebound');
  }, []);

  const showReboundTypePrompt = useCallback((eventInfo: LastEventInfo) => {
    setLastEvent(eventInfo);
    setPromptType('rebound_type');
  }, []);

  const showTurnoverPrompt = useCallback((eventInfo: LastEventInfo) => {
    setLastEvent(eventInfo);
    setPromptType('turnover');
  }, []);

  const showTurnoverTypePrompt = useCallback((eventInfo: LastEventInfo) => {
    setLastEvent(eventInfo);
    setPromptType('turnover_type');
  }, []);

  const showFoulTypePrompt = useCallback((eventInfo: LastEventInfo) => {
    setLastEvent(eventInfo);
    setPromptType('foul_type');
  }, []);

  const showBlockedShotPrompt = useCallback((eventInfo: LastEventInfo) => {
    setLastEvent(eventInfo);
    setPromptType('blocked_shot');
  }, []);

  const showBlockedShooterPrompt = useCallback((eventInfo: LastEventInfo) => {
    setLastEvent(eventInfo);
    setPromptType('blocked_shooter');
  }, []);

  const showFreeThrowPrompt = useCallback((eventInfo: LastEventInfo) => {
    setLastEvent(eventInfo);
    setPromptType('free_throw_sequence');
  }, []);

  const showFouledPlayerPrompt = useCallback((eventInfo: LastEventInfo) => {
    setLastEvent(eventInfo);
    setPromptType('fouled_player');
  }, []);

  const showShotMadeMissedPrompt = useCallback((eventInfo: LastEventInfo) => {
    setLastEvent(eventInfo);
    setPromptType('shot_made_missed');
  }, []);

  const closePrompt = useCallback(() => {
    setPromptType(null);
    setLastEvent(null);
  }, []);

  return {
    promptType,
    lastEvent,
    showAssistPrompt,
    showReboundPrompt,
    showReboundTypePrompt,
    showTurnoverPrompt,
    showTurnoverTypePrompt,
    showFoulTypePrompt,
    showBlockedShotPrompt,
    showBlockedShooterPrompt,
    showFreeThrowPrompt,
    showFouledPlayerPrompt,
    showShotMadeMissedPrompt,
    closePrompt,
  };
}

// Helper to determine shot value
export function getShotValue(statType: string): number {
  switch (statType) {
    case 'three_pointer': return 3;
    case 'field_goal': return 2;
    case 'free_throw': return 1;
    default: return 0;
  }
}

// Helper to get shot type display label
export function getShotTypeLabel(statType: string): string {
  switch (statType) {
    case 'three_pointer': return '3-pointer';
    case 'field_goal': return '2-point shot';
    case 'free_throw': return 'free throw';
    default: return 'shot';
  }
}

