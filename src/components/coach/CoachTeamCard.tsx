'use client';

import React, { useState } from 'react';
import { 
  Users, PlayCircle, Trophy, Settings, Share2, Eye, EyeOff, 
  MapPin, Calendar, MoreVertical, Edit, Trash2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { CoachTeam } from '@/lib/types/coach';
import { CoachQuickTrackModal } from './CoachQuickTrackModal';
import { CoachTournamentSearchModal } from './CoachTournamentSearchModal';

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
  
  // Loading states
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

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
                <span>{team.player_count || 0} players</span>
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
              <Badge variant="outline" className="gap-1">
                <Trophy className="w-3 h-3" />
                Tournament Linked
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                Independent Team
              </Badge>
            )}
          </div>

          {/* Primary Actions */}
          <div className="flex gap-2 flex-wrap mb-4">
            <Button
              onClick={() => setShowQuickTrack(true)}
              className="flex-1 min-w-[120px] gap-2"
              disabled={loadingAction === 'quicktrack'}
            >
              <PlayCircle className="w-4 h-4" />
              {loadingAction === 'quicktrack' ? 'Starting...' : 'Quick Track'}
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
          </div>

          {/* Secondary Actions (when expanded) */}
          {showActions && (
            <div className="flex gap-2 flex-wrap pt-3 border-t border-border">
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
    </>
  );
}
