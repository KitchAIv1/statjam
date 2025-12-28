import { useState, useEffect } from 'react';
import { useTournaments } from '@/lib/hooks/useTournaments';
import { liveStreamService } from '@/services/liveStreamService';
import { useScoreCalculation } from './useScoreCalculation';
import { LiveGame } from '@/types/liveStream';

interface UseLiveStreamGamesParams {
  tournamentId?: string;
  user?: { id: string } | null;
  selectedGameId: string | null;
}

export function useLiveStreamGames({
  tournamentId,
  user,
  selectedGameId,
}: UseLiveStreamGamesParams) {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [selectedGame, setSelectedGame] = useState<LiveGame | null>(null);
  const [gameStats, setGameStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { tournaments } = useTournaments(user);
  const { calculateScores } = useScoreCalculation();

  useEffect(() => {
    if (tournamentId || (user?.id && tournaments.length > 0)) {
      setLoading(true);
      liveStreamService.fetchGames({ tournamentId, user, tournaments })
        .then(setGames)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [tournamentId, user?.id, tournaments.length]);

  useEffect(() => {
    if (!selectedGameId) {
      setGameStats([]);
      setSelectedGame(null);
      return;
    }

    const game = games.find(g => g.id === selectedGameId);
    if (game) {
      setSelectedGame(game);
    }

    liveStreamService.fetchGameStats(selectedGameId)
      .then(setGameStats)
      .catch(console.error);
  }, [selectedGameId, games]);

  useEffect(() => {
    if (!selectedGame || !selectedGame.team_a_id || !selectedGame.team_b_id || gameStats.length === 0) return;
    
    const calculatedScores = calculateScores(gameStats, selectedGame.team_a_id, selectedGame.team_b_id);
    
    setSelectedGame(prev => {
      if (!prev) return null;
      if (prev.home_score === calculatedScores.homeScore && prev.away_score === calculatedScores.awayScore) {
        return prev;
      }
      return { ...prev, home_score: calculatedScores.homeScore, away_score: calculatedScores.awayScore };
    });
  }, [gameStats, selectedGame?.id, selectedGame?.team_a_id, selectedGame?.team_b_id, calculateScores]);

  useEffect(() => {
    if (!selectedGameId) return;
    
    return liveStreamService.subscribeToUpdates(selectedGameId, {
      onStatsChange: () => {
        liveStreamService.fetchGameStats(selectedGameId)
          .then(setGameStats)
          .catch(console.error);
      },
      onGameUpdate: (gameUpdate) => {
        setSelectedGame(prev => {
          if (!prev) return null;
          return {
            ...prev,
            quarter: gameUpdate.quarter || prev.quarter,
            game_clock_minutes: gameUpdate.game_clock_minutes ?? prev.game_clock_minutes,
            game_clock_seconds: gameUpdate.game_clock_seconds ?? prev.game_clock_seconds,
            team_a_fouls: gameUpdate.team_a_fouls,
            team_b_fouls: gameUpdate.team_b_fouls,
            team_a_timeouts: gameUpdate.team_a_timeouts_remaining,
            team_b_timeouts: gameUpdate.team_b_timeouts_remaining,
            current_possession_team_id: gameUpdate.current_possession_team_id,
            jump_ball_arrow_team_id: gameUpdate.jump_ball_arrow_team_id,
            venue: gameUpdate.venue,
            home_score: prev.home_score,
            away_score: prev.away_score,
          };
        });
      },
    });
  }, [selectedGameId]);

  return { games, selectedGame, gameStats, loading };
}

