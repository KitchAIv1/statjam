import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Users, Plus, Phone, Mail, MapPin, Edit, Trash2, Trophy, Filter } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { PlayerManager } from "./PlayerManager";

interface Team {
  id: string;
  name: string;
  coach: string;
  email: string;
  phone: string;
  players: number;
  location: string;
  division: string;
  status: 'Active' | 'Inactive';
  tournamentId: string;
  tournamentName: string;
}

interface Tournament {
  id: string;
  name: string;
  status: 'Active' | 'Completed' | 'Upcoming';
}

interface TeamManagerProps {
  contextTournament?: {
    id: string;
    name: string;
    status: string;
  };
}

export function TeamManager({ contextTournament }: TeamManagerProps) {
  const [tournaments] = useState<Tournament[]>([
    { id: "1", name: "Spring Classic 2024", status: "Active" },
    { id: "2", name: "Summer Showcase 2024", status: "Active" },
    { id: "3", name: "Fall Championship 2024", status: "Upcoming" },
    { id: "4", name: "Winter Invitational 2024", status: "Upcoming" },
    { id: "5", name: "Spring Classic 2023", status: "Completed" }
  ]);

  const [selectedTournament, setSelectedTournament] = useState<string>(
    contextTournament ? contextTournament.id : "All"
  );
  const [teams, setTeams] = useState<Team[]>([
    {
      id: "1",
      name: "Fire Hawks",
      coach: "Mike Johnson",
      email: "mike.johnson@firehawks.com",
      phone: "(555) 123-4567",
      players: 12,
      location: "Madison Square Arena",
      division: "Senior",
      status: "Active",
      tournamentId: "1",
      tournamentName: "Spring Classic 2024"
    },
    {
      id: "2",
      name: "Thunder Bolts",
      coach: "Sarah Williams",
      email: "sarah@thunderbolts.com",
      phone: "(555) 234-5678",
      players: 10,
      location: "Central Basketball Court",
      division: "Youth",
      status: "Active",
      tournamentId: "2",
      tournamentName: "Summer Showcase 2024"
    },
    {
      id: "3",
      name: "Storm Breakers",
      coach: "David Brown",
      email: "coach@stormbreakers.com",
      phone: "(555) 345-6789",
      players: 11,
      location: "West Side Sports Complex",
      division: "Senior",
      status: "Active",
      tournamentId: "1",
      tournamentName: "Spring Classic 2024"
    },
    {
      id: "4",
      name: "Lightning Eagles",
      coach: "Lisa Garcia",
      email: "lisa@lightningeagles.com",
      phone: "(555) 456-7890",
      players: 9,
      location: "North Stadium Arena",
      division: "Youth",
      status: "Inactive",
      tournamentId: "4",
      tournamentName: "Winter Invitational 2024"
    },
    {
      id: "5",
      name: "Phoenix Risers",
      coach: "James Wilson",
      email: "coach@phoenixrisers.com",
      phone: "(555) 567-8901",
      players: 13,
      location: "Downtown Sports Center",
      division: "Senior",
      status: "Active",
      tournamentId: "2",
      tournamentName: "Summer Showcase 2024"
    },
    {
      id: "6",
      name: "Golden Wolves",
      coach: "Maria Rodriguez",
      email: "maria@goldenwolves.com",
      phone: "(555) 678-9012",
      players: 8,
      location: "Community Basketball Hall",
      division: "Youth",
      status: "Active",
      tournamentId: "3",
      tournamentName: "Fall Championship 2024"
    }
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isPlayerManagerOpen, setIsPlayerManagerOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: "",
    coach: "",
    email: "",
    phone: "",
    location: ""
  });

  const handleCreateTeam = () => {
    const team: Team = {
      id: Math.random().toString(36).substr(2, 9),
      name: newTeam.name,
      coach: newTeam.coach,
      email: newTeam.email,
      phone: newTeam.phone,
      players: 0,
      location: newTeam.location,
      division: "Senior",
      status: "Active",
      tournamentId: contextTournament ? contextTournament.id : selectedTournament,
      tournamentName: contextTournament ? contextTournament.name : tournaments.find(t => t.id === selectedTournament)?.name || "Spring Classic 2024"
    };

    setTeams([...teams, team]);
    setNewTeam({
      name: "",
      coach: "",
      email: "",
      phone: "",
      location: ""
    });
    setIsCreateDialogOpen(false);
  };

  const handleUpdateTeamPlayerCount = (teamId: string, playerCount: number) => {
    setTeams(teams.map(team => 
      team.id === teamId ? { ...team, players: playerCount } : team
    ));
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setIsPlayerManagerOpen(true);
  };

  const deleteTeam = (id: string) => {
    setTeams(teams.filter(team => team.id !== id));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Filter teams by tournament
  const filteredTeams = selectedTournament === "All" 
    ? teams 
    : teams.filter(team => team.tournamentId === selectedTournament);

  const activeTeams = filteredTeams.filter(team => team.status === 'Active');
  const inactiveTeams = filteredTeams.filter(team => team.status === 'Inactive');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2>Team Management</h2>
          <p className="text-muted-foreground">Manage teams and their information</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Team
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Team</DialogTitle>
              <DialogDescription>
                {contextTournament 
                  ? `Create a new team for ${contextTournament.name}`
                  : "Create a new team"
                }
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder="Enter team name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="coach">Coach Name</Label>
                <Input
                  id="coach"
                  value={newTeam.coach}
                  onChange={(e) => setNewTeam({ ...newTeam, coach: e.target.value })}
                  placeholder="Enter coach name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newTeam.email}
                    onChange={(e) => setNewTeam({ ...newTeam, email: e.target.value })}
                    placeholder="coach@team.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newTeam.phone}
                    onChange={(e) => setNewTeam({ ...newTeam, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newTeam.location}
                  onChange={(e) => setNewTeam({ ...newTeam, location: e.target.value })}
                  placeholder="Home court/venue"
                />
              </div>
              {contextTournament && (
                <div className="grid gap-2">
                  <Label>Tournament</Label>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <Trophy className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{contextTournament.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {contextTournament.status}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTeam}>
                Create Team
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Enhanced Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-all duration-300 border-0 overflow-hidden">
          <div className="bg-gradient-to-br from-primary to-primary/80 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">Total Teams</CardTitle>
              <Users className="h-5 w-5 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{filteredTeams.length}</div>
              <p className="text-xs text-white/80">{activeTeams.length} active teams</p>
            </CardContent>
          </div>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 border-0 overflow-hidden">
          <div className="bg-gradient-to-br from-accent to-accent/80 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">Total Players</CardTitle>
              <Users className="h-5 w-5 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{filteredTeams.reduce((sum, team) => sum + team.players, 0)}</div>
              <p className="text-xs text-white/80">Across filtered teams</p>
            </CardContent>
          </div>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 border-0 overflow-hidden">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">Divisions</CardTitle>
              <Users className="h-5 w-5 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{new Set(filteredTeams.map(t => t.division)).size}</div>
              <p className="text-xs text-white/80">In this view</p>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Enhanced Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border/50 hover:border-primary/20 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-orange-500"></div>
            <CardHeader className="relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                        {getInitials(team.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-base group-hover:text-primary transition-colors">{team.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-primary/60 rounded-full"></div>
                      {team.division} Division
                    </CardDescription>
                  </div>
                </div>
                <Badge 
                  variant={team.status === 'Active' ? 'default' : 'secondary'}
                  className={team.status === 'Active' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-0' : ''}
                >
                  {team.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Trophy className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate">{team.tournamentName}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>Coach: {team.coach}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{team.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{team.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{team.location}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{team.players}</span>
                  </div>
                  <span className="text-sm font-medium">players</span>
                </div>
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="hover:bg-primary/10 hover:text-primary"
                    onClick={() => handleEditTeam(team)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => deleteTeam(team.id)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Teams Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Teams</CardTitle>
          <CardDescription>Complete overview of registered teams</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Coach</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Players</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(team.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{team.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{team.coach}</TableCell>
                  <TableCell>{team.division}</TableCell>
                  <TableCell>{team.players}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{team.email}</div>
                      <div className="text-muted-foreground">{team.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={team.status === 'Active' ? 'default' : 'secondary'}>
                      {team.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleEditTeam(team)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => deleteTeam(team.id)}
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
      
      {/* Player Manager Modal */}
      <PlayerManager 
        team={selectedTeam}
        isOpen={isPlayerManagerOpen}
        onClose={() => {
          setIsPlayerManagerOpen(false);
          setSelectedTeam(null);
        }}
        onUpdateTeam={handleUpdateTeamPlayerCount}
      />
    </div>
  );
}