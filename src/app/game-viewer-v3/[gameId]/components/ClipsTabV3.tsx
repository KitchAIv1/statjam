'use client';

import { useEffect, useState } from 'react';
import { Film, Loader2 } from 'lucide-react';
import { ClipGrid } from '@/components/clips/ClipGrid';
import { getGameClips, GeneratedClip, hasClipsCache, getCachedClipsSync } from '@/lib/services/clipService';
import { useGameViewerV3Context } from '@/providers/GameViewerV3Provider';

interface ClipPlayer {
  id: string;
  name: string;
  jersey_number?: number;
}

export function ClipsTabV3() {
  const { gameData } = useGameViewerV3Context();
  const gameId = gameData?.game?.id;

  // Initialize from cache for instant render
  const [clips, setClips] = useState<GeneratedClip[]>(() => 
    gameId ? getCachedClipsSync(gameId) || [] : []
  );
  const [loading, setLoading] = useState(() => gameId ? !hasClipsCache(gameId) : false);

  // Build players list from context (no extra fetch needed)
  const players: ClipPlayer[] = gameData ? [
    ...gameData.users.map(u => ({ id: u.id, name: u.name })),
    ...gameData.customPlayers.map(cp => ({ id: cp.id, name: cp.name, jersey_number: cp.jersey_number })),
  ] : [];

  useEffect(() => {
    if (!gameId) return;

    async function loadClips() {
      if (!hasClipsCache(gameId!)) setLoading(true);
      try {
        const gameClips = await getGameClips(gameId!);
        setClips(gameClips);
      } catch (error) {
        console.error('ClipsTabV3: Error loading clips:', error);
      } finally {
        setLoading(false);
      }
    }
    loadClips();
  }, [gameId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] p-6 text-center">
        <div className="w-16 h-16 mb-4 rounded-full flex items-center justify-center bg-gray-800">
          <Film className="w-8 h-8 text-orange-400" />
        </div>
        <h3 className="text-lg font-bold mb-2 text-white">No Clips Available</h3>
        <p className="text-sm max-w-xs text-gray-400">
          Video highlights for this game haven't been generated yet.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <ClipGrid clips={clips} players={players} />
    </div>
  );
}
