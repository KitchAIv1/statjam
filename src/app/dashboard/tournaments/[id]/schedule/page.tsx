'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { TournamentService, TeamService } from '@/lib/services/tournamentService';
import { GameService } from '@/lib/services/gameService';
import { Tournament, Team } from '@/lib/types/tournament';
import { Game } from '@/lib/types/game';
import { invalidateOrganizerDashboard, invalidateOrganizerGames } from '@/lib/utils/cache';
import { BracketService } from '@/lib/services/bracketService';
import { BracketVisualization } from '@/components/bracket/BracketVisualization';
import { DivisionBracketView } from '@/components/bracket/DivisionBracketView';
import { hybridSupabaseService } from '@/lib/services/hybridSupabaseService';
import { 
  Calendar, 
  ArrowLeft, 
  Plus, 
  Filter, 
  Clock, 
  MapPin, 
  Users, 
  User,
  Edit,
  AlertCircle,
  Trash2,
  Play,
  CheckCircle,
  X,
  Eye,
  Trophy
} from 'lucide-react';

interface GameSchedulePageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

const GameSchedulePage = ({ params }: GameSchedulePageProps) => {
  const { user, loading } = useAuthV2();
  const userRole = user?.role;
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [statAdmins, setStatAdmins] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'live' | 'completed'>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [showBracketBuilder, setShowBracketBuilder] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedule' | 'bracket'>('schedule');
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [pendingBracketConfig, setPendingBracketConfig] = useState<any>(null);
  
  const { id: tournamentId } = use(params);

  /**
   * Check if bracket can be regenerated for a specific division
   */
  const checkBracketRegenerationEligibility = React.useCallback((division?: string) => {
    // Filter games by division if specified
    const relevantGames = division
      ? games.filter(game => {
          const teamA = teams.find(t => t.id === game.team_a_id);
          const teamB = teams.find(t => t.id === game.team_b_id);
          return teamA?.division === division || teamB?.division === division;
        })
      : games;

    // Check if any games have started
    const hasStartedGames = relevantGames.some(g => 
      g.status === 'in_progress' || g.status === 'completed' || g.status === 'overtime'
    );
    
    // Check if bracket games exist
    const hasBracketGames = relevantGames.length > 0;
    
    if (hasStartedGames) {
      return {
        allowed: false,
        reason: 'Games have already started. Please edit individual games instead.',
        action: 'edit_only' as const,
        gamesToDelete: 0,
      };
    }
    
    if (hasBracketGames) {
      return {
        allowed: true,
        reason: `Existing bracket will be replaced. ${relevantGames.length} current bracket game${relevantGames.length !== 1 ? 's' : ''} will be deleted.`,
        action: 'regenerate_with_warning' as const,
        gamesToDelete: relevantGames.length,
      };
    }
    
    return {
      allowed: true,
      reason: null,
      action: 'generate_new' as const,
      gamesToDelete: 0,
    };
  }, [games, teams]);

  useEffect(() => {
    if (!loading && (!user || userRole !== 'organizer')) {
      router.push('/auth');
      return;
    }

    const loadData = async () => {
      try {
        setLoadingData(true);
        
        // Load all data in parallel for better performance
        const [tournamentData, teamsData, gamesData, statAdminsData] = await Promise.all([
          TournamentService.getTournament(tournamentId),
          TeamService.getTeamsByTournament(tournamentId),
          GameService.getGamesByTournament(tournamentId),
          TeamService.getStatAdmins()
        ]);
        
        // Set all data at once
        setTournament(tournamentData);
        setTeams(teamsData);
        setGames(gamesData);
        setStatAdmins(statAdminsData);
        
        console.log('🔍 Schedule Page: Loaded all data in parallel:', {
          teams: teamsData.length,
          games: gamesData.length,
          statAdmins: statAdminsData.length
        });
        
      } catch (error) {
        console.error('Failed to load tournament data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, userRole, loading, tournamentId, router]);

  // Real-time subscription for bracket auto-progression
  useEffect(() => {
    if (!tournamentId || !user) return;

    console.log('🔌 Schedule Page: Setting up real-time subscription for tournament:', tournamentId);

    // Subscribe to game updates for this tournament
    const unsubscribe = hybridSupabaseService.subscribe(
      'games',
      `tournament_id=eq.${tournamentId}`,
      (payload: any) => {
        console.log('🔄 Schedule Page: Game updated via real-time:', payload);
        
        // Reload games to get latest state
        GameService.getGamesByTournament(tournamentId)
          .then((updatedGames) => {
            setGames(updatedGames);
            console.log('✅ Schedule Page: Bracket updated with latest games');
          })
          .catch((error) => {
            console.error('❌ Schedule Page: Failed to reload games after update:', error);
          });
      },
      { fallbackToPolling: true, pollingInterval: 5000 } // Poll every 5 seconds as fallback
    );

    return () => {
      console.log('🔌 Schedule Page: Cleaning up real-time subscription');
      unsubscribe();
    };
  }, [tournamentId, user]);

  const handleCreateGame = () => {
    setSelectedGame(null);
    setShowCreateGame(true);
  };

  const handleEditGame = (game: Game) => {
    setSelectedGame(game);
    setShowCreateGame(true);
  };

  const filteredGames = games.filter(game => {
    if (filterStatus !== 'all' && game.status !== filterStatus) return false;
    if (filterDate && !game.start_time.startsWith(filterDate)) return false;
    return true;
  });

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30 pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto animate-pulse">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-9 bg-muted rounded w-40 mb-6"></div>
            <div className="flex justify-between items-start gap-6 flex-wrap mb-6">
              <div className="flex-1 min-w-[300px]">
                <div className="h-10 bg-muted rounded w-80 mb-2"></div>
                <div className="h-6 bg-muted rounded w-96"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-12 bg-muted rounded w-36"></div>
                <div className="h-12 bg-muted rounded w-40"></div>
              </div>
            </div>
          </div>

          {/* Filters Skeleton */}
          <div className="bg-muted/50 rounded-2xl p-6 mb-6 border border-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-10 bg-muted rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Games List Skeleton */}
          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
            <div className="h-6 bg-muted rounded w-48 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-6 border rounded-xl">
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-muted rounded w-40"></div>
                    <div className="flex items-center gap-4">
                      <div className="h-6 bg-muted rounded w-32"></div>
                      <div className="h-4 bg-muted rounded w-8"></div>
                      <div className="h-6 bg-muted rounded w-32"></div>
                    </div>
                    <div className="flex gap-4">
                      <div className="h-4 bg-muted rounded w-32"></div>
                      <div className="h-4 bg-muted rounded w-28"></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-9 bg-muted rounded w-9"></div>
                    <div className="h-9 bg-muted rounded w-9"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/50 via-background to-red-50/30">
        <div className="text-lg">Tournament not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30 pt-24 pb-12 px-6 animate-fadeIn">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard?section=tournaments')}
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tournaments
          </button>

          <div className="flex justify-between items-start gap-6 flex-wrap mb-6">
            <div className="flex-1 min-w-[300px]">
              <h1 className="text-4xl font-bold mb-2">Game Schedule</h1>
              <p className="text-lg text-muted-foreground">{tournament.name} - Manage tournament fixtures</p>
            </div>

            <div className="flex gap-3 items-center relative">
              <button
                onClick={handleCreateGame}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Schedule Game
              </button>
              
              {(() => {
                const eligibility = checkBracketRegenerationEligibility();
                const buttonText = eligibility.action === 'regenerate_with_warning' 
                  ? 'Regenerate Bracket' 
                  : 'Generate Bracket';
                
                return (
                  <div className="relative">
                    <button
                      onClick={() => {
                        if (eligibility.action === 'regenerate_with_warning') {
                          // Will be handled by BracketBuilderModal
                          setShowBracketBuilder(true);
                        } else if (eligibility.allowed) {
                          setShowBracketBuilder(true);
                        }
                      }}
                      disabled={!eligibility.allowed}
                      className={`
                        flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors
                        ${eligibility.allowed
                          ? 'border border-orange-300 text-orange-600 hover:bg-orange-50'
                          : 'border border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50'
                        }
                      `}
                      title={eligibility.allowed ? undefined : (eligibility.reason || '')}
                    >
                      <Calendar className="w-4 h-4" />
                      {buttonText}
                    </button>
                    {!eligibility.allowed && (
                      <div className="absolute top-full left-0 mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700 max-w-xs shadow-lg z-10 whitespace-normal">
                        <div className="font-semibold mb-1">Cannot Generate Bracket</div>
                        <div>{eligibility.reason}</div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'schedule'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Schedule
          </button>
          <button
            onClick={() => setActiveTab('bracket')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'bracket'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            Bracket
          </button>
        </div>

        {/* Schedule Tab Content */}
        {activeTab === 'schedule' && (
          <>
            {/* Filters */}
            <div className="bg-muted/50 rounded-2xl p-6 mb-6 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="all">All Games</option>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Teams</label>
              <div className="text-sm text-muted-foreground py-2.5">
                {teams.length} teams available
                {teams.length > 0 && (
                  <div className="text-xs mt-1">
                    {teams.slice(0, 3).map(team => team.name).join(', ')}
                    {teams.length > 3 && ` +${teams.length - 3} more`}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Games List */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              Scheduled Games ({filteredGames.length})
            </h2>
          </div>

          {filteredGames.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No games scheduled yet</h3>
              <p className="text-muted-foreground mb-6">
                Start by scheduling your first game. You'll need at least 2 teams to create a match.
              </p>
              {teams.length >= 2 ? (
                <button
                  onClick={handleCreateGame}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  Schedule First Game
                </button>
              ) : (
                <div className="text-sm text-muted-foreground">
                  <p className="mb-4">You need at least 2 teams to schedule games.</p>
                  <button
                    onClick={() => router.push(`/dashboard/tournaments/${tournamentId}/teams`)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-muted text-foreground rounded-lg font-semibold hover:bg-muted/80 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    Manage Teams
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  teams={teams}
                  tournament={tournament}
                  onEdit={() => handleEditGame(game)}
                  onDelete={async () => {
                    try {
                      await GameService.deleteGame(game.id);
                      const updatedGames = await GameService.getGamesByTournament(tournamentId);
                      setGames(updatedGames);
                      console.log('✅ Game deleted successfully');
                    } catch (error) {
                      console.error('Failed to delete game:', error);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
          </>
        )}

        {/* Bracket Tab Content */}
        {activeTab === 'bracket' && (
          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
            {/* Division Selector (if tournament has divisions) */}
            {tournament.has_divisions && tournament.division_names && tournament.division_names.length > 0 && (
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Division</label>
                <select
                  className="w-full max-w-xs px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  value={selectedDivision || 'all'}
                  onChange={(e) => setSelectedDivision(e.target.value === 'all' ? null : e.target.value)}
                >
                  <option value="all">All Divisions (Championship)</option>
                  {tournament.division_names.map(div => (
                    <option key={div} value={div}>Division {div}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Bracket Visualization */}
            {(() => {
              try {
                // If tournament has divisions and "All Divisions" is selected, show division view
                if (tournament.has_divisions && tournament.division_names && tournament.division_names.length > 0 && !selectedDivision) {
                  // Calculate brackets for each division
                  const divisionBrackets: Record<string, any> = {};
                  tournament.division_names.forEach(div => {
                    const divBracket = BracketService.calculateBracket({
                      games,
                      teams,
                      tournamentType: tournament.tournamentType,
                      division: div,
                    });
                    if (divBracket.rounds.length > 0) {
                      divisionBrackets[div] = divBracket;
                    }
                  });

                  // Calculate championship bracket (cross-division games only)
                  const championshipBracket = BracketService.calculateBracket({
                    games,
                    teams,
                    tournamentType: tournament.tournamentType,
                    division: undefined,
                    isChampionship: true, // Explicitly mark as championship bracket
                  });

                  // Check if any brackets exist
                  const hasAnyBrackets = Object.keys(divisionBrackets).length > 0 || championshipBracket.rounds.length > 0;

                  if (!hasAnyBrackets) {
                    return (
                      <div className="text-center py-16">
                        <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">No bracket generated yet</h3>
                        <p className="text-muted-foreground mb-6">
                          Generate brackets to visualize the tournament structure.
                        </p>
                        <button
                          onClick={() => {
                            setShowBracketBuilder(true);
                            setActiveTab('schedule');
                          }}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                        >
                          <Calendar className="w-4 h-4" />
                          Generate Bracket
                        </button>
                      </div>
                    );
                  }

                  return (
                    <DivisionBracketView
                      tournament={tournament}
                      games={games}
                      teams={teams}
                      divisionBrackets={divisionBrackets}
                      championshipBracket={championshipBracket.rounds.length > 0 ? championshipBracket : undefined}
                      onGameClick={(gameId) => {
                        const game = games.find(g => g.id === gameId);
                        if (game) {
                          handleEditGame(game);
                        }
                      }}
                    />
                  );
                }

                // Single bracket view (specific division or no divisions)
                const bracketStructure = BracketService.calculateBracket({
                  games,
                  teams,
                  tournamentType: tournament.tournamentType,
                  division: selectedDivision || undefined,
                });

                if (bracketStructure.rounds.length === 0) {
                  return (
                    <div className="text-center py-16">
                      <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No bracket generated yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Generate a bracket to visualize the tournament structure.
                      </p>
                      <button
                        onClick={() => {
                          setShowBracketBuilder(true);
                          setActiveTab('schedule');
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                      >
                        <Calendar className="w-4 h-4" />
                        Generate Bracket
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="bg-gradient-to-br from-orange-50/50 via-white/80 to-red-50/30 rounded-xl p-6 border border-orange-200/30 shadow-lg overflow-x-auto">
                    <BracketVisualization
                      structure={bracketStructure}
                      games={games}
                      teams={teams}
                      onGameClick={(gameId) => {
                        const game = games.find(g => g.id === gameId);
                        if (game) {
                          handleEditGame(game);
                        }
                      }}
                    />
                  </div>
                );
              } catch (error) {
                console.error('Error calculating bracket:', error);
                return (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Error loading bracket. Please try again.</p>
                  </div>
                );
              }
            })()}
          </div>
        )}

        {/* Create/Edit Game Modal */}
        {showCreateGame && (
          <CreateGameModal
            tournament={tournament}
            teams={teams}
            statAdmins={statAdmins}
            game={selectedGame}
            onClose={() => setShowCreateGame(false)}
            onSave={async (gameData) => {
              try {
                if (selectedGame) {
                  // Update existing game
                  await GameService.updateGame(selectedGame.id, {
                    teamAId: gameData.teamAId,
                    teamBId: gameData.teamBId,
                    startTime: gameData.startTime,
                    venue: gameData.venue,
                    statAdminId: gameData.statAdminId || null,
                  });
                  console.log('✅ Game updated successfully');
                } else {
                  // Create new game
                  await GameService.createGame({
                    tournamentId: tournamentId,
                    teamAId: gameData.teamAId,
                    teamBId: gameData.teamBId,
                    startTime: gameData.startTime,
                    venue: gameData.venue,
                    statAdminId: gameData.statAdminId || null,
                  });
                  console.log('✅ Game created successfully');
                }
                
                // Reload games
                const updatedGames = await GameService.getGamesByTournament(tournamentId);
                setGames(updatedGames);
                setShowCreateGame(false);
                
                // ⚡ Invalidate caches after game create/update
                if (user?.id) {
                  invalidateOrganizerDashboard(user.id);
                  invalidateOrganizerGames(user.id);
                }
              } catch (error) {
                console.error('Failed to save game:', error);
                // TODO: Show error to user
              }
            }}
          />
        )}

        {/* Bracket Builder Modal */}
        {showBracketBuilder && (
          <BracketBuilderModal
            tournament={tournament}
            teams={teams}
            games={games}
            checkEligibility={checkBracketRegenerationEligibility}
            onClose={() => {
              setShowBracketBuilder(false);
              setShowRegenerateConfirm(false);
              setPendingBracketConfig(null);
            }}
            onGenerate={async (bracketConfig) => {
              try {
                console.log('🔍 Generating bracket with config:', bracketConfig);
                
                // Check eligibility for the specific division
                const eligibility = checkBracketRegenerationEligibility(bracketConfig.division);
                
                // If regeneration needed, show confirmation first
                if (eligibility.action === 'regenerate_with_warning' && !showRegenerateConfirm) {
                  setPendingBracketConfig(bracketConfig);
                  setShowRegenerateConfirm(true);
                  return; // Wait for user confirmation
                }
                
                // Log division information if available
                if (bracketConfig.division) {
                  console.log(`📊 Generating bracket for Division ${bracketConfig.division}`);
                } else if (bracketConfig.isChampionship) {
                  console.log('🏆 Generating championship bracket (all divisions)');
                }
                
                // Delete existing games for this division if regenerating
                if (eligibility.action === 'regenerate_with_warning' && eligibility.gamesToDelete > 0) {
                  const gamesToDelete = bracketConfig.division
                    ? games.filter(game => {
                        const teamA = teams.find(t => t.id === game.team_a_id);
                        const teamB = teams.find(t => t.id === game.team_b_id);
                        return teamA?.division === bracketConfig.division || teamB?.division === bracketConfig.division;
                      })
                    : games; // Delete all games if championship bracket
                  
                  console.log(`🗑️ Deleting ${gamesToDelete.length} existing bracket games...`);
                  for (const game of gamesToDelete) {
                    await GameService.deleteGame(game.id);
                  }
                  console.log('✅ Existing games deleted');
                }
                
                // Generate games based on bracket configuration
                const generatedGames = generateBracketGames(
                  bracketConfig.tournamentType,
                  bracketConfig.teams,
                  bracketConfig.startDate,
                  bracketConfig.venue,
                  tournamentId
                );
                
                console.log(`✅ Generated ${generatedGames.length} games for bracket`);
                
                // Create all games in the database
                for (const gameData of generatedGames) {
                  await GameService.createGame(gameData);
                }
                
                // Reload games
                const updatedGames = await GameService.getGamesByTournament(tournamentId);
                setGames(updatedGames);
                setShowBracketBuilder(false);
                setShowRegenerateConfirm(false);
                setPendingBracketConfig(null);
                
                // ⚡ Invalidate caches after bracket generation
                if (user?.id) {
                  invalidateOrganizerDashboard(user.id);
                  invalidateOrganizerGames(user.id);
                }
                
                console.log('✅ Bracket generated successfully');
              } catch (error) {
                console.error('Failed to generate bracket:', error);
                alert('Failed to generate bracket. Please try again.');
              }
            }}
          />
        )}

        {/* Regeneration Confirmation Modal */}
        {showRegenerateConfirm && pendingBracketConfig && (
          <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1001]"
            onClick={() => {
              setShowRegenerateConfirm(false);
              setPendingBracketConfig(null);
            }}
          >
            <div 
              className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Regenerate Bracket?
              </h3>
              <p className="text-gray-700 mb-2">
                {(() => {
                  const eligibility = checkBracketRegenerationEligibility(pendingBracketConfig.division);
                  return eligibility.reason || 'This will replace the existing bracket.';
                })()}
              </p>
              <p className="text-sm text-orange-600 font-medium mb-6">
                ⚠️ This action cannot be undone. All existing bracket games will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRegenerateConfirm(false);
                    setPendingBracketConfig(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    // Trigger the actual generation
                    const onGenerate = async (config: any) => {
                      try {
                        // Delete existing games
                        const gamesToDelete = config.division
                          ? games.filter(game => {
                              const teamA = teams.find(t => t.id === game.team_a_id);
                              const teamB = teams.find(t => t.id === game.team_b_id);
                              return teamA?.division === config.division || teamB?.division === config.division;
                            })
                          : games;
                        
                        for (const game of gamesToDelete) {
                          await GameService.deleteGame(game.id);
                        }
                        
                        // Generate new games
                        const generatedGames = generateBracketGames(
                          config.tournamentType,
                          config.teams,
                          config.startDate,
                          config.venue,
                          tournamentId
                        );
                        
                        for (const gameData of generatedGames) {
                          await GameService.createGame(gameData);
                        }
                        
                        const updatedGames = await GameService.getGamesByTournament(tournamentId);
                        setGames(updatedGames);
                        setShowBracketBuilder(false);
                        setShowRegenerateConfirm(false);
                        setPendingBracketConfig(null);
                        
                        if (user?.id) {
                          invalidateOrganizerDashboard(user.id);
                          invalidateOrganizerGames(user.id);
                        }
                      } catch (error) {
                        console.error('Failed to regenerate bracket:', error);
                        alert('Failed to regenerate bracket. Please try again.');
                      }
                    };
                    
                    await onGenerate(pendingBracketConfig);
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Delete & Regenerate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Create Game Modal Component - Modern Design
function CreateGameModal({ 
  tournament, 
  teams, 
  statAdmins, 
  game, 
  onClose, 
  onSave 
}: { 
  tournament: Tournament; 
  teams: Team[]; 
  statAdmins: { id: string; name: string; email: string }[]; 
  game: Game | null; 
  onClose: () => void; 
  onSave: (data: any) => void; 
}) {
  // Filter teams with at least 5 players (minimum required for a game)
  const eligibleTeams = teams.filter(team => team.players && team.players.length >= 5);
  const ineligibleTeams = teams.filter(team => !team.players || team.players.length < 5);
  
  console.log('🔍 CreateGameModal: Received teams:', teams.length, 'teams');
  console.log('   Eligible teams (5+ players):', eligibleTeams.length);
  console.log('   Ineligible teams (< 5 players):', ineligibleTeams.length);
  eligibleTeams.forEach((team, index) => {
    console.log(`   ✅ ${team.name} (${team.players?.length || 0} players)`);
  });
  ineligibleTeams.forEach((team, index) => {
    console.log(`   ❌ ${team.name} (${team.players?.length || 0} players)`);
  });
  
  console.log('🔍 CreateGameModal: Received statAdmins:', statAdmins.length, 'admins');
  
  // Helper function to format date for datetime-local input (converts UTC to local)
  const formatDateTimeLocal = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper function to convert datetime-local value to ISO string (local time to UTC)
  const convertLocalToISO = (localDateTime: string): string => {
    if (!localDateTime) return '';
    // datetime-local format: "YYYY-MM-DDTHH:mm"
    // Create a date object treating it as local time
    const localDate = new Date(localDateTime);
    // Check if date is valid
    if (isNaN(localDate.getTime())) return '';
    // Return ISO string (will be in UTC)
    return localDate.toISOString();
  };
  
  const minDate = formatDateTimeLocal(tournament.startDate);
  const maxDate = formatDateTimeLocal(tournament.endDate);
  
  // Debug tournament dates
  console.log('🔍 Tournament dates for date picker constraints:');
  console.log('   Start Date:', tournament.startDate);
  console.log('   End Date:', tournament.endDate);
  console.log('   Min constraint (formatted):', minDate);
  console.log('   Max constraint (formatted):', maxDate);
  
  const [formData, setFormData] = useState({
    teamAId: game?.team_a_id || '',
    teamBId: game?.team_b_id || '',
    startTime: game?.start_time ? formatDateTimeLocal(game.start_time) : minDate,
    venue: game?.venue || tournament.venue || '',
    statAdminId: game?.stat_admin_id || '',
  });

  const [showValidation, setShowValidation] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Show validation if form is incomplete
    if (!isFormValid) {
      setShowValidation(true);
      return;
    }
    
    // Convert datetime-local to ISO string for storage
    const isoStartTime = convertLocalToISO(formData.startTime);
    
    // Validate date is within tournament range
    const gameDate = new Date(isoStartTime);
    const tournamentStart = new Date(tournament.startDate);
    const tournamentEnd = new Date(tournament.endDate);
    
    if (gameDate < tournamentStart || gameDate > tournamentEnd) {
      alert(`Game date must be between ${tournament.startDate.split('T')[0]} and ${tournament.endDate.split('T')[0]}`);
      return;
    }
    
    // Pass ISO string to onSave
    onSave({
      ...formData,
      startTime: isoStartTime
    });
  };

  const isFormValid = formData.teamAId && formData.teamBId && formData.startTime && formData.venue;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeInUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              {game ? 'Edit Game' : 'Schedule New Game'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Warning if teams are filtered */}
          {ineligibleTeams.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-900 mb-1">
                    {ineligibleTeams.length} {ineligibleTeams.length === 1 ? 'team' : 'teams'} hidden
                  </p>
                  <p className="text-sm text-orange-800 mb-3">
                    Teams with fewer than 5 players cannot be scheduled for games.
                    {eligibleTeams.length === 0 && ' You need at least 2 teams with 5+ players to create a game.'}
                  </p>
                  <details className="text-xs text-orange-700">
                    <summary className="cursor-pointer hover:text-orange-900 font-medium mb-2">
                      View incomplete teams ({ineligibleTeams.length})
                    </summary>
                    <ul className="mt-2 space-y-1 ml-4 text-orange-600">
                      {ineligibleTeams.map(team => (
                        <li key={team.id}>
                          • {team.name} ({team.players?.length || 0}/5 players)
                        </li>
                      ))}
                    </ul>
                  </details>
                  <button
                    type="button"
                    onClick={() => window.location.href = `/dashboard/tournaments/${tournament.id}/teams`}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-orange-700 hover:text-orange-900 transition-colors"
                  >
                    Manage Teams →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Team Selection Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Team A */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Users className="w-4 h-4 text-orange-600" />
                Team A
                <span className="text-xs text-muted-foreground">({eligibleTeams.length} available)</span>
              </label>
              <select
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                value={formData.teamAId}
                onChange={(e) => setFormData(prev => ({ ...prev, teamAId: e.target.value }))}
                required
                disabled={eligibleTeams.length === 0}
              >
                <option value="">
                  {eligibleTeams.length === 0 ? 'No teams with 5+ players' : 'Select Team A'}
                </option>
                {eligibleTeams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.players?.length || 0} players)
                  </option>
                ))}
              </select>
            </div>

            {/* Team B */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Users className="w-4 h-4 text-red-600" />
                Team B
                <span className="text-xs text-muted-foreground">
                  ({eligibleTeams.filter(team => team.id !== formData.teamAId).length} available)
                </span>
              </label>
              <select
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                value={formData.teamBId}
                onChange={(e) => setFormData(prev => ({ ...prev, teamBId: e.target.value }))}
                required
                disabled={eligibleTeams.length < 2}
              >
                <option value="">
                  {eligibleTeams.length < 2 ? 'Need 2+ teams with 5+ players' : 'Select Team B'}
                </option>
                {eligibleTeams.filter(team => team.id !== formData.teamAId).map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.players?.length || 0} players)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="w-4 h-4 text-orange-600" />
              Date & Time
              <span className="text-xs text-orange-600 font-normal">
                ({tournament.startDate.split('T')[0]} to {tournament.endDate.split('T')[0]})
              </span>
            </label>
            <input
              type="datetime-local"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              value={formData.startTime}
              onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              min={minDate}
              max={maxDate}
              required
            />
          </div>

          {/* Venue */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MapPin className="w-4 h-4 text-orange-600" />
              Venue
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              value={formData.venue}
              onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
              placeholder="Enter venue location"
              required
            />
          </div>

          {/* Stat Admin */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <User className="w-4 h-4 text-orange-600" />
              Stat Admin
              <span className="text-xs text-muted-foreground">(Optional)</span>
            </label>
            <select
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              value={formData.statAdminId}
              onChange={(e) => setFormData(prev => ({ ...prev, statAdminId: e.target.value }))}
            >
              <option value="">Assign later</option>
              {statAdmins.map(admin => (
                <option key={admin.id} value={admin.id}>
                  {admin.name} ({admin.email})
                </option>
              ))}
            </select>
          </div>

          {/* Validation Warning - Only show after submit attempt */}
          {showValidation && !isFormValid && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900 mb-2">Required fields missing:</p>
                  <ul className="text-sm text-red-800 space-y-1">
                    {!formData.teamAId && <li>• Select Team A</li>}
                    {!formData.teamBId && <li>• Select Team B</li>}
                    {!formData.startTime && <li>• Select Date & Time</li>}
                    {!formData.venue && <li>• Enter Venue</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                console.log('🔍 Schedule Game button validation:', {
                  teamAId: formData.teamAId,
                  teamBId: formData.teamBId, 
                  startTime: formData.startTime,
                  venue: formData.venue,
                  isValid: isFormValid
                });
              }}
            >
              {game ? 'Update Game' : 'Schedule Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Game Card Component
function GameCard({ 
  game, 
  teams, 
  tournament,
  onEdit, 
  onDelete 
}: { 
  game: Game; 
  teams: Team[]; 
  tournament?: Tournament | null;
  onEdit: () => void; 
  onDelete: () => void; 
}) {
  const router = useRouter();
  const teamA = teams.find(t => t.id === game.team_a_id);
  const teamB = teams.find(t => t.id === game.team_b_id);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return { bg: '#dbeafe', text: '#1e40af' };
      case 'in_progress': return { bg: '#dcfce7', text: '#166534' };
      case 'completed': return { bg: '#f3f4f6', text: '#374151' };
      case 'cancelled': return { bg: '#fee2e2', text: '#dc2626' };
      default: return { bg: '#f9fafb', text: '#6b7280' };
    }
  };

  const statusColors = getStatusColor(game.status);

  const styles = {
    card: {
      background: '#ffffff',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #e5e7eb',
      transition: 'all 0.2s ease',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    },
    cardHover: {
      background: '#ffffff',
      borderColor: '#f97316',
      transform: 'translateY(-1px)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '16px',
    },
    matchup: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flex: 1,
    },
    team: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f2937',
    },
    vs: {
      color: '#6b7280',
      fontSize: '14px',
      fontWeight: '500',
    },
    status: {
      background: statusColors.bg,
      color: statusColors.text,
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase' as const,
    },
    details: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '16px',
      marginBottom: '16px',
    },
    detail: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#6b7280',
      fontSize: '14px',
    },
    actions: {
      display: 'flex',
      gap: '8px',
      justifyContent: 'flex-end',
    },
    actionButton: {
      background: '#f9fafb',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      padding: '8px 12px',
      color: '#374151',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      transition: 'all 0.2s ease',
    },
    editButton: {
      background: '#fef3c7',
      borderColor: '#f59e0b',
      color: '#92400e',
    },
    deleteButton: {
      background: '#fee2e2',
      borderColor: '#ef4444',
      color: '#dc2626',
    },
  };

  return (
    <div
      style={styles.card}
      onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHover)}
      onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.card)}
    >
      <div style={styles.header}>
        <div style={styles.matchup}>
          <div style={styles.team}>
            {teamA?.name || 'Team A'}
          </div>
          <div style={styles.vs}>vs</div>
          <div style={styles.team}>
            {teamB?.name || 'Team B'}
          </div>
        </div>
        <div style={styles.status}>
          {game.status}
        </div>
      </div>

      <div style={styles.details}>
        <div style={styles.detail}>
          <Clock style={{ width: '16px', height: '16px' }} />
          {formatDate(game.start_time)}
        </div>
        <div style={styles.detail}>
          <MapPin style={{ width: '16px', height: '16px' }} />
          Venue: {game.venue || tournament?.venue || 'TBD'}
        </div>
        {game.stat_admin_id && (
          <div style={styles.detail}>
            <User style={{ width: '16px', height: '16px' }} />
            Stat Admin Assigned
          </div>
        )}
      </div>

      <div style={styles.actions}>
        <button
          style={{ 
            ...styles.actionButton, 
            background: '#dbeafe', 
            borderColor: '#3b82f6', 
            color: '#1e40af' 
          }}
          onClick={() => router.push(`/game-viewer/${game.id}`)}
        >
          <Eye style={{ width: '14px', height: '14px', marginRight: '4px' }} />
          View
        </button>
        <button
          style={{ ...styles.actionButton, ...styles.editButton }}
          onClick={onEdit}
        >
          <Edit style={{ width: '14px', height: '14px', marginRight: '4px' }} />
          Edit
        </button>
        <button
          style={{ ...styles.actionButton, ...styles.deleteButton }}
          onClick={onDelete}
        >
          <Trash2 style={{ width: '14px', height: '14px', marginRight: '4px' }} />
          Delete
        </button>
      </div>
    </div>
  );
}

// Bracket Builder Modal Component
function BracketBuilderModal({ 
  tournament, 
  teams,
  games,
  checkEligibility,
  onClose, 
  onGenerate 
}: { 
  tournament: Tournament; 
  teams: Team[];
  games: Game[];
  checkEligibility: (division?: string) => {
    allowed: boolean;
    reason: string | null;
    action: 'generate_new' | 'regenerate_with_warning' | 'edit_only';
    gamesToDelete: number;
  };
  onClose: () => void; 
  onGenerate: (config: any) => void; 
}) {
  // Helper function to format date for datetime-local input (converts UTC to local)
  const formatDateTimeLocal = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper function to convert datetime-local value to ISO string (local time to UTC)
  const convertLocalToISO = (localDateTime: string): string => {
    if (!localDateTime) return '';
    // datetime-local format: "YYYY-MM-DDTHH:mm"
    // Create a date object treating it as local time
    const localDate = new Date(localDateTime);
    // Check if date is valid
    if (isNaN(localDate.getTime())) return '';
    // Return ISO string (will be in UTC)
    return localDate.toISOString();
  };

  const minDate = formatDateTimeLocal(tournament.startDate);
  const maxDate = formatDateTimeLocal(tournament.endDate);

  // Initialize division selection: default to first division if tournament has divisions
  const divisionOptions = React.useMemo(() => {
    if (!tournament.has_divisions) return [];
    
    if (tournament.division_names && tournament.division_names.length > 0) {
      return tournament.division_names;
    }
    
    const count = tournament.division_count || 2;
    return Array.from({ length: count }, (_, i) => 
      String.fromCharCode(65 + i)
    );
  }, [tournament]);

  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  
  // Set initial division selection after divisionOptions is computed
  React.useEffect(() => {
    if (selectedDivision === null && tournament.has_divisions && divisionOptions.length > 0) {
      // Default to first division if tournament has divisions
      setSelectedDivision(divisionOptions[0]);
    }
  }, [tournament.has_divisions, divisionOptions.length]);
  
  // Filter teams by selected division
  const availableTeams = React.useMemo(() => {
    if (!tournament.has_divisions || !selectedDivision) {
      return teams;
    }
    return teams.filter(team => team.division === selectedDivision);
  }, [teams, tournament.has_divisions, selectedDivision]);

  const [seedingMethod, setSeedingMethod] = useState<'manual' | 'tournament_record' | 'historical_record' | 'random'>('manual');
  const [manualSeeds, setManualSeeds] = useState<Record<string, number>>({}); // teamId -> seed number
  const [showSeeding, setShowSeeding] = useState(false);

  const [bracketConfig, setBracketConfig] = useState({
    tournamentType: tournament.tournamentType,
    selectedTeams: [] as Team[], // Will be initialized in useEffect
    startDate: minDate, // Start with tournament start date
    venue: tournament.venue,
    gamesPerDay: 2,
    daysBetweenGames: 1,
  });

  // Initialize and reset selected teams when division or available teams change
  React.useEffect(() => {
    const initialTeams = availableTeams.slice(0, Math.min(availableTeams.length, 8));
    setBracketConfig(prev => ({
      ...prev,
      // Filter out any teams that don't belong to the selected division
      selectedTeams: prev.selectedTeams
        .filter(team => {
          if (!tournament.has_divisions || !selectedDivision) return true;
          return team.division === selectedDivision;
        })
        .filter(team => availableTeams.some(t => t.id === team.id))
        .concat(
          // Add new teams if we have space
          initialTeams.filter(t => !prev.selectedTeams.some(st => st.id === t.id))
        )
        .slice(0, Math.min(availableTeams.length, 8))
    }));
    
    // Initialize manual seeds when teams change
    if (seedingMethod === 'manual') {
      const newSeeds: Record<string, number> = {};
      const teamsToSeed = bracketConfig.selectedTeams.length > 0 
        ? bracketConfig.selectedTeams 
        : initialTeams;
      teamsToSeed.forEach((team, idx) => {
        newSeeds[team.id] = manualSeeds[team.id] || idx + 1;
      });
      setManualSeeds(newSeeds);
    }
  }, [selectedDivision, availableTeams.length, tournament.has_divisions]);

  // Auto-seed when method changes
  React.useEffect(() => {
    if (seedingMethod !== 'manual' && bracketConfig.selectedTeams.length > 0) {
      const seeds = BracketService.calculateSeeding({
        teams: bracketConfig.selectedTeams,
        method: seedingMethod,
      });
      const seedMap: Record<string, number> = {};
      seeds.forEach(s => {
        seedMap[s.teamId] = s.seed;
      });
      setManualSeeds(seedMap);
    }
  }, [seedingMethod, bracketConfig.selectedTeams.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate minimum teams
    if (bracketConfig.selectedTeams.length < 2) {
      alert('Please select at least 2 teams to generate a bracket');
      return;
    }

    // Check eligibility for regeneration
    const eligibility = checkEligibility(selectedDivision || undefined);
    
    // If games have started, block generation
    if (!eligibility.allowed) {
      alert(eligibility.reason || 'Cannot generate bracket at this time.');
      return;
    }
    
    // Validate division consistency: if a division is selected, all teams must belong to it
    if (tournament.has_divisions && selectedDivision) {
      const invalidTeams = bracketConfig.selectedTeams.filter(
        team => team.division !== selectedDivision
      );
      
      if (invalidTeams.length > 0) {
        alert(
          `All selected teams must belong to Division ${selectedDivision}. ` +
          `Please remove: ${invalidTeams.map(t => t.name).join(', ')}`
        );
        return;
      }
    }
    
    // Validate championship bracket: if "All Divisions" is selected, warn if not all divisions are represented
    if (tournament.has_divisions && !selectedDivision) {
      const divisionsInBracket = new Set(
        bracketConfig.selectedTeams
          .map(t => t.division)
          .filter(d => d && d !== '')
      );
      
      const allDivisions = new Set(divisionOptions);
      
      if (divisionsInBracket.size < allDivisions.size) {
        const missingDivisions = Array.from(allDivisions).filter(d => !divisionsInBracket.has(d));
        const proceed = confirm(
          `Championship bracket selected, but not all divisions are represented.\n\n` +
          `Missing divisions: ${missingDivisions.join(', ')}\n\n` +
          `Do you want to proceed anyway?`
        );
        if (!proceed) return;
      }
    }
    
    // Convert datetime-local to ISO string for storage
    const isoStartDate = convertLocalToISO(bracketConfig.startDate);
    
    // Validate date is within tournament range
    const bracketStartDate = new Date(isoStartDate);
    const tournamentStart = new Date(tournament.startDate);
    const tournamentEnd = new Date(tournament.endDate);
    
    if (bracketStartDate < tournamentStart || bracketStartDate > tournamentEnd) {
      alert(`Bracket start date must be between ${tournament.startDate.split('T')[0]} and ${tournament.endDate.split('T')[0]}`);
      return;
    }
    
    // Apply seeding to teams before generating bracket
    const seeds = seedingMethod === 'manual'
      ? Object.entries(manualSeeds).map(([teamId, seed]) => ({ teamId, seed }))
      : BracketService.calculateSeeding({
          teams: bracketConfig.selectedTeams,
          method: seedingMethod,
        }).map(s => ({ teamId: s.teamId, seed: s.seed }));
    
    const seededTeams = BracketService.applySeedingToBracket(
      bracketConfig.selectedTeams,
      seeds
    );

    onGenerate({
      tournamentType: bracketConfig.tournamentType,
      teams: seededTeams, // Use seeded teams
      startDate: isoStartDate, // Pass ISO string
      venue: bracketConfig.venue,
      gamesPerDay: bracketConfig.gamesPerDay,
      daysBetweenGames: bracketConfig.daysBetweenGames,
      division: selectedDivision, // Pass division info for logging/debugging
      isChampionship: tournament.has_divisions && !selectedDivision, // Flag for championship bracket
      seedingMethod, // Pass seeding method for reference
    });
  };

  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
      borderRadius: '16px',
      padding: '32px',
      width: '90%',
      maxWidth: '600px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      maxHeight: '90vh',
      overflowY: 'auto' as const,
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '24px',
      textAlign: 'center' as const,
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '20px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#ffffff',
    },
    select: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      padding: '12px',
      color: '#ffffff',
      fontSize: '14px',
      outline: 'none',
    },
    input: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      padding: '12px',
      color: '#ffffff',
      fontSize: '14px',
      outline: 'none',
    },
    teamsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '12px',
      maxHeight: '200px',
      overflowY: 'auto' as const,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '12px',
    },
    teamItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '6px',
      fontSize: '14px',
    },
    checkbox: {
      width: '16px',
      height: '16px',
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      marginTop: '24px',
    },
    cancelButton: {
      flex: 1,
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      padding: '12px 24px',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
    },
    generateButton: {
      flex: 1,
      background: 'linear-gradient(135deg, #9D4EDD, #7B2CBF)',
      border: 'none',
      borderRadius: '12px',
      padding: '12px 24px',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
    },
    info: {
      background: 'rgba(157, 78, 221, 0.1)',
      border: '1px solid rgba(157, 78, 221, 0.3)',
      borderRadius: '8px',
      padding: '16px',
      fontSize: '14px',
      color: '#b3b3b3',
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>Generate Tournament Bracket</h2>
        
        <form style={styles.form} onSubmit={handleSubmit}>
          {/* Division Selector (if tournament uses divisions) */}
          {tournament.has_divisions && divisionOptions.length > 0 && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Division</label>
              <select
                style={styles.select}
                value={selectedDivision || 'all'}
                onChange={(e) => {
                  const div = e.target.value === 'all' ? null : e.target.value;
                  setSelectedDivision(div);
                }}
              >
                <option value="all">All Divisions (Championship)</option>
                {divisionOptions.map(div => (
                  <option key={div} value={div}>Division {div}</option>
                ))}
              </select>
              <p style={{ fontSize: '12px', color: '#9D4EDD', marginTop: '4px' }}>
                {selectedDivision 
                  ? `Showing teams from Division ${selectedDivision} only (${availableTeams.length} teams)`
                  : `Showing all teams for championship bracket (${availableTeams.length} teams)`}
              </p>
              {!selectedDivision && tournament.has_divisions && (
                <p style={{ fontSize: '11px', color: '#FFA500', marginTop: '4px', fontStyle: 'italic' }}>
                  ⚠️ Championship bracket: Ensure all divisions are represented or only division winners advance
                </p>
              )}
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Tournament Format</label>
            <select
              style={styles.select}
              value={bracketConfig.tournamentType}
              onChange={(e) => setBracketConfig(prev => ({ 
                ...prev, 
                tournamentType: e.target.value as any 
              }))}
            >
              <option value="single_elimination">Single Elimination</option>
              <option value="double_elimination">Double Elimination</option>
              <option value="round_robin">Round Robin</option>
            </select>
          </div>

          {/* Seeding Section */}
          {bracketConfig.selectedTeams.length > 0 && (
            <div style={styles.formGroup}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={styles.label}>Team Seeding</label>
                <button
                  type="button"
                  onClick={() => setShowSeeding(!showSeeding)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    color: '#ffffff',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {showSeeding ? 'Hide' : 'Show'} Seeding
                </button>
              </div>
              
              {showSeeding && (
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  borderRadius: '8px', 
                  padding: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  {/* Seeding Method Selector */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ ...styles.label, fontSize: '12px', marginBottom: '4px' }}>
                      Seeding Method
                    </label>
                    <select
                      style={styles.select}
                      value={seedingMethod}
                      onChange={(e) => setSeedingMethod(e.target.value as any)}
                    >
                      <option value="manual">Manual (Edit Below)</option>
                      <option value="tournament_record">Tournament Record</option>
                      <option value="historical_record">Historical Record</option>
                      <option value="random">Random</option>
                    </select>
                    {seedingMethod !== 'manual' && (
                      <p style={{ fontSize: '11px', color: '#9D4EDD', marginTop: '4px' }}>
                        {(() => {
                          const seeds = BracketService.calculateSeeding({
                            teams: bracketConfig.selectedTeams,
                            method: seedingMethod,
                          });
                          return seeds.length > 0 ? `Seeded by: ${seeds[0].basis}` : '';
                        })()}
                      </p>
                    )}
                  </div>

                  {/* Manual Seed Editor */}
                  {seedingMethod === 'manual' && (
                    <div>
                      <label style={{ ...styles.label, fontSize: '12px', marginBottom: '8px' }}>
                        Drag teams or edit seed numbers (1 = best seed)
                      </label>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '8px',
                        maxHeight: '200px',
                        overflowY: 'auto' as const,
                        padding: '8px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '6px'
                      }}>
                        {[...bracketConfig.selectedTeams]
                          .sort((a, b) => (manualSeeds[a.id] || 999) - (manualSeeds[b.id] || 999))
                          .map((team, idx) => (
                            <div 
                              key={team.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '8px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '6px',
                              }}
                            >
                              <span style={{ 
                                color: '#9D4EDD', 
                                fontSize: '12px', 
                                fontWeight: '600',
                                minWidth: '30px'
                              }}>
                                #{manualSeeds[team.id] || idx + 1}
                              </span>
                              <input
                                type="number"
                                min="1"
                                max={bracketConfig.selectedTeams.length}
                                value={manualSeeds[team.id] || idx + 1}
                                onChange={(e) => {
                                  const newSeed = parseInt(e.target.value) || 1;
                                  setManualSeeds(prev => ({
                                    ...prev,
                                    [team.id]: Math.max(1, Math.min(bracketConfig.selectedTeams.length, newSeed))
                                  }));
                                }}
                                style={{
                                  width: '50px',
                                  padding: '4px 8px',
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  borderRadius: '4px',
                                  color: '#ffffff',
                                  fontSize: '12px',
                                }}
                              />
                              <span style={{ color: '#ffffff', fontSize: '13px', flex: 1 }}>
                                {team.name}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Auto-Seeding Display */}
                  {seedingMethod !== 'manual' && (
                    <div>
                      <label style={{ ...styles.label, fontSize: '12px', marginBottom: '8px' }}>
                        Seeding Order
                      </label>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '6px',
                        maxHeight: '200px',
                        overflowY: 'auto' as const,
                        padding: '8px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '6px'
                      }}>
                        {(() => {
                          const seeds = BracketService.calculateSeeding({
                            teams: bracketConfig.selectedTeams,
                            method: seedingMethod,
                          });
                          return seeds.map((seed) => {
                            const team = bracketConfig.selectedTeams.find(t => t.id === seed.teamId);
                            return (
                              <div 
                                key={seed.teamId}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '6px',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  borderRadius: '4px',
                                }}
                              >
                                <span style={{ 
                                  color: '#9D4EDD', 
                                  fontSize: '12px', 
                                  fontWeight: '600',
                                  minWidth: '30px'
                                }}>
                                  #{seed.seed}
                                </span>
                                <span style={{ color: '#ffffff', fontSize: '13px', flex: 1 }}>
                                  {team?.name || 'Unknown'}
                                </span>
                                <span style={{ color: '#9D4EDD', fontSize: '10px' }}>
                                  {seed.basis}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Select Teams ({bracketConfig.selectedTeams.length} selected)
              {tournament.has_divisions && selectedDivision && (
                <span style={{ fontSize: '12px', color: '#9D4EDD', fontWeight: 'normal' }}>
                  {' '}(Division {selectedDivision} only)
                </span>
              )}
            </label>
            {availableTeams.length === 0 ? (
              <div style={{ 
                padding: '16px', 
                background: 'rgba(255, 165, 0, 0.1)', 
                border: '1px solid rgba(255, 165, 0, 0.3)',
                borderRadius: '8px',
                color: '#FFA500',
                fontSize: '14px'
              }}>
                {selectedDivision 
                  ? `No teams found in Division ${selectedDivision}. Please assign teams to this division first.`
                  : 'No teams available for championship bracket.'}
              </div>
            ) : (
              <div style={styles.teamsGrid}>
                {availableTeams.map(team => {
                  // Check if team belongs to selected division (for validation display)
                  const isValidForDivision = !tournament.has_divisions || !selectedDivision || team.division === selectedDivision;
                  
                  return (
                    <label 
                      key={team.id} 
                      style={{
                        ...styles.teamItem,
                        ...(!isValidForDivision ? {
                          opacity: 0.5,
                          background: 'rgba(255, 0, 0, 0.1)',
                          border: '1px solid rgba(255, 0, 0, 0.3)'
                        } : {})
                      }}
                      title={!isValidForDivision ? `Team belongs to Division ${team.division || 'None'}, not ${selectedDivision}` : ''}
                    >
                      <input
                        type="checkbox"
                        style={styles.checkbox}
                        checked={bracketConfig.selectedTeams.some(t => t.id === team.id)}
                        disabled={!isValidForDivision}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Validate division before adding
                            if (tournament.has_divisions && selectedDivision && team.division !== selectedDivision) {
                              alert(`Team "${team.name}" belongs to Division ${team.division || 'None'}, not Division ${selectedDivision}. Please select teams from the correct division.`);
                              return;
                            }
                            setBracketConfig(prev => ({
                              ...prev,
                              selectedTeams: [...prev.selectedTeams, team]
                            }));
                          } else {
                            setBracketConfig(prev => ({
                              ...prev,
                              selectedTeams: prev.selectedTeams.filter(t => t.id !== team.id)
                            }));
                          }
                        }}
                      />
                      {team.name}
                      {team.division && tournament.has_divisions && (
                        <span style={{ fontSize: '10px', color: '#9D4EDD', marginLeft: '4px' }}>
                          (Div {team.division})
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Tournament Start Date
              <span style={{ fontSize: '12px', color: '#9D4EDD', fontWeight: 'normal' }}>
                (Only {tournament.startDate.split('T')[0]} to {tournament.endDate.split('T')[0]} allowed)
              </span>
            </label>
            <input
              type="datetime-local"
              style={styles.input}
              value={bracketConfig.startDate}
              onChange={(e) => setBracketConfig(prev => ({ 
                ...prev, 
                startDate: e.target.value 
              }))}
              min={minDate} // Tournament start date (properly formatted)
              max={maxDate} // Tournament end date (properly formatted)
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Default Venue</label>
            <input
              type="text"
              style={styles.input}
              value={bracketConfig.venue}
              onChange={(e) => setBracketConfig(prev => ({ 
                ...prev, 
                venue: e.target.value 
              }))}
              placeholder="Enter default venue"
            />
          </div>

          <div style={styles.info}>
            <strong>Preview:</strong> This will {(() => {
              const eligibility = checkEligibility(selectedDivision || undefined);
              return eligibility.action === 'regenerate_with_warning' ? 'regenerate' : 'generate';
            })()} a {bracketConfig.tournamentType.replace('_', ' ')} 
            bracket for {bracketConfig.selectedTeams.length} teams
            {tournament.has_divisions && selectedDivision && ` (Division ${selectedDivision})`}
            {tournament.has_divisions && !selectedDivision && ' (Championship)'}
            , starting on {new Date(bracketConfig.startDate).toLocaleDateString()}.
            {bracketConfig.selectedTeams.length > 0 && tournament.has_divisions && (
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                <strong>Teams:</strong> {bracketConfig.selectedTeams.map(t => t.name).join(', ')}
              </div>
            )}
            {(() => {
              const eligibility = checkEligibility(selectedDivision || undefined);
              if (eligibility.action === 'regenerate_with_warning' && eligibility.gamesToDelete > 0) {
                return (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#FFA500' }}>
                    ⚠️ {eligibility.gamesToDelete} existing game{eligibility.gamesToDelete !== 1 ? 's' : ''} will be deleted
                  </div>
                );
              }
              return null;
            })()}
          </div>

          <div style={styles.buttonGroup}>
            <button
              type="button"
              style={styles.cancelButton}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.generateButton}
              disabled={bracketConfig.selectedTeams.length < 2}
            >
              Generate Bracket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Bracket Generation Logic
function generateBracketGames(
  tournamentType: string,
  teams: Team[],
  startDate: string,
  venue: string,
  tournamentId: string
): any[] {
  const games: any[] = [];
  const startDateTime = new Date(startDate);
  
  switch (tournamentType) {
    case 'single_elimination':
      return generateSingleEliminationBracket(teams, startDateTime, venue, tournamentId);
    
    case 'round_robin':
      return generateRoundRobinBracket(teams, startDateTime, venue, tournamentId);
    
    case 'double_elimination':
      return generateDoubleEliminationBracket(teams, startDateTime, venue, tournamentId);
    
    case 'swiss':
      return generateSwissBracket(teams, startDateTime, venue, tournamentId);
    
    default:
      return generateRoundRobinBracket(teams, startDateTime, venue, tournamentId);
  }
}

function generateSingleEliminationBracket(
  teams: Team[],
  startDate: Date,
  venue: string,
  tournamentId: string
): any[] {
  const games: any[] = [];
  // Teams are already seeded by BracketService.applySeedingToBracket
  // Use teams in seed order (1 vs last, 2 vs second-to-last, etc.)
  const seededTeams = [...teams]; // Already in seed order
  let gameTime = new Date(startDate);
  
  // Round 1 - Pair up teams using proper bracket seeding
  // Seed 1 vs Seed N, Seed 2 vs Seed N-1, etc.
  const numTeams = seededTeams.length;
  const numGames = Math.floor(numTeams / 2);
  
  for (let i = 0; i < numGames; i++) {
    const teamAIndex = i;
    const teamBIndex = numTeams - 1 - i;
    
    games.push({
      tournamentId,
      teamAId: seededTeams[teamAIndex].id,
      teamBId: seededTeams[teamBIndex].id,
      startTime: gameTime.toISOString(),
      venue,
    });
    
    // Space games 2 hours apart
    gameTime = new Date(gameTime.getTime() + 2 * 60 * 60 * 1000);
  }
  
  return games;
}

function generateRoundRobinBracket(
  teams: Team[],
  startDate: Date,
  venue: string,
  tournamentId: string
): any[] {
  const games: any[] = [];
  let gameTime = new Date(startDate);
  
  // Generate all possible matchups
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      games.push({
        tournamentId,
        teamAId: teams[i].id,
        teamBId: teams[j].id,
        startTime: gameTime.toISOString(),
        venue,
      });
      
      // Space games 2 hours apart, start new day after 4 games
      gameTime = new Date(gameTime.getTime() + 2 * 60 * 60 * 1000);
      
      // Start new day after 4 games
      if (games.length % 4 === 0) {
        const nextDay = new Date(startDate.getTime() + Math.floor(games.length / 4) * 24 * 60 * 60 * 1000);
        gameTime = new Date(nextDay.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0));
      }
    }
  }
  
  return games;
}

function generateDoubleEliminationBracket(
  teams: Team[],
  startDate: Date,
  venue: string,
  tournamentId: string
): any[] {
  // For now, implement as single elimination (simplified)
  // TODO: Implement full double elimination logic
  return generateSingleEliminationBracket(teams, startDate, venue, tournamentId);
}

function generateSwissBracket(
  teams: Team[],
  startDate: Date,
  venue: string,
  tournamentId: string
): any[] {
  // For now, implement as round robin (simplified)
  // TODO: Implement Swiss system logic
  return generateRoundRobinBracket(teams, startDate, venue, tournamentId);
}

export default GameSchedulePage;