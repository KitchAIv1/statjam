'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { supabase } from '@/lib/supabase';
import { ClipPurchaseCard } from '@/components/clips/ClipPurchaseCard';
import { ClipPlayer } from '@/components/clips/ClipPlayer';
import {
  Loader2,
  Film,
  ArrowLeft,
  ShoppingBag,
  Clock,
} from 'lucide-react';

interface GameWithClips {
  id: string;
  game_id: string;
  gameTitle: string;
  playerName: string;
  clipCount: number;
  previewClipUrl: string | null;
  isPurchased: boolean;
  gameDate: string;
}

/**
 * Player Clips Page
 * Shows available clip packages for purchase
 * NOTE: Payment integration is non-functional in Phase 1
 */
export default function PlayerClipsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthV2();

  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<GameWithClips[]>([]);
  const [previewClip, setPreviewClip] = useState<string | null>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);

  // Load available games with clips
  useEffect(() => {
    async function loadGames() {
      if (!user) return;

      try {
        setLoading(true);

        // Get games where the player has stats
        const { data: playerStats } = await supabase
          .from('game_stats')
          .select('game_id')
          .eq('player_id', user.id)
          .not('video_timestamp_ms', 'is', null);

        if (!playerStats || playerStats.length === 0) {
          setGames([]);
          return;
        }

        // Get unique game IDs
        const gameIds = [...new Set(playerStats.map(s => s.game_id))];

        // Get clip counts for each game
        const gamesWithClips: GameWithClips[] = [];

        for (const gameId of gameIds) {
          // Get game details
          const { data: game } = await supabase
            .from('games')
            .select('id, team_a_id, team_b_id, created_at')
            .eq('id', gameId)
            .single();

          if (!game) continue;

          // Get team names
          const { data: teamA } = await supabase
            .from('teams')
            .select('name')
            .eq('id', game.team_a_id)
            .single();

          const { data: teamB } = await supabase
            .from('teams')
            .select('name')
            .eq('id', game.team_b_id)
            .single();

          // Get clip count for this player in this game
          const { count } = await supabase
            .from('generated_clips')
            .select('*', { count: 'exact', head: true })
            .eq('game_id', gameId)
            .eq('player_id', user.id)
            .eq('status', 'ready');

          if (!count || count === 0) continue;

          // Check if purchased
          const { data: purchase } = await supabase
            .from('clip_purchases')
            .select('id')
            .eq('user_id', user.id)
            .eq('game_id', gameId)
            .eq('player_id', user.id)
            .eq('status', 'completed')
            .single();

          // Get a preview clip
          const { data: previewData } = await supabase
            .from('generated_clips')
            .select('bunny_clip_url')
            .eq('game_id', gameId)
            .eq('player_id', user.id)
            .eq('status', 'ready')
            .limit(1)
            .single();

          gamesWithClips.push({
            id: `${gameId}-${user.id}`,
            game_id: gameId,
            gameTitle: `${teamA?.name || 'Team A'} vs ${teamB?.name || 'Team B'}`,
            playerName: user.name || 'You',
            clipCount: count,
            previewClipUrl: previewData?.bunny_clip_url || null,
            isPurchased: !!purchase,
            gameDate: game.created_at,
          });
        }

        setGames(gamesWithClips);
      } catch (error) {
        console.error('Error loading games:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadGames();
    }
  }, [user, authLoading]);

  // Handle purchase (Phase 1: Show coming soon)
  const handlePurchase = () => {
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 3000);
  };

  // Handle preview
  const handlePreview = (clipUrl: string | null) => {
    if (clipUrl) {
      setPreviewClip(clipUrl);
    }
  };

  // Handle view all (for purchased)
  const handleViewAll = (gameId: string) => {
    router.push(`/dashboard/player/game/${gameId}/clips`);
  };

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
          <p className="text-gray-500 mb-4">Please log in to view your clips.</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30">
      {/* Header */}
      <header className="bg-white border-b border-orange-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Film className="w-6 h-6 text-orange-500" />
                My Highlights
              </h1>
              <p className="text-sm text-gray-500">Purchase and view your game highlights</p>
            </div>
          </div>

          {/* Purchased Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
            <ShoppingBag className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {games.filter(g => g.isPurchased).length} purchased
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Coming Soon Toast */}
        {showComingSoon && (
          <div className="fixed top-4 right-4 bg-orange-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-slide-in">
            <Clock className="w-5 h-5" />
            <span>Purchases coming soon! Feature in development.</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Highlights Available</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Your game highlights will appear here once video tracking is complete for your games.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <ClipPurchaseCard
                key={game.id}
                gameTitle={game.gameTitle}
                playerName={game.playerName}
                clipCount={game.clipCount}
                isPurchased={game.isPurchased}
                onPurchase={handlePurchase}
                onPreview={() => {
                  if (game.isPurchased) {
                    handleViewAll(game.game_id);
                  } else {
                    handlePreview(game.previewClipUrl);
                  }
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Preview Modal */}
      {previewClip && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full">
            <div className="mb-4 text-center">
              <span className="inline-block px-3 py-1 bg-orange-500 text-white text-sm rounded-full">
                Preview Only
              </span>
            </div>
            <ClipPlayer
              clipUrl={previewClip}
              title="Preview Clip"
              onClose={() => setPreviewClip(null)}
              autoPlay
            />
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setPreviewClip(null);
                  handlePurchase();
                }}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Purchase Full Package - $5.00
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

