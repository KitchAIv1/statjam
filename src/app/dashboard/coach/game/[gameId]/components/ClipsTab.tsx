/**
 * ClipsTab - Game Highlights Tab for Coach Game Viewer
 * 
 * PURPOSE: Display generated video clips for a game.
 * Shows ClipGrid with filters, or upsell message if no clips available.
 * 
 * @module ClipsTab
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Film, Loader2, Sparkles } from 'lucide-react';
import { ClipGrid } from '@/components/clips/ClipGrid';
import { getGameClips, GeneratedClip } from '@/lib/services/clipService';
import { CoachPlayerService } from '@/lib/services/coachPlayerService';

interface Player {
  id: string;
  name: string;
  jersey_number?: number;
}

interface ClipsTabProps {
  gameId: string;
  teamId: string;
}

/**
 * ClipsTab Component
 * Displays game clips with player filtering
 */
export function ClipsTab({ gameId, teamId }: ClipsTabProps) {
  const [clips, setClips] = useState<GeneratedClip[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Load clips and players
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [gameClips, teamPlayers] = await Promise.all([
          getGameClips(gameId),
          CoachPlayerService.getCoachTeamPlayers(teamId),
        ]);

        setClips(gameClips);
        setPlayers(
          teamPlayers.map((p) => ({
            id: p.id,
            name: p.name,
            jersey_number: p.jersey_number,
          }))
        );
      } catch (error) {
        console.error('Error loading clips:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [gameId, teamId]);

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
