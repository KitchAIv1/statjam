/**
 * LiveTabContent - Live Stream Video Tab
 * 
 * Single responsibility: Display live stream embed when active.
 * Uses useTournamentStreamStatus for real-time stream URL/status updates.
 * Shows contextual states: loading, live, ended, error.
 * 
 * @module LiveTabContent
 */

'use client';

import { useState, useCallback } from 'react';
import { TournamentLiveStreamEmbed, PlayerState } from '@/components/live-streaming/TournamentLiveStreamEmbed';
import { useTournamentStreamStatus } from '@/hooks/useTournamentStreamStatus';
import { Tv, Video, ExternalLink } from 'lucide-react';
import { useTournamentTheme } from '@/contexts/TournamentThemeContext';
import { getTournamentThemeClass } from '@/lib/utils/tournamentThemeClasses';

interface LiveTabContentProps {
  tournamentId: string;
  /** Initial values from SSR - hook will take over for real-time updates */
  isStreaming?: boolean;
  liveStreamUrl?: string | null;
  streamPlatform?: 'youtube' | 'twitch' | 'facebook' | null;
}

export function LiveTabContent({
  tournamentId,
  isStreaming: initialIsStreaming,
  liveStreamUrl: initialLiveStreamUrl,
  streamPlatform: initialStreamPlatform,
}: LiveTabContentProps) {
  const { theme } = useTournamentTheme();
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
    
    // When stream ends, mark game for Media Tab AND clear tournament streaming status
    if (state === 'ended' && liveStreamUrl && streamPlatform === 'youtube') {
      import('@/lib/services/tournamentStreamingService')
        .then(({ tournamentStreamingService }) => {
          const videoIdMatch = liveStreamUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/);
          const videoId = videoIdMatch?.[1];
          if (videoId) {
            tournamentStreamingService.markStreamEnded(videoId);
          }
          // ✅ Clear tournament streaming status so container shows placeholder
          tournamentStreamingService.stopStreaming(tournamentId);
        })
        .catch(error => console.warn('Failed to mark stream ended:', error));
    }
  }, [liveStreamUrl, streamPlatform, tournamentId]);

  const streamActive = isStreaming && liveStreamUrl && streamPlatform;

  const placeholderClass = `rounded-xl border p-8 text-center ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('railSectionBg', theme)}`;
  const iconClass = getTournamentThemeClass('emptyIcon', theme);
  const textClass = getTournamentThemeClass('cardTextMuted', theme);
  const subTextClass = getTournamentThemeClass('emptyText', theme);

  // No stream configured
  if (!streamActive) {
    return (
      <div className={placeholderClass}>
        <Tv className={`h-12 w-12 mx-auto mb-4 ${iconClass}`} />
        <p className={`text-sm ${textClass}`}>No active live stream</p>
        <p className={`text-xs mt-1 ${subTextClass}`}>Check back when a game is being broadcast</p>
      </div>
    );
  }

  // Stream ended - show placeholder (replay available in Media Tab)
  if (playerState === 'ended') {
    return (
      <div className={placeholderClass}>
        <Tv className={`h-12 w-12 mx-auto mb-4 ${iconClass}`} />
        <p className={`text-sm ${textClass}`}>No active live stream</p>
        <p className={`text-xs mt-1 ${subTextClass}`}>Check the Media tab for game replays</p>
      </div>
    );
  }

  // Error loading stream
  if (playerState === 'error') {
    return (
      <div className={placeholderClass}>
        <Video className={`h-12 w-12 mx-auto mb-4 ${iconClass}`} />
        <p className={`text-sm font-semibold mb-1 ${getTournamentThemeClass('cardText', theme)}`}>Unable to Load Stream</p>
        <p className={`text-xs mb-4 ${textClass}`}>Watch directly on the platform</p>
        <a
          href={liveStreamUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-[#FF3B30] hover:text-[#FF3B30]/80 transition"
        >
          Open in {streamPlatform === 'youtube' ? 'YouTube' : streamPlatform === 'twitch' ? 'Twitch' : 'Facebook'}
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    );
  }

  // Stream active (loading, playing, buffering, paused, unstarted)
  return (
    <section className={`rounded-xl border overflow-hidden ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('railSectionBg', theme)}`}>
      <TournamentLiveStreamEmbed
        streamUrl={liveStreamUrl}
        platform={streamPlatform}
        className="w-full"
        onStateChange={handleStateChange}
      />
    </section>
  );
}
