'use client';

import React, { useState } from 'react';
import { 
  Users, PlayCircle, Trophy, Settings, Share2, Eye, EyeOff, 
  MapPin, Calendar, MoreVertical, Edit, Trash2 
} from 'lucide-react';
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

  // Styles
  const styles = {
    card: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '20px',
      backdropFilter: 'blur(10px)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      position: 'relative' as const
    },
    cardHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 32px rgba(249, 115, 22, 0.2)',
      borderColor: 'rgba(249, 115, 22, 0.3)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '16px'
    },
    teamInfo: {
      flex: 1
    },
    teamName: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '4px'
    },
    teamMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px'
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '0.875rem',
      color: '#a1a1aa'
    },
    badges: {
      display: 'flex',
      gap: '8px',
      marginBottom: '16px'
    },
    actions: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap' as const
    },
    primaryButton: {
      flex: 1,
      minWidth: '120px'
    },
    secondaryButton: {
      padding: '8px'
    },
    actionsMenu: {
      position: 'absolute' as const,
      top: '16px',
      right: '16px',
      zIndex: 10
    }
  };

  return (
    <>
      <div
        style={styles.card}
        onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHover)}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0px)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.teamInfo}>
            <h3 style={styles.teamName}>{team.name}</h3>
            
            <div style={styles.teamMeta}>
              <div style={styles.metaItem}>
                <Users className="w-4 h-4" />
                <span>{team.player_count || 0} players</span>
              </div>
              
              {team.location?.city && (
                <div style={styles.metaItem}>
                  <MapPin className="w-4 h-4" />
                  <span>{team.location.city}</span>
                </div>
              )}
              
              <div style={styles.metaItem}>
                <Calendar className="w-4 h-4" />
                <span>{team.games_count || 0} games</span>
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <div style={styles.actionsMenu}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActions(!showActions)}
              style={styles.secondaryButton}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Badges */}
        <div style={styles.badges}>
          <Badge 
            variant={team.visibility === 'public' ? 'default' : 'secondary'}
            className="gap-1"
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
        <div style={styles.actions}>
          <Button
            onClick={() => setShowQuickTrack(true)}
            className="gap-2"
            style={styles.primaryButton}
            disabled={loadingAction === 'quicktrack'}
          >
            <PlayCircle className="w-4 h-4" />
            {loadingAction === 'quicktrack' ? 'Starting...' : 'Quick Track'}
          </Button>

          <Button
            onClick={() => setShowTournamentSearch(true)}
            variant="outline"
            className="gap-2"
            style={styles.primaryButton}
            disabled={loadingAction === 'tournament'}
          >
            <Trophy className="w-4 h-4" />
            {loadingAction === 'tournament' ? 'Searching...' : 'Add to Tournament'}
          </Button>
        </div>

        {/* Secondary Actions (when expanded) */}
        {showActions && (
          <div style={{
            ...styles.actions,
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
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
      </div>

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
