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

import { useState, useEffect, useCallback, useRef } from 'react';
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
  sequence_id?: string | null; // ✅ NEW: For detecting and-1 situations
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
 * ✅ FIX: Sort chronologically FIRST, then calculate running scores, then reverse for display
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
  // ✅ STEP 1: Sort all raw data chronologically (oldest first) BEFORE score calculation
  const sortedStats = [...stats].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const sortedSubs = [...substitutions].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const sortedTimeouts = [...timeouts].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  let runningScoreHome = 0;
  let runningScoreAway = 0;
  
  // ✅ STEP 2: Convert sorted stats to play entries with correct running score
  // First, build a map of sequence_id to shooting fouls for and-1 detection
  // Track shooting fouls by their sequence_id so we can detect and-1 situations
  const shootingFoulMap = new Map<string, boolean>();
  
  sortedStats.forEach(stat => {
    // ✅ Check for shooting fouls with a sequence_id
    if (stat.stat_type === 'foul' && 
        stat.modifier === 'shooting' && 
        stat.sequence_id && 
        typeof stat.sequence_id === 'string' &&
        stat.sequence_id.trim() !== '') { // Ensure sequence_id is not empty string
      shootingFoulMap.set(stat.sequence_id, true);
    }
  });
  
  const statPlays = sortedStats.map(stat => {
    const teamName = stat.team_id === teamAId ? teamAName : 
                     stat.team_id === teamBId ? teamBName : 
                     'Unknown Team';
    
    const playerName = stat.player_name || `Player ${stat.player_id?.substring(0, 8) || 'Unknown'}`;
    
    let description = '';
    let points = 0;
    
    // ✅ Check if this is an and-1 situation (made shot with shooting foul sequence)
    // A shot is an and-1 if:
    // 1. It has a valid sequence_id (not null, not undefined, not empty)
    // 2. There's a shooting foul with the same sequence_id
    // 3. The shot was made (field_goal or three_pointer with modifier 'made')
    const hasSequenceId = stat.sequence_id && 
                          typeof stat.sequence_id === 'string' && 
                          stat.sequence_id.trim() !== '';
    const hasShootingFoul = hasSequenceId && stat.sequence_id && shootingFoulMap.has(stat.sequence_id);
    const isMadeShot = (stat.stat_type === 'field_goal' || stat.stat_type === 'three_pointer') &&
                       stat.modifier === 'made';
    const isAndOne = hasShootingFoul && isMadeShot;
    
    switch (stat.stat_type) {
      case 'three_pointer':
        description = stat.modifier === 'made' 
          ? `${playerName} made 3PT${isAndOne ? ' (and-1)' : ''}` 
          : `${playerName} missed 3PT`;
        if (isAndOne && stat.modifier === 'made') {
          console.log('✅ [AND-1 DEBUG] Description set for 3PT:', description);
        }
        points = stat.modifier === 'made' ? 3 : 0;
        break;
      case 'field_goal':
        description = stat.modifier === 'made'
          ? `${playerName} made 2PT${isAndOne ? ' (and-1)' : ''}`
          : `${playerName} missed 2PT`;
        if (isAndOne && stat.modifier === 'made') {
          console.log('✅ [AND-1 DEBUG] Description set for 2PT:', description);
        }
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
        // ✅ FIX: Show foul types clearly (match Edit Stats Modal format)
        if (stat.modifier === 'shooting') {
          description = `${playerName} shooting foul`;
        } else if (stat.modifier === 'personal') {
          description = `${playerName} personal foul`;
        } else if (stat.modifier === 'offensive') {
          description = `${playerName} offensive foul`;
        } else if (stat.modifier === 'technical') {
          description = `${playerName} technical foul`;
        } else if (stat.modifier === 'flagrant') {
          description = `${playerName} flagrant foul`;
        } else if (stat.modifier) {
          description = `${playerName} ${stat.modifier} foul`;
        } else {
          description = `${playerName} foul`;
        }
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
      playerPhotoUrl: (stat as any).player_photo_url || null, // ✅ Include player photo for avatar display
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

  // ✅ STEP 3: Convert sorted substitutions to play entries
  const substitutionPlays = sortedSubs.map(sub => {
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

  // ✅ STEP 4: Convert sorted timeouts to play entries
  const timeoutPlays = sortedTimeouts.map(timeout => {
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

  // ✅ STEP 5: Merge all plays (already sorted chronologically with correct scores)
  // Then sort by timestamp newest first for display
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
  
  // Store players map for photo updates
  const playersMapRef = useRef<Map<string, { name: string; photoUrl: string | null }>>(new Map());

  const fetchGameData = useCallback(async (isUpdate: boolean = false) => {
    if (!gameId) {
      return;
    }

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

      // ✅ FIX: Try to get user auth token for coach games (fallback to anon for public games)
      let authToken = supabaseKey; // Default to anon key
      if (typeof window !== 'undefined') {
        const userToken = localStorage.getItem('sb-access-token');
        if (userToken) {
          authToken = userToken; // Use authenticated token if available
        }
      }

      const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${authToken}`, // ✅ Use user token if available
        'Content-Type': 'application/json'
      };

      // ⚡ PHASE 1: Fetch game data (needed for IDs)
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

      // ⚡ PHASE 2: Parallel fetch all related data
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
        // Stats (include custom_player_id and sequence_id for custom players and and-1 detection)
        fetch(`${supabaseUrl}/rest/v1/game_stats?select=id,game_id,player_id,custom_player_id,team_id,stat_type,stat_value,modifier,quarter,game_time_minutes,game_time_seconds,created_at,sequence_id&game_id=eq.${gameId}&order=created_at.desc`, { headers }),
        // Substitutions
        fetch(`${supabaseUrl}/rest/v1/game_substitutions?select=*&game_id=eq.${gameId}&order=created_at.asc`, { headers }),
        // Timeouts
        fetch(`${supabaseUrl}/rest/v1/game_timeouts?select=*&game_id=eq.${gameId}&order=created_at.desc`, { headers })
      ]);

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
      } else {
        console.error('❌ useGameViewerV2: Failed to fetch game_stats:', statsResponse.status);
      }

      // Parse substitutions
      let gameSubstitutions: any[] = [];
      if (subsResponse.ok) {
        gameSubstitutions = await subsResponse.json();
      } else {
        console.error('❌ useGameViewerV2: Failed to fetch substitutions:', subsResponse.status);
      }

      // Parse timeouts
      let gameTimeouts: any[] = [];
      if (timeoutsResponse.ok) {
        gameTimeouts = await timeoutsResponse.json();
      } else {
        console.error('❌ useGameViewerV2: Failed to fetch timeouts:', timeoutsResponse.status);
      }

      // ⚡ PHASE 3: Fetch ALL player names in parallel (for stats + subs, including custom players)
      const statsPlayerIds = [...new Set(gameStats.map(s => s.player_id).filter(Boolean))];
      const statsCustomPlayerIds = [...new Set((gameStats as any).map((s: any) => s.custom_player_id).filter(Boolean))];
      // ✅ CUSTOM PLAYER SUPPORT: Include both regular and custom player IDs from substitutions
      const subPlayerIds = [...new Set([
        ...gameSubstitutions.map(s => (s as any).player_in_id || (s as any).custom_player_in_id).filter(Boolean),
        ...gameSubstitutions.map(s => (s as any).player_out_id || (s as any).custom_player_out_id).filter(Boolean)
      ])];
      const allPlayerIds = [...new Set([...statsPlayerIds, ...subPlayerIds])];

      // ✅ FIX: Query both users AND custom_players tables in parallel
      const [regularPlayersResponse, customPlayersResponse] = await Promise.all([
        // Regular players from users table (including profile photo)
        allPlayerIds.length > 0 
          ? fetch(`${supabaseUrl}/rest/v1/users?select=id,name,email,profile_photo_url&id=in.(${allPlayerIds.join(',')})`, { headers })
          : Promise.resolve(null),
        // Custom players from custom_players table (include profile_photo_url)
        statsCustomPlayerIds.length > 0
          ? fetch(`${supabaseUrl}/rest/v1/custom_players?select=id,name,profile_photo_url&id=in.(${statsCustomPlayerIds.join(',')})`, { headers })
          : Promise.resolve(null)
      ]);

      // Build combined players map (name + photo URL)
      let playersMap = new Map<string, { name: string; photoUrl: string | null }>();
      
      // Add regular players
      if (regularPlayersResponse && regularPlayersResponse.ok) {
        const playersData = await regularPlayersResponse.json();
        playersData.forEach((p: any) => {
          playersMap.set(p.id, {
            name: p.name || p.email?.split('@')[0] || `Player ${p.id.substring(0, 8)}`,
            photoUrl: p.profile_photo_url || null
          });
        });
      }

      // Add custom players (with photos)
      if (customPlayersResponse && customPlayersResponse.ok) {
        const customPlayersData = await customPlayersResponse.json();
        customPlayersData.forEach((p: any) => {
          playersMap.set(p.id, {
            name: p.name || `Custom Player ${p.id.substring(0, 8)}`,
            photoUrl: p.profile_photo_url || null
          });
        });
      }

      // Update ref for photo update subscriptions
      playersMapRef.current = playersMap;

      // Enrich stats with player names and photo URLs (check both player_id and custom_player_id)
      gameStats = gameStats.map(stat => {
        const statWithCustomId = stat as any;
        const playerId = stat.player_id || statWithCustomId.custom_player_id;
        const playerInfo = playersMap.get(playerId) || { name: `Player ${playerId?.substring(0, 8)}`, photoUrl: null };
        return {
          ...stat,
          custom_player_id: statWithCustomId.custom_player_id, // ✅ FIX: Explicitly preserve custom_player_id
          player_name: playerInfo.name,
          player_photo_url: playerInfo.photoUrl
        };
      });

      // Enrich substitutions with player names (handle both regular and custom players)
      gameSubstitutions = gameSubstitutions.map(sub => {
        const subWithCustom = sub as any;
        const playerInId = sub.player_in_id || subWithCustom.custom_player_in_id;
        const playerOutId = sub.player_out_id || subWithCustom.custom_player_out_id;
        const playerInInfo = playersMap.get(playerInId) || { name: `Player ${playerInId?.substring(0, 8)}`, photoUrl: null };
        const playerOutInfo = playersMap.get(playerOutId) || { name: `Player ${playerOutId?.substring(0, 8)}`, photoUrl: null };
        return {
          ...sub,
          player_in_name: playerInInfo.name,
          player_out_name: playerOutInfo.name
        };
      });

      // 7. Calculate real-time scores from game_stats (fallback if DB scores are 0)
      const calculateScoresFromStats = (stats: GameStats[], teamAId: string, teamBId: string) => {
        let homeScore = 0;
        let awayScore = 0;
        
        stats.forEach(stat => {
          if (stat.modifier === 'made') {
            const points = stat.stat_value || 0;
            
            if (stat.team_id === teamAId) {
              homeScore += points;
            } else if (stat.team_id === teamBId) {
              awayScore += points;
            }
          }
        });
        
        return { homeScore, awayScore };
      };
      
      const calculatedScores = calculateScoresFromStats(gameStats, gameInfo.team_a_id, gameInfo.team_b_id);

      // 8. Enrich game data
      const teamAName = teamsMap.get(gameInfo.team_a_id) || 'Team A';
      const teamBName = teamsMap.get(gameInfo.team_b_id) || 'Team B';
      
      const enrichedGame: GameData = {
        ...gameInfo,
        team_a_name: teamAName,
        team_b_name: teamBName,
        tournament_name: tournamentName,
        // ✅ FIX: Use calculated scores if DB scores are 0 (real-time score tracking)
        home_score: gameInfo.home_score || calculatedScores.homeScore,
        away_score: gameInfo.away_score || calculatedScores.awayScore
      };

      // 9. Transform stats, substitutions, AND timeouts into play-by-play entries
      const playByPlayEntries = transformStatsToPlays(
        gameStats,
        gameInfo.team_a_id,
        gameInfo.team_b_id,
        teamAName,
        teamBName,
        gameSubstitutions,
        gameTimeouts
      );

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
          return prevGame;
        }
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
            return prevStats;
          }
        }
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
            return prevPlays;
          }
        }
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
      
      // Handle custom player photo updates
      if (table === 'custom_players' && payload.new) {
        const updatedPlayer = payload.new as any;
        const playerId = updatedPlayer.id;
        const newPhotoUrl = updatedPlayer.profile_photo_url || null;
        
        console.log('📸 useGameViewerV2: Custom player photo updated:', { playerId, newPhotoUrl });
        
        // Update players map
        const currentPlayer = playersMapRef.current.get(playerId);
        if (currentPlayer) {
          playersMapRef.current.set(playerId, {
            ...currentPlayer,
            photoUrl: newPhotoUrl
          });
          
          // Re-enrich stats with updated photo URLs
          setStats(prevStats => {
            return prevStats.map(stat => {
              const statWithCustomId = stat as any;
              const statPlayerId = stat.player_id || statWithCustomId.custom_player_id;
              if (statPlayerId === playerId) {
                const playerInfo = playersMapRef.current.get(playerId) || { name: currentPlayer.name, photoUrl: newPhotoUrl };
                return {
                  ...stat,
                  player_photo_url: playerInfo.photoUrl
                };
              }
              return stat;
            });
          });
        }
      } else {
        // For other updates (games, game_stats, game_substitutions), refresh all data
        void fetchGameData(true);
      }
    });

    return unsubscribe;
  }, [gameId, fetchGameData]);

  // 📸 Subscribe to custom player photo updates (after we have team IDs)
  useEffect(() => {
    if (!gameId || !game?.team_a_id || !game?.team_b_id) return;

    console.log('📸 useGameViewerV2: Setting up custom players photo subscription for game:', gameId);
    
    const unsubscribeCustomPlayers = gameSubscriptionManager.subscribeToCustomPlayers(
      gameId,
      game.team_a_id,
      game.team_b_id,
      (table: string, payload: any) => {
        console.log('📸 useGameViewerV2: Custom player photo update received:', table, payload);
        // The main subscription handler above will process this
      }
    );

    return unsubscribeCustomPlayers;
  }, [gameId, game?.team_a_id, game?.team_b_id]);

  // ✅ DEDICATED CLOCK POLLING: Ensures clock updates every 5 seconds regardless of WebSocket status
  // This runs independently of subscriptions and only updates clock fields (lightweight)
  useEffect(() => {
    if (!gameId || !game) return;

    // Only poll when game is live and clock is running
    const isLive = game.status?.toLowerCase().includes('live') || 
                  game.status?.toLowerCase().includes('progress') ||
                  game.status?.toLowerCase().includes('overtime');
    const isClockRunning = game.is_clock_running;

    if (!isLive || !isClockRunning) {
      return; // Don't poll if game isn't live or clock isn't running
    }

    console.log('⏱️ useGameViewerV2: Starting dedicated clock polling (every 5 seconds)');

    // Lightweight function to fetch only clock data
    const fetchClockOnly = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          return;
        }

        // Get auth token if available
        let authToken = supabaseKey;
        if (typeof window !== 'undefined') {
          const userToken = localStorage.getItem('sb-access-token');
          if (userToken) {
            authToken = userToken;
          }
        }

        const headers = {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        };

        // Fetch only clock-related fields (lightweight query)
        const response = await fetch(
          `${supabaseUrl}/rest/v1/games?select=game_clock_minutes,game_clock_seconds,is_clock_running,quarter&id=eq.${gameId}`,
          { headers }
        );

        if (!response.ok) {
          console.warn('⚠️ useGameViewerV2: Clock poll failed:', response.statusText);
          return;
        }

        const gameData = await response.json();
        if (!gameData || gameData.length === 0) {
          return;
        }

        const clockData = gameData[0];

        // Update only clock fields in game state (silent update, no re-render if unchanged)
        setGame(prevGame => {
          if (!prevGame) return prevGame;

          // Only update if clock values actually changed
          if (
            prevGame.game_clock_minutes === clockData.game_clock_minutes &&
            prevGame.game_clock_seconds === clockData.game_clock_seconds &&
            prevGame.is_clock_running === clockData.is_clock_running &&
            prevGame.quarter === clockData.quarter
          ) {
            return prevGame; // No change, return same reference
          }

          // Clock changed, update only clock fields
          return {
            ...prevGame,
            game_clock_minutes: clockData.game_clock_minutes,
            game_clock_seconds: clockData.game_clock_seconds,
            is_clock_running: clockData.is_clock_running,
            quarter: clockData.quarter
          };
        });
      } catch (error) {
        // Silent error - don't spam console, clock polling is best-effort
        console.debug('⏱️ useGameViewerV2: Clock poll error (silent):', error);
      }
    };

    // Initial poll after 5 seconds, then every 5 seconds
    const initialTimeout = setTimeout(() => {
      void fetchClockOnly();
    }, 5000);

    const pollInterval = setInterval(() => {
      void fetchClockOnly();
    }, 5000); // 5 seconds - matches tracker sync frequency

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(pollInterval);
      console.log('⏱️ useGameViewerV2: Stopped dedicated clock polling');
    };
  }, [gameId, game?.status, game?.is_clock_running]); // Only re-run if game status or clock running state changes

  return {
    game,
    stats,
    plays,
    loading,
    error
  };
}
