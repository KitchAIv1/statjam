/**
 * useInfoBarOverlays Hook
 * 
 * Combines all overlay data sources for the info bar:
 * - Tournament name (from game.tournament)
 * - Halftime/Overtime (from game.quarter)
 * - Timeout (from useTimeoutOverlay)
 * - Team Run & Milestones (from useTeamRunAndMilestones)
 * 
 * Follows .cursorrules: under 100 lines, single responsibility (composition)
 */

import { useState, useMemo } from 'react';
import {
  InfoBarItem,
  InfoBarToggles,
  DEFAULT_TOGGLES,
  createTournamentNameItem,
  createHalftimeItem,
  createOvertimeItem,
  getActiveInfoBarItem,
  isHalftime,
  isOvertime,
  getOvertimePeriod,
} from '@/lib/services/canvas-overlay/infoBarManager';
import { useTimeoutOverlay } from './useTimeoutOverlay';
import { useTeamRunAndMilestones } from './useTeamRunAndMilestones';

interface GameState {
  quarter: number;
  clockMinutes: number;
  clockSeconds: number;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  tournamentName?: string;
}

interface UseInfoBarOverlaysResult {
  activeItem: InfoBarItem | null;
  toggles: InfoBarToggles;
  setToggles: (toggles: InfoBarToggles) => void;
  items: InfoBarItem[];
}

export function useInfoBarOverlays(
  gameId: string | null,
  gameState: GameState | null
): UseInfoBarOverlaysResult {
  const [toggles, setToggles] = useState<InfoBarToggles>(DEFAULT_TOGGLES);

  // Team names map for child hooks
  const teamNames = useMemo(() => {
    if (!gameState) return {};
    return {
      [gameState.teamAId]: gameState.teamAName,
      [gameState.teamBId]: gameState.teamBName,
    };
  }, [gameState]);

  // Composed hooks for overlay detection
  const timeoutItem = useTimeoutOverlay(gameId, teamNames);
  const { teamRunItem, milestoneItem } = useTeamRunAndMilestones(
    gameId,
    gameState?.teamAId ?? null,
    gameState?.teamBId ?? null,
    teamNames
  );

  // Build items array
  const items = useMemo(() => {
    const result: InfoBarItem[] = [];

    // Tournament name (always available as fallback)
    if (gameState?.tournamentName) {
      result.push(createTournamentNameItem(gameState.tournamentName));
    }

    // Halftime check
    if (gameState && isHalftime(gameState.quarter, gameState.clockMinutes, gameState.clockSeconds)) {
      result.push(createHalftimeItem());
    }

    // Overtime check
    if (gameState && isOvertime(gameState.quarter)) {
      result.push(createOvertimeItem(getOvertimePeriod(gameState.quarter)));
    }

    // Timeout (if active)
    if (timeoutItem) {
      result.push(timeoutItem);
    }

    // Team run (if active and not expired)
    if (teamRunItem && (!teamRunItem.expiresAt || teamRunItem.expiresAt > Date.now())) {
      result.push(teamRunItem);
    }

    // Milestone (if active and not expired)
    if (milestoneItem && (!milestoneItem.expiresAt || milestoneItem.expiresAt > Date.now())) {
      result.push(milestoneItem);
    }

    return result;
  }, [gameState, timeoutItem, teamRunItem, milestoneItem]);

  // Get active item based on priority and toggles
  const activeItem = useMemo(() => {
    return getActiveInfoBarItem(items, toggles);
  }, [items, toggles]);

  return {
    activeItem,
    toggles,
    setToggles,
    items,
  };
}
