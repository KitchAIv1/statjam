import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Users, Plus, UserPlus, Trash2, Search, Filter, Calendar, Hash, Edit } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface Player {
  id: string;
  name: string;
  position: string;
  jerseyNumber: number;
  age: number;
  height: string;
  status: 'Active' | 'Injured' | 'Bench';
  inTeam: boolean;
}

interface RosterPlayer {
  id: string;
  name: string;
  position: string;
  age: number;
  height: string;
  experience: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional';
}

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
}

interface PlayerManagerProps {
  team: Team | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTeam: (teamId: string, playerCount: number) => void;
}

export function PlayerManager({ team, isOpen, onClose, onUpdateTeam }: PlayerManagerProps) {
  // Current team players
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([
    {
      id: "1",
      name: "Michael Jordan",
      position: "Shooting Guard",
      jerseyNumber: 23,
      age: 25,
      height: "6'6\"",
      status: "Active",
      inTeam: true
    },
    {
      id: "2",
      name: "LeBron James",
      position: "Small Forward",
      jerseyNumber: 6,
      age: 28,
      height: "6'9\"",
      status: "Active",
      inTeam: true
    },
    {
      id: "3",
      name: "Stephen Curry",
      position: "Point Guard",
      jerseyNumber: 30,
      age: 26,
      height: "6'2\"",
      status: "Active",
      inTeam: true
    }
  ]);

  // Available roster players (not in team)
  const [rosterPlayers] = useState<RosterPlayer[]>([
    {
      id: "r1",
      name: "Kobe Bryant",
      position: "Shooting Guard",
      age: 27,
      height: "6'6\"",
      experience: "5 years",
      skillLevel: "Professional"
    },
    {
      id: "r2",
      name: "Kevin Durant",
      position: "Power Forward",
      age: 29,
      height: "6'10\"",
      experience: "8 years",
      skillLevel: "Professional"
    },
    {
      id: "r3",
      name: "Magic Johnson",
      position: "Point Guard",
      age: 24,
      height: "6'9\"",
      experience: "3 years",
      skillLevel: "Advanced"
    },
    {
      id: "r4",
      name: "Larry Bird",
      position: "Small Forward",
      age: 26,
      height: "6'9\"",
      experience: "4 years",
      skillLevel: "Professional"
    },
    {
      id: "r5",
      name: "Shaquille O'Neal",
      position: "Center",
      age: 28,
      height: "7'1\"",
      experience: "6 years",
      skillLevel: "Professional"
    },
    {
      id: "r6",
      name: "Tim Duncan",
      position: "Center",
      age: 25,
      height: "6'11\"",
      experience: "2 years",
      skillLevel: "Advanced"
    }
  ]);

  const [showRosterDialog, setShowRosterDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("All");
  const [skillFilter, setSkillFilter] = useState("All");

  const positions = ["All", "Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"];
  const skillLevels = ["All", "Beginner", "Intermediate", "Advanced", "Professional"];

  const filteredRosterPlayers = rosterPlayers.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = positionFilter === "All" || player.position === positionFilter;
    const matchesSkill = skillFilter === "All" || player.skillLevel === skillFilter;
    return matchesSearch && matchesPosition && matchesSkill;
  });

  const handleAddPlayerToTeam = (rosterPlayer: RosterPlayer) => {
    // Generate next available jersey number
    const usedNumbers = teamPlayers.map(p => p.jerseyNumber);
    let jerseyNumber = 1;
    while (usedNumbers.includes(jerseyNumber) && jerseyNumber <= 99) {
      jerseyNumber++;
    }

    const newPlayer: Player = {
      id: rosterPlayer.id,
      name: rosterPlayer.name,
      position: rosterPlayer.position,
      jerseyNumber,
      age: rosterPlayer.age,
      height: rosterPlayer.height,
      status: "Active",
      inTeam: true
    };

    setTeamPlayers([...teamPlayers, newPlayer]);
    if (team) {
      onUpdateTeam(team.id, teamPlayers.length + 1);
    }
    setShowRosterDialog(false);
  };

  const handleRemovePlayerFromTeam = (playerId: string) => {
    setTeamPlayers(teamPlayers.filter(p => p.id !== playerId));
    if (team) {
      onUpdateTeam(team.id, teamPlayers.length - 1);
    }
  };

  const updatePlayerStatus = (playerId: string, status: Player['status']) => {
    setTeamPlayers(teamPlayers.map(p => 
      p.id === playerId ? { ...p, status } : p
    ));
  };

  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    position: "",
    jerseyNumber: "",
    age: "",
    height: "",
    status: "Active" as const
  });

  const handleAddPlayer = () => {
    if (!newPlayer.name || !newPlayer.position || !newPlayer.jerseyNumber) return;

    const player: Player = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPlayer.name,
      position: newPlayer.position,
      jerseyNumber: parseInt(newPlayer.jerseyNumber),
      age: parseInt(newPlayer.age) || 20,
      height: newPlayer.height || "6'0\"",
      status: newPlayer.status,
      inTeam: true
    };

    setTeamPlayers([...teamPlayers, player]);
    if (team) {
      onUpdateTeam(team.id, teamPlayers.length + 1);
    }
    
    setNewPlayer({
      name: "",
      position: "",
      jerseyNumber: "",
      age: "",
      height: "",
      status: "Active"
    });
    setIsAddPlayerOpen(false);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setNewPlayer({
      name: player.name,
      position: player.position,
      jerseyNumber: player.jerseyNumber.toString(),
      age: player.age.toString(),
      height: player.height,
      status: player.status
    });
    setIsAddPlayerOpen(true);
  };

  const handleUpdatePlayer = () => {
    if (!editingPlayer || !newPlayer.name || !newPlayer.position || !newPlayer.jerseyNumber) return;

    const updatedPlayer: Player = {
      ...editingPlayer,
      name: newPlayer.name,
      position: newPlayer.position,
      jerseyNumber: parseInt(newPlayer.jerseyNumber),
      age: parseInt(newPlayer.age) || editingPlayer.age,
      height: newPlayer.height || editingPlayer.height,
      status: newPlayer.status
    };

    setTeamPlayers(teamPlayers.map(p => p.id === editingPlayer.id ? updatedPlayer : p));
    
    setNewPlayer({
      name: "",
      position: "",
      jerseyNumber: "",
      age: "",
      height: "",
      status: "Active"
    });
    setEditingPlayer(null);
    setIsAddPlayerOpen(false);
  };

  const handleDeletePlayer = (playerId: string) => {
    setTeamPlayers(teamPlayers.filter(p => p.id !== playerId));
    if (team) {
      onUpdateTeam(team.id, teamPlayers.length - 1);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusVariant = (status: Player['status']) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Injured':
        return 'destructive';
      case 'Bench':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const activePlayers = teamPlayers.filter(p => p.status === 'Active');
  const injuredPlayers = teamPlayers.filter(p => p.status === 'Injured');
  const benchPlayers = teamPlayers.filter(p => p.status === 'Bench');

  if (!team) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl lg:max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="truncate">{team.name} - Player Management</span>
            </DialogTitle>
            <DialogDescription className="text-sm">
              Manage players for {team.name} ({team.division} Division)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            {/* Player Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <Card className="border-0 overflow-hidden">
                <div className="bg-gradient-to-br from-primary to-primary/80 text-white">
                  <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                    <CardTitle className="text-xs sm:text-sm text-white/90">Total Players</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="text-lg sm:text-2xl font-bold">{teamPlayers.length}</div>
                  </CardContent>
                </div>
              </Card>
              
              <Card className="border-0 overflow-hidden">
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                    <CardTitle className="text-xs sm:text-sm text-white/90">Active</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="text-lg sm:text-2xl font-bold">{activePlayers.length}</div>
                  </CardContent>
                </div>
              </Card>
              
              <Card className="border-0 overflow-hidden">
                <div className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                  <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                    <CardTitle className="text-xs sm:text-sm text-white/90">Injured</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="text-lg sm:text-2xl font-bold">{injuredPlayers.length}</div>
                  </CardContent>
                </div>
              </Card>
              
              <Card className="border-0 overflow-hidden">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                  <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                    <CardTitle className="text-xs sm:text-sm text-white/90">Bench</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="text-lg sm:text-2xl font-bold">{benchPlayers.length}</div>
                  </CardContent>
                </div>
              </Card>
            </div>

            {/* Add Player Button */}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
              <h3 className="text-base sm:text-lg font-semibold">Team Roster</h3>
              <Button 
                onClick={() => setShowRosterDialog(true)}
                className="gap-2 w-full sm:w-auto"
                size="sm"
              >
                <UserPlus className="w-4 h-4" />
                Add from Roster
              </Button>
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {teamPlayers.map((player) => (
                <Card key={player.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-border/50 hover:border-primary/20">
                  <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="relative flex-shrink-0">
                          <Avatar className="border-2 border-primary/20 w-8 h-8 sm:w-10 sm:h-10">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold text-xs sm:text-sm">
                              {getInitials(player.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full border-2 border-white flex items-center justify-center">
                            <span className="text-xs font-bold text-white">{player.jerseyNumber}</span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold group-hover:text-primary transition-colors text-sm sm:text-base truncate">{player.name}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{player.position}</p>
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(player.status)} className="flex-shrink-0 text-xs">
                        {player.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Calendar className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{player.age} years</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Hash className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{player.height}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 pt-2 border-t border-border/50">
                      <Select value={player.status} onValueChange={(value: Player['status']) => updatePlayerStatus(player.id, value)}>
                        <SelectTrigger size="sm" className="flex-1 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Injured">Injured</SelectItem>
                          <SelectItem value="Bench">Bench</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0 flex-shrink-0"
                        onClick={() => handleRemovePlayerFromTeam(player.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Players Table - Hide on mobile, show on tablet+ */}
            <div className="hidden sm:block">
              <Card>
                <CardHeader>
                  <CardTitle>Complete Roster</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Player</TableHead>
                          <TableHead className="hidden md:table-cell">Position</TableHead>
                          <TableHead>Jersey #</TableHead>
                          <TableHead className="hidden lg:table-cell">Age</TableHead>
                          <TableHead className="hidden lg:table-cell">Height</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamPlayers.map((player) => (
                          <TableRow key={player.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {getInitials(player.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm truncate">{player.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm">{player.position}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">#{player.jerseyNumber}</Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm">{player.age}</TableCell>
                            <TableCell className="hidden lg:table-cell text-sm">{player.height}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusVariant(player.status)} className="text-xs">
                                {player.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleEditPlayer(player)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive h-8 w-8 p-0"
                                  onClick={() => handleDeletePlayer(player.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Player Dialog */}
      <Dialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingPlayer ? 'Edit Player' : 'Add New Player'}
            </DialogTitle>
            <DialogDescription>
              {editingPlayer ? 'Update player information' : 'Add a new player to the team roster'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="playerName">Player Name</Label>
              <Input
                id="playerName"
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                placeholder="Enter player name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="position">Position</Label>
              <Select value={newPlayer.position} onValueChange={(value) => setNewPlayer({ ...newPlayer, position: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="jerseyNumber">Jersey Number</Label>
                <Input
                  id="jerseyNumber"
                  type="number"
                  value={newPlayer.jerseyNumber}
                  onChange={(e) => setNewPlayer({ ...newPlayer, jerseyNumber: e.target.value })}
                  placeholder="23"
                  min="0"
                  max="99"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={newPlayer.age}
                  onChange={(e) => setNewPlayer({ ...newPlayer, age: e.target.value })}
                  placeholder="25"
                  min="16"
                  max="50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="height">Height</Label>
                <Input
                  id="height"
                  value={newPlayer.height}
                  onChange={(e) => setNewPlayer({ ...newPlayer, height: e.target.value })}
                  placeholder="6'2&quot;"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={newPlayer.status} onValueChange={(value: Player['status']) => setNewPlayer({ ...newPlayer, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Injured">Injured</SelectItem>
                    <SelectItem value="Bench">Bench</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsAddPlayerOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={editingPlayer ? handleUpdatePlayer : handleAddPlayer}
              className="flex-1"
            >
              {editingPlayer ? 'Update Player' : 'Add Player'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Roster Dialog */}
      <Dialog open={showRosterDialog} onOpenChange={setShowRosterDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base sm:text-lg">Roster Players</DialogTitle>
            <DialogDescription className="text-sm">
              Search and select players to add to your team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
              <Input
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <div className="flex gap-2">
                <Select value={positionFilter} onValueChange={setPositionFilter}>
                  <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue placeholder="Position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={skillFilter} onValueChange={setSkillFilter}>
                  <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue placeholder="Skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {skillLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {filteredRosterPlayers.map((player) => (
                <Card key={player.id} className="border border-border/50 hover:border-primary/20">
                  <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {getInitials(player.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm sm:text-base truncate">{player.name}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{player.position}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0 text-xs">
                        {player.skillLevel}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Calendar className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{player.age} years</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Hash className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{player.height}</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="w-full gap-2 text-xs sm:text-sm h-8 sm:h-9"
                      onClick={() => handleAddPlayerToTeam(player)}
                    >
                      <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                      Add to Team
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}