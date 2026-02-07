'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useGameViewerV3 } from '@/hooks/useGameViewerV3';
import { useGameViewerV3Realtime } from '@/hooks/useGameViewerV3Realtime';

export type GameViewerTheme = 'light' | 'dark';

/** API response shape from /api/game-viewer/[gameId] */
export interface GameViewerV3APIResponse {
  game: {
    id: string;
    tournament_id: string;
    team_a_id: string;
    team_b_id: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overtime';
    quarter: number;
    game_clock_minutes: number;
    game_clock_seconds: number;
    is_clock_running: boolean;
    team_a_score: number;
    team_b_score: number;
    is_coach_game?: boolean;
    player_of_game_id?: string;
    hustle_player_id?: string;
    [key: string]: unknown;
  };
  teams: Array<{ id: string; name: string; logo_url?: string }>;
  teamPlayers: Array<{
    id: string;
    team_id: string;
    player_id?: string;
    custom_player_id?: string;
    jersey_number?: number;
    position?: string;
  }>;
  users: Array<{ id: string; name: string; email?: string; profile_photo_url?: string }>;
  customPlayers: Array<{ id: string; name: string; profile_photo_url?: string; jersey_number?: number }>;
  stats: Array<{
    id: string;
    game_id: string;
    team_id: string;
    player_id?: string;
    custom_player_id?: string;
    stat_type: string;
    stat_value: number;
    modifier?: string;
    quarter: number;
    game_time_minutes?: number;
    game_time_seconds?: number;
    is_opponent_stat?: boolean;
    created_at: string;
  }>;
  substitutions: Array<{
    id: string;
    game_id: string;
    team_id: string;
    player_in_id?: string;
    player_out_id?: string;
    custom_player_in_id?: string;
    custom_player_out_id?: string;
    quarter: number;
    game_time_minutes?: number;
    game_time_seconds?: number;
    created_at: string;
  }>;
  timeouts: Array<{ id: string; game_id: string; team_id: string; quarter: number; created_at: string }>;
  computedTeamAStats?: unknown;
  computedTeamBStats?: unknown;
}

export interface GameViewerV3ContextValue {
  gameData: GameViewerV3APIResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isLive: boolean;
  theme: GameViewerTheme;
  isDark: boolean;
  toggleTheme: () => void;
}

const GameViewerV3Context = createContext<GameViewerV3ContextValue | null>(null);

interface GameViewerV3ProviderProps {
  gameId: string;
  children: ReactNode;
}

export function GameViewerV3Provider({ gameId, children }: GameViewerV3ProviderProps) {
  const { gameData, loading, error, refetch, setGameData } = useGameViewerV3(gameId);
  
  // Setup realtime subscriptions that update shared state
  useGameViewerV3Realtime(gameId, gameData, setGameData);

  // Theme state (persisted to localStorage)
  const [theme, setTheme] = useState<GameViewerTheme>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('gameViewerV3Theme') as GameViewerTheme;
    if (saved === 'light' || saved === 'dark') setTheme(saved);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('gameViewerV3Theme', newTheme);
  }, [theme]);

  const isLive = gameData?.game?.status === 'in_progress' || gameData?.game?.status === 'overtime';
  const isDark = theme === 'dark';

  const contextValue: GameViewerV3ContextValue = {
    gameData,
    loading,
    error,
    refetch,
    isLive,
    theme,
    isDark,
    toggleTheme,
  };

  return (
    <GameViewerV3Context.Provider value={contextValue}>
      {children}
    </GameViewerV3Context.Provider>
  );
}

export function useGameViewerV3Context(): GameViewerV3ContextValue {
  const context = useContext(GameViewerV3Context);
  if (!context) {
    throw new Error('useGameViewerV3Context must be used within GameViewerV3Provider');
  }
  return context;
}
