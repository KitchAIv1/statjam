/**
 * LiveTabContent - Live Stream Video Tab
 * 
 * Single responsibility: Display live stream embed when active.
 * Uses useTournamentStreamStatus for real-time stream URL/status updates.
 * Hides stream container when ended/error to avoid dead embed remnants.
 * 
 * @module LiveTabContent
 */

'use client';

import { useState, useCallback } from 'react';
import { TournamentLiveStreamEmbed, PlayerState } from '@/components/live-streaming/TournamentLiveStreamEmbed';
import { useTournamentStreamStatus } from '@/hooks/useTournamentStreamStatus';

interface LiveTabContentProps {
  tournamentId: string;
  /** Initial values from SSR - hook will take over for real-time updates */
  isStreaming?: boolean;
  liveStreamUrl?: string | null;
  streamPlatform?: 'youtube' | 'twitch' | null;
}

export function LiveTabContent({
  tournamentId,
  isStreaming: initialIsStreaming,
  liveStreamUrl: initialLiveStreamUrl,
  streamPlatform: initialStreamPlatform,
}: LiveTabContentProps) {
  const [playerState, setPlayerState] = useState<PlayerState>('loading');
  
  // Real-time subscription to streaming status - auto-updates on URL/toggle changes
  const { isStreaming, liveStreamUrl, streamPlatform } = useTournamentStreamStatus(
    tournamentId,
    {
      initialIsStreaming,
      initialLiveStreamUrl,
      initialStreamPlatform,
    }
  );

  const handleStateChange = useCallback((state: PlayerState) => {
    setPlayerState(state);
  }, []);

  // Hide stream container when ended or error (no dead embed remnants)
  const streamActive = isStreaming && liveStreamUrl && streamPlatform;
  const showStreamEmbed = streamActive && playerState !== 'ended' && playerState !== 'error';

  return (
    <div>
      {/* Live Stream Embed - Hidden when ended/error */}
      {showStreamEmbed ? (
        <section className="rounded-xl border border-white/10 bg-[#121212] overflow-hidden">
          <TournamentLiveStreamEmbed
            streamUrl={liveStreamUrl}
            platform={streamPlatform}
            className="w-full"
            onStateChange={handleStateChange}
          />
        </section>
      ) : (
        <div className="rounded-xl border border-white/10 bg-[#121212] p-8 text-center">
          <p className="text-sm text-white/60">No active live stream</p>
          <p className="text-xs text-white/40 mt-1">Check back when a game is being broadcast</p>
        </div>
      )}
    </div>
  );
}
