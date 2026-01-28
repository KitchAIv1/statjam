'use client';

/**
 * CoachMissionControl - Main compact dashboard layout
 * 
 * Orchestrates all mission control widgets in a single-screen layout.
 * Handles modal states and navigation for team actions.
 * 
 * Follows .cursorrules: <200 lines, UI orchestration, single responsibility
 */

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CoachTeam } from '@/lib/types/coach';
import { useCoachDashboardData } from '@/hooks/useCoachDashboardData';
import { useSubscription } from '@/hooks/useSubscription';
import { VideoStatService, DailyUploadStatus } from '@/lib/services/videoStatService';
import { CoachTeamService } from '@/lib/services/coachTeamService';
import { ProfileCard, ProfileCardSkeleton } from '@/components/profile/ProfileCard';
import { ProfileService } from '@/lib/services/profileService';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { PhotoUploadField } from '@/components/ui/PhotoUploadField';
import { TeamColorPicker } from '@/components/ui/TeamColorPicker';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/Button';
import { Trophy, Dumbbell, Info, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { invalidateCoachTeams } from '@/lib/utils/cache';
import { LiveActionHub } from './LiveActionHub';
import { TeamsStrip } from './TeamsStrip';
import { VideoTrackingWidget } from './VideoTrackingWidget';
import { RecentGamesWidget } from './RecentGamesWidget';
import { TournamentsCompactWidget } from './TournamentsCompactWidget';
import { SeasonsCompactWidget } from './SeasonsCompactWidget';
import { CoachQuickTrackModal } from './CoachQuickTrackModal';
import { CreateCoachTeamModal } from './CreateCoachTeamModal';
import { CoachTournamentSearchModal } from './CoachTournamentSearchModal';
import { PlayerManagementModal } from '@/components/shared/PlayerManagementModal';
import { CoachPlayerManagementService } from '@/lib/services/coachPlayerManagementService';
import { CoachTeamAnalyticsTab } from './CoachTeamAnalyticsTab';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UpgradeModal, VideoCreditsModal } from '@/components/subscription';
import { SeasonCreateModal, SeasonListModal } from '@/components/season';
import { Season } from '@/lib/types/season';

interface CoachMissionControlProps {
  user: any;
  teams: CoachTeam[];
  teamsLoading: boolean;
  profileData: any;
  profileLoading: boolean;
  onTeamUpdate: () => void;
  onEditProfile: () => void;
}

