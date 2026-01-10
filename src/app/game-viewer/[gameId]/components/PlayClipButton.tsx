/**
 * PlayClipButton - Video clip icon for play-by-play entries
 * 
 * PURPOSE: Show clip icon and open modal when play has associated clip
 * Follows .cursorrules: <100 lines, single responsibility
 */

'use client';

import React, { useState } from 'react';
import { Film } from 'lucide-react';
import { GeneratedClip } from '@/lib/services/clipService';
import { ClipPlayer } from '@/components/clips/ClipPlayer';

interface PlayClipButtonProps {
  clip: GeneratedClip;
  playerName?: string;
  isDark?: boolean;
}

/**
 * Renders a clip icon that opens a modal with the video player
 */
export function PlayClipButton({ clip, playerName, isDark = true }: PlayClipButtonProps) {
  const [showModal, setShowModal] = useState(false);

  if (!clip.bunny_clip_url) return null;

  // Format title for the clip player
  const formatTitle = (): string => {
    const statLabel = clip.stat_type.replace(/_/g, ' ').toUpperCase();
    const quarter = `Q${clip.quarter}`;
    const clock = `${clip.game_clock_minutes}:${clip.game_clock_seconds.toString().padStart(2, '0')}`;
    
    if (playerName) {
      return `${playerName} - ${statLabel} (${quarter} ${clock})`;
    }
    return `${statLabel} (${quarter} ${clock})`;
  };

  return (
    <>
      {/* Clip Icon Button */}
      <button
        onClick={() => setShowModal(true)}
        className={`
          p-1.5 rounded-full transition-all duration-200
          ${isDark 
            ? 'bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 hover:text-orange-300' 
            : 'bg-orange-100 hover:bg-orange-200 text-orange-600 hover:text-orange-700'
          }
        `}
        title="Watch clip"
      >
        <Film className="w-4 h-4" />
      </button>

      {/* Clip Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="max-w-4xl w-full">
            <ClipPlayer
              clipUrl={clip.bunny_clip_url}
              title={formatTitle()}
              onClose={() => setShowModal(false)}
              autoPlay
            />
          </div>
        </div>
      )}
    </>
  );
}

