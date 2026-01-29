/**
 * Tournament Streaming Service
 * 
 * Manages tournament live streaming status for embedding on public pages.
 * Updates tournament fields: is_streaming, live_stream_url, stream_platform
 */

import { supabase } from '@/lib/supabase';

export type StreamPlatform = 'youtube' | 'twitch';

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
}

export const tournamentStreamingService = new TournamentStreamingService();
