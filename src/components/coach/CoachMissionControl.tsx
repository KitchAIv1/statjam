'use client';

/**
 * CoachMissionControl - Main compact dashboard layout
 * 
 * Orchestrates all mission control widgets in a single-screen layout.
 * Handles modal states and navigation for team actions.
 * 
 * Follows .cursorrules: <200 lines, UI orchestration, single responsibility
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CoachTeam } from '@/lib/types/coach';
import { useCoachDashboardData } from '@/hooks/useCoachDashboardData';
import { useSubscription } from '@/hooks/useSubscription';
import { ProfileCard, ProfileCardSkeleton } from '@/components/profile/ProfileCard';
import { ProfileService } from '@/lib/services/profileService';
import { LiveActionHub } from './LiveActionHub';
import { TeamsStrip } from './TeamsStrip';
import { VideoTrackingWidget } from './VideoTrackingWidget';
import { RecentGamesWidget } from './RecentGamesWidget';
import { TournamentsCompactWidget } from './TournamentsCompactWidget';
import { CoachQuickTrackModal } from './CoachQuickTrackModal';
import { CreateCoachTeamModal } from './CreateCoachTeamModal';
import { PlayerManagementModal } from '@/components/shared/PlayerManagementModal';
import { CoachPlayerManagementService } from '@/lib/services/coachPlayerManagementService';
import { CoachTeamAnalyticsTab } from './CoachTeamAnalyticsTab';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UpgradeModal } from '@/components/subscription';

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
  const { limits, tier } = useSubscription('coach');
  
  // Dashboard data hook
  const dashboardData = useCoachDashboardData(user?.id);
  
  // Modal states
  const [showQuickTrack, setShowQuickTrack] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showPlayerManagement, setShowPlayerManagement] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<CoachTeam | null>(null);

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
    if (!limits.hasVideoAccess) {
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
    if (!limits.hasVideoAccess) {
      setShowUpgradeModal(true);
      return;
    }
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
            />
          ) : null}
        </div>

        {/* Action Hub - 1/3 width */}
        <div className="lg:col-span-1">
          <LiveActionHub
            liveGames={dashboardData.liveGames}
            videoQueue={dashboardData.videoQueue}
            clips={dashboardData.clips}
            onStartGame={handleStartGame}
            onUploadVideo={handleUploadVideo}
          />
        </div>
      </div>

      {/* Row 2: Teams Strip */}
      <TeamsStrip
        teams={teams}
        loading={teamsLoading}
        hasVideoAccess={limits.hasVideoAccess}
        onQuickTrack={handleQuickTrack}
        onVideoTrack={handleVideoTrack}
        onManage={handleManage}
        onAnalytics={handleAnalytics}
        onCreateTeam={() => setShowCreateTeam(true)}
      />

      {/* Row 3: Video Tracking + Recent Games + Tournaments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <VideoTrackingWidget videoQueue={dashboardData.videoQueue} />
        <RecentGamesWidget games={dashboardData.recentGames} />
        <TournamentsCompactWidget userId={user?.id || ''} />
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

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        role="coach"
        currentTier={tier}
        triggerReason="Video Tracking is a premium feature. Upgrade to unlock."
      />
    </div>
  );
}

