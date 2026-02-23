/**
 * useGlobalSearch - Global search across players, teams, tournaments, games, coaches
 *
 * Debounced 300ms, min query length 2.
 * Runs 6 parallel Supabase queries (anon-friendly RLS).
 *
 * @module useGlobalSearch
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface SearchResults {
  players: { id: string; name: string; photo?: string; isCustom: boolean }[];
  teams: { id: string; name: string; logo?: string; tournamentId?: string }[];
  tournaments: { id: string; name: string; logo?: string; status: string }[];
  games: { id: string; teamAName: string; teamBName: string; status: string }[];
  coaches: { id: string; name: string; photo?: string }[];
}

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const LIMIT_PER_CATEGORY = 4;

export function useGlobalSearch(query: string) {
  const [results, setResults] = useState<SearchResults>({
    players: [],
    teams: [],
    tournaments: [],
    games: [],
    coaches: [],
  });
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    if (!q || q.length < MIN_QUERY_LENGTH) {
      setResults({ players: [], teams: [], tournaments: [], games: [], coaches: [] });
      return;
    }

    setLoading(true);
    const pattern = `%${q}%`;

    try {
      const [
        customPlayersRes,
        regularPlayersRes,
        teamsRes,
        tournamentsRes,
        coachesRes,
        matchingTeamIdsRes,
      ] = await Promise.all([
        supabase
          .from('custom_players')
          .select('id, name, profile_photo_url')
          .ilike('name', pattern)
          .limit(LIMIT_PER_CATEGORY),
        supabase
          .from('users')
          .select('id, name, profile_photo_url')
          .eq('role', 'player')
          .ilike('name', pattern)
          .limit(LIMIT_PER_CATEGORY),
        supabase
          .from('teams')
          .select('id, name, logo_url, tournament_id')
          .ilike('name', pattern)
          .limit(LIMIT_PER_CATEGORY),
        supabase
          .from('tournaments')
          .select('id, name, logo, status, country')
          .eq('is_public', true)
          .ilike('name', pattern)
          .limit(LIMIT_PER_CATEGORY),
        supabase
          .from('users')
          .select('id, name, profile_photo_url')
          .eq('role', 'coach')
          .ilike('name', pattern)
          .limit(LIMIT_PER_CATEGORY),
        supabase
          .from('teams')
          .select('id')
          .ilike('name', pattern)
          .limit(50),
      ]);

      const matchingTeamIds = (matchingTeamIdsRes.data || []).map(t => t.id);
      let gamesRes: { data: any[] | null } = { data: [] };
      if (matchingTeamIds.length > 0) {
        gamesRes = await supabase
          .from('games')
          .select('id, status, team_a:teams!games_team_a_id_fkey(name), team_b:teams!games_team_b_id_fkey(name)')
          .eq('is_coach_game', false)
          .or(`team_a_id.in.(${matchingTeamIds.join(',')}),team_b_id.in.(${matchingTeamIds.join(',')})`)
          .limit(LIMIT_PER_CATEGORY);
      }

      const customPlayers = (customPlayersRes.data || []).map(p => ({
        id: p.id,
        name: p.name || '',
        photo: p.profile_photo_url || undefined,
        isCustom: true,
      }));

      const regularPlayers = (regularPlayersRes.data || []).map(p => ({
        id: p.id,
        name: p.name || '',
        photo: p.profile_photo_url || undefined,
        isCustom: false,
      }));

      const players = [...customPlayers, ...regularPlayers].slice(0, LIMIT_PER_CATEGORY);

      const teams = (teamsRes.data || []).map(t => ({
        id: t.id,
        name: t.name || '',
        logo: t.logo_url || undefined,
        tournamentId: t.tournament_id || undefined,
      }));

      const tournaments = (tournamentsRes.data || []).map(t => ({
        id: t.id,
        name: t.name || '',
        logo: t.logo || undefined,
        status: t.status || '',
      }));

      const games = (gamesRes.data || []).map((g: any) => ({
        id: g.id,
        teamAName: (g.team_a as { name?: string })?.name || 'Team A',
        teamBName: (g.team_b as { name?: string })?.name || 'Team B',
        status: g.status || '',
      }));

      const coaches = (coachesRes.data || []).map(c => ({
        id: c.id,
        name: c.name || '',
        photo: c.profile_photo_url || undefined,
      }));

      setResults({
        players,
        teams,
        tournaments,
        games,
        coaches,
      });
    } catch (err) {
      setResults({
        players: [],
        teams: [],
        tournaments: [],
        games: [],
        coaches: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setResults({ players: [], teams: [], tournaments: [], games: [], coaches: [] });
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => runSearch(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  const hasResults =
    results.players.length > 0 ||
    results.teams.length > 0 ||
    results.tournaments.length > 0 ||
    results.games.length > 0 ||
    results.coaches.length > 0;

  return {
    results,
    loading,
    hasResults,
  };
}
