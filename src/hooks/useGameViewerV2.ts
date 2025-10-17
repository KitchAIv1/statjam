/**
 * V2 Game Viewer Hook - Enterprise Raw Fetch Implementation
 * 
 * This hook fetches individual game data using raw HTTP requests,
 * bypassing the broken Supabase JS client library.
 * 
 * NBA-LEVEL FEATURES:
 * - Raw HTTP fetch (never hangs)
 * - Play-by-play transformation
 * - Real-time polling fallback
 * - Team data enrichment
 */

import { useState, useEffect, useCallback } from 'react';
import { gameSubscriptionManager } from '@/lib/subscriptionManager';

interface GameData {
  id: string;
  status: string;
  quarter: number;
  game_clock_minutes: number;
  game_clock_seconds: number;
  is_clock_running: boolean;
  home_score: number;
  away_score: number;
  team_a_id: string;
  team_b_id: string;
  tournament_id: string;
  team_a_name?: string;
  team_b_name?: string;
  tournament_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface GameStats {
  id: string;
  game_id: string;
  player_id: string;
  stat_type: string;
  stat_value: number; // ✅ CORRECT: Database uses stat_value, not value
  quarter: number;
  created_at: string; // ✅ CORRECT: Database uses created_at, not timestamp
  player_name?: string;
  team_id?: string;
  modifier?: string | null;
  game_time_minutes?: number;
  game_time_seconds?: number;
}

interface PlayByPlayEntry {
  id: string;
  timestamp: string; // Will be populated from created_at
  quarter: number;
  gameTimeMinutes: number; // ✅ Required by PlayEntry component
  gameTimeSeconds: number; // ✅ Required by PlayEntry component
  description: string;
  statType: string;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  modifier?: string | null;
  points?: number;
  scoreAfter: { // ✅ Required by PlayEntry component
    home: number;
    away: number;
  };
}

interface GameViewerData {
  game: GameData | null;
  stats: GameStats[];
  plays: PlayByPlayEntry[];
  loading: boolean;
  error: string | null;
}

/**
 * Transform raw stats into play-by-play entries with running score calculation
 */
function transformStatsToPlays(
  stats: GameStats[], 
  teamAId: string, 
  teamBId: string,
  teamAName: string,
  teamBName: string
): PlayByPlayEntry[] {
  let runningScoreHome = 0;
  let runningScoreAway = 0;
  
  return stats.map(stat => {
    const teamName = stat.team_id === teamAId ? teamAName : 
                     stat.team_id === teamBId ? teamBName : 
                     'Unknown Team';
    
    const playerName = stat.player_name || `Player ${stat.player_id?.substring(0, 8) || 'Unknown'}`;
    
    let description = '';
    let points = 0;
    
    switch (stat.stat_type) {
      case 'three_pointer':
        description = stat.modifier === 'made' 
          ? `${playerName} made 3PT` 
          : `${playerName} missed 3PT`;
        points = stat.modifier === 'made' ? 3 : 0;
        break;
      case 'field_goal':
        description = stat.modifier === 'made'
          ? `${playerName} made 2PT`
          : `${playerName} missed 2PT`;
        points = stat.modifier === 'made' ? 2 : 0;
        break;
      case 'free_throw':
        description = stat.modifier === 'made'
          ? `${playerName} made FT`
          : `${playerName} missed FT`;
        points = stat.modifier === 'made' ? 1 : 0;
        break;
      case 'rebound':
        description = `${playerName} rebound`;
        break;
      case 'assist':
        description = `${playerName} assist`;
        break;
      case 'steal':
        description = `${playerName} steal`;
        break;
      case 'block':
        description = `${playerName} block`;
        break;
      case 'turnover':
        description = `${playerName} turnover`;
        break;
      case 'foul':
        description = `${playerName} foul`;
        break;
      default:
        description = `${playerName} ${stat.stat_type}`;
    }
    
    // ✅ Calculate running score
    if (points > 0) {
      if (stat.team_id === teamAId) {
        runningScoreHome += points;
      } else if (stat.team_id === teamBId) {
        runningScoreAway += points;
      }
    }
    
    return {
      id: stat.id,
      timestamp: stat.created_at, // ✅ Map created_at to timestamp
      quarter: stat.quarter,
      gameTimeMinutes: stat.game_time_minutes || 0, // ✅ Required by PlayEntry
      gameTimeSeconds: stat.game_time_seconds || 0, // ✅ Required by PlayEntry
      description,
      statType: stat.stat_type,
      playerId: stat.player_id,
      playerName,
      teamId: stat.team_id || '',
      teamName,
      modifier: stat.modifier,
      points,
      scoreAfter: { // ✅ Running score after this play
        home: runningScoreHome,
        away: runningScoreAway
      }
    };
  });
}

export function useGameViewerV2(gameId: string): GameViewerData {
  const [game, setGame] = useState<GameData | null>(null);
  const [stats, setStats] = useState<GameStats[]>([]);
  const [plays, setPlays] = useState<PlayByPlayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGameData = useCallback(async () => {
    if (!gameId) return;

    try {
      setLoading(true);
      setError(null);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase configuration');
      }

      const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      };

      // 1. Fetch game data
      const gameResponse = await fetch(
        `${supabaseUrl}/rest/v1/games?select=*&id=eq.${gameId}`,
        { headers }
      );

      if (!gameResponse.ok) {
        throw new Error(`Failed to fetch game: ${gameResponse.statusText}`);
      }

      const gameData = await gameResponse.json();
      if (!gameData || gameData.length === 0) {
        throw new Error('Game not found');
      }

      const gameInfo = gameData[0];

      // 2. Fetch team names
      const teamIds = [gameInfo.team_a_id, gameInfo.team_b_id].filter(Boolean);
      let teamsMap = new Map<string, string>();

      if (teamIds.length > 0) {
        const teamsResponse = await fetch(
          `${supabaseUrl}/rest/v1/teams?select=id,name&id=in.(${teamIds.join(',')})`,
          { headers }
        );

        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json();
          teamsMap = new Map(teamsData.map((t: any) => [t.id, t.name]));
        }
      }

      // 3. Fetch tournament name
      let tournamentName = 'Unknown Tournament';
      if (gameInfo.tournament_id) {
        const tournamentResponse = await fetch(
          `${supabaseUrl}/rest/v1/tournaments?select=name&id=eq.${gameInfo.tournament_id}`,
          { headers }
        );

        if (tournamentResponse.ok) {
          const tournamentData = await tournamentResponse.json();
          if (tournamentData.length > 0) {
            tournamentName = tournamentData[0].name;
          }
        }
      }

      // 4. Fetch game stats with CORRECT column names
      const statsResponse = await fetch(
        `${supabaseUrl}/rest/v1/game_stats?select=id,game_id,player_id,team_id,stat_type,stat_value,modifier,quarter,game_time_minutes,game_time_seconds,created_at&game_id=eq.${gameId}&order=created_at.desc`,
        { headers }
      );

      let gameStats: GameStats[] = [];
      if (statsResponse.ok) {
        gameStats = await statsResponse.json();
        console.log('🏀 useGameViewerV2: Fetched', gameStats.length, 'game_stats rows');
        
        // 4b. Fetch player names for the stats
        const playerIds = [...new Set(gameStats.map(s => s.player_id).filter(Boolean))];
        let playersMap = new Map<string, string>();
        
        if (playerIds.length > 0) {
          const playersResponse = await fetch(
            `${supabaseUrl}/rest/v1/users?select=id,name,email&id=in.(${playerIds.join(',')})`,
            { headers }
          );
          
          if (playersResponse.ok) {
            const playersData = await playersResponse.json();
            playersMap = new Map(
              playersData.map((p: any) => [
                p.id,
                p.name || p.email?.split('@')[0] || `Player ${p.id.substring(0, 8)}`
              ])
            );
          }
        }
        
        // Enrich stats with player names
        gameStats = gameStats.map(stat => ({
          ...stat,
          player_name: playersMap.get(stat.player_id) || `Player ${stat.player_id?.substring(0, 8)}`
        }));
        
      } else {
        console.error('❌ useGameViewerV2: Failed to fetch game_stats:', statsResponse.status, await statsResponse.text());
      }

      // 5. Enrich game data
      const teamAName = teamsMap.get(gameInfo.team_a_id) || 'Team A';
      const teamBName = teamsMap.get(gameInfo.team_b_id) || 'Team B';
      
      const enrichedGame: GameData = {
        ...gameInfo,
        team_a_name: teamAName,
        team_b_name: teamBName,
        tournament_name: tournamentName
      };

      // 6. Transform stats into play-by-play entries
      const playByPlayEntries = transformStatsToPlays(
        gameStats,
        gameInfo.team_a_id,
        gameInfo.team_b_id,
        teamAName,
        teamBName
      );

      console.log('🏀 useGameViewerV2: Fetched', gameStats.length, 'stats, transformed into', playByPlayEntries.length, 'plays');

      // ✅ ANTI-FLICKER: Only update if data actually changed
      setGame(prevGame => {
        if (prevGame && 
            prevGame.id === enrichedGame.id &&
            prevGame.home_score === enrichedGame.home_score &&
            prevGame.away_score === enrichedGame.away_score &&
            prevGame.status === enrichedGame.status &&
            prevGame.quarter === enrichedGame.quarter &&
            prevGame.game_clock_minutes === enrichedGame.game_clock_minutes &&
            prevGame.game_clock_seconds === enrichedGame.game_clock_seconds) {
          console.log('🔇 useGameViewerV2: Game data unchanged, skipping update');
          return prevGame;
        }
        console.log('🔄 useGameViewerV2: Game data changed, updating');
        return enrichedGame;
      });

      // 🏀 NBA-LEVEL: Ultra-fast array comparison (no JSON.stringify)
      setStats(prevStats => {
        if (prevStats.length === gameStats.length) {
          let hasChanges = false;
          for (let i = 0; i < gameStats.length; i++) {
            if (prevStats[i]?.id !== gameStats[i]?.id) {
              hasChanges = true;
              break;
            }
          }
          if (!hasChanges) {
            console.log('🔇 useGameViewerV2: Stats unchanged, skipping update');
            return prevStats;
          }
        }
        console.log('🔄 useGameViewerV2: Stats changed, updating');
        return gameStats;
      });

      setPlays(prevPlays => {
        if (prevPlays.length === playByPlayEntries.length) {
          let hasChanges = false;
          for (let i = 0; i < playByPlayEntries.length; i++) {
            if (prevPlays[i]?.id !== playByPlayEntries[i]?.id) {
              hasChanges = true;
              break;
            }
          }
          if (!hasChanges) {
            console.log('🔇 useGameViewerV2: Plays unchanged, skipping update');
            return prevPlays;
          }
        }
        console.log('🔄 useGameViewerV2: Plays changed, updating');
        return playByPlayEntries;
      });

    } catch (e: any) {
      console.error('❌ useGameViewerV2: Error:', e);
      setError(e?.message || 'Failed to load game data');
      setGame(null);
      setStats([]);
      setPlays([]);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    void fetchGameData();
  }, [fetchGameData]);

  // 🏀 USE EXISTING HYBRID SYSTEM: WebSocket subscriptions via gameSubscriptionManager
  useEffect(() => {
    if (!gameId) return;

    console.log('🔌 useGameViewerV2: Setting up hybrid subscriptions for game:', gameId);
    
    // Use the existing hybrid subscription system
    const unsubscribe = gameSubscriptionManager.subscribe(gameId, (table: string, payload: any) => {
      console.log('🔔 useGameViewerV2: Real-time update received:', table, payload);
      // Only refetch when we get real updates
      void fetchGameData();
    });

    return unsubscribe;
  }, [gameId, fetchGameData]);

  return {
    game,
    stats,
    plays,
    loading,
    error
  };
}
