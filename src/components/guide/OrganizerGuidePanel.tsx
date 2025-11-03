import React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  UserPlus, 
  Trophy, 
  Users, 
  Target, 
  Play, 
  BarChart3, 
  Mail,
  ExternalLink,
  CheckCircle,
  Eye,
  Share2
} from 'lucide-react';
import { useOrganizerGuide } from '@/contexts/OrganizerGuideContext';
import { GuideSection } from './GuideSection';
import { GuideSection as GuideSectionType } from '@/lib/types/guide';

export function OrganizerGuidePanel() {
  const { isGuideOpen, closeGuide } = useOrganizerGuide();

  const guideSections: GuideSectionType[] = [
    {
      id: 'quick-start',
      title: 'Quick Start',
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Welcome to StatJam! This guide will walk you through setting up tournaments, 
            managing teams, and enabling live stat tracking for your games.
          </p>
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">What you'll learn:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• How to create and manage tournaments</li>
              <li>• Setting up teams and player rosters</li>
              <li>• Assigning statisticians for live tracking</li>
              <li>• Running games with real-time stats</li>
              <li>• Sharing live games with families and fans</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'create-account',
      title: 'Create Organizer Account',
      icon: UserPlus,
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Account Created!</span>
          </div>
          <p className="text-sm text-muted-foreground">
            You've already completed this step. Your organizer account gives you access to:
          </p>
          <ul className="text-sm space-y-2 text-muted-foreground ml-4">
            <li>• Tournament creation and management</li>
            <li>• Team and player roster management</li>
            <li>• Game scheduling and settings</li>
            <li>• Statistician assignment and permissions</li>
            <li>• Live game tracking coordination</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'create-tournament',
      title: 'Create Tournament; add teams & players',
      icon: Trophy,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">1. Create Tournament</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Click "Create Tournament" from your dashboard to set up a new tournament.
              </p>
              <div className="bg-muted/50 p-3 rounded text-sm">
                <strong>Tip:</strong> Fill in all tournament details including format, dates, and venue for better organization.
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">2. Add Teams</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Navigate to the "Teams" section of your tournament to add participating teams.
              </p>
              <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                <li>• Click "Add Team" to create new teams</li>
                <li>• Enter team name and coach information</li>
                <li>• Teams can register themselves if public registration is enabled</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. Manage Players</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Player rosters are built from created player profiles in the system. Ensure all players are added to their respective teams.
              </p>
              <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                <li>• Click "Manage Players" on any team card</li>
                <li>• Search and add players from existing profiles</li>
                <li>• Ensure each team has at least 5 players</li>
                <li>• <strong className="text-orange-600">Coming soon:</strong> Manual player creation</li>
              </ul>
              <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mt-2">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  ⚠️ Important: Assign a Stat Admin to each game before it starts!
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'assign-statistician',
      title: 'Assign a Statistician',
      icon: Users,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Statisticians are users who can track live game stats. You need to assign them to specific games.
          </p>
          
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">1. Create Stat Profile</h4>
              <p className="text-sm text-muted-foreground mb-2">
                First, ensure you have stat admin users in your system. These are users with the "stat_admin" role.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. Game Settings</h4>
              <p className="text-sm text-muted-foreground mb-2">
                When creating or editing games in your tournament schedule:
              </p>
              <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                <li>• Go to Tournament → Schedule → Create/Edit Game</li>
                <li>• In the game settings, assign a stat admin</li>
                <li>• Only assigned stat admins can launch the Stat Tracker</li>
              </ul>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Important:</strong> Only the assigned statistician can start live tracking for that specific game.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'run-game',
      title: 'Run the Game',
      icon: Play,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Once everything is set up, here's how live game tracking works:
          </p>
          
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">1. Start Game</h4>
              <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                <li>• The assigned stat admin logs into their dashboard</li>
                <li>• They navigate to the Stat Tracker for the specific game</li>
                <li>• Game clock and scoring begin when they start tracking</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. Live Sync Updates</h4>
              <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                <li>• Scores update in real-time across all connected devices</li>
                <li>• Player stats (points, rebounds, assists) are tracked live</li>
                <li>• Fouls, timeouts, and substitutions are recorded</li>
                <li>• Spectators can follow along via the live game viewer</li>
                <li>• Families and fans can watch on the main website</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. Game Management</h4>
              <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                <li>• Pause/resume game clock as needed</li>
                <li>• Manage player substitutions</li>
                <li>• Track team fouls and timeouts</li>
                <li>• End game when complete</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'live-viewer',
      title: 'Share with Families & Fans',
      icon: Eye,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Let families and fans watch live games with real-time stats and play-by-play updates.
          </p>
          
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">1. Games Are Public</h4>
              <p className="text-sm text-muted-foreground mb-2">
                All games are automatically public - no settings needed.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. Share Live Viewer</h4>
              <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                <li>• Go to main website homepage</li>
                <li>• Find your game in "Live Games" section</li>
                <li>• Click game to open Live Viewer</li>
                <li>• Share the URL with families and fans</li>
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Tip:</strong> Share the link on social media before games start!
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'review-share',
      title: 'Review & Share',
      icon: BarChart3,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            After games are completed, you can review results and share with participants.
          </p>
          
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">Post-Game Summaries</h4>
              <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                <li>• View complete game statistics and box scores</li>
                <li>• Review player performance metrics</li>
                <li>• Check team standings and tournament progress</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Player Stats</h4>
              <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                <li>• Individual player statistics across all games</li>
                <li>• Season averages and totals</li>
                <li>• Performance trends and highlights</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Sharing Options</h4>
              <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                <li>• Generate shareable tournament standings</li>
                <li>• Export game results and statistics</li>
                <li>• Create player highlight cards</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Sheet open={isGuideOpen} onOpenChange={closeGuide}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary" />
            <div>
              <SheetTitle className="text-xl">Organizer Guide</SheetTitle>
              <SheetDescription>
                Everything you need to know about running tournaments with StatJam
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {guideSections.map((section) => (
            <GuideSection key={section.id} section={section} />
          ))}

          <Separator />

          {/* Beta Note */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Beta
              </Badge>
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  You are using the beta. Feedback helps us improve fast.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-green-200 hover:bg-green-100 dark:border-green-800 dark:hover:bg-green-900"
                  onClick={() => window.open('https://wa.me/7472189711', '_blank')}
                >
                  <Mail className="w-4 h-4" />
                  WhatsApp: +7472189711
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={closeGuide} className="w-full">
              Close Guide
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
