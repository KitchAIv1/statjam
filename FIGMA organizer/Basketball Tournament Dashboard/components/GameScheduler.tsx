import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Calendar, Plus, Clock, MapPin, Users, Trophy, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface Game {
  id: string;
  tournament: string;
  team1: string;
  team2: string;
  date: string;
  time: string;
  court: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  score1?: number;
  score2?: number;
}

export function GameScheduler() {
  const [games, setGames] = useState<Game[]>([
    {
      id: "1",
      tournament: "Spring Championship",
      team1: "Fire Hawks",
      team2: "Thunder Bolts",
      date: "2025-08-15",
      time: "15:00",
      court: "Court A",
      status: "Scheduled"
    },
    {
      id: "2",
      tournament: "Spring Championship",
      team1: "Storm Breakers",
      team2: "Lightning Eagles",
      date: "2025-08-15",
      time: "17:00",
      court: "Court B",
      status: "Scheduled"
    },
    {
      id: "3",
      tournament: "Summer Classic",
      team1: "Fire Hawks",
      team2: "Storm Breakers",
      date: "2025-08-14",
      time: "14:00",
      court: "Court A",
      status: "Completed",
      score1: 78,
      score2: 65
    },
    {
      id: "4",
      tournament: "Youth League Finals",
      team1: "Thunder Bolts",
      team2: "Lightning Eagles",
      date: "2025-08-16",
      time: "10:00",
      court: "Court C",
      status: "In Progress",
      score1: 45,
      score2: 42
    }
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGame, setNewGame] = useState({
    tournament: "",
    team1: "",
    team2: "",
    date: "",
    time: "",
    court: ""
  });

  const tournaments = ["Spring Championship", "Summer Classic", "Youth League Finals"];
  const teams = ["Fire Hawks", "Thunder Bolts", "Storm Breakers", "Lightning Eagles"];
  const courts = ["Court A", "Court B", "Court C", "Main Arena"];

  const handleCreateGame = () => {
    const game: Game = {
      id: Math.random().toString(36).substr(2, 9),
      tournament: newGame.tournament,
      team1: newGame.team1,
      team2: newGame.team2,
      date: newGame.date,
      time: newGame.time,
      court: newGame.court,
      status: "Scheduled"
    };

    setGames([...games, game]);
    setNewGame({
      tournament: "",
      team1: "",
      team2: "",
      date: "",
      time: "",
      court: ""
    });
    setIsCreateDialogOpen(false);
  };

  const deleteGame = (id: string) => {
    setGames(games.filter(game => game.id !== id));
  };

  const getStatusVariant = (status: Game['status']) => {
    switch (status) {
      case 'Scheduled':
        return 'default';
      case 'In Progress':
        return 'destructive';
      case 'Completed':
        return 'outline';
      case 'Cancelled':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr: string) => {
    return new Date(`1970-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const todayGames = games.filter(game => game.date === "2025-08-15");
  const upcomingGames = games.filter(game => new Date(game.date) > new Date("2025-08-15"));
  const completedGames = games.filter(game => game.status === "Completed");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2>Game Scheduler</h2>
          <p className="text-muted-foreground">Schedule and manage basketball games</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Schedule Game
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Schedule New Game</DialogTitle>
              <DialogDescription>
                Schedule a new basketball game between two teams.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tournament">Tournament</Label>
                <Select value={newGame.tournament} onValueChange={(value) => setNewGame({ ...newGame, tournament: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tournament" />
                  </SelectTrigger>
                  <SelectContent>
                    {tournaments.map((tournament) => (
                      <SelectItem key={tournament} value={tournament}>
                        {tournament}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="team1">Team 1</Label>
                  <Select value={newGame.team1} onValueChange={(value) => setNewGame({ ...newGame, team1: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.filter(team => team !== newGame.team2).map((team) => (
                        <SelectItem key={team} value={team}>
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="team2">Team 2</Label>
                  <Select value={newGame.team2} onValueChange={(value) => setNewGame({ ...newGame, team2: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.filter(team => team !== newGame.team1).map((team) => (
                        <SelectItem key={team} value={team}>
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newGame.date}
                    onChange={(e) => setNewGame({ ...newGame, date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newGame.time}
                    onChange={(e) => setNewGame({ ...newGame, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="court">Court</Label>
                <Select value={newGame.court} onValueChange={(value) => setNewGame({ ...newGame, court: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select court" />
                  </SelectTrigger>
                  <SelectContent>
                    {courts.map((court) => (
                      <SelectItem key={court} value={court}>
                        {court}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGame}>
                Schedule Game
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Game Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Games</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayGames.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled for today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Games</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingGames.length}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Trophy className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedGames.length}</div>
            <p className="text-xs text-muted-foreground">Games finished</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Games</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{games.length}</div>
            <p className="text-xs text-muted-foreground">All tournaments</p>
          </CardContent>
        </Card>
      </div>

      {/* Games Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Games</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Games</CardTitle>
              <CardDescription>Complete schedule overview</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tournament</TableHead>
                    <TableHead>Teams</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Court</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {games.map((game) => (
                    <TableRow key={game.id}>
                      <TableCell className="font-medium">{game.tournament}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{game.team1}</span>
                          <span className="text-muted-foreground">vs</span>
                          <span>{game.team2}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{formatDate(game.date)}</div>
                          <div className="text-sm text-muted-foreground">{formatTime(game.time)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          {game.court}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(game.status)}>
                          {game.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {game.score1 !== undefined && game.score2 !== undefined ? (
                          <span className="font-mono">{game.score1} - {game.score2}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => deleteGame(game.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="today" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayGames.map((game) => (
              <Card key={game.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{game.tournament}</CardTitle>
                    <Badge variant={getStatusVariant(game.status)}>
                      {game.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {game.team1} <span className="text-muted-foreground">vs</span> {game.team2}
                    </div>
                    {game.score1 !== undefined && game.score2 !== undefined && (
                      <div className="text-xl font-bold text-primary mt-2">
                        {game.score1} - {game.score2}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(game.time)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {game.court}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Games</CardTitle>
              <CardDescription>Games scheduled for the future</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingGames.map((game) => (
                  <div key={game.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{game.team1} vs {game.team2}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(game.date)} at {formatTime(game.time)} • {game.court}
                      </p>
                    </div>
                    <Badge variant="outline">{game.tournament}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Games</CardTitle>
              <CardDescription>Past game results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completedGames.map((game) => (
                  <div key={game.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{game.team1} vs {game.team2}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(game.date)} • {game.tournament}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {game.score1} - {game.score2}
                      </div>
                      <div className="text-sm text-muted-foreground">Final</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}