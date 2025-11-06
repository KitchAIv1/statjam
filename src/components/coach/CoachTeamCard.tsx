'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, PlayCircle, Trophy, Settings, Share2, Eye, EyeOff, 
  MapPin, Calendar, MoreVertical, Edit, Trash2, UserPlus, AlertCircle, BarChart3 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CoachTeam } from '@/lib/types/coach';
import { CoachQuickTrackModal } from './CoachQuickTrackModal';
import { CoachTournamentSearchModal } from './CoachTournamentSearchModal';
import { PlayerManagementModal } from '@/components/shared/PlayerManagementModal';
import { CoachPlayerManagementService } from '@/lib/services/coachPlayerManagementService';
import { CoachPlayerService } from '@/lib/services/coachPlayerService';
import { CoachTeamAnalyticsTab } from './CoachTeamAnalyticsTab';

interface CoachTeamCardProps {
  team: CoachTeam;
  onUpdate: () => void;
}

/**
 * CoachTeamCard - Individual team card component
 * 
 * Features:
 * - Team info display with visibility toggle
 * - Primary actions (Quick Track, Add to Tournament)
 * - Secondary actions (Edit, Share, View Games)
 * - Status indicators and badges
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function CoachTeamCard({ team, onUpdate }: CoachTeamCardProps) {
  // Modal states
  const [showQuickTrack, setShowQuickTrack] = useState(false);
  const [showTournamentSearch, setShowTournamentSearch] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showPlayerManagement, setShowPlayerManagement] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Loading states
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  
  // Player count state
  const [playerCount, setPlayerCount] = useState<number>(team.player_count || 0);
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

  // Handle visibility toggle
  const handleVisibilityToggle = async () => {
    try {
      setLoadingAction('visibility');
      
      const { CoachTeamService } = await import('@/lib/services/coachTeamService');
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

  // Handle share token generation
  const handleGenerateShareToken = async () => {
    try {
      setLoadingAction('share');
      
      const { CoachTeamService } = await import('@/lib/services/coachTeamService');
      const token = await CoachTeamService.generateImportToken(team.id);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(token.token);
      
      // Show success notification (you can implement toast here)
      console.log('✅ Import token copied to clipboard');
    } catch (error) {
      console.error('❌ Error generating share token:', error);
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle Quick Track with validation
  const handleQuickTrack = async () => {
    // Validate minimum players
    const validation = await CoachPlayerService.validateMinimumPlayers(team.id, 5);
    
    if (!validation.isValid) {
      // Show error and redirect to player management
      alert(validation.message || 'Need at least 5 players to start tracking');
      setShowPlayerManagement(true);
      return;
    }
    
    setShowQuickTrack(true);
  };

  // Handle player management modal
  const handlePlayerManagement = () => {
    setShowPlayerManagement(true);
  };

  // Handle player management update
  const handlePlayerUpdate = () => {
    // Reload player count
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


  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-2">{team.name}</CardTitle>
            
                    {/* Team Meta */}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {playerCountLoading ? '...' : playerCount} players
                          {playerCount < 5 && (
                            <AlertCircle className="w-3 h-3 ml-1 text-orange-500 inline" />
                          )}
                        </span>
                      </div>
                      
                      {team.location?.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{team.location.city}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{team.games_count || 0} games</span>
                      </div>
                    </div>
          </div>

          {/* Actions Menu */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowActions(!showActions)}
            className="h-8 w-8 p-0"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent>
          {/* Badges */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <Badge 
              variant={team.visibility === 'public' ? 'default' : 'secondary'}
              className="gap-1 cursor-pointer hover:opacity-80"
              onClick={handleVisibilityToggle}
            >
              {team.visibility === 'public' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              {team.visibility === 'public' ? 'Public' : 'Private'}
            </Badge>
            
            {team.tournament_id ? (
              team.approval_status === 'pending' ? (
                <Badge variant="outline" className="gap-1 bg-orange-50 text-orange-700 border-orange-200">
                  <Trophy className="w-3 h-3" />
                  Pending Approval
                </Badge>
              ) : team.approval_status === 'rejected' ? (
                <Badge variant="outline" className="gap-1 bg-red-50 text-red-700 border-red-200">
                  <Trophy className="w-3 h-3" />
                  Request Denied
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
                  <Trophy className="w-3 h-3" />
                  Tournament Linked
                </Badge>
              )
            ) : (
              <Badge variant="secondary" className="gap-1">
                Independent Team
              </Badge>
            )}
          </div>

          {/* Primary Actions */}
          <div className="flex gap-2 flex-wrap mb-4">
            <Button
              onClick={handleQuickTrack}
              className="flex-1 min-w-[120px] gap-2"
              disabled={loadingAction === 'quicktrack' || playerCountLoading}
              variant={playerCount < 5 ? "secondary" : "default"}
            >
              {playerCount < 5 ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  Add Players First
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  {loadingAction === 'quicktrack' ? 'Starting...' : 'Quick Track'}
                </>
              )}
            </Button>

            <Button
              onClick={() => setShowTournamentSearch(true)}
              variant="outline"
              className="flex-1 min-w-[120px] gap-2"
              disabled={loadingAction === 'tournament'}
            >
              <Trophy className="w-4 h-4" />
              {loadingAction === 'tournament' ? 'Searching...' : 'Add to Tournament'}
            </Button>

            <Button
              onClick={() => setShowAnalytics(true)}
              variant="outline"
              className="flex-1 min-w-[120px] gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Button>
          </div>

          {/* Secondary Actions (when expanded) */}
          {showActions && (
            <div className="flex gap-2 flex-wrap pt-3 border-t border-border">
              <Button
                onClick={handlePlayerManagement}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Manage Players
              </Button>

              <Button
                onClick={handleVisibilityToggle}
                variant="ghost"
                size="sm"
                className="gap-2"
                disabled={loadingAction === 'visibility'}
              >
                {team.visibility === 'public' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {loadingAction === 'visibility' ? 'Updating...' : 
                 team.visibility === 'public' ? 'Make Private' : 'Make Public'}
              </Button>

              <Button
                onClick={handleGenerateShareToken}
                variant="ghost"
                size="sm"
                className="gap-2"
                disabled={loadingAction === 'share' || team.visibility === 'private'}
              >
                <Share2 className="w-4 h-4" />
                {loadingAction === 'share' ? 'Generating...' : 'Share Token'}
              </Button>

              <Button
                onClick={() => console.log('Edit team:', team.id)}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showQuickTrack && (
        <CoachQuickTrackModal
          team={team}
          onClose={() => setShowQuickTrack(false)}
          onGameCreated={onUpdate}
        />
      )}

      {showTournamentSearch && (
        <CoachTournamentSearchModal
          team={team}
          onClose={() => setShowTournamentSearch(false)}
          onTournamentAttached={onUpdate}
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
    </>
  );
}
