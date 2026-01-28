/**
 * useTimeoutOverlay Hook
 * 
 * Detects active timeouts from game_timeouts table
 * Uses time-based detection (no is_active column exists)
 * 
 * @module useTimeoutOverlay
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { InfoBarItem, createTimeoutItem } from '@/lib/services/canvas-overlay/infoBarManager';

const TIMEOUT_DISPLAY_DURATION_MS = 30 * 1000; // 30 seconds
const POLL_INTERVAL_MS = 5000; // 5 seconds

export function useTimeoutOverlay(
  gameId: string | null,
  teamNames: Record<string, string>
): InfoBarItem | null {
  const [timeoutItem, setTimeoutItem] = useState<InfoBarItem | null>(null);

  useEffect(() => {
    if (!gameId || !supabase) return;

    const fetchActiveTimeout = async () => {
      // Get most recent timeout for this game
      const { data } = await supabase
        .from('game_timeouts')
        .select('id, team_id, created_at, duration_seconds')
        .eq('game_id', gameId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        // Check if timeout is "active" based on recency
        const elapsed = Date.now() - new Date(data.created_at).getTime();
        
        if (elapsed < TIMEOUT_DISPLAY_DURATION_MS) {
          const teamName = teamNames[data.team_id] || 'TEAM';
          setTimeoutItem(createTimeoutItem(teamName, data.team_id));
        } else {
          setTimeoutItem(null);
        }
      } else {
        setTimeoutItem(null);
      }
    };

    fetchActiveTimeout();
    
    // Poll to clear expired timeouts
    const pollInterval = setInterval(fetchActiveTimeout, POLL_INTERVAL_MS);

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`timeout_overlay:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_timeouts',
          filter: `game_id=eq.${gameId}`,
        },
        fetchActiveTimeout
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [gameId, teamNames]);

  return timeoutItem;
}
