import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trophy, Plus, Calendar, Users, Settings, Eye, UserPlus, MapPin, Award, Bell, Shield, Clock, Edit, Trash2, UserCheck, UserX, Target, CalendarDays } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTournaments } from "@/lib/hooks/useTournaments";
import { useTeamManagement } from "@/hooks/useTeamManagement";
import { useTournamentTeamCount } from "@/hooks/useTournamentTeamCount";
import { useTournamentGameStatus } from "@/hooks/useTournamentGameStatus";
import { TournamentTableRow } from "@/components/TournamentTableRow";
import { Tournament } from "@/lib/types/tournament";
import { TeamCreationModal } from "@/components/shared/TeamCreationModal";
import { OrganizerPlayerManagementService } from "@/lib/services/organizerPlayerManagementService";
import { TeamService, TournamentService } from "@/lib/services/tournamentService";
import { useRouter } from 'next/navigation';
import { notify } from '@/lib/services/notificationService';
import { invalidateOrganizerDashboard, invalidateOrganizerTournaments } from '@/lib/utils/cache';

// Utility function for tournament status variants with enhanced styling
function getStatusVariant(status: Tournament['status']) {
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
}

// Enhanced status styling function
function getStatusClasses(status: Tournament['status']) {
  switch (status) {
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

// Tournament Card Component with Real-time Team Count
interface TournamentCardProps {
  tournament: Tournament;
  onManageTeams: (tournament: Tournament) => void;
  onManageSchedule: (tournament: Tournament) => void;
  onOpenSettings: (tournament: Tournament) => void;
  onDeleteTournament: (tournament: Tournament) => void;
  onViewTournament: (tournament: Tournament) => void;
}

function TournamentCard({ tournament, onManageTeams, onManageSchedule, onOpenSettings, onDeleteTournament, onViewTournament }: TournamentCardProps) {
  const { currentTeams, maxTeams, loading: teamCountLoading } = useTournamentTeamCount(tournament.id, {
    maxTeams: tournament.maxTeams
  });
  
  const { hasGames, gameCount, loading: gameStatusLoading } = useTournamentGameStatus(tournament.id);

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border/50 hover:border-primary/20 overflow-hidden cursor-pointer">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-accent to-orange-500"></div>
      <CardHeader 
        className="relative bg-gradient-to-br from-muted/30 to-transparent"
        onClick={() => onViewTournament(tournament)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-base group-hover:text-primary transition-colors">{tournament.name}</CardTitle>
              <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                {tournament.tournamentType}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={getStatusVariant(tournament.status)} className={`${getStatusClasses(tournament.status)} px-3 py-1 text-xs uppercase tracking-wide`}>
              {tournament.status === 'active' && <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>}
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
        <div 
          className="grid grid-cols-2 gap-4"
          onClick={() => onViewTournament(tournament)}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center">
                <Users className="w-3 h-3 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Teams</p>
                <p className="text-sm font-semibold">
                  {teamCountLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    `${currentTeams}/${maxTeams}`
                  )}
                </p>
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
        
        <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-border/50">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-1 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    onManageTeams(tournament);
                  }}
                >
                  <UserPlus className="w-3 h-3" />
                  <span className="hidden sm:inline">Teams</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add Players</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="sm" 
                variant={hasGames ? "default" : "outline"}
                className={`gap-1 ${
                  hasGames 
                    ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                    : "hover:bg-orange/10 hover:text-orange-600 hover:border-orange/30"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onManageSchedule(tournament);
                }}
                disabled={gameStatusLoading}
              >
                <CalendarDays className="w-3 h-3" />
                <span className="hidden sm:inline">
                  {gameStatusLoading ? "..." : hasGames ? "Schedule" : "Create"}
                </span>
                {hasGames && gameCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs px-1 py-0 h-4 min-w-4">
                    {gameCount}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{hasGames ? "Manage Game Schedules" : "Create Game Schedules"}</p>
            </TooltipContent>
          </Tooltip>
          
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-1 hover:bg-accent/10 hover:text-accent hover:border-accent/30"
            onClick={(e) => {
              e.stopPropagation();
              onOpenSettings(tournament);
            }}
          >
            <Settings className="w-3 h-3" />
            <span className="hidden sm:inline">Settings</span>
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="sm" 
                variant="outline"
                className="gap-1 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTournament(tournament);
                }}
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Tournament</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}



interface OrganizerTournamentManagerProps {
  user: { id: string } | null;
}

export function OrganizerTournamentManager({ user }: OrganizerTournamentManagerProps) {
  const { tournaments, loading, error, createTournament, deleteTournament } = useTournaments(user);
  const router = useRouter();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tournamentToEdit, setTournamentToEdit] = useState<Tournament | null>(null);
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  
  // Delete confirmation states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null);
  
  // Stat admin management states
  const [statAdmins, setStatAdmins] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loadingStatAdmins, setLoadingStatAdmins] = useState(false);
  const [assignedStatAdmins, setAssignedStatAdmins] = useState<string[]>([]);
  
  // Team management hook - always call it, but pass empty string if no tournament selected
  const teamManagement = useTeamManagement(selectedTournament?.id || '', user);
  const [newTournament, setNewTournament] = useState({
    name: "",
    format: "",
    startDate: "",
    endDate: "",
    maxTeams: "",
    description: "",
    ruleset: "NBA" // ✅ PHASE 1: Default to NBA ruleset
  });
  
  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Load stat admins when settings modal opens
  const loadStatAdmins = async () => {
    if (!tournamentToEdit) return;
    
    setLoadingStatAdmins(true);
    try {
      console.log('🔍 Loading stat admins for tournament settings...');
      
      // Load all available stat admins
      const admins = await TeamService.getStatAdmins();
      console.log('✅ Loaded stat admins:', admins.length, 'admins');
      setStatAdmins(admins);
      
      // Load existing assignments for this tournament
      console.log('🔍 Loading existing stat admin assignments for tournament:', tournamentToEdit.id);
      
      // First check database (from games)
      const dbAssignments = await TeamService.getTournamentStatAdmins(tournamentToEdit.id);
      console.log('✅ Loaded DB assignments:', dbAssignments.length, 'assignments');
      
      // If no DB assignments, check localStorage for pending assignments
      if (dbAssignments.length === 0) {
        const localKey = `stat_admins_${tournamentToEdit.id}`;
        const localAssignments = JSON.parse(localStorage.getItem(localKey) || '[]');
        console.log('✅ Loaded local assignments:', localAssignments.length, 'assignments');
        setAssignedStatAdmins(localAssignments);
      } else {
        setAssignedStatAdmins(dbAssignments);
      }
      
    } catch (error) {
      console.error('❌ Failed to load stat admins:', error);
    } finally {
      setLoadingStatAdmins(false);
    }
  };

  // Handle stat admin assignment/removal
  const handleToggleStatAdmin = (adminId: string) => {
    setAssignedStatAdmins(prev => 
      prev.includes(adminId) 
        ? prev.filter(id => id !== adminId)
        : [...prev, adminId]
    );
  };

  // Load stat admins when settings modal opens
  useEffect(() => {
    if (isSettingsOpen && tournamentToEdit) {
      loadStatAdmins();
    }
  }, [isSettingsOpen, tournamentToEdit]);

  const handleCreateTournament = async () => {
    try {
      // Clear previous errors
      setValidationErrors([]);
      
      // ✅ Validation - Collect all missing required fields
      const errors: string[] = [];
      
      if (!newTournament.name.trim()) {
        errors.push('Tournament name is required');
      }
      if (!newTournament.format) {
        errors.push('Tournament format is required');
      }
      if (!newTournament.maxTeams) {
        errors.push('Maximum teams is required');
      }
      if (!newTournament.startDate) {
        errors.push('Start date is required');
      }
      if (!newTournament.endDate) {
        errors.push('End date is required');
      }
      
      // Additional validation: End date should be after start date
      if (newTournament.startDate && newTournament.endDate) {
        if (new Date(newTournament.endDate) < new Date(newTournament.startDate)) {
          errors.push('End date must be after start date');
        }
      }
      
      // If there are errors, display them and stop
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      const tournamentData = {
        name: newTournament.name,
        description: newTournament.description,
        startDate: newTournament.startDate,
        endDate: newTournament.endDate,
        venue: "TBD",
        maxTeams: parseInt(newTournament.maxTeams) || 8,
        tournamentType: newTournament.format.toLowerCase().replace(/\s+/g, '_') as any,
        isPublic: true,
        entryFee: 0,
        prizePool: 0,
        country: "US",
        ruleset: newTournament.ruleset as 'NBA' | 'FIBA' | 'NCAA'
      };

      const result = await createTournament(tournamentData);
      if (result) {
        setNewTournament({
          name: "",
          format: "",
          startDate: "",
          endDate: "",
          maxTeams: "",
          description: "",
          ruleset: "NBA"
        });
        setValidationErrors([]);
        setIsCreateDialogOpen(false);
        
        // ⚡ Invalidate caches after tournament creation
        if (user?.id) {
          invalidateOrganizerDashboard(user.id);
          invalidateOrganizerTournaments(user.id);
        }
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      setValidationErrors(['Failed to create tournament. Please try again.']);
    }
  };



  const handleManageTeams = (tournament: Tournament) => {
    // ✅ Navigate to dedicated teams page instead of opening modal
    router.push(`/dashboard/tournaments/${tournament.id}/teams`);
  };

  const handleOpenSettings = (tournament: Tournament) => {
    setTournamentToEdit(tournament);
    setIsSettingsOpen(true);
  };

  // Handle schedule management navigation
  const handleManageSchedule = (tournament: Tournament) => {
    console.log('🔍 Navigating to schedule for tournament:', tournament.name);
    router.push(`/dashboard/tournaments/${tournament.id}/schedule`);
  };

  // Handle tournament overview navigation
  const handleViewTournament = (tournament: Tournament) => {
    console.log('🔍 Navigating to tournament overview:', tournament.name);
    router.push(`/dashboard/tournaments/${tournament.id}`);
  };


  // Delete tournament handlers
  const handleDeleteTournament = (tournament: Tournament) => {
    setTournamentToDelete(tournament);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!tournamentToDelete) return;

    try {
      const success = await deleteTournament(tournamentToDelete.id);
      if (success) {
        notify.success(
          'Tournament deleted successfully',
          `"${tournamentToDelete.name}" and all associated data have been permanently removed.`
        );
        setIsDeleteDialogOpen(false);
        setTournamentToDelete(null);
        
        // ⚡ Invalidate caches after tournament deletion
        if (user?.id) {
          invalidateOrganizerDashboard(user.id);
          invalidateOrganizerTournaments(user.id);
        }
      }
    } catch (error) {
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete tournament';
      notify.error(
        'Failed to delete tournament',
        errorMessage
      );
    }
  };



  const handleSaveSettings = async () => {
    if (tournamentToEdit) {
      try {
        console.log('Saving settings for tournament:', tournamentToEdit.name);
        console.log('Tournament data to save:', tournamentToEdit);
        console.log('Assigned stat admins:', assignedStatAdmins);
        
        // Save tournament settings (including status changes)
        const updatedTournament = await TournamentService.updateTournament({
          id: tournamentToEdit.id,
          name: tournamentToEdit.name,
          description: tournamentToEdit.description,
          status: tournamentToEdit.status,
          startDate: tournamentToEdit.startDate,
          endDate: tournamentToEdit.endDate,
          maxTeams: tournamentToEdit.maxTeams,
          tournamentType: tournamentToEdit.tournamentType
        });
        
        // Save stat admin assignments to games
        const statAdminSuccess = await TeamService.updateTournamentStatAdmins(tournamentToEdit.id, assignedStatAdmins);
        
        if (updatedTournament && statAdminSuccess) {
          console.log('✅ Tournament settings and stat admin assignments saved successfully');
          setIsSettingsOpen(false);
          setTournamentToEdit(null);
          setAssignedStatAdmins([]);
          // The tournaments list will automatically refresh due to React state updates
        } else {
          console.error('❌ Failed to save some tournament settings');
          // Keep modal open so user can retry
        }
      } catch (error) {
        console.error('❌ Failed to save tournament settings:', error);
        // Keep modal open so user can retry
      }
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
    <div className="space-y-6 mt-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tournament Management</h2>
          <p className="text-muted-foreground">Create and manage your basketball tournaments</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            // Clear validation errors when closing dialog
            setValidationErrors([]);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 relative overflow-hidden bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-pulse-glow">
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
                <Label htmlFor="name">Tournament Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={newTournament.name}
                  onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                  placeholder="Enter tournament name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="format">Format <span className="text-red-500">*</span></Label>
                <Select value={newTournament.format} onValueChange={(value) => setNewTournament({ ...newTournament, format: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tournament format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single Elimination">Single Elimination</SelectItem>
                    <SelectItem value="Double Elimination">Double Elimination</SelectItem>
                    <SelectItem value="Round Robin">Round Robin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date <span className="text-red-500">*</span></Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newTournament.startDate}
                    onChange={(e) => setNewTournament({ ...newTournament, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date <span className="text-red-500">*</span></Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newTournament.endDate}
                    onChange={(e) => setNewTournament({ ...newTournament, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxTeams">Maximum Teams <span className="text-red-500">*</span></Label>
                <Select value={newTournament.maxTeams} onValueChange={(value) => setNewTournament({ ...newTournament, maxTeams: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select max teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 Teams</SelectItem>
                    <SelectItem value="5">5 Teams</SelectItem>
                    <SelectItem value="6">6 Teams</SelectItem>
                    <SelectItem value="7">7 Teams</SelectItem>
                    <SelectItem value="8">8 Teams</SelectItem>
                    <SelectItem value="9">9 Teams</SelectItem>
                    <SelectItem value="10">10 Teams</SelectItem>
                    <SelectItem value="11">11 Teams</SelectItem>
                    <SelectItem value="12">12 Teams</SelectItem>
                    <SelectItem value="16">16 Teams</SelectItem>
                    <SelectItem value="18">18 Teams</SelectItem>
                    <SelectItem value="24">24 Teams</SelectItem>
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
              {/* ✅ PHASE 1: Ruleset Selector */}
              <div className="grid gap-2">
                <Label htmlFor="ruleset">Game Rules</Label>
                <Select value={newTournament.ruleset} onValueChange={(value) => setNewTournament({ ...newTournament, ruleset: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ruleset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NBA">NBA (12 min quarters, 24s shot clock)</SelectItem>
                    <SelectItem value="FIBA">FIBA (10 min quarters, 24s shot clock)</SelectItem>
                    <SelectItem value="NCAA">NCAA (20 min halves, 30s shot clock)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  💡 All automation features are OFF by default
                </p>
              </div>
              
              {/* Error Display */}
              {validationErrors.length > 0 && (
                <div className="rounded-lg border-2 border-red-500 bg-red-100 dark:bg-red-900/50 dark:border-red-400 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-700 dark:text-red-300" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-red-900 dark:text-red-100">
                        Please fix the following errors:
                      </h3>
                      <ul className="mt-2 text-sm text-red-800 dark:text-red-200 space-y-1 list-disc list-inside font-medium">
                        {validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
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
          <TournamentCard 
            key={tournament.id} 
            tournament={tournament}
            onManageTeams={handleManageTeams}
            onManageSchedule={handleManageSchedule}
            onOpenSettings={handleOpenSettings}
            onDeleteTournament={handleDeleteTournament}
            onViewTournament={handleViewTournament}
          />
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
                <TournamentTableRow 
                  key={tournament.id} 
                  tournament={tournament}
                  onManageTeams={handleManageTeams}
                  onManageSchedule={handleManageSchedule}
                  onOpenSettings={handleOpenSettings}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Team Manager Modal */}
      <Dialog open={isTeamManagerOpen} onOpenChange={setIsTeamManagerOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              {selectedTournament?.name} - Team Management
            </DialogTitle>
            <DialogDescription>
              Manage teams for {selectedTournament?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 py-4 min-h-0">
            {selectedTournament && (
              <div className="space-y-6 pb-6">
                {/* Loading State - Skeleton Cards */}
                {teamManagement?.loading && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="overflow-hidden animate-pulse">
                        <div className="h-1 bg-muted"></div>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-muted rounded-full"></div>
                              <div>
                                <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                                <div className="h-3 bg-muted rounded w-24"></div>
                              </div>
                            </div>
                            <div className="h-6 bg-muted rounded w-16"></div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="h-4 bg-muted rounded w-40"></div>
                          <div className="flex justify-between items-center pt-3 border-t">
                            <div className="h-8 bg-muted rounded w-20"></div>
                            <div className="h-8 bg-muted rounded w-8"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Error State */}
                {teamManagement?.error && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-lg flex items-center justify-center">
                      <Users className="w-8 h-8 text-destructive" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Error Loading Teams</h3>
                    <p className="text-muted-foreground mb-4">{teamManagement.error}</p>
                    <Button onClick={teamManagement.refetch} variant="outline">
                      Try Again
                    </Button>
                  </div>
                )}

                {/* Success State */}
                {!teamManagement?.loading && !teamManagement?.error && (
                  <>
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold">Team Management</h2>
                        <p className="text-muted-foreground">Manage teams for {selectedTournament.name}</p>
                      </div>
                      <Button 
                        className="gap-2"
                        onClick={() => setIsCreateTeamDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4" />
                        Add Team
                      </Button>
                    </div>

                    {/* Live Team Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="hover:shadow-lg transition-all duration-300 border-0 overflow-hidden">
                        <div className="bg-gradient-to-br from-primary to-primary/80 text-white">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-white/90">Total Teams</CardTitle>
                            <Users className="h-5 w-5 text-white" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold">{teamManagement?.stats.totalTeams || 0}</div>
                            <p className="text-xs text-white/80">{teamManagement?.stats.totalTeams || 0} active teams</p>
                          </CardContent>
                        </div>
                      </Card>
                      
                      <Card className="hover:shadow-lg transition-all duration-300 border-0 overflow-hidden">
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-white/90">Total Players</CardTitle>
                            <Users className="h-5 w-5 text-white" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold">{teamManagement?.stats.totalPlayers || 0}</div>
                            <p className="text-xs text-white/80">Across all teams</p>
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
                            <div className="text-3xl font-bold">{teamManagement?.stats.divisions || 0}</div>
                            <p className="text-xs text-white/80">Active divisions</p>
                          </CardContent>
                        </div>
                      </Card>
                    </div>

                    {/* Live Team Cards Grid */}
                    {teamManagement?.teams && teamManagement.teams.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teamManagement.teams.map((team) => (
                          <Card key={team.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border/50 hover:border-primary/20 overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-orange-500"></div>
                            <CardHeader className="relative">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <Avatar className="border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
                                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                                        {team.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                    </div>
                                  </div>
                                  <div>
                                    <CardTitle className="text-base group-hover:text-primary transition-colors">{team.name}</CardTitle>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <div className="w-2 h-2 bg-primary/60 rounded-full"></div>
                                      {team.division || 'Unknown'} Division
                                    </div>
                                  </div>
                                </div>
                                <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
                                  Active
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-muted-foreground" />
                                  <span>Coach: {team.coach || 'TBD'}</span>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center pt-3 border-t border-border/50">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">{team.players.length}</span>
                                  </div>
                                  <span className="text-sm font-medium">players</span>
                                </div>
                                <div className="flex gap-1">
                                  <Button 
                                     size="sm" 
                                     variant="ghost" 
                                     className="hover:bg-destructive/10 hover:text-destructive"
                                     onClick={() => teamManagement?.deleteTeam(team.id)}
                                     title="Delete Team"
                                   >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
                          <Users className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Teams Yet</h3>
                        <p className="text-muted-foreground">
                          This tournament doesn't have any teams yet. Use the "Add Team" button above to create your first team.
                        </p>
                      </div>
                    )}
                  </>
                )}
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
                    <TabsTrigger value="stat-admin" className="gap-2">
                      <Shield className="w-4 h-4" />
                      Stat Admin
                    </TabsTrigger>
                    <TabsTrigger value="venue" className="gap-2">
                      <MapPin className="w-4 h-4" />
                      Venue
                    </TabsTrigger>
                    <TabsTrigger value="prizes" className="gap-2">
                      <Award className="w-4 h-4" />
                      Prizes
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
                                <SelectItem value="draft" className="text-gray-600 font-medium">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                    Draft
                                  </div>
                                </SelectItem>
                                <SelectItem value="active" className="text-green-700 font-semibold bg-green-50 hover:bg-green-100">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    Active
                                  </div>
                                </SelectItem>
                                <SelectItem value="completed" className="text-blue-700 font-medium bg-blue-50 hover:bg-blue-100">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    Completed
                                  </div>
                                </SelectItem>
                                <SelectItem value="cancelled" className="text-red-700 font-medium bg-red-50 hover:bg-red-100">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    Cancelled
                                  </div>
                                </SelectItem>
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

                  <TabsContent value="stat-admin" className="space-y-6 mt-6">
                    {/* Stat Admin Management */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-primary" />
                          Stat Admin Management
                        </CardTitle>
                        <CardDescription>
                          Assign stat admins who can track live games for this tournament
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {loadingStatAdmins ? (
                          <div className="space-y-3 py-4">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg animate-pulse">
                                <div className="w-8 h-8 bg-muted rounded-full"></div>
                                <div className="flex-1">
                                  <div className="h-3 bg-muted rounded w-32 mb-2"></div>
                                  <div className="h-3 bg-muted rounded w-24"></div>
                                </div>
                                <div className="h-8 bg-muted rounded w-16"></div>
                              </div>
                            ))}
                          </div>
                        ) : statAdmins.length === 0 ? (
                          <div className="text-center py-8">
                            <UserX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Stat Admins Available</h3>
                            <p className="text-muted-foreground mb-4">
                              No users with stat admin role found in the system.
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Contact your system administrator to create stat admin accounts.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">Available Stat Admins</Label>
                              <Badge variant="secondary" className="text-xs">
                                {assignedStatAdmins.length} of {statAdmins.length} assigned
                              </Badge>
                            </div>
                            
                            <div className="grid gap-3 max-h-64 overflow-y-auto">
                              {statAdmins.map((admin) => {
                                const isAssigned = assignedStatAdmins.includes(admin.id);
                                return (
                                  <div
                                    key={admin.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                      isAssigned 
                                        ? 'border-primary bg-primary/5' 
                                        : 'border-border hover:border-primary/50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Avatar className="w-8 h-8">
                                        <AvatarFallback className="text-xs">
                                          {admin.name ? admin.name.split(' ').map(n => n[0]).join('').toUpperCase() : 
                                           admin.email.split('@')[0].slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium text-sm">
                                          {admin.name || admin.email.split('@')[0]}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{admin.email}</p>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant={isAssigned ? "default" : "outline"}
                                      onClick={() => handleToggleStatAdmin(admin.id)}
                                      className="gap-1.5"
                                    >
                                      {isAssigned ? (
                                        <>
                                          <UserCheck className="w-3 h-3" />
                                          Assigned
                                        </>
                                      ) : (
                                        <>
                                          <UserPlus className="w-3 h-3" />
                                          Assign
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {assignedStatAdmins.length > 0 && (
                              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                  <Bell className="w-4 h-4 inline mr-1" />
                                  Assigned stat admins will be able to access live game tracking for this tournament.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Other Advanced Settings */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Other Advanced Settings</CardTitle>
                        <CardDescription>Additional tournament configuration options</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Additional advanced settings will be implemented here.</p>
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

      {/* Create Team Modal */}
      {isCreateTeamDialogOpen && selectedTournament && (
        <TeamCreationModal
          tournamentId={selectedTournament.id}
          service={new OrganizerPlayerManagementService()}
          onClose={() => setIsCreateTeamDialogOpen(false)}
          onTeamCreated={async () => {
            setIsCreateTeamDialogOpen(false);
            // Refresh team data
            await teamManagement?.refetch();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete Tournament
            </DialogTitle>
            <DialogDescription asChild>
              <div>
                <p>Are you sure you want to delete "{tournamentToDelete?.name}"?</p>
                <br />
                <p><strong>This will permanently delete:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All teams and their player assignments</li>
                  <li>All scheduled and completed games</li>
                  <li>All game statistics and player stats</li>
                  <li>Tournament settings and configurations</li>
                </ul>
                <br />
                <p className="text-red-600 font-medium">This action cannot be undone.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={loading}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {loading ? 'Deleting...' : 'Delete Tournament'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
