'use client';

/**
 * LiveActionHub - Primary action center for Coach Mission Control
 * 
 * V4 Apple-Inspired Redesign:
 * - Integrated button states (credits inside Upload button)
 * - Removed redundant counters (shown in VideoTrackingWidget)
 * - Clear hierarchy: one hero action
 * - Contextual value messaging
 * 
 * Follows .cursorrules: <150 lines, UI only, single responsibility
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { PlayCircle, Upload, Video, ArrowRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';
import { CoachGame } from '@/lib/types/coach';

interface DailyUploadStatus {
  uploadsToday: number;
  limit: number;
  remaining: number;
  isExempt: boolean;
}

interface LiveActionHubProps {
  liveGames: CoachGame[];
  videoCredits?: number;
  dailyUploads?: DailyUploadStatus;
  onStartGame: () => void;
  onUploadVideo: () => void;
  onBuyCredits?: () => void;
}

export function LiveActionHub({
  liveGames,
  videoCredits,
  dailyUploads,
  onStartGame,
  onUploadVideo,
  onBuyCredits,
}: LiveActionHubProps) {
  const router = useRouter();
  const hasLiveGame = liveGames.length > 0;
  const liveGame = liveGames[0];

  const handleResume = (game: CoachGame) => {
    const url = `/stat-tracker-v3?gameId=${game.id}&coachMode=true&coachTeamId=${game.coach_team_id}`;
    router.push(url);
  };

  // Credits state helpers
  const hasCredits = videoCredits !== undefined && videoCredits > 0;
  const isLowCredits = videoCredits !== undefined && videoCredits > 0 && videoCredits <= 2;
  
  // Daily limit helpers
  const dailyLimitReached = dailyUploads && !dailyUploads.isExempt && dailyUploads.remaining === 0;
  const showDailyLimit = dailyUploads && !dailyUploads.isExempt;

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-border/50 hover:border-primary/30 overflow-hidden h-full flex flex-col relative">
      {/* Leaderboard-style Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: 'url(/images/leadersection.webp)' }}
      />
      
      {/* Gradient Top Bar */}
      <div className="h-2 bg-gradient-to-r from-primary via-accent to-orange-500 flex-shrink-0 relative z-10"></div>
      
      <CardContent className="p-4 pt-3 flex flex-col flex-1 relative z-10">
        {/* Header */}
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Quick Actions
        </h3>

        {/* Actions */}
        <div className="space-y-3 flex-1">
          {/* Hero CTA: Start New Game */}
          <button
            onClick={onStartGame}
            className="w-full text-left p-3 rounded-xl border-2 border-orange-400 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition-all group/start"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/20 group-hover/start:bg-white/30 transition-colors">
                <PlayCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white">Start New Game</div>
                <div className="text-xs text-white/80">Manual stat tracking</div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/70 group-hover/start:text-white transition-colors flex-shrink-0" />
            </div>
          </button>

          {/* Upload Video - State-aware integrated button */}
          {hasCredits ? (
            <button
              onClick={dailyLimitReached ? undefined : onUploadVideo}
              disabled={dailyLimitReached}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all group/upload
                ${dailyLimitReached 
                  ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60' 
                  : 'border-orange-200 bg-orange-50/50 hover:border-orange-300 hover:bg-orange-50'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${dailyLimitReached ? 'bg-gray-200' : 'bg-orange-100 group-hover/upload:bg-orange-200'}`}>
                  <Upload className={`w-5 h-5 ${dailyLimitReached ? 'text-gray-500' : 'text-orange-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">Upload Video</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium ${isLowCredits ? 'text-amber-600' : 'text-orange-600'}`}>
                      {isLowCredits 
                        ? `⚠ ${videoCredits} credit${videoCredits === 1 ? '' : 's'} left`
                        : `✓ ${videoCredits} credit${videoCredits === 1 ? '' : 's'}`}
                    </span>
                    {showDailyLimit && (
                      <span className={`text-xs flex items-center gap-0.5 ${dailyLimitReached ? 'text-red-500' : 'text-gray-500'}`}>
                        <Calendar className="w-3 h-3" />
                        {dailyLimitReached ? 'Limit reached' : `${dailyUploads!.remaining}/${dailyUploads!.limit} today`}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className={`w-4 h-4 transition-colors flex-shrink-0 ${dailyLimitReached ? 'text-gray-400' : 'text-orange-400 group-hover/upload:text-orange-600'}`} />
              </div>
            </button>
          ) : (
            <button
              onClick={onBuyCredits}
              className="w-full text-left p-3 rounded-xl border-2 border-dashed border-primary/30 
                         bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all group/buy"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">Buy Video Credits</div>
                  <div className="text-xs text-gray-500">Track games with AI highlight clips</div>
                </div>
                <ArrowRight className="w-4 h-4 text-primary/50 group-hover/buy:text-primary transition-colors flex-shrink-0" />
              </div>
            </button>
          )}
        </div>

        {/* Live Game Alert - Only shown when there's a live game */}
        {hasLiveGame && liveGame && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wide">Live Game</span>
              </div>
              <span className="text-[10px] font-medium text-gray-500">Q{liveGame.quarter || 1}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">vs {liveGame.opponent_name}</div>
                <div className="text-xs text-gray-500">{liveGame.home_score || 0} - {liveGame.away_score || 0}</div>
              </div>
              <Button
                size="sm"
                onClick={() => handleResume(liveGame)}
                className="h-8 px-3 text-xs bg-orange-600 hover:bg-orange-700 gap-1"
              >
                Resume <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
