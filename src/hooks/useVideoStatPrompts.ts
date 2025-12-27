/**
 * useVideoStatPrompts - Handles assist/rebound/turnover prompts for video stat tracking
 * 
 * Shows prompts after shots/steals are recorded to capture follow-up stats.
 * 
 * @module useVideoStatPrompts
 */

import { useState, useCallback } from 'react';

export type PromptType = 'assist' | 'rebound' | 'turnover' | 'turnover_type' | 'foul_type' | 'blocked_shot' | 'blocked_shooter' | null;

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

// Foul type options - must match database constraint game_stats_modifier_check
// Allowed values: personal, shooting, technical, offensive, flagrant, 1-and-1
export const FOUL_TYPES = [
  { key: '1', value: 'personal', label: 'Personal' },
  { key: '2', value: 'shooting', label: 'Shooting' },
  { key: '3', value: 'offensive', label: 'Offensive' },
  { key: '4', value: 'technical', label: 'Technical' },
  { key: '5', value: 'flagrant', label: 'Flagrant' },
  { key: '6', value: '1-and-1', label: '1-and-1' },
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
}

interface UseVideoStatPromptsReturn {
  promptType: PromptType;
  lastEvent: LastEventInfo | null;
  showAssistPrompt: (eventInfo: LastEventInfo) => void;
  showReboundPrompt: (eventInfo: LastEventInfo) => void;
  showTurnoverPrompt: (eventInfo: LastEventInfo) => void;
  showTurnoverTypePrompt: (eventInfo: LastEventInfo) => void;
  showFoulTypePrompt: (eventInfo: LastEventInfo) => void;
  showBlockedShotPrompt: (eventInfo: LastEventInfo) => void;
  showBlockedShooterPrompt: (eventInfo: LastEventInfo) => void;
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

  const closePrompt = useCallback(() => {
    setPromptType(null);
    setLastEvent(null);
  }, []);

  return {
    promptType,
    lastEvent,
    showAssistPrompt,
    showReboundPrompt,
    showTurnoverPrompt,
    showTurnoverTypePrompt,
    showFoulTypePrompt,
    showBlockedShotPrompt,
    showBlockedShooterPrompt,
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

