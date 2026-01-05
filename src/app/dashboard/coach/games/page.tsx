'use client';

/**
 * Coach Games List Page
 * 
 * Displays all tracked games for a selected team with filtering and actions.
 * 
 * Follows .cursorrules: <200 lines, single page responsibility
 */

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { useCoachTeams } from '@/hooks/useCoachTeams';
import { CoachGameService } from '@/lib/services/coachGameService';
import { CoachGame } from '@/lib/types/coach';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, PlayCircle, Eye, BarChart3, Calendar, 
  Users, CheckCircle, Clock, Loader2 
} from 'lucide-react';
import { CoachGameStatsModal } from '@/components/coach/CoachGameStatsModal';

function CoachGamesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuthV2();
  const { teams, loading: teamsLoading } = useCoachTeams(user ? { id: user.id, role: 'coach' } : null);
  
  // Get teamId from URL or default to first team
  const teamIdParam = searchParams.get('teamId');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [games, setGames] = useState<CoachGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  
  // Modal state
  const [showStats, setShowStats] = useState(false);
  const [selectedGame, setSelectedGame] = useState<CoachGame | null>(null);

  // Set initial team from URL or first available
  useEffect(() => {
    if (teamIdParam && teams.some(t => t.id === teamIdParam)) {
      setSelectedTeamId(teamIdParam);
    } else if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teamIdParam, teams, selectedTeamId]);

  // Fetch games when team changes
  const fetchGames = useCallback(async () => {
    if (!selectedTeamId) return;
    try {
      setLoading(true);
      const result = await CoachGameService.getTeamGames(selectedTeamId, 50);
      setGames(result.games);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTeamId]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // Handle team change
  const handleTeamChange = (teamId: string) => {
    setSelectedTeamId(teamId);
    router.replace(`/dashboard/coach/games?teamId=${teamId}`, { scroll: false });
  };

  // Helpers
  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const inProgressGames = games.filter(g => g.status === 'in_progress');
  const completedGames = games.filter(g => g.status === 'completed');
  const scheduledGames = games.filter(g => g.status === 'scheduled');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge className="bg-green-500 text-white text-xs">Live</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="text-xs">Completed</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Scheduled</Badge>;
    }
  };

  const formatGameTime = (game: CoachGame) => {
    if (!game.start_time) return 'Not started';
    const date = new Date(game.start_time);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (authLoading || teamsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/coach')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Button>
        </div>

        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-orange-500" />
                Game History
              </CardTitle>
              
              {/* Team Selector */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <Select value={selectedTeamId} onValueChange={handleTeamChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Stats Summary */}
            <div className="flex gap-4 text-sm text-gray-500 mt-2">
              <span>{total} total games</span>
              {inProgressGames.length > 0 && (
                <span className="text-green-600">{inProgressGames.length} live</span>
              )}
              <span>{completedGames.length} completed</span>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            ) : games.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No games yet</p>
                <p className="text-sm">Start tracking games from the dashboard</p>
                <Button 
                  onClick={() => router.push('/dashboard/coach')}
                  className="mt-4"
                  size="sm"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Start Tracking
                </Button>
              </div>
            ) : (
              <>
                {/* In-Progress Games */}
                {inProgressGames.map((game) => (
                  <div
                    key={game.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(game.status)}
                        <span className="font-medium text-sm">vs {game.opponent_name}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-semibold">{game.home_score || 0} - {game.away_score || 0}</span>
                        <span className="mx-1">•</span>
                        <span>Q{game.quarter || 1}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push(`/stat-tracker-v3?gameId=${game.id}&coachMode=true&coachTeamId=${selectedTeamId}`)}
                      size="sm"
                      className="gap-2"
                    >
                      <PlayCircle className="w-3 h-3" />
                      Resume
                    </Button>
                  </div>
                ))}

                {/* Completed Games */}
                {completedGames.map((game) => (
                  <div
                    key={game.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(game.status)}
                        <span className="font-medium text-sm">vs {game.opponent_name}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-semibold">{game.home_score || 0} - {game.away_score || 0}</span>
                        <span className="mx-1">•</span>
                        <span>{formatGameTime(game)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => router.push(`/dashboard/coach/game/${game.id}`)}
                        size="sm"
                        variant="outline"
                        className="gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                      <Button
                        onClick={() => { setSelectedGame(game); setShowStats(true); }}
                        size="sm"
                        variant="outline"
                        className="gap-1"
                      >
                        <BarChart3 className="w-3 h-3" />
                        Stats
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Scheduled Games */}
                {scheduledGames.map((game) => (
                  <div
                    key={game.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(game.status)}
                        <span className="font-medium text-sm">vs {game.opponent_name}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatGameTime(game)}
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push(`/stat-tracker-v3?gameId=${game.id}&coachMode=true&coachTeamId=${selectedTeamId}`)}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      <PlayCircle className="w-3 h-3" />
                      Start
                    </Button>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Modal */}
      {showStats && selectedGame && selectedTeam && (
        <CoachGameStatsModal
          game={selectedGame}
          teamName={selectedTeam.name}
          onClose={() => { setShowStats(false); setSelectedGame(null); }}
        />
      )}
    </div>
  );
}

export default function CoachGamesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    }>
      <CoachGamesContent />
    </Suspense>
  );
}
