/**
 * Tournament Streaming Service
 * 
 * Manages tournament live streaming status for embedding on public pages.
 * Updates tournament fields: is_streaming, live_stream_url, stream_platform
 */

import { supabase } from '@/lib/supabase';

export type StreamPlatform = 'youtube' | 'twitch' | 'facebook';

interface StreamingStatus {
  isStreaming: boolean;
  liveStreamUrl: string | null;
  streamPlatform: StreamPlatform | null;
}

class TournamentStreamingService {
  /**
   * Start streaming - updates tournament with streaming info
   */
  async startStreaming(
    tournamentId: string,
    platform: StreamPlatform,
    publicStreamUrl: string
  ): Promise<void> {
    const { error } = await supabase
      .from('tournaments')
      .update({
        is_streaming: true,
        live_stream_url: publicStreamUrl,
        stream_platform: platform,
      })
      .eq('id', tournamentId);

    if (error) {
      console.error('Failed to start streaming:', error);
      throw new Error(`Failed to update streaming status: ${error.message}`);
    }
  }

  /**
   * Stop streaming - clears tournament streaming status
   */
  async stopStreaming(tournamentId: string): Promise<void> {
    const { error } = await supabase
      .from('tournaments')
      .update({
        is_streaming: false,
        live_stream_url: null,
        stream_platform: null,
      })
      .eq('id', tournamentId);

    if (error) {
      console.error('Failed to stop streaming:', error);
      throw new Error(`Failed to clear streaming status: ${error.message}`);
    }
  }

  /**
   * Get streaming status for a tournament
   */
  async getStreamingStatus(tournamentId: string): Promise<StreamingStatus> {
    const { data, error } = await supabase
      .from('tournaments')
      .select('is_streaming, live_stream_url, stream_platform')
      .eq('id', tournamentId)
      .single();

    if (error) {
      console.error('Failed to get streaming status:', error);
      return { isStreaming: false, liveStreamUrl: null, streamPlatform: null };
    }

    return {
      isStreaming: data?.is_streaming ?? false,
      liveStreamUrl: data?.live_stream_url ?? null,
      streamPlatform: data?.stream_platform as StreamPlatform | null,
    };
  }

  /**
   * Save stream video ID to game for Media tab replays
   * Extracts YouTube video ID from URL and saves to games.stream_video_id
   */
  async saveGameStreamVideoId(gameId: string, publicStreamUrl: string): Promise<void> {
    const videoId = this.extractYouTubeVideoId(publicStreamUrl);
    if (!videoId) {
      console.warn('Could not extract YouTube video ID from URL:', publicStreamUrl);
      return;
    }

    const { error } = await supabase
      .from('games')
      .update({ stream_video_id: videoId })
      .eq('id', gameId);

    if (error) {
      console.error('Failed to save game stream video ID:', error);
    } else {
      console.log('✅ Saved stream video ID to game:', { gameId, videoId });
    }
  }

  /**
   * Extract YouTube video ID from various URL formats
   */
  private extractYouTubeVideoId(url: string): string | null {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) return match[1];
    }
    return null;
  }
}

export const tournamentStreamingService = new TournamentStreamingService();
