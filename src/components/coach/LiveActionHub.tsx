'use client';

/**
 * LiveActionHub - Primary action center for Coach Mission Control
 * 
 * V3 Refinement:
 * - Height matches ProfileCard
 * - Uniform button sizes
 * - Proper spacing
 * 
 * Follows .cursorrules: <150 lines, UI only, single responsibility
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { PlayCircle, Upload, Video, Film, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';
import { CoachGame } from '@/lib/types/coach';
import { VideoQueueSummary, ClipsSummary } from '@/hooks/useCoachDashboardData';

interface LiveActionHubProps {
  liveGames: CoachGame[];
  videoQueue: VideoQueueSummary;
  clips: ClipsSummary;
  onStartGame: () => void;
  onUploadVideo: () => void;
}

export function LiveActionHub({
  liveGames,
  videoQueue,
  clips,
  onStartGame,
  onUploadVideo,
}: LiveActionHubProps) {
  const router = useRouter();
  const hasLiveGame = liveGames.length > 0;
  const liveGame = liveGames[0];

  const handleResume = (game: CoachGame) => {
    const url = `/stat-tracker-v3?gameId=${game.id}&coachMode=true&coachTeamId=${game.coach_team_id}`;
    router.push(url);
  };

  const videosInPipeline = videoQueue.inProgress + videoQueue.assigned + videoQueue.pending;

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-border/50 hover:border-primary/30 overflow-hidden h-full flex flex-col">
      {/* Gradient Top Bar - matches ProfileCard */}
      <div className="h-2 bg-gradient-to-r from-primary via-accent to-orange-500 flex-shrink-0"></div>
      
      <CardContent className="p-4 pt-3 flex flex-col flex-1">
        {/* Header */}
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Quick Actions
        </h3>

        {/* Primary Actions - Same size buttons */}
        <div className="space-y-2 mb-4">
          <Button
            onClick={onStartGame}
            className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition-all gap-2"
          >
            <PlayCircle className="w-5 h-5" />
            <span className="font-semibold">Start New Game</span>
          </Button>

          <Button
            onClick={onUploadVideo}
            variant="outline"
            className="w-full h-11 border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:border-gray-300 gap-2"
          >
            <Upload className="w-5 h-5" />
            <span className="font-medium">Upload Video</span>
          </Button>
        </div>

        {/* Live Game Alert */}
        {hasLiveGame && liveGame && (
          <div className="mb-4 p-2.5 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">Live</span>
              </div>
              <span className="text-[10px] font-medium text-gray-500">Q{liveGame.quarter || 1}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">vs {liveGame.opponent_name}</div>
                <div className="text-[11px] text-gray-500">{liveGame.home_score || 0} - {liveGame.away_score || 0}</div>
              </div>
              <Button
                size="sm"
                onClick={() => handleResume(liveGame)}
                className="h-7 px-3 text-[11px] bg-green-600 hover:bg-green-700 gap-1"
              >
                Resume <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Status Counters - pushed to bottom */}
        <div className="grid grid-cols-2 gap-3 mt-auto">
          {/* Videos */}
          <div className="bg-primary/10 rounded-lg p-2.5 text-center border border-primary/20">
            <div className="flex items-center justify-center mb-0.5">
              <Video className="w-4 h-4 text-primary" />
            </div>
            <div className="text-xl font-bold text-primary">{videosInPipeline}</div>
            <div className="text-[10px] text-foreground/70">Videos</div>
          </div>
          
          {/* Clips */}
          <div className="bg-primary/10 rounded-lg p-2.5 text-center border border-primary/20">
            <div className="flex items-center justify-center mb-0.5">
              <Film className="w-4 h-4 text-primary" />
            </div>
            <div className="text-xl font-bold text-primary">{clips.readyClips}</div>
            <div className="text-[10px] text-foreground/70">Clips</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
