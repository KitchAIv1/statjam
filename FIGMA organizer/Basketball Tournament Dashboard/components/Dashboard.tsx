import { useState } from "react";
import { 
  Trophy, 
  Users, 
  Calendar, 
  BarChart3, 
  Home,
  Video
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { TournamentManager } from "./TournamentManager";
import { TeamManager } from "./TeamManager";
import { GameScheduler } from "./GameScheduler";
import { DashboardOverview } from "./DashboardOverview";
import { LiveStream } from "./LiveStream";

type ActiveSection = 'overview' | 'tournaments' | 'teams' | 'games' | 'live-stream';

export function Dashboard() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');

  const menuItems = [
    { id: 'overview' as const, label: 'Overview', icon: Home },
    { id: 'tournaments' as const, label: 'Tournaments', icon: Trophy },
    { id: 'teams' as const, label: 'Teams', icon: Users },
    { id: 'games' as const, label: 'Games', icon: Calendar },
    { id: 'live-stream' as const, label: 'Live Stream', icon: Video },
  ];

  const getHeaderTitle = (section: ActiveSection) => {
    const item = menuItems.find(item => item.id === section);
    return item ? item.label : section;
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <DashboardOverview />;
      case 'tournaments':
        return <TournamentManager />;
      case 'teams':
        return <TeamManager />;
      case 'games':
        return <GameScheduler />;
      case 'live-stream':
        return <LiveStream />;
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar className="border-r">
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Trophy className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold">StatJam</h2>
                <p className="text-sm text-muted-foreground">Tournament Manager</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-4">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveSection(item.id)}
                    isActive={activeSection === item.id}
                    className="w-full justify-start"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          
          <SidebarFooter className="border-t p-4">
            <div className="text-xs text-muted-foreground">
              © 2025 StatJam
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="border-b bg-card p-4 flex items-center gap-4">
            <SidebarTrigger />
            <h1>{getHeaderTitle(activeSection)}</h1>
          </header>
          
          <main className="flex-1 p-6 overflow-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}