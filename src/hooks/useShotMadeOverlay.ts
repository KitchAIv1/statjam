/** useShotMadeOverlay - Detects made shots, creates info bar items with team color + 3PT shake */
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { InfoBarItem, createShotMadeItem, ShotMadeData } from '@/lib/services/canvas-overlay/infoBarManager';
import { fetchPlayerDisplayName } from '@/lib/services/playerLookupService';

const SHOT_DISPLAY_MS = 5000;

interface Options { gameId: string | null; teamAId: string | null; teamBId: string | null; }
export interface ScoreDelta { statId: string; teamId: string; points: number; }
interface ShotMadeResult { item: InfoBarItem | null; scoreDelta: ScoreDelta | null; }

export function useShotMadeOverlay({ gameId, teamAId, teamBId }: Options): ShotMadeResult {
  const [shotItem, setShotItem] = useState<InfoBarItem | null>(null);
  const [scoreDelta, setScoreDelta] = useState<ScoreDelta | null>(null);
  const lastShotIdRef = useRef<string | null>(null);
  const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearShot = useCallback(() => { setShotItem(null); setScoreDelta(null); lastShotIdRef.current = null; }, []);

  useEffect(() => {
    if (!gameId || !teamAId || !teamBId || !supabase) return;

    const channel = supabase
      .channel(`shot_made_overlay:${gameId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_stats', filter: `game_id=eq.${gameId}` },
        async (payload) => {
          const stat = payload.new as {
            id: string; team_id: string; player_id: string | null; custom_player_id: string | null;
            stat_type: string; stat_value: number; modifier: string | null; is_opponent_stat?: boolean;
          };

          if (stat.modifier !== 'made') return;
          if (!['field_goal', 'three_pointer'].includes(stat.stat_type)) return;
          if (stat.is_opponent_stat) return;
          if (stat.id === lastShotIdRef.current) return;
          lastShotIdRef.current = stat.id;

          const playerId = stat.player_id || stat.custom_player_id;
          if (!playerId) return;

          // ✅ FIX: Calculate points BEFORE async call to prevent race condition
          const is3Pointer = stat.stat_type === 'three_pointer';
          const points = is3Pointer ? 3 : stat.stat_value;
          
          // ✅ FIX: Set scoreDelta IMMEDIATELY (before async player name fetch)
          // This ensures score freeze starts before DB sync can update dbHomeScore
          setScoreDelta({ statId: stat.id, teamId: stat.team_id, points });
          if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
          clearTimeoutRef.current = setTimeout(clearShot, SHOT_DISPLAY_MS);

          // Async: Fetch player name for overlay (score already frozen above)
          const playerName = await fetchPlayerDisplayName(playerId);
          
          const shotData: ShotMadeData = {
            playerId, playerName, points, is3Pointer, animationStart: Date.now(),
          };

          setShotItem(createShotMadeItem(shotData, stat.team_id));
        }
      ).subscribe();

    return () => {
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [gameId, teamAId, teamBId, clearShot]);

  return { item: shotItem, scoreDelta };
}
