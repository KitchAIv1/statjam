/**
 * useTeamRunAndMilestones Hook
 * 
 * Detects team runs and milestones from game_stats
 * Single subscription, dual detection (efficient)
 * 
 * @module useTeamRunAndMilestones
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { InfoBarItem, createTeamRunItem } from '@/lib/services/canvas-overlay/infoBarManager';
import { extractScoringPlays, detectTeamRun } from '@/lib/engines/teamRunEngine';
import { detectAllMilestonesFromStats, createMilestoneInfoBarItem } from '@/lib/engines/milestoneOverlayEngine';
import { fetchPlayerDisplayName } from '@/lib/services/playerLookupService';

interface TeamRunAndMilestonesResult {
  teamRunItem: InfoBarItem | null;
  milestoneItem: InfoBarItem | null;
}

export function useTeamRunAndMilestones(
  gameId: string | null,
  teamAId: string | null,
  teamBId: string | null,
  teamNames: Record<string, string>
): TeamRunAndMilestonesResult {
  const [teamRunItem, setTeamRunItem] = useState<InfoBarItem | null>(null);
  const [milestoneItem, setMilestoneItem] = useState<InfoBarItem | null>(null);
  
  // Track shown milestones to prevent re-triggering
  const shownMilestonesRef = useRef<Set<string>>(new Set());
  
  // Track current team run to prevent redundant updates
  const currentRunPointsRef = useRef<number | null>(null);
  
  // Clear tracking when game changes
  useEffect(() => {
    shownMilestonesRef.current.clear();
    currentRunPointsRef.current = null;
  }, [gameId]);

  const checkStats = useCallback(async () => {
    if (!gameId || !teamAId || !teamBId || !supabase) return;

    const { data: stats } = await supabase
      .from('game_stats')
      .select('id, team_id, player_id, custom_player_id, stat_type, stat_value, modifier, is_opponent_stat, created_at')
      .eq('game_id', gameId)
      .order('created_at', { ascending: true });

    if (!stats) return;

    // Team Run Detection
    const scoringPlays = extractScoringPlays(stats, teamAId, teamBId);
    const runResult = detectTeamRun(scoringPlays, teamNames);

    if (runResult.hasRun && runResult.run) {
      if (runResult.run.points !== currentRunPointsRef.current) {
        currentRunPointsRef.current = runResult.run.points;
        setTeamRunItem(createTeamRunItem(runResult.run));
      }
    } else {
      if (currentRunPointsRef.current !== null) {
        currentRunPointsRef.current = null;
        setTeamRunItem(null);
      }
    }

    // Milestone Detection (reuses same stats)
    const allMilestones = detectAllMilestonesFromStats(stats);
    const unseenMilestone = allMilestones.find(m => {
      const key = `${m.playerId}:${m.milestone}`;
      return !shownMilestonesRef.current.has(key);
    });
    
    if (unseenMilestone) {
      const milestoneKey = `${unseenMilestone.playerId}:${unseenMilestone.milestone}`;
      shownMilestonesRef.current.add(milestoneKey);
      
      const displayName = await fetchPlayerDisplayName(unseenMilestone.playerId);
      setMilestoneItem(createMilestoneInfoBarItem(unseenMilestone.milestone, displayName, unseenMilestone.teamId));
    }
  }, [gameId, teamAId, teamBId, teamNames]);

  // Subscribe to game_stats changes
  useEffect(() => {
    if (!gameId || !supabase) return;

    checkStats();

    const channel = supabase
      .channel(`stats_overlay:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_stats',
          filter: `game_id=eq.${gameId}`,
        },
        checkStats
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, checkStats]);

  return { teamRunItem, milestoneItem };
}
