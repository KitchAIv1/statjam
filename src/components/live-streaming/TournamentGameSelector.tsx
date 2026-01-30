/**
 * TournamentGameSelector - Hierarchical tournament and game selection
 * 
 * Select tournament first, then filter games by that tournament.
 * Passes tournament info for overlay without additional DB queries.
 * 
 * Follows .cursorrules: under 200 lines, reusable component
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTournaments } from '@/lib/hooks/useTournaments';
import { GameService } from '@/lib/services/gameService';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Tournament } from '@/lib/types/tournament';
import type { GameOverlayData } from '@/lib/services/canvas-overlay';

interface LiveGame {
  id: string;
  team_a_id: string;
  team_b_id: string;
  team_a_name: string;
  team_b_name: string;
  home_score: number;
  away_score: number;
  quarter: number;
  status: string;
  game_clock_minutes: number;
  game_clock_seconds: number;
  tournament_id: string;
}

interface TournamentGameSelectorProps {
  user: User | null;
  selectedGameId: string | null;
  onGameSelect: (gameId: string | null) => void;
  onTournamentSelect: (tournament: Tournament | null) => void;
  overlayData: GameOverlayData | null;
}

export function TournamentGameSelector({
  user,
  selectedGameId,
  onGameSelect,
  onTournamentSelect,
  overlayData,
}: TournamentGameSelectorProps) {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [loadingGames, setLoadingGames] = useState(true);
  
  const { tournaments, loading: tournamentsLoading } = useTournaments(user);
  
  // Stable tournament IDs for dependency
  const tournamentIds = useMemo(() => tournaments.map(t => t.id).join(','), [tournaments]);
  
  // Get selected tournament
  const selectedTournament = useMemo(() => 
    tournaments.find(t => t.id === selectedTournamentId) || null, 
    [tournaments, selectedTournamentId]
  );
  
  // Filter games by selected tournament
  const filteredGames = useMemo(() => 
    selectedTournamentId ? games.filter(g => g.tournament_id === selectedTournamentId) : [],
    [games, selectedTournamentId]
  );
  
  const selectedGame = filteredGames.find(g => g.id === selectedGameId);

  // Notify parent of tournament selection
  useEffect(() => {
    onTournamentSelect(selectedTournament);
  }, [selectedTournament, onTournamentSelect]);

  // Clear game selection when tournament changes
  useEffect(() => {
    onGameSelect(null);
  }, [selectedTournamentId, onGameSelect]);

  // Fetch games from all tournaments
  useEffect(() => {
    async function fetchGames() {
      if (!user?.id || !tournamentIds) { setLoadingGames(false); return; }
      try {
        setLoadingGames(true);
        const ids = tournamentIds.split(',').filter(Boolean);
        const tournamentGamesPromises = ids.map(id => 
          GameService.getGamesByTournament(id)
            .then(g => g.filter((x: any) => ['live', 'in_progress'].includes(String(x.status || '').toLowerCase()))
                       .map((x: any) => ({ ...x, tournament_id: id })))
            .catch(() => [])
        );
        const allGames = (await Promise.all(tournamentGamesPromises)).flat();
        const teamIds = [...new Set(allGames.flatMap((g: any) => [g.team_a_id, g.team_b_id]).filter(Boolean))];
        let teamsMap = new Map<string, any>();
        if (teamIds.length > 0 && supabase) {
          const { data } = await supabase.from('teams').select('id, name').in('id', teamIds);
          teamsMap = new Map((data || []).map(t => [t.id, t]));
        }
        setGames(allGames.map((g: any) => ({ 
          id: g.id, 
          team_a_id: g.team_a_id, 
          team_b_id: g.team_b_id, 
          team_a_name: teamsMap.get(g.team_a_id)?.name || 'Team A', 
          team_b_name: teamsMap.get(g.team_b_id)?.name || 'Team B', 
          home_score: g.home_score || 0, 
          away_score: g.away_score || 0, 
          quarter: g.quarter || 1, 
          status: g.status, 
          game_clock_minutes: g.game_clock_minutes ?? 0, 
          game_clock_seconds: g.game_clock_seconds || 0,
          tournament_id: g.tournament_id,
        })));
      } catch (err) { 
        console.error('Error loading games:', err); 
      } finally { 
        setLoadingGames(false); 
      }
    }
    if (!tournamentsLoading && tournamentIds) fetchGames();
    else if (!tournamentsLoading) setLoadingGames(false);
  }, [user?.id, tournamentIds, tournamentsLoading]);

  return (
    <Card className="p-3 flex-shrink-0">
      <div className="space-y-3">
        {/* Tournament Selector */}
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold">Tournament</h3>
          {tournamentsLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : tournaments.length === 0 ? (
            <p className="text-xs text-muted-foreground">No tournaments found</p>
          ) : (
            <select
              value={selectedTournamentId || ''}
              onChange={(e) => setSelectedTournamentId(e.target.value || null)}
              className="w-full text-xs px-2 py-1.5 bg-background border rounded"
            >
              <option value="">-- Select Tournament --</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </div>
        
        {/* Game Selector */}
        <div className="space-y-1.5 pt-2 border-t">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Game</h3>
            {selectedGame && overlayData && (
              <span className="text-xs px-1.5 py-0.5 bg-green-500/10 text-green-600 rounded">LIVE</span>
            )}
          </div>
          {!selectedTournamentId ? (
            <p className="text-xs text-muted-foreground py-2">Select a tournament first</p>
          ) : loadingGames ? (
            <Skeleton className="h-8 w-full" />
          ) : filteredGames.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No live games in this tournament</p>
          ) : (
            <select
              value={selectedGameId || ''}
              onChange={(e) => onGameSelect(e.target.value || null)}
              className="w-full text-xs px-2 py-1.5 bg-background border rounded"
            >
              <option value="">-- Select Game --</option>
              {filteredGames.map(g => (
                <option key={g.id} value={g.id}>
                  {g.team_b_name} vs {g.team_a_name}
                </option>
              ))}
            </select>
          )}
        </div>
        
        {/* Selected Game Info */}
        {selectedGame && overlayData && (
          <div className="text-xs space-y-0.5 pt-2 border-t animate-in fade-in-0">
            <p className="font-medium">
              {overlayData.teamBName} {overlayData.awayScore} - {overlayData.homeScore} {overlayData.teamAName}
            </p>
            <p className="text-muted-foreground">
              Q{overlayData.quarter} | {overlayData.gameClockMinutes}:{String(overlayData.gameClockSeconds).padStart(2, '0')}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
