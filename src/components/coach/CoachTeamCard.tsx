'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, PlayCircle, Trophy, Settings, Share2, Eye, EyeOff, 
  MapPin, Calendar, MoreVertical, Edit, Trash2, UserPlus, AlertCircle, BarChart3,
  Clock, CheckCircle, ChevronDown, ChevronUp, Info, AlertTriangle, Dumbbell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CoachTeam } from '@/lib/types/coach';
import { CoachGame } from '@/lib/types/coach';
import { CoachQuickTrackModal } from './CoachQuickTrackModal';
import { CoachTournamentSearchModal } from './CoachTournamentSearchModal';
import { PlayerManagementModal } from '@/components/shared/PlayerManagementModal';
import { CoachPlayerManagementService } from '@/lib/services/coachPlayerManagementService';
import { CoachPlayerService } from '@/lib/services/coachPlayerService';
import { CoachGameService } from '@/lib/services/coachGameService';
import { CoachTeamService } from '@/lib/services/coachTeamService';
import { CoachTeamAnalyticsTab } from './CoachTeamAnalyticsTab';
import { CoachGameStatsModal } from './CoachGameStatsModal';
import { SmartTooltip } from '@/components/onboarding/SmartTooltip';

interface CoachTeamCardProps {
  team: CoachTeam;
  onUpdate: () => void;
}

/**
 * CoachTeamCard - Enhanced team card with game history
 * 
 * Features:
 * - Full-width card with team info
 * - Expandable game history (in-progress & completed)
 * - Quick actions per game (Resume, View Stats)
 * - Team management actions
 * 
 * Follows .cursorrules: <500 lines, single responsibility
 */
