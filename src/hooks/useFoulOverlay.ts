/** useFoulOverlay - Detects player fouls, creates info bar items */
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { InfoBarItem, createFoulItem, FoulData } from '@/lib/services/canvas-overlay/infoBarManager';
import { fetchPlayerDisplayName } from '@/lib/services/playerLookupService';

const FOUL_DISPLAY_MS = 5000;

interface Options {
  gameId: string | null;
  teamAId: string | null;
  teamBId: string | null;
}

export function useFoulOverlay({ gameId, teamAId, teamBId }: Options): InfoBarItem | null {
  const [foulItem, setFoulItem] = useState<InfoBarItem | null>(null);
  const lastFoulIdRef = useRef<string | null>(null);
  const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearFoul = useCallback(() => {
    setFoulItem(null);
    lastFoulIdRef.current = null;
  }, []);

  useEffect(() => {
    if (!gameId || !teamAId || !teamBId || !supabase) return;

    const channel = supabase
      .channel(`foul_overlay:${gameId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'game_stats', filter: `game_id=eq.${gameId}` },
        async (payload) => {
          const stat = payload.new as {
            id: string;
            team_id: string;
            player_id: string | null;
            custom_player_id: string | null;
            stat_type: string;
            stat_value: number;
            is_opponent_stat?: boolean;
          };

          // Only process foul stats (stat_type is 'foul', modifier is 'personal'/'shooting'/etc)
          if (stat.stat_type !== 'foul') return;
          if (stat.is_opponent_stat) return;
          if (stat.id === lastFoulIdRef.current) return;
          lastFoulIdRef.current = stat.id;

          const playerId = stat.player_id || stat.custom_player_id;
          if (!playerId) return;

          const playerName = await fetchPlayerDisplayName(playerId);

          const foulData: FoulData = {
            playerId,
            playerName,
            foulType: 'personal', // Default to personal foul
            foulCount: stat.stat_value,
          };

          setFoulItem(createFoulItem(foulData, stat.team_id));
          if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
          clearTimeoutRef.current = setTimeout(clearFoul, FOUL_DISPLAY_MS);
        }
      )
      .subscribe();

    return () => {
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
      supabase?.removeChannel(channel);
    };
  }, [gameId, teamAId, teamBId, clearFoul]);

  return foulItem;
}
