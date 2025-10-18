import { useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import { OrganizerDashboardOverview } from "./OrganizerDashboardOverview";
import { OrganizerTournamentManager } from "./OrganizerTournamentManager";
import { OrganizerGameScheduler } from "./OrganizerGameScheduler";
import { OrganizerLiveStream } from "./OrganizerLiveStream";

type ActiveSection = 'overview' | 'tournaments' | 'teams' | 'games' | 'live-stream';

interface OrganizerDashboardProps {
  user: { id: string } | null;
}

export function OrganizerDashboard({ user }: OrganizerDashboardProps) {
  const searchParams = useSearchParams();
  
  // Get current section from URL params, default to overview
  const currentSection = (searchParams.get('section') || 'overview') as ActiveSection;

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
                  onClick={() => window.location.href = '/dashboard?section=tournaments'}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Go to Tournaments
                </button>
              </div>
            </div>
          </div>
        );
      case 'games':
        return <OrganizerGameScheduler />;
      case 'live-stream':
        return <OrganizerLiveStream />;
      default:
        return <OrganizerDashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content - Full Width */}
      <main className="pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}