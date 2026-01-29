/**
 * Tournament Live Stream Embed Component
 * 
 * Embeds YouTube or Twitch live stream for public tournament pages.
 * Auto-detects platform from URL and renders appropriate player.
 */

'use client';

import { useMemo } from 'react';
import { Video, ExternalLink } from 'lucide-react';

interface TournamentLiveStreamEmbedProps {
  streamUrl: string;
  platform: 'youtube' | 'twitch';
  className?: string;
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeVideoId(url: string): string | null {
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

/**
 * Extract Twitch channel name from URL
 */
function extractTwitchChannel(url: string): string | null {
  const patterns = [
    /twitch\.tv\/([a-zA-Z0-9_]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function TournamentLiveStreamEmbed({ 
  streamUrl, 
  platform,
  className = '' 
}: TournamentLiveStreamEmbedProps) {
  const embedUrl = useMemo(() => {
    if (platform === 'youtube') {
      const videoId = extractYouTubeVideoId(streamUrl);
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
      }
    } else if (platform === 'twitch') {
      const channel = extractTwitchChannel(streamUrl);
      if (channel) {
        // Twitch requires parent domain for embedding
        const parentDomain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        return `https://player.twitch.tv/?channel=${channel}&parent=${parentDomain}&muted=true`;
      }
    }
    return null;
  }, [streamUrl, platform]);

  if (!embedUrl) {
    return (
      <div className={`relative bg-black rounded-lg overflow-hidden ${className}`} style={{ aspectRatio: '16/9' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <Video className="h-8 w-8 text-white/40 mb-2" />
          <p className="text-sm text-white/60 mb-2">Unable to embed stream</p>
          <a 
            href={streamUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-[#FF3B30] hover:underline"
          >
            Watch on {platform === 'youtube' ? 'YouTube' : 'Twitch'}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`} style={{ aspectRatio: '16/9' }}>
      <iframe
        src={embedUrl}
        title={`Live stream on ${platform === 'youtube' ? 'YouTube' : 'Twitch'}`}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      {/* Live indicator */}
      <div className="absolute top-2 left-2 z-10">
        <div className="flex items-center gap-1.5 bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      </div>
    </div>
  );
}
