import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Calendar, Target, TrendingUp, Award, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/Button";
import { useOrganizerDashboardData } from "@/hooks/useOrganizerDashboardData";
import { useRouter } from "next/navigation";
import { OrganizerGuideCallout } from "@/components/guide";
import { useOrganizerGuide } from "@/contexts/OrganizerGuideContext";

// Enhanced status styling function for overview cards
function getOverviewStatusClasses(status: string) {
  const normalizedStatus = status.toLowerCase();
  switch (normalizedStatus) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200 font-semibold shadow-sm';
    case 'draft':
      return 'bg-gray-100 text-gray-600 border-gray-200 font-medium';
    case 'completed':
      return 'bg-blue-100 text-blue-800 border-blue-200 font-medium';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200 font-medium';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200 font-medium';
  }
}

interface OrganizerDashboardOverviewProps {
  user: { id: string } | null;
}

export function OrganizerDashboardOverview({ user }: OrganizerDashboardOverviewProps) {
  const { data, loading, error } = useOrganizerDashboardData(user);
  const router = useRouter();
  const { incrementSession } = useOrganizerGuide();

  // Increment session count when dashboard loads (must be before any returns)
  React.useEffect(() => {
    incrementSession();
  }, [incrementSession]);

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-muted rounded mb-2"></div>
                <div className="h-12 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-20 bg-muted rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6 mt-6">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <div className="text-destructive mb-2">Error loading dashboard data</div>
            <div className="text-sm text-muted-foreground">{error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use live data from the hook
  const stats = [
    {
      title: "Active Tournaments",
      value: data.stats.activeTournaments.toString(),
      description: `${data.stats.totalTournaments} total tournaments`,
      icon: Trophy,
      color: "text-white",
      bgGradient: "bg-primary",
      trend: data.stats.trends.tournaments
    },
    {
      title: "Total Teams",
      value: data.stats.totalTeams.toString(),
      description: `${Math.round(data.stats.totalTeams / Math.max(data.stats.totalTournaments, 1))} teams per tournament avg`,
      icon: Users,
      color: "text-white", 
      bgGradient: "bg-gradient-to-br from-blue-500 to-blue-600",
      trend: data.stats.trends.teams
    },
    {
      title: "Games Scheduled",
      value: data.stats.totalGames.toString(),
      description: "12 this week",
      icon: Calendar,
      color: "text-white",
      bgGradient: "bg-gradient-to-br from-orange-500 to-orange-600",
      trend: data.stats.trends.games
    },
    {
      title: "Completion Rate",
      value: `${data.stats.completionRate}%`,
      description: "Games completed on time",
      icon: Target,
      color: "text-white",
      bgGradient: "bg-red-600",
      trend: data.stats.trends.completion
    }
  ];

  // Use live recent tournaments data
  const recentTournaments = data.recentTournaments;

  // Use live upcoming games data
  const upcomingGames = data.upcomingGames;

  return (
    <div className="space-y-6 mt-6">
      {/* Guide Callout Card */}
      <OrganizerGuideCallout />
      
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 overflow-hidden">
            <div className={`${stat.bgGradient} relative`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-white">
                <CardTitle className="text-sm font-medium text-white/90">{stat.title}</CardTitle>
                <div className="relative">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                </div>
              </CardHeader>
              <CardContent className="text-white">
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    {stat.trend}
                  </div>
                </div>
                <p className="text-xs text-white/80 mt-1">{stat.description}</p>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Tournament Cards */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <CardTitle>Tournament Status</CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1"
                onClick={() => router.push('/dashboard?section=tournaments')}
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <CardDescription>Track your active tournaments (showing {recentTournaments.length} most recent)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {recentTournaments.length > 0 ? recentTournaments.map((tournament, index) => (
              <div 
                key={index} 
                className="group p-4 border rounded-xl hover:border-primary/30 hover:bg-muted/30 transition-all duration-300 cursor-pointer"
                onClick={() => router.push('/dashboard?section=tournaments')}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-4 h-4 text-primary" />
                      <p className="font-semibold group-hover:text-primary transition-colors">{tournament.name}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{tournament.venue}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {tournament.teams} teams
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {tournament.prize}
                      </span>
                      {tournament.nextGame && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {tournament.nextGame}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant={tournament.status === 'Active' ? 'default' : 'secondary'}
                    className={`${getOverviewStatusClasses(tournament.status)} shrink-0 px-3 py-1 text-xs uppercase tracking-wide`}
                  >
                    {tournament.status === 'Active' && <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>}
                    {tournament.status}
                  </Badge>
                </div>
                {tournament.status === 'Active' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tournament Progress</span>
                      <span className="font-medium">{tournament.progress}%</span>
                    </div>
                    <Progress value={tournament.progress} className="h-2" />
                  </div>
                )}
              </div>
            )) : (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-4">No tournaments yet</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/dashboard?section=tournaments')}
                >
                  Create Your First Tournament
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Upcoming Games */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              <CardTitle>Upcoming Games</CardTitle>
            </div>
            <CardDescription>Next scheduled matches</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {upcomingGames.length > 0 ? upcomingGames.map((game, index) => (
              <div key={index} className="group p-4 border rounded-xl hover:border-accent/30 hover:bg-muted/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <p className="font-semibold group-hover:text-accent transition-colors">
                        {game.team1} <span className="text-muted-foreground font-normal">vs</span> {game.team2}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{game.time}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{game.tournament}</span>
                      <span>•</span>
                      <span className="text-primary font-medium">{game.importance}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0">{game.court}</Badge>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-4">No upcoming games scheduled</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/dashboard?section=games')}
                >
                  Schedule a Game
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Quick Actions */}
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for tournament organizers</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="group p-6 border rounded-xl text-center space-y-3 hover:border-primary/30 hover:bg-gradient-to-b hover:from-primary/5 hover:to-transparent cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="w-12 h-12 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold group-hover:text-primary transition-colors">Create Tournament</h4>
              <p className="text-sm text-muted-foreground">Start a new tournament</p>
            </div>
            <div className="group p-6 border rounded-xl text-center space-y-3 hover:border-accent/30 hover:bg-gradient-to-b hover:from-accent/5 hover:to-transparent cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="w-12 h-12 mx-auto bg-gradient-to-br from-accent to-accent/80 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold group-hover:text-accent transition-colors">Add Team</h4>
              <p className="text-sm text-muted-foreground">Register a new team</p>
            </div>
            <div className="group p-6 border rounded-xl text-center space-y-3 hover:border-orange-500/30 hover:bg-gradient-to-b hover:from-orange-50 hover:to-transparent cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="w-12 h-12 mx-auto bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold group-hover:text-orange-600 transition-colors">Schedule Game</h4>
              <p className="text-sm text-muted-foreground">Plan upcoming matches</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
