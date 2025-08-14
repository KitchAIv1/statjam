import { useSearchParams } from "next/navigation";
import { OrganizerDashboardOverview } from "./OrganizerDashboardOverview";
import { OrganizerTournamentManager } from "./OrganizerTournamentManager";
import { OrganizerTeamManager } from "./OrganizerTeamManager";
import { OrganizerGameScheduler } from "./OrganizerGameScheduler";
import { OrganizerLiveStream } from "./OrganizerLiveStream";

type ActiveSection = 'overview' | 'tournaments' | 'teams' | 'games' | 'live-stream';

export function OrganizerDashboard() {
  const searchParams = useSearchParams();
  
  // Get current section from URL params, default to overview
  const currentSection = (searchParams.get('section') || 'overview') as ActiveSection;

  const renderContent = () => {
    switch (currentSection) {
      case 'overview':
        return <OrganizerDashboardOverview />;
      case 'tournaments':
        return <OrganizerTournamentManager />;
      case 'teams':
        return <OrganizerTeamManager />;
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
