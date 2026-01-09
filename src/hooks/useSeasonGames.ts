// ============================================================================
// USE SEASON GAMES - Game selection logic (<100 lines)
// Purpose: Fetch and filter team games for season selection
// Follows .cursorrules: Custom hook, <100 lines, data fetching only
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { CoachGame } from '@/lib/types/coach';

interface UseSeasonGamesOptions {
  teamId: string;
  startDate?: string;
  endDate?: string;
}

export function useSeasonGames({ teamId, startDate, endDate }: UseSeasonGamesOptions) {
  const [games, setGames] = useState<CoachGame[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch completed games for the team - matches getTeamGamesCount query
  useEffect(() => {
    const fetchGames = async () => {
      if (!teamId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔍 SeasonGames: Fetching for teamId:', teamId);
        
        // Query games where team_a_id OR team_b_id matches (same as getTeamGamesCount)
        const { data, error: queryError } = await supabase
          .from('games')
          .select('id, opponent_name, status, quarter, game_clock_minutes, game_clock_seconds, home_score, away_score, start_time, end_time, team_a_id, team_b_id, created_at')
          .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`)
          .order('start_time', { ascending: false })
          .limit(100);
        
        if (queryError) {
          console.error('❌ SeasonGames query error:', queryError);
          throw queryError;
        }
        
        console.log('📊 SeasonGames: Total games found:', data?.length || 0);
        console.log('📊 SeasonGames: By status:', {
          completed: data?.filter(g => g.status === 'completed').length || 0,
          in_progress: data?.filter(g => g.status === 'in_progress').length || 0,
          scheduled: data?.filter(g => g.status === 'scheduled').length || 0,
        });
        
        // Filter for completed games only (for season selection)
        const completedData = (data || []).filter(g => g.status === 'completed');
        
        // Map to CoachGame type
        const completedGames: CoachGame[] = completedData.map(g => ({
          id: g.id,
          opponent_name: g.opponent_name || 'Unknown Opponent',
          status: g.status,
          quarter: g.quarter,
          game_clock_minutes: g.game_clock_minutes,
          game_clock_seconds: g.game_clock_seconds,
          home_score: g.home_score || 0,
          away_score: g.away_score || 0,
          start_time: g.start_time,
          end_time: g.end_time,
          coach_team_id: g.team_a_id === teamId ? g.team_a_id : g.team_b_id,
          created_at: g.created_at,
        }));
        
        console.log('✅ SeasonGames: Completed games for selection:', completedGames.length);
        setGames(completedGames);
      } catch (err) {
        console.error('❌ Error fetching season games:', err);
        setError(err instanceof Error ? err.message : 'Failed to load games');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGames();
  }, [teamId]);

  // Filter games by date range
  const filteredGames = useMemo(() => {
    return games.filter(game => {
      const gameDate = new Date(game.start_time || game.created_at);
      if (startDate && gameDate < new Date(startDate)) return false;
      if (endDate && gameDate > new Date(endDate)) return false;
      return true;
    });
  }, [games, startDate, endDate]);

  // Toggle game selection
  const toggleGame = useCallback((gameId: string) => {
    setSelectedIds(prev => 
      prev.includes(gameId) 
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId]
    );
  }, []);

  // Select all filtered games
  const selectAll = useCallback(() => {
    setSelectedIds(filteredGames.map(g => g.id));
  }, [filteredGames]);

  // Deselect all
  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Calculate stats for selected games
  const selectedStats = useMemo(() => {
    const selected = games.filter(g => selectedIds.includes(g.id));
    const wins = selected.filter(g => g.home_score > g.away_score).length;
    const losses = selected.length - wins;
    const totalFor = selected.reduce((sum, g) => sum + g.home_score, 0);
    const totalAgainst = selected.reduce((sum, g) => sum + g.away_score, 0);
    
    return {
      count: selected.length,
      wins,
      losses,
      pointsFor: totalFor,
      pointsAgainst: totalAgainst,
      avgFor: selected.length ? (totalFor / selected.length).toFixed(1) : '0',
      avgAgainst: selected.length ? (totalAgainst / selected.length).toFixed(1) : '0',
    };
  }, [games, selectedIds]);

  return {
    games: filteredGames,
    allGames: games,
    selectedIds,
    selectedStats,
    loading,
    error,
    toggleGame,
    selectAll,
    deselectAll,
    setSelectedIds,
  };
}

