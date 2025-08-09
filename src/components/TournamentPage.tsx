import { useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Avatar } from "./ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { 
  Calendar,
  MapPin,
  Users,
  Trophy,
  Play,
  Clock,
  TrendingUp,
  ArrowLeft,
  Filter,
  Star,
  Target,
  Zap,
  Shield,
  Eye,
  Share
} from "lucide-react";

interface TournamentPageProps {
  onBack?: () => void;
  onWatchLive?: () => void;
}

export function TournamentPage({ onBack, onWatchLive }: TournamentPageProps) {
  const [scheduleTab, setScheduleTab] = useState("all");
  const [standingsView, setStandingsView] = useState("teams");

  // Mock tournament data
  const tournamentInfo = {
    name: "Summer League Championship 2025",
    season: "2025",
    organizer: "StatJam Sports",
    dates: "Jul 15 - Jul 28, 2025",
    location: "Multiple Venues, Los Angeles",
    teams: 16,
    sponsors: ["Nike", "Gatorade", "Wilson"]
  };

  // Mock games data
  const games = [
    {
      id: 1,
      team1: { name: "Lightning Bolts", logo: "⚡", score: 85 },
      team2: { name: "Thunder Hawks", logo: "🦅", score: 78 },
      date: "Jul 20, 2025",
      time: "7:00 PM",
      venue: "Court A",
      status: "FINAL",
      isLive: false
    },
    {
      id: 2,
      team1: { name: "Fire Dragons", logo: "🐲", score: 92 },
      team2: { name: "Ice Wolves", logo: "🐺", score: 88 },
      date: "Jul 21, 2025", 
      time: "8:30 PM",
      venue: "Court B",
      status: "LIVE",
      isLive: true,
      quarter: "Q3 5:24"
    },
    {
      id: 3,
      team1: { name: "Street Kings", logo: "👑", score: 0 },
      team2: { name: "Court Crushers", logo: "🏀", score: 0 },
      date: "Jul 22, 2025",
      time: "6:00 PM", 
      venue: "Court A",
      status: "UPCOMING",
      isLive: false
    }
  ];

  // Mock standings data
  const teamStandings = [
    {
      rank: 1,
      team: { name: "Fire Dragons", logo: "🐲" },
      wins: 6,
      losses: 1,
      pf: 542,
      pa: 498,
      pd: 44,
      streak: "W3"
    },
    {
      rank: 2,
      team: { name: "Lightning Bolts", logo: "⚡" },
      wins: 5,
      losses: 2,
      pf: 518,
      pa: 502,
      pd: 16,
      streak: "W2"
    },
    {
      rank: 3,
      team: { name: "Thunder Hawks", logo: "🦅" },
      wins: 5,
      losses: 2,
      pf: 495,
      pa: 485,
      pd: 10,
      streak: "L1"
    },
    {
      rank: 4,
      team: { name: "Ice Wolves", logo: "🐺" },
      wins: 4,
      losses: 3,
      pf: 476,
      pa: 468,
      pd: 8,
      streak: "W1"
    }
  ];

  // Mock player leaderboards
  const playerLeaderboards = {
    scoring: [
      {
        rank: 1,
        player: "Marcus Johnson",
        team: "Fire Dragons",
        logo: "🐲",
        ppg: 24.8,
        photo: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=150"
      },
      {
        rank: 2,
        player: "Tyler Davis",
        team: "Lightning Bolts", 
        logo: "⚡",
        ppg: 22.3,
        photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
      },
      {
        rank: 3,
        player: "Kevin Thompson",
        team: "Thunder Hawks",
        logo: "🦅", 
        ppg: 21.7,
        photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
      }
    ],
    assists: [
      {
        rank: 1,
        player: "Chris Wilson",
        team: "Ice Wolves",
        logo: "🐺",
        apg: 8.4,
        photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
      },
      {
        rank: 2,
        player: "Jason Lee",
        team: "Street Kings",
        logo: "👑",
        apg: 7.9,
        photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150"
      }
    ]
  };

  // Mock player of the game
  const playerOfGame = {
    player: "Marcus Johnson",
    team: "Fire Dragons",
    logo: "🐲",
    photo: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=150",
    stats: {
      points: 32,
      rebounds: 8,
      assists: 6,
      steals: 3
    },
    gameVs: "vs Lightning Bolts"
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      {onBack && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      )}

      {/* Tournament Overview Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Tournament Info */}
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {tournamentInfo.name}
              </h1>
              <div className="text-lg text-gray-600 mb-4">
                Presented by {tournamentInfo.organizer}
              </div>
              
              {/* Quick Info */}
              <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{tournamentInfo.dates}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{tournamentInfo.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{tournamentInfo.teams} Teams</span>
                </div>
              </div>
            </div>

            {/* Sponsor Carousel */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">Presented by:</div>
              <div className="flex gap-3">
                {tournamentInfo.sponsors.map((sponsor, index) => (
                  <div key={index} className="px-3 py-1 bg-gray-100 rounded text-sm font-medium">
                    {sponsor}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Live & Upcoming Schedule */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Games</h2>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          <Tabs value={scheduleTab} onValueChange={setScheduleTab}>
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
              <TabsTrigger value="all">All Games</TabsTrigger>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value={scheduleTab} className="mt-6">
              <div className="space-y-4">
                {games.map((game) => (
                  <Card key={game.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      {/* Teams */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              {game.team1.logo}
                            </div>
                            <span className="font-semibold">{game.team1.name}</span>
                            {game.status === "FINAL" && (
                              <span className="text-xl font-bold">{game.team1.score}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              {game.team2.logo}
                            </div>
                            <span className="font-semibold">{game.team2.name}</span>
                            {game.status === "FINAL" && (
                              <span className="text-xl font-bold">{game.team2.score}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Game Info */}
                      <div className="text-center">
                        <div className="text-sm text-gray-500 mb-1">{game.date}</div>
                        <div className="text-sm font-medium">{game.time}</div>
                        <div className="text-xs text-gray-400">{game.venue}</div>
                        {game.isLive && game.quarter && (
                          <div className="text-sm text-orange-600 font-medium mt-1">
                            {game.quarter}
                          </div>
                        )}
                      </div>

                      {/* Status & Action */}
                      <div className="text-right">
                        <Badge 
                          className={`mb-2 ${
                            game.status === 'LIVE' ? 'bg-red-500' :
                            game.status === 'FINAL' ? 'bg-gray-500' :
                            'bg-blue-500'
                          } text-white`}
                        >
                          {game.status}
                        </Badge>
                        {game.isLive && (
                          <div>
                            <Button onClick={onWatchLive} size="sm" className="bg-orange-500 hover:bg-orange-600">
                              <Play className="w-4 h-4 mr-1" />
                              Watch Live
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Standings & Leaderboards */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Standings */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Standings</h2>
              <Tabs value={standingsView} onValueChange={setStandingsView}>
                <TabsList>
                  <TabsTrigger value="teams">Teams</TabsTrigger>
                  <TabsTrigger value="divisions">Divisions</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-center">W-L</TableHead>
                  <TableHead className="text-center">PF</TableHead>
                  <TableHead className="text-center">PA</TableHead>
                  <TableHead className="text-center">PD</TableHead>
                  <TableHead className="text-center">Streak</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamStandings.map((team) => (
                  <TableRow key={team.rank}>
                    <TableCell className="font-medium">{team.rank}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                          {team.team.logo}
                        </div>
                        <span className="font-medium">{team.team.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{team.wins}-{team.losses}</TableCell>
                    <TableCell className="text-center">{team.pf}</TableCell>
                    <TableCell className="text-center">{team.pa}</TableCell>
                    <TableCell className={`text-center ${team.pd > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {team.pd > 0 ? '+' : ''}{team.pd}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={team.streak.startsWith('W') ? 'default' : 'destructive'}>
                        {team.streak}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Player Leaderboards */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Player Leaders</h2>
            
            <Tabs defaultValue="scoring">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="scoring">Scoring</TabsTrigger>
                <TabsTrigger value="assists">Assists</TabsTrigger>
              </TabsList>

              <TabsContent value="scoring" className="mt-4">
                <div className="space-y-3">
                  {playerLeaderboards.scoring.map((player) => (
                    <div key={player.rank} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold">
                        {player.rank}
                      </div>
                      <Avatar className="w-10 h-10">
                        <ImageWithFallback
                          src={player.photo}
                          alt={player.player}
                          className="w-full h-full object-cover"
                        />
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-semibold">{player.player}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <span>{player.logo}</span>
                          <span>{player.team}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{player.ppg}</div>
                        <div className="text-xs text-gray-500">PPG</div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="assists" className="mt-4">
                <div className="space-y-3">
                  {playerLeaderboards.assists.map((player) => (
                    <div key={player.rank} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold">
                        {player.rank}
                      </div>
                      <Avatar className="w-10 h-10">
                        <ImageWithFallback
                          src={player.photo}
                          alt={player.player}
                          className="w-full h-full object-cover"
                        />
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-semibold">{player.player}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <span>{player.logo}</span>
                          <span>{player.team}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{player.apg}</div>
                        <div className="text-xs text-gray-500">APG</div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Stats Spotlight */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Stats Spotlight</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Player of the Game */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-lg">Player of the Game</h3>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-16 h-16">
                  <ImageWithFallback
                    src={playerOfGame.photo}
                    alt={playerOfGame.player}
                    className="w-full h-full object-cover"
                  />
                </Avatar>
                <div>
                  <div className="font-bold text-xl">{playerOfGame.player}</div>
                  <div className="text-gray-600 flex items-center gap-1">
                    <span>{playerOfGame.logo}</span>
                    <span>{playerOfGame.team}</span>
                  </div>
                  <div className="text-sm text-gray-500">{playerOfGame.gameVs}</div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="font-bold text-2xl text-orange-600">{playerOfGame.stats.points}</div>
                  <div className="text-xs text-gray-600">PTS</div>
                </div>
                <div>
                  <div className="font-bold text-2xl text-orange-600">{playerOfGame.stats.rebounds}</div>
                  <div className="text-xs text-gray-600">REB</div>
                </div>
                <div>
                  <div className="font-bold text-2xl text-orange-600">{playerOfGame.stats.assists}</div>
                  <div className="text-xs text-gray-600">AST</div>
                </div>
                <div>
                  <div className="font-bold text-2xl text-orange-600">{playerOfGame.stats.steals}</div>
                  <div className="text-xs text-gray-600">STL</div>
                </div>
              </div>
            </div>

            {/* Team of the Week */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-lg">Team of the Week</h3>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
                  🐲
                </div>
                <div>
                  <div className="font-bold text-xl">Fire Dragons</div>
                  <div className="text-gray-600">3-0 this week</div>
                  <div className="text-sm text-gray-500">Avg margin: +15.3</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="font-bold text-2xl text-blue-600">115.3</div>
                  <div className="text-xs text-gray-600">PPG</div>
                </div>
                <div>
                  <div className="font-bold text-2xl text-blue-600">68%</div>
                  <div className="text-xs text-gray-600">FG%</div>
                </div>
                <div>
                  <div className="font-bold text-2xl text-blue-600">28.7</div>
                  <div className="text-xs text-gray-600">APG</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Media & Highlights */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Highlights & Media</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Featured Video */}
            <div className="md:col-span-2">
              <div className="relative bg-gray-100 rounded-lg aspect-video mb-4">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=2190&auto=format&fit=crop"
                  alt="Game highlight"
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                  <Button size="lg" className="bg-white/20 hover:bg-white/30 text-white border-white">
                    <Play className="w-6 h-6 mr-2" />
                    Watch Highlights
                  </Button>
                </div>
              </div>
              <h3 className="font-bold text-lg mb-2">Fire Dragons vs Lightning Bolts - Game Highlights</h3>
              <p className="text-gray-600">Amazing comeback victory featuring Marcus Johnson's 32-point performance.</p>
            </div>

            {/* Thumbnail Gallery */}
            <div className="space-y-4">
              <h4 className="font-semibold">More Highlights</h4>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="relative w-20 h-12 bg-gray-100 rounded flex-shrink-0">
                    <ImageWithFallback
                      src={`https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=400&auto=format&fit=crop&${i}`}
                      alt={`Highlight ${i}`}
                      className="w-full h-full object-cover rounded"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">Top Play #{i}</div>
                    <div className="text-xs text-gray-500">2 hours ago</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Footer Call-to-Action */}
        <Card className="p-8 bg-gradient-to-r from-orange-50 to-red-50">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Track Your Stats Like the Pros?
            </h2>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Join StatJam Player Premium and get detailed analytics, highlight reels, and shareable performance profiles for your basketball journey.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white">
                Try Player Premium
              </Button>
              <Button size="lg" variant="outline">
                Organize Tournament
              </Button>
              <Button size="lg" variant="outline">
                Become a Sponsor
              </Button>
            </div>

            {/* Social Links */}
            <div className="flex justify-center gap-4 mt-6">
              <Button variant="ghost" size="sm">
                <Share className="w-4 h-4 mr-2" />
                Follow on Twitter
              </Button>
              <Button variant="ghost" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Instagram
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}