/**
 * PublicClipsTab - Clips Tab for Public/Shareable Game Viewer
 * 
 * PURPOSE: Display generated video clips with player filtering.
 * Reuses same data fetching pattern as dashboard ClipsTab.
 * 
 * Follows .cursorrules: <100 lines, single responsibility
 * @module PublicClipsTab
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Film, Loader2 } from 'lucide-react';
import { ClipGrid } from '@/components/clips/ClipGrid';
import { getGameClips, GeneratedClip } from '@/lib/services/clipService';
import { supabase } from '@/lib/supabase';

interface Player {
  id: string;
  name: string;
  jersey_number?: number;
}

interface PublicClipsTabProps {
  gameId: string;
  teamId: string;
  isDark?: boolean;
}

/**
 * Fetch players for a team (supports both coach teams and tournament teams)
 */
async function fetchTeamPlayers(teamId: string): Promise<Player[]> {
  if (!teamId) return [];

  // Try coach team players first (custom_players via team_players junction)
  const { data: teamPlayers } = await supabase
    .from('team_players')
    .select('custom_player_id')
    .eq('team_id', teamId);

  if (teamPlayers && teamPlayers.length > 0) {
    const playerIds = teamPlayers.map(tp => tp.custom_player_id).filter(Boolean);
    const { data: customPlayers } = await supabase
      .from('custom_players')
      .select('id, name, jersey_number')
      .in('id', playerIds);

    if (customPlayers) {
      return customPlayers.map(p => ({
        id: p.id,
        name: p.name,
        jersey_number: p.jersey_number,
      }));
    }
  }

  // Fallback: try tournament team roster
  const { data: roster } = await supabase
    .from('team_roster')
    .select('player_id, users:player_id(id, name)')
    .eq('team_id', teamId);

  if (roster) {
    return roster
      .filter(r => r.users)
      .map(r => ({
        id: (r.users as any).id,
        name: (r.users as any).name || 'Unknown',
      }));
  }

  return [];
}

export function PublicClipsTab({ gameId, teamId, isDark = false }: PublicClipsTabProps) {
  const [clips, setClips] = useState<GeneratedClip[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [gameClips, teamPlayers] = await Promise.all([
          getGameClips(gameId),
          fetchTeamPlayers(teamId),
        ]);
        setClips(gameClips);
        setPlayers(teamPlayers);
      } catch (error) {
        console.error('Error loading clips:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [gameId, teamId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] p-6 text-center">
        <div className={`w-16 h-16 mb-4 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-orange-100'}`}>
          <Film className={`w-8 h-8 ${isDark ? 'text-orange-400' : 'text-orange-500'}`} />
        </div>
        <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          No Clips Available
        </h3>
        <p className={`text-sm max-w-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Video highlights for this game haven't been generated yet. Check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <ClipGrid clips={clips} players={players} />
    </div>
  );
}

