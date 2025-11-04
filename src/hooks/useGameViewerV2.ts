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
  team_a_fouls?: number;
  team_b_fouls?: number;
  team_a_timeouts_remaining?: number;
  team_b_timeouts_remaining?: number;
}

interface GameStats {
  id: string;
  game_id: string;
  player_id: string;
  custom_player_id?: string; // ✅ FIX: Support custom players
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
 * Transform raw stats AND substitutions into play-by-play entries with running score calculation
 */
function transformStatsToPlays(
  stats: GameStats[], 
  teamAId: string, 
  teamBId: string,
  teamAName: string,
  teamBName: string,
  substitutions: any[] = [],
  timeouts: any[] = []
): PlayByPlayEntry[] {
  let runningScoreHome = 0;
  let runningScoreAway = 0;
  
  // Convert stats to play entries
  const statPlays = stats.map(stat => {
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
      playerId: stat.player_id || stat.custom_player_id || '', // ✅ FIX: Support custom players
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

  // Convert substitutions to play entries
  const substitutionPlays = substitutions.map(sub => {
    const teamName = sub.team_id === teamAId ? teamAName : 
                     sub.team_id === teamBId ? teamBName : 
                     'Unknown Team';
    
    const description = `SUB: ${sub.player_in_name} in for ${sub.player_out_name}`;
    
    return {
      id: sub.id,
      timestamp: sub.created_at,
      quarter: sub.quarter || 1,
      gameTimeMinutes: sub.game_time_minutes || 0,
      gameTimeSeconds: sub.game_time_seconds || 0,
      description,
      statType: 'substitution',
      playerId: sub.player_in_id,
      playerName: sub.player_in_name,
      teamId: sub.team_id || '',
      teamName,
      modifier: null,
      points: 0,
      scoreAfter: {
        home: runningScoreHome,
        away: runningScoreAway
      }
    };
  });

  // Convert timeouts to play entries
  const timeoutPlays = timeouts.map(timeout => {
    const teamName = timeout.team_id === teamAId ? teamAName : 
                     timeout.team_id === teamBId ? teamBName : 
                     'Unknown Team';
    
    const timeoutTypeDisplay = timeout.timeout_type === 'full' ? 'Full Timeout' : '30-Second Timeout';
    const description = `${teamName} ${timeoutTypeDisplay}`;
    
    return {
      id: timeout.id,
      timestamp: timeout.created_at,
      quarter: timeout.quarter || 1,
      gameTimeMinutes: timeout.game_clock_minutes || 0,
      gameTimeSeconds: timeout.game_clock_seconds || 0,
      description,
      statType: 'timeout',
      playerId: '', // No player for timeout
      playerName: '',
      teamId: timeout.team_id || '',
      teamName,
      modifier: timeout.timeout_type, // Store timeout type in modifier
      points: 0,
      scoreAfter: {
        home: runningScoreHome,
        away: runningScoreAway
      }
    };
  });

  // Merge stats, substitutions, AND timeouts, sort by timestamp (newest first)
  const allPlays = [...statPlays, ...substitutionPlays, ...timeoutPlays].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return allPlays;
}

export function useGameViewerV2(gameId: string): GameViewerData {
  const [game, setGame] = useState<GameData | null>(null);
  const [stats, setStats] = useState<GameStats[]>([]);
  const [plays, setPlays] = useState<PlayByPlayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchGameData = useCallback(async (isUpdate: boolean = false) => {
    if (!gameId) return;

    try {
      // Only show loading spinner on initial load, not on updates
      if (!isUpdate) {
        setLoading(true);
      }
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

      // ⚡ PERFORMANCE: Start timing
      const perfStart = performance.now();

      // ⚡ PHASE 1: Fetch game data (needed for IDs)
      const phase1Start = performance.now();
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
      const phase1Time = performance.now() - phase1Start;
      console.log(`⚡ Phase 1 (game): ${phase1Time.toFixed(0)}ms`);

      // ⚡ PHASE 2: Parallel fetch all related data
      const phase2Start = performance.now();
      const teamIds = [gameInfo.team_a_id, gameInfo.team_b_id].filter(Boolean);
      
      const [
        teamsResponse,
        tournamentResponse,
        statsResponse,
        subsResponse,
        timeoutsResponse
      ] = await Promise.all([
        // Teams
        teamIds.length > 0 
          ? fetch(`${supabaseUrl}/rest/v1/teams?select=id,name&id=in.(${teamIds.join(',')})`, { headers })
          : Promise.resolve(null),
        // Tournament
        gameInfo.tournament_id
          ? fetch(`${supabaseUrl}/rest/v1/tournaments?select=name&id=eq.${gameInfo.tournament_id}`, { headers })
          : Promise.resolve(null),
        // Stats (include custom_player_id for custom players)
        fetch(`${supabaseUrl}/rest/v1/game_stats?select=id,game_id,player_id,custom_player_id,team_id,stat_type,stat_value,modifier,quarter,game_time_minutes,game_time_seconds,created_at&game_id=eq.${gameId}&order=created_at.desc`, { headers }),
        // Substitutions
        fetch(`${supabaseUrl}/rest/v1/game_substitutions?select=*&game_id=eq.${gameId}&order=created_at.asc`, { headers }),
        // Timeouts
        fetch(`${supabaseUrl}/rest/v1/game_timeouts?select=*&game_id=eq.${gameId}&order=created_at.desc`, { headers })
      ]);

      const phase2Time = performance.now() - phase2Start;
      console.log(`⚡ Phase 2 (parallel 5 queries): ${phase2Time.toFixed(0)}ms`);

      // Parse teams
      let teamsMap = new Map<string, string>();
      if (teamsResponse && teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        teamsMap = new Map(teamsData.map((t: any) => [t.id, t.name]));
      }

      // Parse tournament
      let tournamentName = 'Unknown Tournament';
      if (tournamentResponse && tournamentResponse.ok) {
        const tournamentData = await tournamentResponse.json();
        if (tournamentData.length > 0) {
          tournamentName = tournamentData[0].name;
        }
      }

      // Parse stats
      let gameStats: GameStats[] = [];
      if (statsResponse.ok) {
        gameStats = await statsResponse.json();
        console.log('🏀 useGameViewerV2: Fetched', gameStats.length, 'game_stats rows');
      } else {
        console.error('❌ useGameViewerV2: Failed to fetch game_stats:', statsResponse.status);
      }

      // Parse substitutions
      let gameSubstitutions: any[] = [];
      if (subsResponse.ok) {
        gameSubstitutions = await subsResponse.json();
        console.log('🔄 useGameViewerV2: Fetched', gameSubstitutions.length, 'substitutions');
      } else {
        console.error('❌ useGameViewerV2: Failed to fetch substitutions:', subsResponse.status);
      }

      // Parse timeouts
      let gameTimeouts: any[] = [];
      if (timeoutsResponse.ok) {
        gameTimeouts = await timeoutsResponse.json();
        console.log('⏰ useGameViewerV2: Fetched', gameTimeouts.length, 'timeouts');
      } else {
        console.error('❌ useGameViewerV2: Failed to fetch timeouts:', timeoutsResponse.status);
      }

      // ⚡ PHASE 3: Fetch ALL player names in parallel (for stats + subs, including custom players)
      const phase3Start = performance.now();
      const statsPlayerIds = [...new Set(gameStats.map(s => s.player_id).filter(Boolean))];
      const statsCustomPlayerIds = [...new Set((gameStats as any).map((s: any) => s.custom_player_id).filter(Boolean))];
      const subPlayerIds = [...new Set([
        ...gameSubstitutions.map(s => s.player_in_id).filter(Boolean),
        ...gameSubstitutions.map(s => s.player_out_id).filter(Boolean)
      ])];
      const allPlayerIds = [...new Set([...statsPlayerIds, ...subPlayerIds])];

      // ✅ FIX: Query both users AND custom_players tables in parallel
      const [regularPlayersResponse, customPlayersResponse] = await Promise.all([
        // Regular players from users table
        allPlayerIds.length > 0 
          ? fetch(`${supabaseUrl}/rest/v1/users?select=id,name,email&id=in.(${allPlayerIds.join(',')})`, { headers })
          : Promise.resolve(null),
        // Custom players from custom_players table
        statsCustomPlayerIds.length > 0
          ? fetch(`${supabaseUrl}/rest/v1/custom_players?select=id,name&id=in.(${statsCustomPlayerIds.join(',')})`, { headers })
          : Promise.resolve(null)
      ]);

      // Build combined players map
      let playersMap = new Map<string, string>();
      
      // Add regular players
      if (regularPlayersResponse && regularPlayersResponse.ok) {
        const playersData = await regularPlayersResponse.json();
        playersData.forEach((p: any) => {
          playersMap.set(p.id, p.name || p.email?.split('@')[0] || `Player ${p.id.substring(0, 8)}`);
        });
      }

      // Add custom players
      if (customPlayersResponse && customPlayersResponse.ok) {
        const customPlayersData = await customPlayersResponse.json();
        customPlayersData.forEach((p: any) => {
          playersMap.set(p.id, p.name || `Custom Player ${p.id.substring(0, 8)}`);
        });
      }

      const phase3Time = performance.now() - phase3Start;
      console.log(`⚡ Phase 3 (players): ${phase3Time.toFixed(0)}ms`);

      // Enrich stats with player names (check both player_id and custom_player_id)
      gameStats = gameStats.map(stat => {
        const statWithCustomId = stat as any;
        const playerId = stat.player_id || statWithCustomId.custom_player_id;
        const playerName = playersMap.get(playerId) || `Player ${playerId?.substring(0, 8)}`;
        return {
          ...stat,
          custom_player_id: statWithCustomId.custom_player_id, // ✅ FIX: Explicitly preserve custom_player_id
          player_name: playerName
        };
      });

      // Enrich substitutions with player names
      gameSubstitutions = gameSubstitutions.map(sub => ({
        ...sub,
        player_in_name: playersMap.get(sub.player_in_id) || `Player ${sub.player_in_id?.substring(0, 8)}`,
        player_out_name: playersMap.get(sub.player_out_id) || `Player ${sub.player_out_id?.substring(0, 8)}`
      }));

      // 7. Enrich game data
      const teamAName = teamsMap.get(gameInfo.team_a_id) || 'Team A';
      const teamBName = teamsMap.get(gameInfo.team_b_id) || 'Team B';
      
      const enrichedGame: GameData = {
        ...gameInfo,
        team_a_name: teamAName,
        team_b_name: teamBName,
        tournament_name: tournamentName
      };

      // 8. Transform stats, substitutions, AND timeouts into play-by-play entries
      const playByPlayEntries = transformStatsToPlays(
        gameStats,
        gameInfo.team_a_id,
        gameInfo.team_b_id,
        teamAName,
        teamBName,
        gameSubstitutions,
        gameTimeouts
      );

      const totalTime = performance.now() - perfStart;
      console.log(`⚡ TOTAL FETCH TIME: ${totalTime.toFixed(0)}ms (Phase1: ${phase1Time.toFixed(0)}ms | Phase2: ${phase2Time.toFixed(0)}ms | Phase3: ${phase3Time.toFixed(0)}ms)`);
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
      // Only set loading to false on initial load
      if (!isUpdate) {
        setLoading(false);
      }
      // Mark that initial load is complete
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    }
  }, [gameId, isInitialLoad]);

  useEffect(() => {
    void fetchGameData(false); // Initial load
  }, [fetchGameData]);

  // 🏀 USE EXISTING HYBRID SYSTEM: WebSocket subscriptions via gameSubscriptionManager
  useEffect(() => {
    if (!gameId) return;

    console.log('🔌 useGameViewerV2: Setting up hybrid subscriptions for game:', gameId);
    
    // Use the existing hybrid subscription system
    const unsubscribe = gameSubscriptionManager.subscribe(gameId, (table: string, payload: any) => {
      console.log('🔔 useGameViewerV2: Real-time update received:', table, payload);
      // Silent update - no loading spinner
      void fetchGameData(true);
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
