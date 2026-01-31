/**
 * useTimeoutOverlay Hook
 * 
 * Detects active timeouts from game_timeouts table
 * Uses realtime subscription + local timer (NO polling)
 * 
 * @module useTimeoutOverlay
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { InfoBarItem, createTimeoutItem } from '@/lib/services/canvas-overlay/infoBarManager';

const DEFAULT_TIMEOUT_DURATION_MS = 30 * 1000; // 30 seconds fallback

export function useTimeoutOverlay(
  gameId: string | null,
  teamNames: Record<string, string>
): InfoBarItem | null {
  const [timeoutItem, setTimeoutItem] = useState<InfoBarItem | null>(null);
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // ✅ Ref to avoid callback recreation when teamNames changes
  const teamNamesRef = useRef(teamNames);
  teamNamesRef.current = teamNames;

  // Clear timeout display
  const clearTimeoutDisplay = useCallback(() => {
    setTimeoutItem(null);
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
  }, []);

  // Handle new timeout (from INSERT event or initial check)
  const handleTimeout = useCallback((data: { team_id: string; created_at: string; duration_seconds?: number }) => {
    const durationMs = (data.duration_seconds || 30) * 1000;
    const elapsed = Date.now() - new Date(data.created_at).getTime();
    const remaining = durationMs - elapsed;

    if (remaining > 0) {
      const teamName = teamNamesRef.current[data.team_id] || 'TEAM';
      setTimeoutItem(createTimeoutItem(teamName, data.team_id));

      // Clear any existing timer
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      
      // Set local timer to clear after remaining duration
      clearTimerRef.current = setTimeout(clearTimeoutDisplay, remaining);
    } else {
      clearTimeoutDisplay();
    }
  }, [clearTimeoutDisplay]);

  // ✅ Ref to keep subscription stable (no recreation on callback changes)
  const handleTimeoutRef = useRef(handleTimeout);
  handleTimeoutRef.current = handleTimeout;

  // ✅ Track if initial check has run for this gameId
  const checkedGameIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!gameId || !supabase) return;

    // Initial check for active timeout (one-time per gameId)
    const checkInitial = async () => {
      // Skip if already checked for this game
      if (checkedGameIdRef.current === gameId) return;
      checkedGameIdRef.current = gameId;

      const { data, error } = await supabase!
        .from('game_timeouts')
        .select('id, team_id, created_at, duration_seconds')
        .eq('game_id', gameId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // ✅ Handle 406/error gracefully - table might not exist
      if (error || !data) return;
      
      handleTimeoutRef.current(data);
    };

    checkInitial();

    // Subscribe to INSERT events only (new timeouts)
    const channel = supabase
      .channel(`timeout_overlay:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_timeouts',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const data = payload.new as { team_id: string; created_at: string; duration_seconds?: number };
          handleTimeoutRef.current(data);
        }
      )
      .subscribe();

    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      supabase?.removeChannel(channel);
    };
  }, [gameId]); // ✅ Stable deps - subscription never recreated unnecessarily

  return timeoutItem;
}
