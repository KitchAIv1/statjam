/**
 * GameReplayCard - YouTube replay thumbnail card
 * 
 * Displays game replay with YouTube thumbnail, team info, and score.
 * Click opens replay in modal or new tab.
 * 
 * @module GameReplayCard
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, ExternalLink } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { GameReplay } from '@/hooks/useGameReplays';
import { TournamentLiveStreamEmbed } from '@/components/live-streaming/TournamentLiveStreamEmbed';

interface GameReplayCardProps {
  replay: GameReplay;
  /** When provided with team ids in replay, team names become clickable links */
  tournamentId?: string;
  /** ✅ YouTube-like: controlled by parent - only one video plays at a time */
  isPlaying?: boolean;
  onPlay?: (id: string) => void;
  onClose?: () => void;
}

function TeamName({ name, id, tournamentId }: { name: string; id?: string; tournamentId?: string }) {
  if (tournamentId && id) {
    return <Link href={`/t/${tournamentId}/team/${id}`} className="hover:text-[#FF3B30] transition-colors" onClick={(e) => e.stopPropagation()}>{name}</Link>;
  }
  return <span>{name}</span>;
}

export function GameReplayCard({ replay, tournamentId, isPlaying, onPlay, onClose }: GameReplayCardProps) {
  // ✅ Fallback to local state for standalone usage (backward compatible)
  const [localShowPlayer, setLocalShowPlayer] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  
  // ✅ Use controlled props if provided, otherwise fall back to local state
  const showPlayer = isPlaying !== undefined ? isPlaying : localShowPlayer;
  const handlePlay = () => {
    if (onPlay) {
      onPlay(replay.id);
    } else {
      setLocalShowPlayer(true);
    }
  };
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setLocalShowPlayer(false);
    }
  };

  const thumbnailUrl = `https://img.youtube.com/vi/${replay.streamVideoId}/mqdefault.jpg`;
  const youtubeUrl = `https://www.youtube.com/watch?v=${replay.streamVideoId}`;

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  if (showPlayer) {
    return (
      <div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
        <TournamentLiveStreamEmbed
          streamUrl={youtubeUrl}
          platform="youtube"
          className="w-full"
          isLive={false}
        />
        <div className="px-3 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-white">
            <TeamName name={replay.teamAName} id={replay.teamAId} tournamentId={tournamentId} />
            <span className="font-bold">{replay.homeScore}</span>
            <span className="text-white/50">-</span>
            <span className="font-bold">{replay.awayScore}</span>
            <TeamName name={replay.teamBName} id={replay.teamBId} tournamentId={tournamentId} />
          </div>
          <button
            onClick={handleClose}
            className="text-[10px] text-white/50 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group cursor-pointer space-y-2 rounded-2xl border border-white/10 bg-black/30 p-3 transition hover:border-[#FF3B30]/30 hover:bg-black/50"
      onClick={handlePlay}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-white/5">
        {!thumbnailError ? (
          <Image
            src={thumbnailUrl}
            alt={`${replay.teamAName} vs ${replay.teamBName} replay`}
            fill
            className="object-cover"
            onError={() => setThumbnailError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#FF3B30]/20 to-black/50">
            <Play className="h-8 w-8 text-white/40" />
          </div>
        )}
        
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#FF3B30] shadow-lg">
            <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
          </div>
        </div>

        {/* Score overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
            <Avatar className="h-4 w-4 border border-white/20">
              {replay.teamALogo && <AvatarImage src={replay.teamALogo} />}
              <AvatarFallback className="bg-white/10 text-[8px]">
                {replay.teamAName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[10px] font-bold text-white">{replay.homeScore}</span>
            <span className="text-[10px] text-white/50">-</span>
            <span className="text-[10px] font-bold text-white">{replay.awayScore}</span>
            <Avatar className="h-4 w-4 border border-white/20">
              {replay.teamBLogo && <AvatarImage src={replay.teamBLogo} />}
              <AvatarFallback className="bg-white/10 text-[8px]">
                {replay.teamBName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          {replay.gameDate && (
            <span className="text-[10px] text-white/70 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
              {formatDate(replay.gameDate)}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-white font-medium truncate">
          <TeamName name={replay.teamAName} id={replay.teamAId} tournamentId={tournamentId} /> vs <TeamName name={replay.teamBName} id={replay.teamBId} tournamentId={tournamentId} />
        </span>
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-white/50 hover:text-[#FF3B30] transition"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
