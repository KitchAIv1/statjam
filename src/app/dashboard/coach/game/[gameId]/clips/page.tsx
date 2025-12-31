'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { GameService } from '@/lib/services/gameService';
import { getGameClips, GeneratedClip } from '@/lib/services/clipService';
import { CoachPlayerService } from '@/lib/services/coachPlayerService';
import { ClipGrid } from '@/components/clips/ClipGrid';
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Film,
} from 'lucide-react';

interface CoachClipsPageProps {
  params: Promise<{ gameId: string }>;
}

interface Player {
  id: string;
  name: string;
  jersey_number?: number;
}

/**
 * Coach Clip Viewer
 * Allows coaches to view all generated clips for their games (FREE access)
 * Player and stat filtering is handled by ClipGrid component
 */
export default function CoachClipsPage({ params }: CoachClipsPageProps) {
  const { gameId } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuthV2();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [game, setGame] = useState<any>(null);
  const [clips, setClips] = useState<GeneratedClip[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  // Load data
  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        setLoading(true);

        // Load game
        const gameData = await GameService.getGame(gameId);
        if (!gameData) {
          setError('Game not found');
          return;
        }
        setGame(gameData);

        // Load clips
        const gameClips = await getGameClips(gameId);
        setClips(gameClips);

        // Load players
        if (gameData.is_coach_game && gameData.team_a_id) {
          const customPlayers = await CoachPlayerService.getCoachTeamPlayers(gameData.team_a_id);
          setPlayers(customPlayers.map(p => ({
            id: p.id,
            name: p.name,
            jersey_number: p.jersey_number,
          })));
        }

      } catch (err) {
        console.error('Error loading clips:', err);
        setError('Failed to load clips');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadData();
    }
  }, [gameId, user, authLoading]);

  // Auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-xl shadow-lg">
          <p className="text-gray-500 mb-4">Please log in to view clips.</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading clips...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-red-200">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30">
      {/* Header */}
      <header className="bg-white border-b border-orange-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Film className="w-6 h-6 text-orange-500" />
                Game Highlights
              </h1>
              <p className="text-sm text-gray-500">
                {game?.team_a_name} vs {game?.team_b_name || game?.opponent_name}
              </p>
            </div>
          </div>

          {/* Clip Count Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-full">
            <Film className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">{clips.length} clips</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Clips Grid - ClipGrid handles player & stat filtering */}
        {clips.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Clips Available</h3>
            <p className="text-gray-500">
              Clips will appear here once video tracking is complete.
            </p>
          </div>
        ) : (
          <ClipGrid clips={clips} players={players} />
        )}
      </main>
    </div>
  );
}