export function CoachTeamCard({ team, onUpdate }: CoachTeamCardProps) {
  // Modal states
  const [showQuickTrack, setShowQuickTrack] = useState(false);
  const [showTournamentSearch, setShowTournamentSearch] = useState(false);
  const [showPlayerManagement, setShowPlayerManagement] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [showGameStats, setShowGameStats] = useState(false);
  const [selectedGame, setSelectedGame] = useState<CoachGame | null>(null);
  
  // Game history states
  const [games, setGames] = useState<CoachGame[]>([]);
  const [gamesExpanded, setGamesExpanded] = useState(true);
  const [gamesLoading, setGamesLoading] = useState(false);
  
  // Loading states
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  
  // Player count state
  const [playerCount, setPlayerCount] = useState<number>(team.player_count || 0);
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: team.name,
    is_official_team: team.is_official_team || false
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [playerCountLoading, setPlayerCountLoading] = useState(false);

  // Load accurate player count on mount
  useEffect(() => {
    const loadPlayerCount = async () => {
      try {
        setPlayerCountLoading(true);
        const count = await CoachPlayerService.getTeamPlayerCount(team.id);
        setPlayerCount(count);
      } catch (error) {
        console.error('❌ Error loading player count:', error);
      } finally {
        setPlayerCountLoading(false);
      }
    };

    loadPlayerCount();
  }, [team.id]);

  // Load games on mount
  useEffect(() => {
    const loadGames = async () => {
      try {
        setGamesLoading(true);
        const teamGames = await CoachGameService.getTeamGames(team.id, 5);
        setGames(teamGames);
      } catch (error) {
        console.error('❌ Error loading team games:', error);
      } finally {
        setGamesLoading(false);
      }
    };

    loadGames();
  }, [team.id]);

  // Handle visibility toggle
  const handleVisibilityToggle = async () => {
    try {
      setLoadingAction('visibility');
      
      await CoachTeamService.updateTeam(team.id, {
        visibility: team.visibility === 'public' ? 'private' : 'public'
      });
      
      onUpdate();
    } catch (error) {
      console.error('❌ Error toggling visibility:', error);
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle team edit save
  const handleSaveEdit = async () => {
    try {
      setEditLoading(true);
      setEditError(null);

      if (!editFormData.name.trim()) {
        setEditError('Team name is required');
        return;
      }

      await CoachTeamService.updateTeam(team.id, {
        name: editFormData.name,
        is_official_team: editFormData.is_official_team
      });

      setShowEditTeam(false);
      onUpdate();
    } catch (error) {
      console.error('❌ Error updating team:', error);
      setEditError(error instanceof Error ? error.message : 'Failed to update team');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle team deletion
  const handleDeleteTeam = async () => {
    try {
      setDeleteLoading(true);
      await CoachTeamService.deleteTeam(team.id);
      setShowDeleteConfirm(false);
      onUpdate();
    } catch (error) {
      console.error('❌ Error deleting team:', error);
      alert('Failed to delete team. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle share token generation
  const handleGenerateShareToken = async () => {
    try {
      setLoadingAction('share');
      
      const { CoachTeamService } = await import('@/lib/services/coachTeamService');
      const token = await CoachTeamService.generateImportToken(team.id);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(token.token);
      
      alert('✅ Import token copied to clipboard!');
    } catch (error) {
      console.error('❌ Error generating share token:', error);
      alert('Failed to generate share token');
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle Quick Track with validation
  const handleQuickTrack = async () => {
    // Validate minimum players
    const validation = await CoachPlayerService.validateMinimumPlayers(team.id, 5);
    
    if (!validation.isValid) {
      alert(validation.message || 'Need at least 5 players to start tracking');
      setShowPlayerManagement(true);
      return;
    }
    
    setShowQuickTrack(true);
  };

  // Handle player management update
  const handlePlayerUpdate = () => {
    const loadPlayerCount = async () => {
      try {
        const count = await CoachPlayerService.getTeamPlayerCount(team.id);
        setPlayerCount(count);
      } catch (error) {
        console.error('❌ Error reloading player count:', error);
      }
    };
    
    loadPlayerCount();
    onUpdate();
  };

  // Format game time
  const formatGameTime = (game: CoachGame) => {
    if (game.status === 'in_progress') {
      const quarter = game.quarter || 1;
      const mins = game.game_clock_minutes || 0;
      const secs = game.game_clock_seconds || 0;
      return `Q${quarter} ${mins}:${secs.toString().padStart(2, '0')}`;
    }
    if (game.end_time) {
      return new Date(game.end_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    if (game.start_time) {
      return new Date(game.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return 'N/A';
  };

  // Get game status badge
  const getGameStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge className="bg-green-500 text-white gap-1"><Clock className="w-3 h-3" /> Live</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="gap-1"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="gap-1"><Calendar className="w-3 h-3" /> Scheduled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const inProgressGames = games.filter(g => g.status === 'in_progress');
  const completedGames = games.filter(g => g.status === 'completed');

  return (
    <>
      <Card className="hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-3">
          {/* Mobile-First Layout */}
          <div className="space-y-4">
            {/* Team Info - Always Full Width */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <CardTitle className="text-lg sm:text-xl font-semibold truncate">{team.name}</CardTitle>
                  
                  {/* Team Type Badge */}
                  {team.is_official_team ? (
                    <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 gap-1 shrink-0">
                      <Trophy className="w-3 h-3" />
                      <span className="hidden sm:inline">Official</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-600 gap-1 shrink-0">
                      <Dumbbell className="w-3 h-3" />
                      <span className="hidden sm:inline">Practice</span>
                    </Badge>
                  )}
                  
                  {/* Visibility Badge */}
                  <Badge 
                    variant={team.visibility === 'public' ? 'default' : 'secondary'}
                    className="gap-1 cursor-pointer hover:opacity-80 shrink-0"
                    onClick={handleVisibilityToggle}
                    title="Click to toggle visibility"
                  >
                    {team.visibility === 'public' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span className="hidden sm:inline">{team.visibility === 'public' ? 'Public' : 'Private'}</span>
                  </Badge>
                </div>
                
                {/* Stats - Responsive Grid */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>
                      {playerCountLoading ? '...' : playerCount}
                      <span className="hidden sm:inline"> players</span>
                      {playerCount < 5 && (
                        <>
                          <AlertCircle
                            className="w-3 h-3 ml-1 text-orange-500 inline"
                            aria-label="Minimum 5 players required"
                            role="img"
                          />
                          <span className="sr-only">Minimum 5 players required</span>
                        </>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{games.length}<span className="hidden sm:inline"> games</span></span>
                  </div>
                  
                  {team.location?.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="truncate max-w-[100px] sm:max-w-none">{team.location.city}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Share Button - Always Visible */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerateShareToken}
                className="h-8 w-8 p-0 shrink-0"
                aria-label="Share team"
                disabled={loadingAction === 'share'}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Action Buttons - Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <Button
                onClick={handleQuickTrack}
                size="sm"
                disabled={playerCount < 5 || playerCountLoading}
                variant={playerCount < 5 ? "secondary" : "default"}
                className="gap-1.5 w-full text-xs sm:text-sm px-2 sm:px-3"
                aria-label={playerCount < 5 ? "Add at least 5 players first" : "Start tracking a new game"}
              >
                <PlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden sm:inline truncate">Quick Track</span>
                <span className="sm:hidden truncate">Track</span>
              </Button>
              
              <Button
                onClick={() => {}}
                size="sm"
                variant="outline"
                disabled
                className="gap-1.5 w-full text-xs sm:text-sm px-2 sm:px-3 !border-gray-300 cursor-not-allowed opacity-60"
                title="Coming Soon - Team analytics and insights"
                aria-label="Team analytics (coming soon)"
              >
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden sm:inline truncate">Analytics</span>
                <span className="sm:hidden truncate">Stats</span>
              </Button>

              <SmartTooltip
                id="coach-manage-roster"
                content="Open the roster manager to add players before you start tracking."
              >
                <Button
                  onClick={() => setShowPlayerManagement(true)}
                  size="sm"
                  variant="outline"
                  className="gap-1.5 w-full text-xs sm:text-sm px-2 sm:px-3 !border-gray-300"
                >
                  <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="hidden sm:inline truncate">Manage</span>
                  <span className="sm:hidden truncate">Players</span>
                </Button>
              </SmartTooltip>

              <Button
                onClick={() => setShowEditTeam(true)}
                size="sm"
                variant="outline"
                className="gap-1.5 w-full text-xs sm:text-sm px-2 sm:px-3 !border-gray-300"
              >
                <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">Edit</span>
              </Button>

              <Button
                onClick={() => setShowDeleteConfirm(true)}
                size="sm"
                variant="outline"
                className="gap-1.5 w-full text-xs sm:text-sm px-2 sm:px-3 !border-red-300 text-red-600 hover:text-red-700 hover:bg-red-50 hover:!border-red-400"
                aria-label="Delete team"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">Delete</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Game History Section */}
          <div className="border-t pt-4">
            <button
              onClick={() => setGamesExpanded(!gamesExpanded)}
              className="flex items-center justify-between w-full text-left mb-3 hover:opacity-80 transition-opacity"
            >
              <h3 className="font-semibold text-sm flex items-center gap-2">
                Recent Games
                {inProgressGames.length > 0 && (
                  <Badge className="bg-green-500 text-white text-xs">{inProgressGames.length} Live</Badge>
                )}
              </h3>
              {gamesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {gamesExpanded && (
              <div className="space-y-2">
                {gamesLoading ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">Loading games...</div>
                ) : games.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    No games yet. Click "Quick Track" to start!
                  </div>
                ) : (
                  <>
                    {/* In-Progress Games - Mobile Optimized */}
                    {inProgressGames.map((game) => (
                      <div
                        key={game.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {getGameStatusBadge(game.status)}
                            <span className="font-medium text-sm truncate">vs {game.opponent_name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <span className="font-semibold">{game.home_score} - {game.away_score}</span>
                            <span className="mx-1">•</span>
                            <span>{formatGameTime(game)}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            // ✅ RESUME: Navigate to stat-tracker-v3 with coach mode params
                            // ✅ REFINEMENT: No need to pass opponentName - it's in the database
                            const resumeUrl = `/stat-tracker-v3?gameId=${game.id}&coachMode=true&coachTeamId=${team.id}`;
                            window.location.href = resumeUrl;
                          }}
                          size="sm"
                          className="gap-2 w-full sm:w-auto shrink-0"
                        >
                          <PlayCircle className="w-3 h-3" />
                          Resume
                        </Button>
                      </div>
                    ))}

                    {/* Completed Games - Mobile Optimized */}
                    {completedGames.map((game) => (
                      <div
                        key={game.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-muted/50 border rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {getGameStatusBadge(game.status)}
                            <span className="font-medium text-sm truncate">vs {game.opponent_name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <span className="font-semibold">{game.home_score} - {game.away_score}</span>
                            <span className="mx-1">•</span>
                            <span>{formatGameTime(game)}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedGame(game);
                            setShowGameStats(true);
                          }}
                          size="sm"
                          variant="outline"
                          className="gap-2 w-full sm:w-auto shrink-0"
                          title="View box score and player stats"
                        >
                          <BarChart3 className="w-3 h-3" />
                          <span className="hidden sm:inline">View Stats</span>
                          <span className="sm:hidden">Stats</span>
                        </Button>
                      </div>
                    ))}

                    {games.length >= 5 && (
                      <Button
                        onClick={() => window.location.href = '/dashboard/coach?section=games'}
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2"
                      >
                        View All Games →
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {showQuickTrack && (
        <CoachQuickTrackModal
          team={team}
          onClose={() => setShowQuickTrack(false)}
          onGameCreated={() => {
            setShowQuickTrack(false);
            // Reload games
            CoachGameService.getTeamGames(team.id, 5).then(setGames);
            onUpdate();
          }}
        />
      )}

      {showTournamentSearch && (
        <CoachTournamentSearchModal
          team={team}
          onClose={() => setShowTournamentSearch(false)}
          onTournamentLinked={() => {
            setShowTournamentSearch(false);
            onUpdate();
          }}
        />
      )}

      {showPlayerManagement && (
        <PlayerManagementModal
          team={team}
          service={new CoachPlayerManagementService()}
          onClose={() => setShowPlayerManagement(false)}
          onUpdate={handlePlayerUpdate}
        />
      )}

      {showAnalytics && (
        <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Team Analytics - {team.name}</DialogTitle>
            </DialogHeader>
            <CoachTeamAnalyticsTab teamId={team.id} teamName={team.name} />
          </DialogContent>
        </Dialog>
      )}

      {showEditTeam && (
        <Dialog open={showEditTeam} onOpenChange={setShowEditTeam}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Team</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Team Name */}
              <div className="space-y-2">
                <Label htmlFor="edit-team-name">Team Name *</Label>
                <Input
                  id="edit-team-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Eagles U16"
                />
              </div>

              {/* Team Type Toggle */}
              <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="edit-is-official" className="text-base font-semibold cursor-pointer">
                      Team Type
                    </Label>
                    {editFormData.is_official_team ? (
                      <Trophy className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Dumbbell className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <Switch
                    id="edit-is-official"
                    checked={editFormData.is_official_team}
                    onCheckedChange={(checked) => 
                      setEditFormData(prev => ({ ...prev, is_official_team: checked }))
                    }
                  />
                </div>
                
                <div className="text-sm">
                  {editFormData.is_official_team ? (
                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900 mb-1">Official Team</p>
                        <p className="text-blue-700">
                          Games will count toward your players' statistics and appear on their StatJam profiles.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                      <div>
                        <p className="font-medium text-amber-900 mb-1">Practice Team</p>
                        <p className="text-amber-700">
                          Games are for your analysis only and won't affect player statistics.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Warning when changing from official to practice */}
              {editFormData.is_official_team === false && team.is_official_team === true && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Changing to Practice Team will remove this team's games from player statistics. This action cannot be undone.
                  </AlertDescription>
                </Alert>
              )}

              {/* Error message */}
              {editError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {editError}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowEditTeam(false)}
                className="flex-1"
                disabled={editLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={editLoading || !editFormData.name.trim()}
                className="flex-1"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Delete Team
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <span className="font-semibold text-foreground">{team.name}</span>?
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-red-900">This action cannot be undone.</p>
                <ul className="text-xs text-red-700 space-y-1 ml-4 list-disc">
                  <li>All team data will be permanently deleted</li>
                  <li>Game history will be removed</li>
                  <li>Players will be unlinked from this team</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteTeam}
                disabled={deleteLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Team'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showGameStats && selectedGame && (
        <CoachGameStatsModal
          isOpen={showGameStats}
          onClose={() => {
            setShowGameStats(false);
            setSelectedGame(null);
          }}
          gameId={selectedGame.id}
          teamId={team.id}
          teamName={team.name}
          opponentName={selectedGame.opponent_name || 'Unknown Opponent'}
          finalScore={{
            team: selectedGame.home_score || 0,
            opponent: selectedGame.away_score || 0
          }}
        />
      )}
    </>
  );
}
