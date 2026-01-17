'use client';
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trophy, Plus, Calendar, Users, Settings, Eye, UserPlus, MapPin, Award, Bell, Shield, Clock, Edit, Trash2, UserCheck, UserX, Target, CalendarDays, ExternalLink, Unlink, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PhotoUploadField } from "@/components/ui/PhotoUploadField";
import { SearchableCountrySelect } from "@/components/shared/SearchableCountrySelect";
import { SearchableStatAdminSelect } from "@/components/shared/SearchableStatAdminSelect";
import { useTournaments } from "@/lib/hooks/useTournaments";
import { useTeamManagement } from "@/hooks/useTeamManagement";
import { useTournamentTeamCount } from "@/hooks/useTournamentTeamCount";
import { useTournamentGameStatus } from "@/hooks/useTournamentGameStatus";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import { TournamentTableRow } from "@/components/TournamentTableRow";
import { Tournament } from "@/lib/types/tournament";
import { TeamCreationModal } from "@/components/shared/TeamCreationModal";
import { TeamDeleteConfirmModal } from "@/components/shared/TeamDeleteConfirmModal";
import { OrganizerPlayerManagementService } from "@/lib/services/organizerPlayerManagementService";
import { TeamService, TournamentService } from "@/lib/services/tournamentService";
import { useRouter, useSearchParams } from 'next/navigation';
import { notify } from '@/lib/services/notificationService';
import { invalidateOrganizerDashboard, invalidateOrganizerTournaments } from '@/lib/utils/cache';
import { getCountryName } from '@/data/countries';
import { TeamLimitSelector, UpgradeModal } from '@/components/subscription';
import { useSubscription } from '@/hooks/useSubscription';

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

// Tournament Card Component with Real-time Team Count (Simplified)
interface TournamentCardProps {
  tournament: Tournament;
  onViewTournament: (tournament: Tournament) => void;
}

