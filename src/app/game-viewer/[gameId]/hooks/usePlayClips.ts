/**
 * usePlayClips - Hook for linking play-by-play entries to video clips
 * 
 * PURPOSE: Create efficient lookup from stat_event_id to clip data
 * Follows .cursorrules: <50 lines, single responsibility
 */

import { useMemo } from 'react';
import { GeneratedClip } from '@/lib/services/clipService';

export interface PlayClipLookup {
  hasClip: (statId: string) => boolean;
  getClip: (statId: string) => GeneratedClip | undefined;
  clipCount: number;
}

/**
 * Creates a lookup map for clips by stat_event_id
 * @param clips - Array of generated clips for the game
 * @returns Lookup functions and clip count
 */
export function usePlayClips(clips: GeneratedClip[] = []): PlayClipLookup {
  const clipMap = useMemo(() => {
    const map = new Map<string, GeneratedClip>();
    clips.forEach(clip => {
      if (clip.stat_event_id && clip.bunny_clip_url) {
        map.set(clip.stat_event_id, clip);
      }
    });
    return map;
  }, [clips]);

  return {
    hasClip: (statId: string) => clipMap.has(statId),
    getClip: (statId: string) => clipMap.get(statId),
    clipCount: clipMap.size,
  };
}

