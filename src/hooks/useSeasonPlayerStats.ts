// ============================================================================
// USE SEASON PLAYER STATS HOOK - Aggregate player stats across season games
// Follows .cursorrules: Single responsibility, matches Game Viewer stat types
// ============================================================================

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PlayerSeasonStats } from '@/components/standings/PlayerStatsTable';

export function useSeasonPlayerStats(seasonId: string | null) {
  const [players, setPlayers] = useState<PlayerSeasonStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!seasonId) return;
    
    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get game IDs in this season
        const { data: seasonGames, error: gamesErr } = await supabase
          .from('season_games').select('game_id').eq('season_id', seasonId);
        if (gamesErr) throw gamesErr;
        if (!seasonGames?.length) { setPlayers([]); return; }

        const gameIds = seasonGames.map(sg => sg.game_id);

        // Fetch stats with modifier (matches Game Viewer query)
        // ✅ FIX: Filter out opponent stats - they should NOT appear in player leaderboard
        const { data: stats, error: statsErr } = await supabase
          .from('game_stats')
          .select('player_id, custom_player_id, stat_type, modifier, game_id')
          .in('game_id', gameIds)
          .eq('is_opponent_stat', false);
        if (statsErr) throw statsErr;

        // ✅ FIX: Separate player_id (users) from custom_player_id (custom_players)
        const regularPlayerIds = [...new Set(stats?.filter(s => s.player_id).map(s => s.player_id))];
        const customPlayerIds = [...new Set(stats?.filter(s => s.custom_player_id).map(s => s.custom_player_id))];

        // ✅ Query BOTH tables in parallel (matches useGameViewerV2 pattern)
        const [usersResult, customPlayersResult] = await Promise.all([
          regularPlayerIds.length > 0
            ? supabase.from('users').select('id, name, profile_photo_url').in('id', regularPlayerIds)
            : Promise.resolve({ data: [] }),
          customPlayerIds.length > 0
            ? supabase.from('custom_players').select('id, name, jersey_number, profile_photo_url').in('id', customPlayerIds)
            : Promise.resolve({ data: [] }),
        ]);

        // ✅ Merge into single lookup map
        const playersLookup = new Map<string, { name: string; jerseyNumber?: number; photoUrl?: string }>();
        
        // Add regular users (claimed players)
        (usersResult.data || []).forEach((u: any) => {
          playersLookup.set(u.id, { name: u.name || 'Unknown', photoUrl: u.profile_photo_url });
        });
        
        // Add custom players
        (customPlayersResult.data || []).forEach((cp: any) => {
          playersLookup.set(cp.id, { name: cp.name || 'Unknown', jerseyNumber: cp.jersey_number, photoUrl: cp.profile_photo_url });
        });

        // Aggregate by player (matches Game Viewer stat type mapping)
        const playerMap = new Map<string, PlayerSeasonStats>();
        const gamesByPlayer = new Map<string, Set<string>>();

        for (const stat of stats || []) {
          const pid = stat.player_id || stat.custom_player_id;
          if (!pid) continue;

          // Track games played
          if (!gamesByPlayer.has(pid)) gamesByPlayer.set(pid, new Set());
          gamesByPlayer.get(pid)!.add(stat.game_id);

          // Initialize player if new (✅ uses merged lookup for both users & custom_players)
          if (!playerMap.has(pid)) {
            const player = playersLookup.get(pid);
            playerMap.set(pid, {
              playerId: pid, playerName: player?.name || 'Unknown',
              jerseyNumber: player?.jerseyNumber, profilePhotoUrl: player?.photoUrl,
              gamesPlayed: 0, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0,
              fgMade: 0, fgAttempts: 0, threePtMade: 0, threePtAttempts: 0, ftMade: 0, ftAttempts: 0,
            });
          }

          const p = playerMap.get(pid)!;
          const made = stat.modifier === 'made';

          // ✅ Match Game Viewer stat types (field_goal, three_pointer, free_throw)
          switch (stat.stat_type) {
            case 'field_goal': case 'two_pointer':
              p.fgAttempts++; if (made) { p.points += 2; p.fgMade++; } break;
            case 'three_pointer': case '3_pointer':
              p.fgAttempts++; p.threePtAttempts++;
              if (made) { p.points += 3; p.fgMade++; p.threePtMade++; } break;
            case 'free_throw':
              p.ftAttempts++; if (made) { p.points++; p.ftMade++; } break;
            case 'rebound': p.rebounds++; break;
            case 'assist': p.assists++; break;
            case 'steal': p.steals++; break;
            case 'block': p.blocks++; break;
            case 'turnover': p.turnovers++; break;
          }
        }

        // Set games played count
        for (const [pid, games] of gamesByPlayer) {
          if (playerMap.has(pid)) playerMap.get(pid)!.gamesPlayed = games.size;
        }

        setPlayers(Array.from(playerMap.values()));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [seasonId]);

  return { players, loading, error };
}
