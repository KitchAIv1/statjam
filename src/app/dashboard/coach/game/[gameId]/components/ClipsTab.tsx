/**
 * ClipsTab - Game Highlights Tab for Coach Game Viewer
 * 
 * PURPOSE: Display generated video clips for a game.
 * PURE COMPONENT - receives all data via props, no internal fetching.
 * Parent component (page.tsx) handles data fetching via useClips hook.
 * 
 * @module ClipsTab
 */

'use client';

import React from 'react';
import { Film, Loader2, Sparkles } from 'lucide-react';
import { ClipGrid } from '@/components/clips/ClipGrid';
import { GeneratedClip } from '@/lib/services/clipService';

interface Player {
  id: string;
  name: string;
  jersey_number?: number;
}

interface ClipsTabProps {
  clips: GeneratedClip[];
  players: Player[];
  loading: boolean;
}

/**
 * ClipsTab Component (Pure)
 * Displays game clips with player filtering
 * All data passed via props - no internal state or fetching
 */
export function ClipsTab({ clips, players, loading }: ClipsTabProps) {
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  // No clips - show upsell
  if (clips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shadow-lg">
          <Film className="w-10 h-10 text-purple-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Game Highlights Coming Soon
        </h3>
        <p className="text-gray-600 mb-4 max-w-sm">
          Video clips are generated automatically after video tracking is complete. 
          Each play becomes a shareable highlight!
        </p>
        <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-4 py-2 rounded-full">
          <Sparkles className="w-4 h-4" />
          <span>AI-powered clip generation</span>
        </div>
      </div>
    );
  }

  // Clips available - show grid
  return (
    <div className="p-4">
      <ClipGrid clips={clips} players={players} />
    </div>
  );
}
