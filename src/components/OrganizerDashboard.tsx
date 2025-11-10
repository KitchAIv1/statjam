import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import { OrganizerDashboardOverview } from "./OrganizerDashboardOverview";
import { OrganizerTournamentManager } from "./OrganizerTournamentManager";
import { OrganizerGameScheduler } from "./OrganizerGameScheduler";
import { OrganizerLiveStream } from "./OrganizerLiveStream";
import { ProfileCard, ProfileCardSkeleton } from "./profile/ProfileCard";
import { ProfileEditModal } from "./profile/ProfileEditModal";
import { useOrganizerProfile } from "@/hooks/useOrganizerProfile";
import { ProfileService } from "@/lib/services/profileService";

type ActiveSection = 'overview' | 'tournaments' | 'teams' | 'games' | 'live-stream';

interface OrganizerDashboardProps {
  user: { id: string } | null;
}

export function OrganizerDashboard({ user }: OrganizerDashboardProps) {
  const searchParams = useSearchParams();
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Get current section from URL params, default to overview
  const currentSection = (searchParams.get('section') || 'overview') as ActiveSection;
  
  // Fetch organizer profile data
  const { profileData, loading: profileLoading, updateProfile } = useOrganizerProfile(user?.id || '');

  // Handle profile share
  const handleShare = async () => {
    if (!profileData) return;
    
    const shareData = ProfileService.generateShareData(profileData);
    
    try {
      await navigator.clipboard.writeText(shareData.profileUrl);
      alert('✅ Profile link copied to clipboard!');
    } catch (error) {
      console.error('❌ Error copying to clipboard:', error);
      alert('Failed to copy link. Please try again.');
    }
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'overview':
        return <OrganizerDashboardOverview user={user} />;
      case 'tournaments':
        return <OrganizerTournamentManager user={user} />;
      case 'teams':
        return (
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Team Management</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Team management is now integrated into the Tournament Manager. 
                Go to the Tournaments section and click "Teams" on any tournament card.
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = '/dashboard?section=tournaments';
                    }
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Go to Tournaments
                </button>
              </div>
            </div>
          </div>
        );
      case 'games':
        return <OrganizerGameScheduler user={user} />;
      case 'live-stream':
        return <OrganizerLiveStream />;
      default:
        return <OrganizerDashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content - Full Width */}
      <main className="pt-24 px-6 pb-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Profile Card - Top of Dashboard */}
          {!profileLoading && profileData && (
            <ProfileCard
              profileData={profileData}
              shareData={ProfileService.generateShareData(profileData)}
              onEdit={() => setShowEditModal(true)}
              onShare={handleShare}
            />
          )}
          
          {/* Main Dashboard Content */}
          {renderContent()}
        </div>
      </main>

      {/* Profile Edit Modal */}
      {profileData && (
        <ProfileEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          profileData={profileData}
          onSave={updateProfile}
        />
      )}
    </div>
  );
}