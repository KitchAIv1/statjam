import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trophy, Plus, Calendar, Users, Settings, Eye, UserPlus, MapPin, Award, Bell, Shield, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTournaments } from "@/lib/hooks/useTournaments";
import { Tournament } from "@/lib/types/tournament";

export function OrganizerTournamentManager() {
  const { tournaments, loading, error, createTournament, deleteTournament } = useTournaments();

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

  const handleCreateTournament = async () => {
    try {
      const tournamentData = {
        name: newTournament.name,
        description: newTournament.description,
        startDate: newTournament.startDate,
        endDate: newTournament.endDate,
        venue: "TBD", // Will be updated in the form
        maxTeams: parseInt(newTournament.maxTeams),
        tournamentType: newTournament.format.toLowerCase().replace(' ', '_') as any,
        isPublic: true,
        entryFee: 0,
        prizePool: 0,
        country: "US"
      };

      const result = await createTournament(tournamentData);
      if (result) {
        setNewTournament({
          name: "",
          format: "",
          startDate: "",
          endDate: "",
          maxTeams: "",
          description: ""
        });
        setIsCreateDialogOpen(false);
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
    }
  };

  const getStatusVariant = (status: Tournament['status']) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
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
      // This would update the tournament via the service
      console.log('Saving settings for tournament:', tournamentToEdit.name);
      setIsSettingsOpen(false);
      setTournamentToEdit(null);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Tournament Management</h2>
            <p className="text-muted-foreground">Create and manage your basketball tournaments</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded"></div>
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Tournament Management</h2>
            <p className="text-muted-foreground">Create and manage your basketball tournaments</p>
          </div>
        </div>
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <div className="text-destructive mb-2">Error loading tournaments</div>
            <div className="text-sm text-muted-foreground">{error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tournament Management</h2>
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
                      {tournament.tournamentType}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={getStatusVariant(tournament.status)} className={
                    tournament.status === 'active' 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-0' 
                      : tournament.status === 'completed'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0'
                      : ''
                  }>
                    {tournament.status}
                  </Badge>
                  {tournament.status === 'active' && (
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
                      <p className="text-sm font-semibold">{tournament.currentTeams}/{tournament.maxTeams}</p>
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
                      <p className="text-xs font-semibold">{tournament.tournamentType.split('_')[0]}</p>
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
                  <TableCell>{tournament.tournamentType}</TableCell>
                  <TableCell>{tournament.currentTeams}/{tournament.maxTeams}</TableCell>
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
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleOpenSettings(tournament)}
                        title="View Tournament"
                      >
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
              <div className="space-y-6">
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="font-semibold text-foreground mb-2">Team Management</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Team management for "{selectedTournament.name}" will be available here.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This will integrate with the live team data from your tournament.
                  </p>
                </div>
              </div>
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
                            <Select value={tournamentToEdit.status} onValueChange={(value: Tournament['status']) => setTournamentToEdit({ ...tournamentToEdit, status: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="edit-description">Description</Label>
                          <Textarea
                            id="edit-description"
                            value={tournamentToEdit.description || ''}
                            onChange={(e) => setTournamentToEdit({ ...tournamentToEdit, description: e.target.value })}
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-format">Format</Label>
                            <Select value={tournamentToEdit.tournamentType} onValueChange={(value) => setTournamentToEdit({ ...tournamentToEdit, tournamentType: value as any })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="single_elimination">Single Elimination</SelectItem>
                                <SelectItem value="double_elimination">Double Elimination</SelectItem>
                                <SelectItem value="round_robin">Round Robin</SelectItem>
                                <SelectItem value="swiss_system">Swiss System</SelectItem>
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

                  {/* Other tabs would be implemented here */}
                  <TabsContent value="venue" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Venue Settings</CardTitle>
                        <CardDescription>Configure tournament venue and location</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Venue settings will be implemented here.</p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="prizes" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Prize Settings</CardTitle>
                        <CardDescription>Configure tournament prizes and awards</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Prize settings will be implemented here.</p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Advanced Settings</CardTitle>
                        <CardDescription>Advanced tournament configuration</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Advanced settings will be implemented here.</p>
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