function TournamentCard({ tournament, onViewTournament }: TournamentCardProps) {
  const { currentTeams, maxTeams, loading: teamCountLoading } = useTournamentTeamCount(tournament.id, {
    maxTeams: tournament.maxTeams
  });
  
  const { hasGames, gameCount, loading: gameStatusLoading } = useTournamentGameStatus(tournament.id);

  // Logo loading states
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);

  return (
    <Card 
      className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border/50 hover:border-primary/20 overflow-hidden cursor-pointer"
      onClick={() => onViewTournament(tournament)}
    >
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-accent to-orange-500"></div>
      <CardHeader className="relative bg-gradient-to-br from-muted/30 to-transparent">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 overflow-hidden relative">
              {tournament.logo ? (
                <>
                  {/* Shimmer loading effect */}
                  {!logoLoaded && !logoError && (
                    <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  )}
                  
                  {/* Logo image */}
                  <img 
                    src={tournament.logo} 
                    alt={`${tournament.name} logo`} 
                    className={`w-full h-full object-cover rounded-xl transition-opacity duration-300 ${
                      logoLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    loading="eager"
                    decoding="async"
                    onLoad={() => setLogoLoaded(true)}
                    onError={() => {
                      setLogoError(true);
                      console.error('Failed to load tournament logo:', tournament.logo);
                    }}
                  />
                  
                  {/* Fallback on error */}
                  {logoError && (
                    <Trophy className="w-6 h-6 text-white" />
                  )}
                </>
              ) : (
                <Trophy className="w-6 h-6 text-white" />
              )}
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
        {tournament.country && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>{getCountryName(tournament.country)}</span>
          </div>
        )}
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
        
        {/* Compact footer with game count indicator */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>
              {gameStatusLoading ? '...' : hasGames ? `${gameCount} games` : 'No games yet'}
            </span>
          </div>
          <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
            Click to manage →
          </span>
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
  
  // Subscription gatekeeping
  const searchParams = useSearchParams();
  const { tier: subscriptionTier, refetch: refetchSubscription } = useSubscription('organizer');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const FREE_SEASON_LIMIT = 1;

  // Handle checkout success - refetch subscription when returning from Stripe
  useEffect(() => {
    const checkoutParam = searchParams.get('checkout');
    if (checkoutParam === 'success') {
      console.log('✅ Organizer checkout success detected, refreshing subscription...');
      setCheckoutSuccess(true);
      refetchSubscription();
      
      // Clear the query param after a short delay
      setTimeout(() => {
        router.replace('/dashboard?section=tournaments', { scroll: false });
        setCheckoutSuccess(false);
      }, 3000);
    }
  }, [searchParams, refetchSubscription, router]);
  
  // Time-gate: Free users can only schedule within current month
  const isFreeOrganizer = subscriptionTier === 'free';
  const getMaxDateForFree = (): string => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return endOfMonth.toISOString().split('T')[0];
  };
  const maxDateForFree = getMaxDateForFree();
  const [tournamentToEdit, setTournamentToEdit] = useState<Tournament | null>(null);
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  
  // Delete confirmation states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null);
  
  // Team delete/disconnect confirmation states
  const [isTeamDeleteModalOpen, setIsTeamDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<{ id: string; name: string; coach_id?: string } | null>(null);
  
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
    ruleset: "NBA", // ✅ PHASE 1: Default to NBA ruleset
    logo: "", // Tournament logo URL
    country: "US", // Default country
    has_divisions: false, // Default: no divisions
    division_count: undefined as number | undefined,
    division_names: undefined as string[] | undefined,
  });
  
  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Logo upload for settings modal
  const logoUpload = usePhotoUpload({
    userId: user?.id || '',
    photoType: 'tournament_logo',
    tournamentId: tournamentToEdit?.id || 'temp-new',
    currentPhotoUrl: tournamentToEdit?.logo || newTournament.logo || null,
    onSuccess: (url) => {
      if (tournamentToEdit) {
        setTournamentToEdit({ ...tournamentToEdit, logo: url });
      } else {
        // For new tournament creation
        setNewTournament({ ...newTournament, logo: url });
      }
    },
    onError: (error) => console.error('Logo upload error:', error)
  });

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

      // Validate division settings if divisions are enabled
      if (newTournament.has_divisions) {
        if (!newTournament.division_count || newTournament.division_count < 2) {
          errors.push('At least 2 divisions required');
        } else if (newTournament.division_count > 8) {
          errors.push('Maximum 8 divisions allowed');
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
        country: newTournament.country,
        ruleset: newTournament.ruleset as 'NBA' | 'FIBA' | 'NCAA',
        logo: newTournament.logo || undefined, // Include uploaded logo
        has_divisions: newTournament.has_divisions || false,
        division_count: newTournament.has_divisions ? newTournament.division_count : undefined,
        division_names: newTournament.has_divisions && newTournament.division_names 
          ? newTournament.division_names 
          : undefined,
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
          ruleset: "NBA",
          logo: "",
          country: "US",
          has_divisions: false,
          division_count: undefined,
          division_names: undefined,
        });
        logoUpload.clearPreview(); // Clear logo preview
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
        
        // Save tournament settings (including status changes, logo, venue, country, and divisions)
        const updatedTournament = await TournamentService.updateTournament({
          id: tournamentToEdit.id,
          name: tournamentToEdit.name,
          description: tournamentToEdit.description,
          status: tournamentToEdit.status,
          startDate: tournamentToEdit.startDate,
          endDate: tournamentToEdit.endDate,
          maxTeams: tournamentToEdit.maxTeams,
          tournamentType: tournamentToEdit.tournamentType,
          logo: tournamentToEdit.logo, // Include logo in update
          venue: tournamentToEdit.venue, // Include venue in update
          country: tournamentToEdit.country, // Include country in update
          has_divisions: tournamentToEdit.has_divisions, // Include division settings
          division_count: tournamentToEdit.division_count,
          division_names: tournamentToEdit.division_names
        });
        
        // Save stat admin assignments to games
        const statAdminSuccess = await TeamService.updateTournamentStatAdmins(tournamentToEdit.id, assignedStatAdmins);
        
        if (updatedTournament && statAdminSuccess) {
          console.log('✅ Tournament settings and stat admin assignments saved successfully');
          setIsSettingsOpen(false);
          setTournamentToEdit(null);
          setAssignedStatAdmins([]);
          
          // ⚡ Invalidate caches after tournament update
          if (user?.id) {
            invalidateOrganizerDashboard(user.id);
            invalidateOrganizerTournaments(user.id);
          }
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
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
      {/* Checkout Success Banner */}
      {checkoutSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Payment Successful!</p>
            <p className="text-sm text-green-700">Your subscription is now active. Enjoy unlimited tournaments and teams!</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tournament Management</h2>
          <p className="text-muted-foreground">Create and manage your basketball tournaments</p>
        </div>
        {/* Create Tournament Button with Subscription Check */}
        <Button 
          onClick={() => {
            // Check season limit for free tier
            const isFreeTier = subscriptionTier === 'free';
            const atLimit = isFreeTier && tournaments.length >= FREE_SEASON_LIMIT;
            
            if (atLimit) {
              setShowUpgradeModal(true);
            } else {
              setIsCreateDialogOpen(true);
            }
          }}
          className="gap-2 relative overflow-hidden bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-pulse-glow"
        >
          <Plus className="w-4 h-4" />
          Create Tournament
        </Button>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            // Clear validation errors when closing dialog
            setValidationErrors([]);
          }
        }}>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
              <DialogTitle>Create New Tournament</DialogTitle>
              <DialogDescription>
                Set up a new basketball tournament with your preferred format and settings.
              </DialogDescription>
            </DialogHeader>
            <div 
              className="flex-1 overflow-y-auto px-6 py-4 dialog-scroll"
              tabIndex={0}
              onKeyDown={(e) => {
                // Don't interfere with input field navigation
                const target = e.target as HTMLElement;
                const isInputField = target.tagName === 'INPUT' || 
                                    target.tagName === 'TEXTAREA' || 
                                    target.tagName === 'SELECT' ||
                                    target.closest('input, textarea, select');
                
                // Only handle scroll keys when NOT in an input field
                if (isInputField) {
                  return;
                }
                
                const element = e.currentTarget;
                const scrollAmount = 50;
                
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  element.scrollBy({ top: scrollAmount, behavior: 'smooth' });
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  element.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
                } else if (e.key === 'PageDown') {
                  e.preventDefault();
                  element.scrollBy({ top: element.clientHeight * 0.9, behavior: 'smooth' });
                } else if (e.key === 'PageUp') {
                  e.preventDefault();
                  element.scrollBy({ top: -(element.clientHeight * 0.9), behavior: 'smooth' });
                } else if (e.key === 'Home') {
                  e.preventDefault();
                  element.scrollTo({ top: 0, behavior: 'smooth' });
                } else if (e.key === 'End') {
                  e.preventDefault();
                  element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
                }
              }}
              onClick={(e) => {
                // Only focus scrollable area if clicking on non-interactive elements
                const target = e.target as HTMLElement;
                const isInteractiveElement = target.tagName === 'INPUT' || 
                                            target.tagName === 'TEXTAREA' || 
                                            target.tagName === 'SELECT' ||
                                            target.tagName === 'BUTTON' ||
                                            target.closest('input, textarea, select, button, [role="button"]');
                
                // Don't interfere with interactive elements - let them handle their own focus
                if (!isInteractiveElement && e.currentTarget !== document.activeElement) {
                  e.currentTarget.focus();
                }
              }}
            >
              <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Tournament Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={newTournament.name}
                  onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                  placeholder="Enter tournament name"
                  className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20"
                  required
                />
              </div>

              {/* Tournament Structure - Divisions - DISABLED */}
              {/* 
              <div className="grid gap-2">
                <Label>Tournament Structure</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewTournament({
                        ...newTournament,
                        has_divisions: false,
                        division_count: undefined,
                        division_names: undefined,
                      });
                    }}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      !newTournament.has_divisions
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <div className="text-sm font-semibold">Single Bracket</div>
                    <div className="text-xs opacity-80">All teams together</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const count = 2;
                      const names = ['A', 'B'];
                      setNewTournament({
                        ...newTournament,
                        has_divisions: true,
                        division_count: count,
                        division_names: names,
                      });
                    }}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      newTournament.has_divisions
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <div className="text-sm font-semibold">Divisions</div>
                    <div className="text-xs opacity-80">Groups first</div>
                  </button>
                </div>
              </div>

              {newTournament.has_divisions && (
                <div className="grid gap-2">
                  <Label htmlFor="division_count">Number of Divisions <span className="text-red-500">*</span></Label>
                  <Select
                    value={newTournament.division_count?.toString() || '2'}
                    onValueChange={(value) => {
                      const count = parseInt(value);
                      const names = Array.from({ length: count }, (_, i) => 
                        String.fromCharCode(65 + i)
                      );
                      setNewTournament({
                        ...newTournament,
                        division_count: count,
                        division_names: names,
                      });
                    }}
                  >
                    <SelectTrigger className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20">
                      <SelectValue placeholder="Select number of divisions" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6, 7, 8].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} Divisions
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    💡 Divisions will be named: {newTournament.division_names?.join(', ') || 'A, B, C...'}
                  </p>
                </div>
              )}
              */}

              {/* Tournament Format (AFTER structure - depends on how teams are organized) */}
              <div className="grid gap-2">
                <Label htmlFor="format">Tournament Format <span className="text-red-500">*</span></Label>
                <Select value={newTournament.format} onValueChange={(value) => setNewTournament({ ...newTournament, format: value })}>
                  <SelectTrigger className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20">
                    <SelectValue placeholder="Select tournament format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single Elimination">Single Elimination</SelectItem>
                    <SelectItem value="Double Elimination">Double Elimination</SelectItem>
                    <SelectItem value="Round Robin">Round Robin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <TeamLimitSelector
                  value={parseInt(newTournament.maxTeams) || 6}
                  onChange={(value) => setNewTournament({ ...newTournament, maxTeams: String(value) })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate" className="flex items-center gap-2">
                    Start Date <span className="text-red-500">*</span>
                    {isFreeOrganizer && (
                      <span className="text-xs text-orange-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Current month
                      </span>
                    )}
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newTournament.startDate}
                    onChange={(e) => setNewTournament({ ...newTournament, startDate: e.target.value })}
                    max={isFreeOrganizer ? maxDateForFree : undefined}
                    className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate" className="flex items-center gap-2">
                    End Date <span className="text-red-500">*</span>
                    {isFreeOrganizer && (
                      <span className="text-xs text-orange-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Current month
                      </span>
                    )}
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newTournament.endDate}
                    onChange={(e) => setNewTournament({ ...newTournament, endDate: e.target.value })}
                    max={isFreeOrganizer ? maxDateForFree : undefined}
                    className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20"
                    required
                  />
                </div>
              </div>

              {/* Free tier date restriction notice */}
              {isFreeOrganizer && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-orange-800 font-medium">
                        Free tier: Current month scheduling only
                      </p>
                      <p className="text-xs text-orange-700 mt-1">
                        Upgrade to schedule tournaments beyond {new Date().toLocaleString('default', { month: 'long' })}.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setShowUpgradeModal(true)}
                        className="mt-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-xs h-7"
                      >
                        <Award className="w-3 h-3 mr-1" />
                        Upgrade to Unlock
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTournament.description}
                  onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })}
                  placeholder="Brief description of the tournament"
                  className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20"
                />
              </div>
              
              {/* Country Selector */}
              <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <SearchableCountrySelect
                  value={newTournament.country}
                  onChange={(value) => setNewTournament({ ...newTournament, country: value })}
                  placeholder="Select country"
                />
              </div>

              {/* ✅ PHASE 1: Ruleset Selector */}
              <div className="grid gap-2">
                <Label htmlFor="ruleset">Game Rules</Label>
                <Select value={newTournament.ruleset} onValueChange={(value) => setNewTournament({ ...newTournament, ruleset: value })}>
                  <SelectTrigger className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20">
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

              {/* Tournament Logo Upload */}
              <div className="grid gap-2">
                <Label>Tournament Logo (Optional)</Label>
                <PhotoUploadField
                  label="Upload Logo"
                  value={null}
                  previewUrl={logoUpload.previewUrl}
                  uploading={logoUpload.uploading}
                  error={logoUpload.error}
                  aspectRatio="square"
                  onFileSelect={logoUpload.handleFileSelect}
                  onRemove={() => logoUpload.clearPreview()}
                />
                <p className="text-xs text-muted-foreground">
                  Square image recommended (min 256x256px, max 5MB)
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
            </div>
            <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tournaments.map((tournament) => (
          <TournamentCard 
            key={tournament.id} 
            tournament={tournament}
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
                                  {team.coach_id ? (
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="hover:bg-orange-600/10 hover:text-orange-600"
                                      onClick={() => {
                                        setTeamToDelete({ id: team.id, name: team.name, coach_id: team.coach_id });
                                        setIsTeamDeleteModalOpen(true);
                                      }}
                                      title="Disconnect Team"
                                    >
                                      <Unlink className="w-4 h-4" />
                                    </Button>
                                  ) : (
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="hover:bg-destructive/10 hover:text-destructive"
                                      onClick={() => {
                                        setTeamToDelete({ id: team.id, name: team.name, coach_id: undefined });
                                        setIsTeamDeleteModalOpen(true);
                                      }}
                                      title="Delete Team"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
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
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Tournament Settings - {tournamentToEdit?.name}
            </DialogTitle>
            <DialogDescription>
              Configure all aspects of your tournament
            </DialogDescription>
          </DialogHeader>
          
          <div 
            className="flex-1 overflow-y-auto dialog-scroll"
            tabIndex={0}
            onKeyDown={(e) => {
              const element = e.currentTarget;
              const scrollAmount = 50;
              
              // Don't interfere with input fields or select dropdowns
              const target = e.target as HTMLElement;
              if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.closest('[role="combobox"]')) {
                return;
              }
              
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                element.scrollBy({ top: scrollAmount, behavior: 'smooth' });
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                element.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
              } else if (e.key === 'PageDown') {
                e.preventDefault();
                element.scrollBy({ top: element.clientHeight * 0.9, behavior: 'smooth' });
              } else if (e.key === 'PageUp') {
                e.preventDefault();
                element.scrollBy({ top: -(element.clientHeight * 0.9), behavior: 'smooth' });
              } else if (e.key === 'Home') {
                e.preventDefault();
                element.scrollTo({ top: 0, behavior: 'smooth' });
              } else if (e.key === 'End') {
                e.preventDefault();
                element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
              }
            }}
            onClick={(e) => {
              // Focus the scrollable area when clicked (but not on interactive elements)
              const target = e.target as HTMLElement;
              if (!target.closest('input, textarea, select, button, [role="button"], [role="combobox"], a')) {
                if (e.currentTarget !== document.activeElement) {
                  e.currentTarget.focus();
                }
              }
            }}
          >
            {tournamentToEdit && (
              <Tabs defaultValue="general" className="w-full">
                <div className="px-6 pt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general" className="gap-2">
                      <Trophy className="w-4 h-4" />
                      General
                    </TabsTrigger>
                    <TabsTrigger value="stat-admin" className="gap-2">
                      <Shield className="w-4 h-4" />
                      Stat Admin
                    </TabsTrigger>
                    <TabsTrigger value="prizes" className="gap-2">
                      <Award className="w-4 h-4" />
                      Prizes
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="px-6 pb-4">
                  {/* General Settings Tab */}
                  <TabsContent value="general" className="space-y-3 mt-4">
                    {/* Basic Information & Visual Identity - Side by side on desktop */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {/* Basic Information */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Trophy className="w-4 h-4 text-primary" />
                            Basic Information
                          </CardTitle>
                          <CardDescription className="text-xs">Tournament name, description, and status</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                          <div className="space-y-1.5">
                            <Label htmlFor="edit-name" className="text-sm">Tournament Name</Label>
                            <Input
                              id="edit-name"
                              value={tournamentToEdit.name}
                              onChange={(e) => setTournamentToEdit({ ...tournamentToEdit, name: e.target.value })}
                              placeholder="Enter tournament name"
                              className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20"
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <Label htmlFor="edit-description" className="text-sm">Description</Label>
                            <Textarea
                              id="edit-description"
                              value={tournamentToEdit.description || ''}
                              onChange={(e) => setTournamentToEdit({ ...tournamentToEdit, description: e.target.value })}
                              placeholder="Describe your tournament"
                              rows={3}
                              className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="edit-status" className="text-sm">Status</Label>
                            <Select value={tournamentToEdit.status} onValueChange={(value: Tournament['status']) => setTournamentToEdit({ ...tournamentToEdit, status: value })}>
                              <SelectTrigger className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20">
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
                        </CardContent>
                      </Card>

                      {/* Visual Identity */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Trophy className="w-4 h-4 text-primary" />
                            Visual Identity
                          </CardTitle>
                          <CardDescription className="text-xs">Tournament logo and branding</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 pt-0">
                          <div className="space-y-1.5">
                            <Label className="text-sm">Tournament Logo</Label>
                            <PhotoUploadField
                              label="Upload Logo"
                              value={tournamentToEdit.logo || null}
                              previewUrl={logoUpload.previewUrl}
                              uploading={logoUpload.uploading}
                              error={logoUpload.error}
                              aspectRatio="square"
                              onFileSelect={logoUpload.handleFileSelect}
                              onRemove={() => {
                                logoUpload.clearPreview();
                                setTournamentToEdit({ ...tournamentToEdit, logo: '' });
                              }}
                            />
                            <p className="text-xs text-muted-foreground">
                              Square image recommended (min 256x256px, max 5MB)
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Tournament Structure */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Users className="w-4 h-4 text-primary" />
                          Tournament Structure
                        </CardTitle>
                        <CardDescription className="text-xs">Format and team capacity</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="edit-format" className="text-sm">Tournament Format</Label>
                            <Select value={tournamentToEdit.tournamentType} onValueChange={(value) => setTournamentToEdit({ ...tournamentToEdit, tournamentType: value as any })}>
                              <SelectTrigger className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20">
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
                          <div className="space-y-1.5">
                            <TeamLimitSelector
                              value={tournamentToEdit.maxTeams || 6}
                              onChange={(value) => setTournamentToEdit({ ...tournamentToEdit, maxTeams: value })}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Schedule */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Calendar className="w-4 h-4 text-primary" />
                          Schedule
                        </CardTitle>
                        <CardDescription className="text-xs">Tournament start and end dates</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="edit-start-date" className="text-sm flex items-center gap-1">
                              Start Date
                              {isFreeOrganizer && <Clock className="w-3 h-3 text-orange-500" />}
                            </Label>
                            <Input
                              id="edit-start-date"
                              type="date"
                              value={tournamentToEdit.startDate}
                              onChange={(e) => setTournamentToEdit({ ...tournamentToEdit, startDate: e.target.value })}
                              max={isFreeOrganizer ? maxDateForFree : undefined}
                              className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="edit-end-date" className="text-sm flex items-center gap-1">
                              End Date
                              {isFreeOrganizer && <Clock className="w-3 h-3 text-orange-500" />}
                            </Label>
                            <Input
                              id="edit-end-date"
                              type="date"
                              value={tournamentToEdit.endDate}
                              onChange={(e) => setTournamentToEdit({ ...tournamentToEdit, endDate: e.target.value })}
                              max={isFreeOrganizer ? maxDateForFree : undefined}
                              className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20"
                            />
                          </div>
                        </div>
                        {isFreeOrganizer && (
                          <p className="text-xs text-orange-600 mt-2">
                            Free tier: Limited to current month. Upgrade to schedule beyond {new Date().toLocaleString('default', { month: 'long' })}.
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Division Configuration */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Target className="w-4 h-4 text-primary" />
                          Division Configuration
                        </CardTitle>
                        <CardDescription className="text-xs">Organize teams into divisions for group play</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-medium">Enable Divisions</Label>
                              <p className="text-xs text-muted-foreground">Split teams into groups before championship bracket</p>
                            </div>
                            <Switch
                              checked={tournamentToEdit.has_divisions || false}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  const count = tournamentToEdit.division_count || 2;
                                  const names = tournamentToEdit.division_names || Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
                                  setTournamentToEdit({
                                    ...tournamentToEdit,
                                    has_divisions: true,
                                    division_count: count,
                                    division_names: names,
                                  });
                                } else {
                                  setTournamentToEdit({
                                    ...tournamentToEdit,
                                    has_divisions: false,
                                    division_count: undefined,
                                    division_names: undefined,
                                  });
                                }
                              }}
                            />
                          </div>

                          {tournamentToEdit.has_divisions && (
                            <>
                              <div className="space-y-1.5">
                                <Label htmlFor="edit-division-count" className="text-sm">Number of Divisions</Label>
                                <Select
                                  value={tournamentToEdit.division_count?.toString() || '2'}
                                  onValueChange={(value) => {
                                    const count = parseInt(value);
                                    const names = Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
                                    setTournamentToEdit({
                                      ...tournamentToEdit,
                                      division_count: count,
                                      division_names: names,
                                    });
                                  }}
                                >
                                  <SelectTrigger className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[2, 3, 4, 5, 6, 7, 8].map(num => (
                                      <SelectItem key={num} value={num.toString()}>
                                        {num} Divisions
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {tournamentToEdit.division_names && tournamentToEdit.division_names.length > 0 && (
                                <div className="space-y-2">
                                  <Label className="text-sm">Division Names</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {tournamentToEdit.division_names.map((name, index) => (
                                      <Badge key={index} variant="outline" className="px-3 py-1 text-sm">
                                        Division {name}
                                      </Badge>
                                    ))}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Divisions are automatically named alphabetically (A, B, C...)
                                  </p>
                                </div>
                              )}

                              {/* Division Statistics */}
                              {teamManagement?.teams && teamManagement.teams.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border">
                                  <Label className="text-sm font-medium mb-2 block">Team Distribution</Label>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {tournamentToEdit.division_names?.map((divName) => {
                                      const teamsInDivision = teamManagement.teams.filter(t => t.division === divName).length;
                                      return (
                                        <div key={divName} className="bg-muted/50 rounded-lg p-2 text-center">
                                          <div className="text-xs text-muted-foreground">Division {divName}</div>
                                          <div className="text-lg font-semibold">{teamsInDivision} teams</div>
                                        </div>
                                      );
                                    })}
                                    {(() => {
                                      const unassignedTeams = teamManagement.teams.filter(t => !t.division || t.division === '').length;
                                      if (unassignedTeams > 0) {
                                        return (
                                          <div className="bg-orange-50 rounded-lg p-2 text-center border border-orange-200">
                                            <div className="text-xs text-orange-700">Unassigned</div>
                                            <div className="text-lg font-semibold text-orange-900">{unassignedTeams} teams</div>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Location */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <MapPin className="w-4 h-4 text-primary" />
                          Location
                        </CardTitle>
                        <CardDescription className="text-xs">Venue and country</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="edit-venue" className="text-sm">Venue</Label>
                            <Input
                              id="edit-venue"
                              value={tournamentToEdit.venue || ''}
                              onChange={(e) => setTournamentToEdit({ ...tournamentToEdit, venue: e.target.value })}
                              placeholder="Enter venue name or address"
                              className="bg-white border-gray-300 focus:border-primary focus:ring-primary/20"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="edit-country" className="text-sm">Country</Label>
                            <SearchableCountrySelect
                              value={tournamentToEdit.country || 'US'}
                              onChange={(value) => setTournamentToEdit({ ...tournamentToEdit, country: value })}
                              placeholder="Select country"
                            />
                          </div>
                        </div>
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
                              <Label className="text-sm font-medium">Select Stat Admins</Label>
                              <Badge variant="secondary" className="text-xs">
                                {assignedStatAdmins.length} of {statAdmins.length} assigned
                              </Badge>
                            </div>
                            
                            <SearchableStatAdminSelect
                              statAdmins={statAdmins}
                              selectedIds={assignedStatAdmins}
                              onToggle={handleToggleStatAdmin}
                              loading={loadingStatAdmins}
                              placeholder="Search and select stat admins..."
                            />
                            
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

          <DialogFooter className="px-6 py-4 border-t flex-shrink-0 bg-background">
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
      {isCreateTeamDialogOpen && selectedTournament && user && (
        <TeamCreationModal
          tournamentId={selectedTournament.id}
          userId={user.id}
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

      {/* Team Delete/Disconnect Confirmation Modal */}
      {teamToDelete && (
        <TeamDeleteConfirmModal
          open={isTeamDeleteModalOpen}
          onClose={() => {
            setIsTeamDeleteModalOpen(false);
            setTeamToDelete(null);
          }}
          onConfirm={async () => {
            if (!teamToDelete || !teamManagement) {
              return;
            }
            const isCoachTeam = !!teamToDelete.coach_id;
            if (isCoachTeam) {
              await teamManagement.disconnectTeam(teamToDelete.id);
            } else {
              await teamManagement.deleteTeam(teamToDelete.id);
            }
            setIsTeamDeleteModalOpen(false);
            setTeamToDelete(null);
          }}
          teamId={teamToDelete.id}
          teamName={teamToDelete.name}
          action={teamToDelete.coach_id ? 'disconnect' : 'delete'}
          isCoachTeam={!!teamToDelete.coach_id}
        />
      )}

      {/* Subscription Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        role="organizer"
        currentTier={subscriptionTier}
        triggerReason={`You've reached your free limit of ${FREE_SEASON_LIMIT} season. Upgrade for unlimited seasons.`}
      />
    </div>
  );
}
