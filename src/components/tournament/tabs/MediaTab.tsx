/**
 * MediaTab - Media & Highlights Tab
 * 
 * Displays game replays (from YouTube), highlights, and photos.
 * Replays section at top shows completed games with stream_video_id.
 * 
 * @module MediaTab
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Video, Film } from 'lucide-react';
import { useGameReplays } from '@/hooks/useGameReplays';
import { GameReplayCard } from '../GameReplayCard';

interface MediaTabProps {
  tournamentId: string;
}

export function MediaTab({ tournamentId }: MediaTabProps) {
  const { replays, loading, hasReplays } = useGameReplays(tournamentId, { limit: 6 });
  
  // ✅ YouTube-like behavior: Only one video can play at a time
  const [activeReplayId, setActiveReplayId] = useState<string | null>(null);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Game Replays Section */}
      <Card className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80 backdrop-blur sm:rounded-3xl sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Video className="h-5 w-5 text-[#FF3B30]" />
          <h2 className="text-lg font-semibold text-white sm:text-xl">Game Replays</h2>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-2 rounded-2xl bg-white/5 p-3">
                <div className="aspect-video rounded-xl bg-white/10" />
                <div className="h-4 w-3/4 rounded bg-white/10" />
              </div>
            ))}
          </div>
        ) : hasReplays ? (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {replays.map((replay) => (
              <GameReplayCard
                key={replay.id}
                replay={replay}
                tournamentId={tournamentId}
                isPlaying={activeReplayId === replay.id}
                onPlay={(id) => setActiveReplayId(id)}
                onClose={() => setActiveReplayId(null)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-center">
            <Video className="h-8 w-8 text-white/30 mx-auto mb-2" />
            <p className="text-sm text-white/60">No game replays yet</p>
            <p className="text-xs text-white/40 mt-1">
              Replays will appear here after live streamed games complete
            </p>
          </div>
        )}
      </Card>

      {/* Highlights Section */}
      <Card className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80 backdrop-blur sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-[#FF3B30]" />
            <div>
              <h2 className="text-lg font-semibold text-white sm:text-xl">Highlights</h2>
              <p className="text-xs text-white/50 sm:text-sm">Game clips and condensed games</p>
            </div>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-wide text-white/60 sm:px-4 sm:py-2 sm:text-xs">
            Coming Soon
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((index) => (
            <div key={index} className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-3 opacity-50">
              <div className="aspect-video rounded-xl bg-white/10" />
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-white">Highlight {index}</div>
                <div className="text-[10px] text-white/50">Auto-generated clips coming soon</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Content Pipeline Teaser */}
      <Card className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70 backdrop-blur sm:rounded-3xl sm:p-6">
        <h3 className="text-base font-semibold text-white sm:text-lg">Content Pipeline</h3>
        <p className="mt-2 text-xs text-white/50 sm:text-sm">
          Organizer Pro surfaces auto-generated recap articles, social media packages, and player spotlights powered by StatJam AI.
        </p>
      </Card>
    </div>
  );
}
