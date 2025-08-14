import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Trophy, Users, Calendar, Target, TrendingUp, Award, Clock } from "lucide-react";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";

export function DashboardOverview() {
  const stats = [
    {
      title: "Active Tournaments",
      value: "3",
      description: "2 in progress",
      icon: Trophy,
      color: "text-white",
      bgGradient: "bg-gradient-to-br from-primary to-primary/80",
      trend: "+12%"
    },
    {
      title: "Total Teams",
      value: "24",
      description: "8 teams per tournament avg",
      icon: Users,
      color: "text-white", 
      bgGradient: "bg-gradient-to-br from-accent to-accent/80",
      trend: "+8%"
    },
    {
      title: "Games Scheduled",
      value: "156",
      description: "12 this week",
      icon: Calendar,
      color: "text-white",
      bgGradient: "bg-gradient-to-br from-orange-500 to-orange-600",
      trend: "+24%"
    },
    {
      title: "Completion Rate",
      value: "87%",
      description: "Games completed on time",
      icon: Target,
      color: "text-white",
      bgGradient: "bg-gradient-to-br from-red-500 to-red-600",
      trend: "+5%"
    }
  ];

  const recentTournaments = [
    { 
      name: "Spring Championship", 
      status: "Active", 
      teams: 8, 
      progress: 75,
      venue: "Madison Square Arena",
      prize: "$25,000",
      nextGame: "Today 3:00 PM"
    },
    { 
      name: "Youth League Finals", 
      status: "Upcoming", 
      teams: 6, 
      progress: 0,
      venue: "Community Sports Center",
      prize: "$5,000",
      nextGame: "Apr 1, 2:00 PM"
    },
    { 
      name: "Summer Classic", 
      status: "Active", 
      teams: 12, 
      progress: 45,
      venue: "Downtown Basketball Complex",
      prize: "$50,000",
      nextGame: "Tomorrow 1:00 PM"
    },
  ];

  const upcomingGames = [
    { 
      team1: "Lakers", 
      team2: "Warriors", 
      time: "Today 3:00 PM", 
      court: "Court A",
      tournament: "Spring Championship",
      importance: "Semifinal"
    },
    { 
      team1: "Bulls", 
      team2: "Celtics", 
      time: "Today 5:00 PM", 
      court: "Court B",
      tournament: "Summer Classic",
      importance: "Quarterfinal"
    },
    { 
      team1: "Heat", 
      team2: "Spurs", 
      time: "Tomorrow 2:00 PM", 
      court: "Court A",
      tournament: "Spring Championship",
      importance: "Final"
    },
  ];

  return (
    <div className="space-y-6">
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
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <CardTitle>Tournament Status</CardTitle>
            </div>
            <CardDescription>Track your active tournaments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {recentTournaments.map((tournament, index) => (
              <div key={index} className="group p-4 border rounded-xl hover:border-primary/30 hover:bg-muted/30 transition-all duration-300">
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
                    className="shrink-0"
                  >
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
            ))}
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
            {upcomingGames.map((game, index) => (
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
            ))}
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