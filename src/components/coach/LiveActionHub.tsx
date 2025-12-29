'use client';

/**
 * LiveActionHub - Primary action center for Coach Mission Control
 * 
 * Shows:
 * - Primary CTAs (Start Game, Upload Video)
 * - Live game alert with resume button
 * - Video & Clips status counters
 * 
 * Follows .cursorrules: <150 lines, UI only, single responsibility
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { PlayCircle, Upload, Video, Film, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
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
  const liveGame = liveGames[0]; // Show first live game

  const handleResume = (game: CoachGame) => {
    const url = `/stat-tracker-v3?gameId=${game.id}&coachMode=true&coachTeamId=${game.coach_team_id}`;
    router.push(url);
  };

  return (
    <Card className="p-4 bg-white border-gray-200 h-full">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        🎯 Action Hub
      </h3>

      {/* Primary CTAs */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button
          onClick={onStartGame}
          className="h-12 flex-col gap-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        >
          <PlayCircle className="w-5 h-5" />
          <span className="text-xs">Start Game</span>
        </Button>
        <Button
          onClick={onUploadVideo}
          variant="outline"
          className="h-12 flex-col gap-1 !border-purple-300 text-purple-600 hover:bg-purple-50"
        >
          <Upload className="w-5 h-5" />
          <span className="text-xs">Upload Video</span>
        </Button>
      </div>

      {/* Live Game Alert */}
      {hasLiveGame && liveGame && (
        <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-xs font-semibold text-green-700">LIVE</span>
          </div>
          <div className="text-sm font-medium text-gray-900 mb-1">
            vs {liveGame.opponent_name}
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              Q{liveGame.quarter || 1} • {liveGame.home_score || 0}-{liveGame.away_score || 0}
            </div>
            <Button
              size="sm"
              onClick={() => handleResume(liveGame)}
              className="h-7 text-xs gap-1"
            >
              Resume <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Status Counters */}
      <div className="grid grid-cols-2 gap-2">
        {/* Video Tracking Status */}
        <div className="p-2.5 bg-purple-50 border border-purple-100 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <Video className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-xs font-medium text-purple-700">Videos</span>
          </div>
          <div className="text-lg font-bold text-purple-900">
            {videoQueue.inProgress + videoQueue.assigned}
          </div>
          <div className="text-[10px] text-purple-600">
            {videoQueue.pending > 0 && `${videoQueue.pending} queued`}
            {videoQueue.pending === 0 && 'in pipeline'}
          </div>
        </div>

        {/* Clips Ready */}
        <div className="p-2.5 bg-orange-50 border border-orange-100 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <Film className="w-3.5 h-3.5 text-orange-600" />
            <span className="text-xs font-medium text-orange-700">Clips</span>
          </div>
          <div className="text-lg font-bold text-orange-900">
            {clips.readyClips}
          </div>
          <div className="text-[10px] text-orange-600">ready to view</div>
        </div>
      </div>
    </Card>
  );
}

