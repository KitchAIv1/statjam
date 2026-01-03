'use client';

/**
 * VideoSelectGameCard Component
 * 
 * Displays a game card in the video tracking game list.
 * Shows game status, score, and upload/delete actions.
 * Used by both Coach and Organizer video select pages.
 */

import React from 'react';
import { Button } from '@/components/ui/Button';
import { 
  Loader2, Video, PlayCircle, Calendar, Clock, CheckCircle, Trash2
} from 'lucide-react';
import { CoachVideoStatusCard } from './CoachVideoStatusCard';
import type { GameVideo } from '@/lib/types/video';

interface VideoSelectGame {
  id: string;
  opponent_name?: string;
  game_date?: string;
  status?: string;
  home_score?: number;
  away_score?: number;
  video?: GameVideo | null;
}

interface VideoSelectGameCardProps {
  game: VideoSelectGame;
  teamName: string;
  onSelect: (gameId: string) => void;
  onDelete: (gameId: string, e: React.MouseEvent) => void;
  deletingGameId: string | null;
}

export function VideoSelectGameCard({ 
  game, 
  teamName, 
  onSelect, 
  onDelete,
  deletingGameId 
}: VideoSelectGameCardProps) {
  // If game has a video uploaded, show the status card with delete option
  if (game.video && game.video.status !== 'uploading') {
    return (
      <div className="relative group">
        <div 
          onClick={() => onSelect(game.id)} 
          className="cursor-pointer"
        >
          <CoachVideoStatusCard
            video={game.video}
            teamName={teamName}
            opponentName={game.opponent_name || 'Opponent'}
            compact
          />
        </div>
        <button
          onClick={(e) => onDelete(game.id, e)}
          disabled={deletingGameId === game.id}
          className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-500 
                     hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50
                     opacity-0 group-hover:opacity-100"
          title="Delete game"
        >
          {deletingGameId === game.id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    );
  }
  
  // Otherwise show the regular game card
  const isCompleted = game.status === 'completed';
  const isInProgress = game.status === 'in_progress';
  
  return (
    <div
      className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 
                 hover:border-orange-200 hover:bg-orange-50/50 transition-colors cursor-pointer"
      onClick={() => onSelect(game.id)}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        isCompleted ? 'bg-green-100' : isInProgress ? 'bg-orange-100' : 'bg-gray-100'
      }`}>
        {isCompleted ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : isInProgress ? (
          <Clock className="w-5 h-5 text-orange-600" />
        ) : (
          <PlayCircle className="w-5 h-5 text-gray-500" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground truncate">
          vs {game.opponent_name || 'Opponent'}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {game.game_date ? new Date(game.game_date).toLocaleDateString() : 'No date'}
          </span>
          {isCompleted && game.home_score !== undefined && (
            <span className="font-medium">
              {game.home_score} - {game.away_score}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-2 border-orange-300 text-orange-600 hover:bg-orange-50"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(game.id);
          }}
        >
          <Video className="w-4 h-4" />
          Upload
        </Button>
        
        <button
          onClick={(e) => onDelete(game.id, e)}
          disabled={deletingGameId === game.id}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 
                     rounded-lg transition-colors disabled:opacity-50"
          title="Delete game"
        >
          {deletingGameId === game.id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

