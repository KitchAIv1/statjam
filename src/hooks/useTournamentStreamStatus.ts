/**
 * useTournamentStreamStatus - Real-time tournament streaming state
 * 
 * Subscribes to tournaments table for live streaming fields.
 * Detects URL changes, platform switches, and streaming toggle in real-time.
 * 
 * Single responsibility: Provide reactive streaming state for public pages.
 * @module useTournamentStreamStatus
 */

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface TournamentStreamStatus {
  isStreaming: boolean;
  liveStreamUrl: string | null;
  streamPlatform: 'youtube' | 'twitch' | null;
  loading: boolean;
}

interface UseTournamentStreamStatusOptions {
  /** Initial values from SSR to avoid flash */
  initialIsStreaming?: boolean;
  initialLiveStreamUrl?: string | null;
  initialStreamPlatform?: 'youtube' | 'twitch' | null;
}

/**
 * Hook to subscribe to real-time tournament streaming status changes.
 * Automatically updates when organizer changes stream URL, toggles streaming, or switches platform.
 */
export function useTournamentStreamStatus(
  tournamentId: string | null,
  options?: UseTournamentStreamStatusOptions
): TournamentStreamStatus {
  const [status, setStatus] = useState<TournamentStreamStatus>({
    isStreaming: options?.initialIsStreaming ?? false,
    liveStreamUrl: options?.initialLiveStreamUrl ?? null,
    streamPlatform: options?.initialStreamPlatform ?? null,
    loading: !options?.initialIsStreaming, // Only loading if no initial data
  });

  useEffect(() => {
    if (!tournamentId) {
      setStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    // Initial fetch (in case SSR data is stale)
    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('is_streaming, live_stream_url, stream_platform')
        .eq('id', tournamentId)
        .single();

      if (error) {
        console.error('❌ [useTournamentStreamStatus] Fetch error:', error.message);
        // On error, keep initial values instead of clearing them
        setStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      if (data) {
        // Prefer fetched data, fallback to SSR initial values if fetch returned null
        setStatus({
          isStreaming: data.is_streaming ?? options?.initialIsStreaming ?? false,
          liveStreamUrl: data.live_stream_url ?? options?.initialLiveStreamUrl ?? null,
          streamPlatform: (data.stream_platform ?? options?.initialStreamPlatform) as 'youtube' | 'twitch' | null,
          loading: false,
        });
      }
    };

    fetchStatus();

    // Real-time subscription for UPDATE events on this tournament
    const channel = supabase
      .channel(`tournament-stream-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournaments',
          filter: `id=eq.${tournamentId}`,
        },
        (payload) => {
          const newData = payload.new as {
            is_streaming?: boolean;
            live_stream_url?: string | null;
            stream_platform?: string | null;
          };

          console.log('🔄 [useTournamentStreamStatus] Stream status updated:', {
            isStreaming: newData.is_streaming,
            liveStreamUrl: newData.live_stream_url,
            streamPlatform: newData.stream_platform,
          });

          setStatus({
            isStreaming: newData.is_streaming ?? false,
            liveStreamUrl: newData.live_stream_url ?? null,
            streamPlatform: newData.stream_platform as 'youtube' | 'twitch' | null,
            loading: false,
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ [useTournamentStreamStatus] Subscribed to tournament:', tournamentId);
        }
      });

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [tournamentId]);

  return status;
}
