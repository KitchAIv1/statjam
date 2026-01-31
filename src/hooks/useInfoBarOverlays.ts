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
  createOvertimeItem,
  getActiveInfoBarItem,
  isOvertime,
  getOvertimePeriod,
  ShotMadeData,
} from '@/lib/services/canvas-overlay/infoBarManager';
import { useTimeoutOverlay } from './useTimeoutOverlay';
import { useTeamRunAndMilestones } from './useTeamRunAndMilestones';
import { useShotMadeOverlay, ScoreDelta } from './useShotMadeOverlay';
import { useFoulOverlay } from './useFoulOverlay';
import { useHalftimeOverlay } from './useHalftimeOverlay';

interface GameState {
  quarter: number;
  clockMinutes: number;
  clockSeconds: number;
  isClockRunning: boolean;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  tournamentName?: string;
}

interface UseInfoBarOverlaysResult {
  activeItem: InfoBarItem | null;
  secondaryItem: InfoBarItem | null;  // For split display (NBA style)
  toggles: InfoBarToggles;
  setToggles: (toggles: InfoBarToggles) => void;
  items: InfoBarItem[];
  // Shot made animation data (for 3PT shake effect)
  shotMadeData: ShotMadeData | null;
  // Optimistic score delta (for instant score update)
  scoreDelta: ScoreDelta | null;
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
  const { item: shotMadeItem, scoreDelta } = useShotMadeOverlay({
    gameId,
    teamAId: gameState?.teamAId ?? null,
    teamBId: gameState?.teamBId ?? null,
  });
  const foulItem = useFoulOverlay({
    gameId,
    teamAId: gameState?.teamAId ?? null,
    teamBId: gameState?.teamBId ?? null,
  });
  const halftimeItem = useHalftimeOverlay({
    quarter: gameState?.quarter ?? 1,
    isClockRunning: gameState?.isClockRunning ?? false,
  });

  // Build items array
  const items = useMemo(() => {
    const result: InfoBarItem[] = [];

    // Tournament name (always available as fallback)
    if (gameState?.tournamentName) {
      result.push(createTournamentNameItem(gameState.tournamentName));
    }

    // Halftime (from hook - auto-detects Q2 end)
    if (halftimeItem) {
      result.push(halftimeItem);
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

    // Shot made (if active and not expired)
    if (shotMadeItem && (!shotMadeItem.expiresAt || shotMadeItem.expiresAt > Date.now())) {
      result.push(shotMadeItem);
    }

    // Foul (if active and not expired)
    if (foulItem && (!foulItem.expiresAt || foulItem.expiresAt > Date.now())) {
      result.push(foulItem);
    }

    return result;
  }, [gameState, halftimeItem, timeoutItem, teamRunItem, milestoneItem, shotMadeItem, foulItem]);

  // Get active items based on priority and toggles (primary + secondary for split)
  const { activeItem, secondaryItem } = useMemo(() => {
    const primary = getActiveInfoBarItem(items, toggles);
    
    // Get secondary item (different type than primary, for split display)
    // Split-eligible types: team_run, milestone, shot_made, foul (NBA style dual display)
    const SPLIT_ELIGIBLE = ['team_run', 'milestone', 'shot_made', 'foul'];
    let secondary: InfoBarItem | null = null;
    if (primary) {
      const otherItems = items.filter(item => {
        if (item.type === primary.type) return false;
        // Only split-eligible types can be shown together
        if (!SPLIT_ELIGIBLE.includes(item.type)) return false;
        if (!SPLIT_ELIGIBLE.includes(primary.type)) return false;
        // Check toggle
        const toggleKey = item.type === 'team_run' ? 'teamRun' 
          : item.type === 'shot_made' ? 'shotMade' 
          : item.type === 'foul' ? 'foul' : 'milestone';
        if (!toggles[toggleKey]) return false;
        // Check expiry
        if (item.expiresAt && item.expiresAt < Date.now()) return false;
        return true;
      });
      
      if (otherItems.length > 0) {
        otherItems.sort((a, b) => b.priority - a.priority);
        secondary = otherItems[0];
      }
    }
    
    return { activeItem: primary, secondaryItem: secondary };
  }, [items, toggles]);

  // Extract shot made data if active item is shot_made
  const shotMadeData = useMemo(() => {
    if (activeItem?.type === 'shot_made' && activeItem.data) {
      return activeItem.data as ShotMadeData;
    }
    return null;
  }, [activeItem]);

  return {
    activeItem,
    secondaryItem,
    toggles,
    setToggles,
    items,
    shotMadeData,
    scoreDelta,
  };
}