export function CoachMissionControl({
  user,
  teams,
  teamsLoading,
  profileData,
  profileLoading,
  onTeamUpdate,
  onEditProfile,
}: CoachMissionControlProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { limits, tier, videoCredits, isVerified, refetch: refetchSubscription } = useSubscription('coach');
  
  // Dashboard data hook
  const dashboardData = useCoachDashboardData(user?.id);

  // Refetch subscription after successful checkout
  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'video_success') {
      refetchSubscription();
      router.replace('/dashboard/coach', { scroll: false });
    }
  }, [searchParams, refetchSubscription, router]);
  
  // ⚡ Quick Track from URL param (for "Track Another Game" flow)
  useEffect(() => {
    const quickTrackTeamId = searchParams.get('quickTrack');
    if (quickTrackTeamId && teams.length > 0) {
      const targetTeam = teams.find(t => t.id === quickTrackTeamId);
      if (targetTeam) {
        setSelectedTeam(targetTeam);
        setShowQuickTrack(true);
        // Clear URL param to prevent re-triggering
        router.replace('/dashboard/coach', { scroll: false });
      }
    }
  }, [searchParams, teams, router]);
  
  // Modal states
  const [showQuickTrack, setShowQuickTrack] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showPlayerManagement, setShowPlayerManagement] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTournamentSearch, setShowTournamentSearch] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showVideoCreditsModal, setShowVideoCreditsModal] = useState(false);
  const [showSeasonList, setShowSeasonList] = useState(false);
  const [showSeasonCreate, setShowSeasonCreate] = useState(false);
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<CoachTeam | null>(null);
  const [selectedSeasonForEdit, setSelectedSeasonForEdit] = useState<Season | null>(null);
  
  // Edit team form state
  const [editFormData, setEditFormData] = useState({ 
    name: '', 
    is_official_team: false, 
    logo: '',
    // Team branding colors
    primary_color: '#111827',
    secondary_color: '#999999',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  
  // Photo upload for edit modal
  const editLogoUpload = usePhotoUpload({
    photoType: 'team_logo',
    teamId: selectedTeam?.id,
    currentPhotoUrl: selectedTeam?.logo,
    onSuccess: (url: string) => setEditFormData(prev => ({ ...prev, logo: url })),
  });
  
  // Daily upload limit
  const [dailyUploads, setDailyUploads] = useState<DailyUploadStatus>({ 
    uploadsToday: 0, limit: 2, remaining: 2, isExempt: false 
  });
  
  // Fetch daily upload limit
  useEffect(() => {
    async function checkLimit() {
      if (!user?.id) return;
      try {
        const status = await VideoStatService.getDailyUploadStatus(user.id, 'coach');
        setDailyUploads(status);
      } catch (error) {
        console.error('Error checking daily limit:', error);
      }
    }
    if (user?.id) checkLimit();
  }, [user?.id]);

  // Handlers
  const handleQuickTrack = (team: CoachTeam) => {
    if ((team.player_count || 0) < 5) {
      setSelectedTeam(team);
      setShowPlayerManagement(true);
      return;
    }
    setSelectedTeam(team);
    setShowQuickTrack(true);
  };

  const handleVideoTrack = (team: CoachTeam) => {
    // Allow video track if user has subscription access OR video credits
    const hasAccess = limits.hasVideoAccess || videoCredits > 0;
    
    if (!hasAccess) {
      setShowUpgradeModal(true);
      return;
    }
    router.push(`/dashboard/coach/video-select?teamId=${team.id}`);
  };

  const handleManage = (team: CoachTeam) => {
    setSelectedTeam(team);
    setShowPlayerManagement(true);
  };

  const handleAnalytics = (team: CoachTeam) => {
    setSelectedTeam(team);
    setShowAnalytics(true);
  };

  const handleJoinTournament = (team: CoachTeam) => {
    setSelectedTeam(team);
    setShowTournamentSearch(true);
  };

  const handleViewGames = (team: CoachTeam) => {
    router.push(`/dashboard/coach/games?teamId=${team.id}`);
  };

  const handleSeasons = (team: CoachTeam) => {
    setSelectedTeam(team);
    setShowSeasonList(true);
  };

  const handleEditTeam = (team: CoachTeam) => {
    setSelectedTeam(team);
    setEditFormData({
      name: team.name,
      is_official_team: team.is_official_team || false,
      logo: team.logo || '',
      // Team branding colors
      primary_color: team.primary_color || '#111827',
      secondary_color: team.secondary_color || '#999999',
    });
    setEditError(null);
    setShowEditTeam(true);
  };

  const handleSaveEditTeam = async () => {
    if (!selectedTeam) return;
    
    try {
      setEditLoading(true);
      setEditError(null);

      if (!editFormData.name.trim()) {
        setEditError('Team name is required');
        return;
      }

      await CoachTeamService.updateTeam(selectedTeam.id, {
        name: editFormData.name,
        is_official_team: editFormData.is_official_team,
        logo: editFormData.logo || undefined,
        // Team branding colors
        primary_color: editFormData.primary_color,
        secondary_color: editFormData.secondary_color,
      });

      setShowEditTeam(false);
      setSelectedTeam(null);
      if (user?.id) {
        invalidateCoachTeams(user.id);
      }
      onTeamUpdate();
    } catch (err) {
      console.error('Failed to update team:', err);
      setEditError(err instanceof Error ? err.message : 'Failed to update team');
    } finally {
      setEditLoading(false);
    }
  };

  const handleLogoRemove = () => {
    setEditFormData(prev => ({ ...prev, logo: '' }));
    editLogoUpload.clearPreview();
  };

  const handleCreateSeason = () => {
    setSelectedSeasonForEdit(null); // Clear any edit state
    setShowSeasonList(false);
    setShowSeasonCreate(true);
  };

  const handleEditSeason = (season: Season) => {
    setSelectedSeasonForEdit(season);
    setShowSeasonList(false);
    setShowSeasonCreate(true);
  };

  const handleStartGame = () => {
    if (teams.length === 0) {
      setShowCreateTeam(true);
      return;
    }
    // Default to first team with enough players
    const validTeam = teams.find(t => (t.player_count || 0) >= 5);
    if (validTeam) {
      handleQuickTrack(validTeam);
    } else {
      setSelectedTeam(teams[0]);
      setShowPlayerManagement(true);
    }
  };

  const handleUploadVideo = () => {
    // Allow upload if user has subscription access OR video credits
    const hasAccess = limits.hasVideoAccess || videoCredits > 0;
    
    if (!hasAccess) {
      setShowUpgradeModal(true);
      return;
    }
    
    handleContinueToUpload();
  };

  const handleContinueToUpload = () => {
    if (teams.length === 0) {
      setShowCreateTeam(true);
      return;
    }
    router.push(`/dashboard/coach/video-select?teamId=${teams[0].id}`);
  };

  const handleShare = async () => {
    if (!profileData) return;
    const shareData = ProfileService.generateShareData(profileData);
    await navigator.clipboard.writeText(shareData.profileUrl);
    alert('✅ Profile link copied!');
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Profile + Action Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile Card - 2/3 width */}
        <div className="lg:col-span-2">
          {profileLoading ? (
            <ProfileCardSkeleton />
          ) : profileData ? (
            <ProfileCard
              profileData={profileData}
              shareData={ProfileService.generateShareData(profileData)}
              onEdit={onEditProfile}
              onShare={handleShare}
              isVerified={isVerified}
            />
          ) : null}
        </div>

        {/* Action Hub - 1/3 width */}
        <div className="lg:col-span-1">
          <LiveActionHub
            liveGames={dashboardData.liveGames}
            videoCredits={videoCredits}
            dailyUploads={dailyUploads}
            onStartGame={handleStartGame}
            onUploadVideo={handleUploadVideo}
            onBuyCredits={() => {
              // ✅ GATEKEEPING: If not subscribed, show upgrade modal first
              if (!limits.hasVideoAccess && videoCredits === 0) {
                setShowUpgradeModal(true);
              } else {
                setShowVideoCreditsModal(true);
              }
            }}
          />
        </div>
      </div>

      {/* Row 2: Teams Strip */}
      <TeamsStrip
        teams={teams}
        loading={teamsLoading}
        hasVideoAccess={limits.hasVideoAccess || videoCredits > 0}
        onQuickTrack={handleQuickTrack}
        onVideoTrack={handleVideoTrack}
        onManage={handleManage}
        onEditTeam={handleEditTeam}
        onJoinTournament={handleJoinTournament}
        onViewGames={handleViewGames}
        onSeasons={handleSeasons}
        onCreateTeam={() => setShowCreateTeam(true)}
      />

      {/* Row 3: Video Tracking + Recent Games + Tournaments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <VideoTrackingWidget 
          videoQueue={dashboardData.videoQueue}
          videoCredits={videoCredits}
          onBuyCredits={() => setShowVideoCreditsModal(true)}
        />
        <RecentGamesWidget games={dashboardData.recentGames} />
        {/* Seasons + Tournaments stacked - equal height distribution */}
        <div className="flex flex-col gap-3 h-full">
          <div className="flex-1 min-h-0">
            <SeasonsCompactWidget userId={user?.id || ''} />
          </div>
          <div className="flex-1 min-h-0">
            <TournamentsCompactWidget userId={user?.id || ''} />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showQuickTrack && selectedTeam && user?.id && (
        <CoachQuickTrackModal
          team={selectedTeam}
          userId={user.id}
          onClose={() => { setShowQuickTrack(false); setSelectedTeam(null); }}
          onGameCreated={() => {
            setShowQuickTrack(false);
            setSelectedTeam(null);
            onTeamUpdate();
            dashboardData.refetch();
          }}
        />
      )}

      {showCreateTeam && user?.id && (
        <CreateCoachTeamModal
          userId={user.id}
          onClose={() => setShowCreateTeam(false)}
          onTeamCreated={() => {
            setShowCreateTeam(false);
            onTeamUpdate();
          }}
        />
      )}

      {showPlayerManagement && selectedTeam && (
        <PlayerManagementModal
          team={selectedTeam}
          service={new CoachPlayerManagementService()}
          onClose={() => { setShowPlayerManagement(false); setSelectedTeam(null); }}
          onUpdate={onTeamUpdate}
        />
      )}

      {showAnalytics && selectedTeam && (
        <Dialog open={showAnalytics} onOpenChange={() => { setShowAnalytics(false); setSelectedTeam(null); }}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Team Analytics - {selectedTeam.name}</DialogTitle>
            </DialogHeader>
            <CoachTeamAnalyticsTab teamId={selectedTeam.id} teamName={selectedTeam.name} />
          </DialogContent>
        </Dialog>
      )}

      {showTournamentSearch && selectedTeam && (
        <CoachTournamentSearchModal
          team={selectedTeam}
          onClose={() => { setShowTournamentSearch(false); setSelectedTeam(null); }}
          onTournamentAttached={() => {
            setShowTournamentSearch(false);
            setSelectedTeam(null);
            onTeamUpdate();
          }}
        />
      )}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        role="coach"
        currentTier={tier}
        triggerReason="Video Tracking is a premium feature. Upgrade to unlock."
      />

      <VideoCreditsModal
        isOpen={showVideoCreditsModal}
        onClose={() => setShowVideoCreditsModal(false)}
        role="coach"
        currentCredits={videoCredits}
        onPurchaseComplete={() => {
          refetchSubscription();
          setShowVideoCreditsModal(false);
        }}
      />

      {showSeasonList && selectedTeam && (
        <SeasonListModal
          team={selectedTeam}
          isOpen={showSeasonList}
          onClose={() => { setShowSeasonList(false); setSelectedTeam(null); }}
          onCreateNew={handleCreateSeason}
          onEdit={handleEditSeason}
        />
      )}

      {showSeasonCreate && selectedTeam && (
        <SeasonCreateModal
          team={selectedTeam}
          isOpen={showSeasonCreate}
          onClose={() => { setShowSeasonCreate(false); setSelectedTeam(null); setSelectedSeasonForEdit(null); }}
          onCreated={() => {
            setShowSeasonCreate(false);
            setShowSeasonList(true); // Go back to list to see updated season
            setSelectedSeasonForEdit(null);
            onTeamUpdate();
          }}
          existingSeason={selectedSeasonForEdit || undefined}
        />
      )}

      {/* Edit Team Modal */}
      {showEditTeam && selectedTeam && (
        <Dialog open={showEditTeam} onOpenChange={() => { setShowEditTeam(false); setSelectedTeam(null); }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Team</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Team Logo Upload */}
              <div className="space-y-2">
                <Label>Team Logo</Label>
                <PhotoUploadField
                  label="Upload Team Logo"
                  value={editFormData.logo || null}
                  previewUrl={editLogoUpload.previewUrl || editFormData.logo}
                  uploading={editLogoUpload.uploading}
                  progress={editLogoUpload.progress}
                  error={editLogoUpload.error}
                  onFileSelect={editLogoUpload.handleFileSelect}
                  onRemove={handleLogoRemove}
                  onClearError={editLogoUpload.clearError}
                />
              </div>

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
                      <Trophy className="w-4 h-4 text-orange-600" />
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
                    <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                      <Info className="w-4 h-4 mt-0.5 shrink-0 text-orange-600" />
                      <div>
                        <span className="font-medium text-orange-800">Official Team</span>
                        <p className="text-orange-700 mt-0.5">
                          Players can claim their profile and build their stats history.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                      <div>
                        <span className="font-medium text-amber-800">Practice/Scrimmage Team</span>
                        <p className="text-amber-700 mt-0.5">
                          For practice games. Stats are not linked to player profiles.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Team Colors */}
              <div className="border-t pt-4">
                <TeamColorPicker
                  primaryColor={editFormData.primary_color || '#111827'}
                  secondaryColor={editFormData.secondary_color || '#999999'}
                  onChange={(field, value) => setEditFormData(prev => ({ ...prev, [field]: value }))}
                />
              </div>

              {/* Warning when changing from official to practice */}
              {editFormData.is_official_team === false && selectedTeam.is_official_team === true && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Changing to practice team will unlink all player profiles from this team&apos;s stats.
                  </AlertDescription>
                </Alert>
              )}

              {/* Error */}
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
                onClick={() => { setShowEditTeam(false); setSelectedTeam(null); }}
                className="flex-1"
                disabled={editLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEditTeam}
                disabled={editLoading || !editFormData.name.trim()}
                className="flex-1"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

