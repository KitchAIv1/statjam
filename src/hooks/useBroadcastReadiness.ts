/**
 * useBroadcastReadiness Hook
 * 
 * Determines if all requirements are met to start broadcasting.
 * Returns readiness status and missing requirements.
 * Limits: < 100 lines
 */

import { useMemo } from 'react';

export interface BroadcastReadinessResult {
  isReady: boolean;
  missing: string[];
  requirements: {
    game: boolean;
    video: boolean;
    composition: boolean;
  };
}

export function useBroadcastReadiness(
  selectedGameId: string | null,
  activeVideoStream: MediaStream | null,
  isComposing: boolean
): BroadcastReadinessResult {
  return useMemo(() => {
    const requirements = {
      game: !!selectedGameId,
      video: !!activeVideoStream,
      composition: isComposing,
    };
    
    const isReady = requirements.game && requirements.video && requirements.composition;
    const missing = Object.entries(requirements)
      .filter(([_, met]) => !met)
      .map(([key]) => {
        switch (key) {
          case 'game': return 'Select a game';
          case 'video': return 'Connect video source';
          case 'composition': return 'Start composition';
          default: return '';
        }
      })
      .filter(Boolean);
    
    return { isReady, missing, requirements };
  }, [selectedGameId, activeVideoStream, isComposing]);
}
