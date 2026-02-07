'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { GameViewerV3APIResponse } from '@/providers/GameViewerV3Provider';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Manages realtime subscriptions for game viewer V3.
 * Updates shared context state on game/stats changes.
 * Uses specific game_id filter (NO wildcards).
 */
export function useGameViewerV3Realtime(
  gameId: string,
  gameData: GameViewerV3APIResponse | null,
  setGameData: React.Dispatch<React.SetStateAction<GameViewerV3APIResponse | null>>
): void {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!gameId || !gameData) return;

    const isLive = gameData.game?.status === 'in_progress' || gameData.game?.status === 'overtime';
    if (!isLive) return;

    console.log(`📡 GameViewerV3Realtime: Setting up subscriptions for game ${gameId.substring(0, 8)}`);

    const channel = supabase
      .channel(`game-viewer-v3-${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        (payload) => {
          console.log('📡 GameViewerV3Realtime: Game update received');
          if (payload.new && typeof payload.new === 'object') {
            setGameData((prev) => prev ? { ...prev, game: payload.new as GameViewerV3APIResponse['game'] } : null);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'game_stats', filter: `game_id=eq.${gameId}` },
        (payload) => {
          console.log('📡 GameViewerV3Realtime: New stat recorded');
          if (payload.new && typeof payload.new === 'object') {
            setGameData((prev) => {
              if (!prev) return null;
              const newStat = payload.new as GameViewerV3APIResponse['stats'][0];
              return { ...prev, stats: [...prev.stats, newStat] };
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 GameViewerV3Realtime: Subscription status - ${status}`);
      });

    channelRef.current = channel;

    return () => {
      console.log(`📡 GameViewerV3Realtime: Cleaning up subscriptions`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [gameId, gameData?.game?.status, setGameData]);
}
