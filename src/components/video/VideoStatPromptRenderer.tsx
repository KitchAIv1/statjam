'use client';

/**
 * VideoStatPromptRenderer - Renders stat prompts based on prompt type
 * 
 * Extracted from VideoStatEntryPanel for .cursorrules compliance.
 * Handles rendering of all inline prompts (turnover, foul, FT, etc.)
 * 
 * @module VideoStatPromptRenderer
 */

import React from 'react';
import { VideoInlinePrompt } from '@/components/video/VideoInlinePrompt';
import { VideoTurnoverTypePrompt } from '@/components/video/VideoTurnoverTypePrompt';
import { VideoFoulTypePrompt } from '@/components/video/VideoFoulTypePrompt';
import { VideoFreeThrowPrompt } from '@/components/video/VideoFreeThrowPrompt';
import { getShotTypeLabel } from '@/hooks/useVideoStatPrompts';
import type { PromptType } from '@/hooks/useVideoStatPrompts';
import type { Player } from '@/hooks/useVideoStatEntry';

interface LastEventInfo {
  playerId: string;
  playerName: string;
  teamId: string;
  statType: string;
  shotValue: number;
  videoTimestampMs: number;
  isOpponentStat?: boolean;
  ftCount?: number;
  foulType?: string;
}

interface VideoStatPromptRendererProps {
  promptType: PromptType;
  lastEvent: LastEventInfo | null;
  promptPlayers: Player[];
  onTurnoverTypeSelect: (type: string) => void;
  onFoulTypeSelect: (type: string, ftCount: number) => void;
  onFreeThrowComplete: (results: { made: boolean }[]) => void;
  onPromptPlayerSelect: (playerId: string, index: number) => void;
  onBlockedShotTypeSelect: (shotType: 'field_goal' | 'three_pointer') => void;
  onShotMadeMissed: (made: boolean) => void;
  onClosePrompt: () => void;
}

export function VideoStatPromptRenderer({
  promptType,
  lastEvent,
  promptPlayers,
  onTurnoverTypeSelect,
  onFoulTypeSelect,
  onFreeThrowComplete,
  onPromptPlayerSelect,
  onBlockedShotTypeSelect,
  onShotMadeMissed,
  onClosePrompt,
}: VideoStatPromptRendererProps) {
  if (!promptType || !lastEvent) return null;

  // Turnover Type Prompt
  if (promptType === 'turnover_type') {
    return (
      <div className="mb-3">
        <VideoTurnoverTypePrompt
          playerName={lastEvent.playerName}
          onSelectType={onTurnoverTypeSelect}
          onSkip={onClosePrompt}
        />
      </div>
    );
  }

  // Foul Type Prompt
  if (promptType === 'foul_type') {
    return (
      <div className="mb-3">
        <VideoFoulTypePrompt
          playerName={lastEvent.playerName}
          onSelectType={onFoulTypeSelect}
          onSkip={onClosePrompt}
        />
      </div>
    );
  }

  // Free Throw Sequence Prompt
  if (promptType === 'free_throw_sequence') {
    return (
      <div className="mb-3">
        <VideoFreeThrowPrompt
          shooterName={lastEvent.playerName}
          totalShots={lastEvent.ftCount || 2}
          foulType={lastEvent.foulType || 'shooting'}
          onComplete={onFreeThrowComplete}
          onSkip={onClosePrompt}
        />
      </div>
    );
  }

  // Inline Prompts (assist, rebound, turnover, blocked_shot, blocked_shooter, fouled_player, shot_made_missed)
  const getEventDescription = () => {
    if (promptType === 'blocked_shot' || promptType === 'blocked_shooter') return 'Block';
    if (promptType === 'fouled_player') return `Shooting Foul (${lastEvent.ftCount || 2} FTs)`;
    if (promptType === 'shot_made_missed') {
      const shotType = (lastEvent as any).shootingFoulShotType === '3pt' ? '3PT' : '2PT';
      return `Shooting Foul (${shotType})`;
    }
    if (lastEvent.statType === 'steal') return 'Steal';
    if (lastEvent.statType === 'block') return 'Block';
    return `${getShotTypeLabel(lastEvent.statType)} ${lastEvent.shotValue > 0 ? 'made' : 'missed'}`;
  };

  return (
    <div className="mb-3">
      <VideoInlinePrompt
        promptType={promptType}
        playerName={lastEvent.playerName}
        eventResult={lastEvent.statType === 'steal' ? 'steal' : (lastEvent.shotValue > 0 ? 'made' : 'missed')}
        eventDescription={getEventDescription()}
        players={promptPlayers}
        onSelectPlayer={onPromptPlayerSelect}
        onSelectShotType={onBlockedShotTypeSelect}
        onSelectShotMadeMissed={onShotMadeMissed}
        onSkip={onClosePrompt}
      />
    </div>
  );
}

