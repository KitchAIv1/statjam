import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Trophy, Plus, Calendar, Users, Settings, Eye, UserPlus, Clock, MapPin, Award, Bell, Shield } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { TeamManager } from "./TeamManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";

interface Tournament {
  id: string;
  name: string;
  format: string;
  startDate: string;
  endDate: string;
  teams: number;
  maxTeams: number;
  status: 'Draft' | 'Active' | 'Completed';
  description: string;
}

export function TournamentManager() {
  const [tournaments, setTournaments] = useState<Tournament[]>([
    {
      id: "1",
      name: "Spring Championship",
      format: "Single Elimination",
      startDate: "2025-03-15",
      endDate: "2025-03-22",
      teams: 8,
      maxTeams: 8,
      status: "Active",
      description: "Annual spring basketball championship"
    },
    {
      id: "2",
      name: "Youth League Finals",
      format: "Round Robin",
      startDate: "2025-04-01",
      endDate: "2025-04-08",
      teams: 4,
      maxTeams: 6,
      status: "Draft",
      description: "Youth division championship tournament"
    },
    {
      id: "3",
      name: "Summer Classic",
      format: "Double Elimination",
      startDate: "2025-06-10",
      endDate: "2025-06-20",
      teams: 12,
      maxTeams: 16,
      status: "Active",
      description: "Premier summer basketball tournament"
    }
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tournamentToEdit, setTournamentToEdit] = useState<Tournament | null>(null);
  const [newTournament, setNewTournament] = useState({
    name: "",
    format: "",
    startDate: "",
    endDate: "",
    maxTeams: "",
    description: ""
  });

  const handleCreateTournament = () => {
    const tournament: Tournament = {
      id: Math.random().toString(36).substr(2, 9),
      name: newTournament.name,
      format: newTournament.format,
      startDate: newTournament.startDate,
      endDate: newTournament.endDate,
      teams: 0,
      maxTeams: parseInt(newTournament.maxTeams),
      status: "Draft",
      description: newTournament.description
    };

    setTournaments([...tournaments, tournament]);
    setNewTournament({
      name: "",
      format: "",
      startDate: "",
      endDate: "",
      maxTeams: "",
      description: ""
    });
    setIsCreateDialogOpen(false);
  };

  const handleManageTeams = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setIsTeamManagerOpen(true);
  };

  const handleOpenSettings = (tournament: Tournament) => {
    setTournamentToEdit(tournament);
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = () => {
    if (tournamentToEdit) {
      setTournaments(tournaments.map(t => 
        t.id === tournamentToEdit.id ? tournamentToEdit : t
      ));
      setIsSettingsOpen(false);
      setTournamentToEdit(null);
    }
  };

  const getStatusVariant = (status: Tournament['status']) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Draft':
        return 'secondary';
      case 'Completed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2>Tournament Management</h2>
          <p className="text-muted-foreground">Create and manage your basketball tournaments</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Tournament
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Tournament</DialogTitle>
              <DialogDescription>
                Set up a new basketball tournament with your preferred format and settings.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Tournament Name</Label>
                <Input
                  id="name"
                  value={newTournament.name}
                  onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                  placeholder="Enter tournament name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="format">Format</Label>
                <Select value={newTournament.format} onValueChange={(value) => setNewTournament({ ...newTournament, format: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tournament format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single Elimination">Single Elimination</SelectItem>
                    <SelectItem value="Double Elimination">Double Elimination</SelectItem>
                    <SelectItem value="Round Robin">Round Robin</SelectItem>
                    <SelectItem value="Swiss System">Swiss System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newTournament.startDate}
                    onChange={(e) => setNewTournament({ ...newTournament, startDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newTournament.endDate}
                    onChange={(e) => setNewTournament({ ...newTournament, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxTeams">Maximum Teams</Label>
                <Select value={newTournament.maxTeams} onValueChange={(value) => setNewTournament({ ...newTournament, maxTeams: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select max teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 Teams</SelectItem>
                    <SelectItem value="8">8 Teams</SelectItem>
                    <SelectItem value="16">16 Teams</SelectItem>
                    <SelectItem value="32">32 Teams</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTournament.description}
                  onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })}
                  placeholder="Brief description of the tournament"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTournament}>
                Create Tournament
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Enhanced Tournament Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tournaments.map((tournament) => (
          <Card key={tournament.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border/50 hover:border-primary/20 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-accent to-orange-500"></div>
            <CardHeader className="relative bg-gradient-to-br from-muted/30 to-transparent">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base group-hover:text-primary transition-colors">{tournament.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      {tournament.format}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={getStatusVariant(tournament.status)} className={
                    tournament.status === 'Active' 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-0' 
                      : tournament.status === 'Completed'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0'
                      : ''
                  }>
                    {tournament.status}
                  </Badge>
                  {tournament.status === 'Active' && (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
              <div className="mt-2">
                <p className="text-sm text-muted-foreground line-clamp-2">{tournament.description}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center">
                      <Users className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Teams</p>
                      <p className="text-sm font-semibold">{tournament.teams}/{tournament.maxTeams}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/30">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-md flex items-center justify-center">
                      <Calendar className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Start</p>
                      <p className="text-sm font-semibold">{new Date(tournament.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-md flex items-center justify-center">
                      <Trophy className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Format</p>
                      <p className="text-xs font-semibold">{tournament.format.split(' ')[0]}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                    <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-md flex items-center justify-center">
                      <Calendar className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">End</p>
                      <p className="text-sm font-semibold">{new Date(tournament.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2 border-t border-border/50">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 gap-1 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                  onClick={() => handleManageTeams(tournament)}
                >
                  <UserPlus className="w-3 h-3" />
                  Teams
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 gap-1 hover:bg-accent/10 hover:text-accent hover:border-accent/30"
                  onClick={() => handleOpenSettings(tournament)}
                >
                  <Settings className="w-3 h-3" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tournament Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tournaments</CardTitle>
          <CardDescription>Complete list of your tournaments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Teams</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournaments.map((tournament) => (
                <TableRow key={tournament.id}>
                  <TableCell className="font-medium">{tournament.name}</TableCell>
                  <TableCell>{tournament.format}</TableCell>
                  <TableCell>{tournament.teams}/{tournament.maxTeams}</TableCell>
                  <TableCell>
                    {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(tournament.status)}>
                      {tournament.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleManageTeams(tournament)}
                        title="Manage Teams"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleOpenSettings(tournament)}
                        title="Tournament Settings"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Team Manager Modal */}
      <Dialog open={isTeamManagerOpen} onOpenChange={setIsTeamManagerOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[95vh] overflow-hidden p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              {selectedTournament?.name} - Team Management
            </DialogTitle>
            <DialogDescription>
              Manage teams for {selectedTournament?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 py-4">
            {selectedTournament && (
              <TeamManager 
                contextTournament={{
                  id: selectedTournament.id,
                  name: selectedTournament.name,
                  status: selectedTournament.status
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Tournament Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[95vh] overflow-hidden p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Tournament Settings - {tournamentToEdit?.name}
            </DialogTitle>
            <DialogDescription>
              Configure all aspects of your tournament
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto flex-1">
            {tournamentToEdit && (
              <Tabs defaultValue="general" className="w-full">
                <div className="px-6 pt-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="general" className="gap-2">
                      <Trophy className="w-4 h-4" />
                      General
                    </TabsTrigger>
                    <TabsTrigger value="venue" className="gap-2">
                      <MapPin className="w-4 h-4" />
                      Venue
                    </TabsTrigger>
                    <TabsTrigger value="prizes" className="gap-2">
                      <Award className="w-4 h-4" />
                      Prizes
                    </TabsTrigger>
                    <TabsTrigger value="advanced" className="gap-2">
                      <Shield className="w-4 h-4" />
                      Advanced
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="px-6 pb-4">
                  {/* General Settings Tab */}
                  <TabsContent value="general" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-primary" />
                          Tournament Information
                        </CardTitle>
                        <CardDescription>Basic tournament details and configuration</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">Tournament Name</Label>
                            <Input
                              id="edit-name"
                              value={tournamentToEdit.name}
                              onChange={(e) => setTournamentToEdit({ ...tournamentToEdit, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-status">Status</Label>
                            <Select value={tournamentToEdit.status} onValueChange={(value: 'Draft' | 'Active' | 'Completed') => setTournamentToEdit({ ...tournamentToEdit, status: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Draft">Draft</SelectItem>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="edit-description">Description</Label>
                          <Textarea
                            id="edit-description"
                            value={tournamentToEdit.description}
                            onChange={(e) => setTournamentToEdit({ ...tournamentToEdit, description: e.target.value })}
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-format">Format</Label>
                            <Select value={tournamentToEdit.format} onValueChange={(value) => setTournamentToEdit({ ...tournamentToEdit, format: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Single Elimination">Single Elimination</SelectItem>
                                <SelectItem value="Double Elimination">Double Elimination</SelectItem>
                                <SelectItem value="Round Robin">Round Robin</SelectItem>
                                <SelectItem value="Swiss System">Swiss System</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-start-date">Start Date</Label>
                            <Input
                              id="edit-start-date"
                              type="date"
                              value={tournamentToEdit.startDate}
                              onChange={(e) => setTournamentToEdit({ ...tournamentToEdit, startDate: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-end-date">End Date</Label>
                            <Input
                              id="edit-end-date"
                              type="date"
                              value={tournamentToEdit.endDate}
                              onChange={(e) => setTournamentToEdit({ ...tournamentToEdit, endDate: e.target.value })}
                            />
                          </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-max-teams">Maximum Teams</Label>
                            <Select value={tournamentToEdit.maxTeams.toString()} onValueChange={(value) => setTournamentToEdit({ ...tournamentToEdit, maxTeams: parseInt(value) })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="4">4 Teams</SelectItem>
                                <SelectItem value="8">8 Teams</SelectItem>
                                <SelectItem value="16">16 Teams</SelectItem>
                                <SelectItem value="32">32 Teams</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-3">
                            <Label>Registration Settings</Label>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="auto-register" className="text-sm">Allow Auto Registration</Label>
                              <Switch id="auto-register" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="public-registration" className="text-sm">Public Registration</Label>
                              <Switch id="public-registration" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Game Settings Tab */}
                  <TabsContent value="games" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-primary" />
                          Game Configuration
                        </CardTitle>
                        <CardDescription>Configure game duration, rules, and scoring</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="game-duration">Game Duration (minutes)</Label>
                            <Select defaultValue="40">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="20">20 minutes</SelectItem>
                                <SelectItem value="32">32 minutes</SelectItem>
                                <SelectItem value="40">40 minutes</SelectItem>
                                <SelectItem value="48">48 minutes</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="quarter-duration">Quarter Duration</Label>
                            <Select defaultValue="10">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="8">8 minutes</SelectItem>
                                <SelectItem value="10">10 minutes</SelectItem>
                                <SelectItem value="12">12 minutes</SelectItem>
                                <SelectItem value="15">15 minutes</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="shot-clock">Shot Clock (seconds)</Label>
                            <Select defaultValue="24">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="24">24 seconds</SelectItem>
                                <SelectItem value="30">30 seconds</SelectItem>
                                <SelectItem value="35">35 seconds</SelectItem>
                                <SelectItem value="none">No Shot Clock</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h4 className="font-medium">Game Rules</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="overtime" className="text-sm">Allow Overtime</Label>
                                <Switch id="overtime" defaultChecked />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="three-point" className="text-sm">Three-Point Line</Label>
                                <Switch id="three-point" defaultChecked />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="substitutions" className="text-sm">Unlimited Substitutions</Label>
                                <Switch id="substitutions" defaultChecked />
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="fouls" className="text-sm">Team Foul Limit (per quarter)</Label>
                                <Select defaultValue="5">
                                  <SelectTrigger className="w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="4">4</SelectItem>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="6">6</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="timeouts" className="text-sm">Timeouts per Team</Label>
                                <Select defaultValue="6">
                                  <SelectTrigger className="w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="4">4</SelectItem>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="6">6</SelectItem>
                                    <SelectItem value="7">7</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Venue Settings Tab */}
                  <TabsContent value="venue" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-primary" />
                          Venue & Location
                        </CardTitle>
                        <CardDescription>Set up tournament venues and court assignments</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="venue-name">Venue Name</Label>
                            <Input
                              id="venue-name"
                              placeholder="e.g., Sports Complex Arena"
                              defaultValue="Community Sports Center"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="venue-address">Address</Label>
                            <Input
                              id="venue-address"
                              placeholder="Full venue address"
                              defaultValue="123 Basketball Ave, Sports City"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Prizes Tab */}
                  <TabsContent value="prizes" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-primary" />
                          Awards & Prizes
                        </CardTitle>
                        <CardDescription>Configure tournament prizes and recognition</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="first-prize">1st Place Prize</Label>
                            <Input
                              id="first-prize"
                              placeholder="e.g., $500 or Trophy"
                              defaultValue="Championship Trophy + $500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="second-prize">2nd Place Prize</Label>
                            <Input
                              id="second-prize"
                              placeholder="e.g., $250 or Medal"
                              defaultValue="Runner-up Trophy + $250"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="third-prize">3rd Place Prize</Label>
                            <Input
                              id="third-prize"
                              placeholder="e.g., $100 or Medal"
                              defaultValue="Bronze Medal + $100"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mvp-prize">MVP Award</Label>
                            <Input
                              id="mvp-prize"
                              placeholder="Most Valuable Player award"
                              defaultValue="MVP Trophy + Basketball"
                            />
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h4 className="font-medium">Additional Awards</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="sportsmanship" className="text-sm">Sportsmanship Award</Label>
                              <Switch id="sportsmanship" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="all-tournament" className="text-sm">All-Tournament Team</Label>
                              <Switch id="all-tournament" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="participation" className="text-sm">Participation Certificates</Label>
                              <Switch id="participation" defaultChecked />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="sponsor-prizes">Sponsor Prizes</Label>
                            <Textarea
                              id="sponsor-prizes"
                              placeholder="List any additional sponsor-provided prizes..."
                              rows={3}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Advanced Settings Tab */}
                  <TabsContent value="advanced" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-primary" />
                          Advanced Configuration
                        </CardTitle>
                        <CardDescription>Advanced tournament settings and notifications</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-4">
                          <h4 className="font-medium flex items-center gap-2">
                            <Bell className="w-4 h-4" />
                            Notifications
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="email-updates" className="text-sm">Email Updates to Teams</Label>
                                <Switch id="email-updates" defaultChecked />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="game-reminders" className="text-sm">Game Reminders</Label>
                                <Switch id="game-reminders" defaultChecked />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="score-updates" className="text-sm">Live Score Updates</Label>
                                <Switch id="score-updates" />
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="bracket-updates" className="text-sm">Bracket Change Notifications</Label>
                                <Switch id="bracket-updates" defaultChecked />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="weather-alerts" className="text-sm">Weather Alerts</Label>
                                <Switch id="weather-alerts" />
                              </div>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h4 className="font-medium text-destructive">Danger Zone</h4>
                          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                            <div>
                              <p className="font-medium">Delete Tournament</p>
                              <p className="text-sm text-muted-foreground">Permanently delete this tournament and all associated data</p>
                            </div>
                            <Button variant="destructive" size="sm">
                              Delete Tournament
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}