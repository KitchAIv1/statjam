'use client';

import { useState, useEffect } from 'react';

/**
 * useGameDataLoader - Single source of truth for stat tracker data loading
 * 
 * PURPOSE: Ensures ALL data is loaded BEFORE the tracker hook initializes.
 * This eliminates the race condition where useTracker was called with 
 * placeholder team IDs ('teamA', 'teamB') instead of actual UUIDs.
 * 
 * ARCHITECTURE: Page waits for this hook, then passes real data to useTracker.
 */

// Player type - matches the tracker's expected player format
// Using generic to avoid type conflicts with page-level definitions
interface TrackerPlayer {
  id: string;
  name: string;
  jerseyNumber?: number;
  is_custom_player?: boolean;
  [key: string]: unknown; // Allow additional properties
}

interface GameData {
  id: string;
  team_a_id: string;
  team_b_id: string;
  status: string;
  quarter: number;
  game_clock_minutes: number;
  game_clock_seconds: number;
  is_clock_running: boolean;
  home_score: number;
  away_score: number;
  team_a?: { name?: string | null } | null;
  team_b?: { name?: string | null } | null;
  opponent_name?: string | null;
  is_demo?: boolean;
  [key: string]: unknown; // Allow additional properties from DB
}

interface UseGameDataLoaderProps {
  gameId: string;
  coachMode: boolean;
  coachTeamId: string;
  userId: string | undefined;
  isAuthLoading: boolean;
}

interface UseGameDataLoaderReturn {
  gameData: GameData | null;
  teamAPlayers: TrackerPlayer[];
  teamBPlayers: TrackerPlayer[];
  isLoading: boolean;
  error: string | null;
  isReady: boolean; // TRUE only when ALL data is loaded and valid
}

export function useGameDataLoader({
  gameId,
  coachMode,
  coachTeamId,
  userId,
  isAuthLoading
}: UseGameDataLoaderProps): UseGameDataLoaderReturn {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [teamAPlayers, setTeamAPlayers] = useState<TrackerPlayer[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<TrackerPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all data in a single effect
  useEffect(() => {
    const loadAllData = async () => {
      // Guard: Wait for auth and valid gameId
      if (!gameId || isAuthLoading || !userId) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Import services (raw HTTP - reliable)
        const { GameServiceV3 } = await import('@/lib/services/gameServiceV3');
        const { TeamServiceV3 } = await import('@/lib/services/teamServiceV3');

        // 1. Load game data first (needed for team IDs)
        const game = await GameServiceV3.getGame(gameId);
        if (!game) {
          setError('Game not found');
          setIsLoading(false);
          return;
        }

        // 2. Validate team IDs exist
        if (!game.team_a_id || !game.team_b_id) {
          setError('Game missing team information');
          setIsLoading(false);
          return;
        }

        // 3. Load both teams in parallel
        const [teamAData, teamBData] = await Promise.all([
          loadTeamPlayers(TeamServiceV3, game, coachMode, coachTeamId),
          loadOpponentPlayers(TeamServiceV3, game, coachMode)
        ]);

        // 4. Set all state atomically
        setGameData(game);
        setTeamAPlayers(teamAData);
        setTeamBPlayers(teamBData);
        setIsLoading(false);

      } catch (err) {
        console.error('❌ useGameDataLoader: Error loading data:', err);
        setError('Failed to load game data');
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [gameId, coachMode, coachTeamId, userId, isAuthLoading]);

  // Derived state: isReady when we have valid game data with real UUIDs
  const isReady = !isLoading && 
                  !error && 
                  gameData !== null && 
                  typeof gameData.team_a_id === 'string' && 
                  gameData.team_a_id.length > 10; // UUIDs are 36 chars

  return {
    gameData,
    teamAPlayers,
    teamBPlayers,
    isLoading,
    error,
    isReady
  };
}

// Helper: Load team A players (coach or tournament mode)
async function loadTeamPlayers(
  TeamServiceV3: any,
  game: GameData,
  coachMode: boolean,
  coachTeamId: string
): Promise<TrackerPlayer[]> {
  try {
    if (coachMode && coachTeamId) {
      return await TeamServiceV3.getTeamPlayersWithSubstitutions(coachTeamId, game.id);
    }
    return await TeamServiceV3.getTeamPlayersWithSubstitutions(game.team_a_id, game.id);
  } catch (err) {
    console.error('❌ Failed to load Team A players:', err);
    return [];
  }
}

// Helper: Load team B players (skip in coach mode - dummy opponent)
async function loadOpponentPlayers(
  TeamServiceV3: any,
  game: GameData,
  coachMode: boolean
): Promise<TrackerPlayer[]> {
  try {
    if (coachMode) {
      return []; // Coach mode has no real opponent team
    }
    return await TeamServiceV3.getTeamPlayersWithSubstitutions(game.team_b_id, game.id);
  } catch (err) {
    console.error('❌ Failed to load Team B players:', err);
    return [];
  }
}
