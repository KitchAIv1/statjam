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
import { useTournamentTheme } from '@/contexts/TournamentThemeContext';
import { getTournamentThemeClass } from '@/lib/utils/tournamentThemeClasses';

interface MediaTabProps {
  tournamentId: string;
}

export function MediaTab({ tournamentId }: MediaTabProps) {
  const { theme } = useTournamentTheme();
  const { replays, loading, hasReplays } = useGameReplays(tournamentId, { limit: 6 });
  const [activeReplayId, setActiveReplayId] = useState<string | null>(null);

  const cardClass = `rounded-2xl border p-4 backdrop-blur sm:rounded-3xl sm:p-6 ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBgSubtle', theme)} ${getTournamentThemeClass('cardTextMuted', theme)}`;
  const skeletonClass = getTournamentThemeClass('cardBgSubtle', theme);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Game Replays Section */}
      <Card className={cardClass}>
        <div className="flex items-center gap-2 mb-4">
          <Video className="h-5 w-5 text-[#FF3B30]" />
          <h2 className={`text-lg font-semibold sm:text-xl ${getTournamentThemeClass('cardText', theme)}`}>Game Replays</h2>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`animate-pulse space-y-2 rounded-2xl p-3 ${skeletonClass}`}>
                <div className={`aspect-video rounded-xl ${skeletonClass}`} />
                <div className={`h-4 w-3/4 rounded ${skeletonClass}`} />
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
          <div className={`rounded-xl border p-6 text-center ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBg', theme)}`}>
            <Video className={`h-8 w-8 mx-auto mb-2 ${getTournamentThemeClass('emptyIcon', theme)}`} />
            <p className={`text-sm ${getTournamentThemeClass('cardTextMuted', theme)}`}>No game replays yet</p>
            <p className={`text-xs mt-1 ${getTournamentThemeClass('emptyText', theme)}`}>
              Replays will appear here after live streamed games complete
            </p>
          </div>
        )}
      </Card>

      {/* Highlights Section */}
      <Card className={cardClass}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-[#FF3B30]" />
            <div>
              <h2 className={`text-lg font-semibold sm:text-xl ${getTournamentThemeClass('cardText', theme)}`}>Highlights</h2>
              <p className={`text-xs sm:text-sm ${getTournamentThemeClass('cardTextDim', theme)}`}>Game clips and condensed games</p>
            </div>
          </div>
          <span className={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-wide sm:px-4 sm:py-2 sm:text-xs ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardTextDim', theme)}`}>
            Coming Soon
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((index) => (
            <div key={index} className={`space-y-2 rounded-2xl border p-3 opacity-50 ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBg', theme)}`}>
              <div className={`aspect-video rounded-xl ${skeletonClass}`} />
              <div className="space-y-1 text-xs">
                <div className={`font-semibold ${getTournamentThemeClass('cardText', theme)}`}>Highlight {index}</div>
                <div className={getTournamentThemeClass('cardTextDim', theme)}>Auto-generated clips coming soon</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Content Pipeline Teaser */}
      <Card className={cardClass}>
        <h3 className={`text-base font-semibold sm:text-lg ${getTournamentThemeClass('cardText', theme)}`}>Content Pipeline</h3>
        <p className={`mt-2 text-xs sm:text-sm ${getTournamentThemeClass('cardTextDim', theme)}`}>
          Organizer Pro surfaces auto-generated recap articles, social media packages, and player spotlights powered by StatJam AI.
        </p>
      </Card>
    </div>
  );
}
