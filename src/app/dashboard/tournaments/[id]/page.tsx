'use client';

import React, { useState, useEffect, use, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { TournamentService } from '@/lib/services/tournamentService';
import { Tournament } from '@/lib/types/tournament';
import { Trophy, ArrowLeft, Users, Calendar, Settings, ExternalLink, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useTournamentTeamCount } from '@/hooks/useTournamentTeamCount';
import { useTournamentGameStatus } from '@/hooks/useTournamentGameStatus';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { useTournamentSettings } from '@/hooks/useTournamentSettings';
import { TournamentOverviewTab } from '@/components/tournament/TournamentOverviewTab';
import { TournamentSettingsTab } from '@/components/tournament/TournamentSettingsTab';

interface TournamentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TournamentDetailPage({ params }: TournamentDetailPageProps) {
  const { user, loading } = useAuthV2();
  const userRole = user?.role;
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loadingTournament, setLoadingTournament] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  
  const { id: tournamentId } = use(params);

  // Team management for division stats
  const teamManagement = useTeamManagement(tournamentId, user);

  // Settings hook
  const settingsManager = useTournamentSettings({
    tournament,
    tournamentId,
    userId: user?.id,
    onTournamentUpdate: setTournament,
  });

  // Get tab from URL if provided
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'teams', 'schedule', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Team and game counts
  const { currentTeams, maxTeams, loading: teamCountLoading } = useTournamentTeamCount(tournamentId, {
    maxTeams: tournament?.maxTeams
  });
  const { hasGames, gameCount, loading: gameStatusLoading } = useTournamentGameStatus(tournamentId);

  // Load tournament
  useEffect(() => {
    if (!loading && (!user || (userRole !== 'organizer' && userRole !== 'stat_admin'))) {
      router.push('/auth');
      return;
    }

    const loadTournament = async () => {
      try {
        const tournamentData = await TournamentService.getTournament(tournamentId);
        setTournament(tournamentData);
      } catch (error) {
        console.error('Failed to load tournament:', error);
      } finally {
        setLoadingTournament(false);
      }
    };

    if (user) {
      loadTournament();
    }
  }, [user, userRole, loading, tournamentId, router]);

  // Handle tab change - navigate for Teams/Schedule
  const handleTabChange = (value: string) => {
    if (value === 'teams') {
      router.push(`/dashboard/tournaments/${tournamentId}/teams`);
    } else if (value === 'schedule') {
      router.push(`/dashboard/tournaments/${tournamentId}/schedule`);
    } else {
      setActiveTab(value);
    }
  };

  // Team distribution for divisions
  const teamDistribution = useMemo(() => {
    if (!teamManagement?.teams || !settingsManager.editedTournament?.division_names) {
      return undefined;
    }
    return settingsManager.editedTournament.division_names.map(divName => ({
      division: divName,
      count: teamManagement.teams.filter(t => t.division === divName).length,
    }));
  }, [teamManagement?.teams, settingsManager.editedTournament?.division_names]);

  // Handle update for edited tournament
  const handleTournamentUpdate = (updates: Partial<Tournament>) => {
    if (settingsManager.editedTournament) {
      settingsManager.setEditedTournament({ ...settingsManager.editedTournament, ...updates });
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!tournament) return;
    setDeleting(true);
    try {
      await TournamentService.deleteTournament(tournament.id);
      router.push('/dashboard?section=tournaments');
    } catch (error) {
      console.error('Failed to delete tournament:', error);
      setDeleting(false);
    }
  };

  if (loading || loadingTournament) {
    return <LoadingState />;
  }

  if (!tournament || !settingsManager.editedTournament) {
    return <NotFoundState onBack={() => router.push('/dashboard?section=tournaments')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30 pt-24 pb-12 px-6">
      <div className="max-w-5xl mx-auto">
        <BackButton onClick={() => router.push('/dashboard?section=tournaments')} />

        <TournamentHeader
          tournament={tournament}
          logoLoaded={logoLoaded}
          logoError={logoError}
          onLogoLoad={() => setLogoLoaded(true)}
          onLogoError={() => setLogoError(true)}
        />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabTriggerStyled value="overview">Overview</TabTriggerStyled>
            <TabTriggerStyled value="teams" icon={<Users className="w-4 h-4" />} badge={!teamCountLoading ? currentTeams : undefined}>
              Teams
            </TabTriggerStyled>
            <TabTriggerStyled value="schedule" icon={<Calendar className="w-4 h-4" />} badge={!gameStatusLoading && hasGames ? gameCount : undefined}>
              Schedule
            </TabTriggerStyled>
            <TabTriggerStyled value="settings" icon={<Settings className="w-4 h-4" />}>
              Settings
            </TabTriggerStyled>
          </TabsList>

          <TabsContent value="overview">
            <TournamentOverviewTab
              tournament={tournament}
              tournamentId={tournamentId}
              currentTeams={currentTeams}
              maxTeams={maxTeams}
              gameCount={gameCount}
              teamCountLoading={teamCountLoading}
              gameStatusLoading={gameStatusLoading}
              onSettingsClick={() => setActiveTab('settings')}
            />
          </TabsContent>

          <TabsContent value="settings">
            <TournamentSettingsTab
              tournament={settingsManager.editedTournament}
              onUpdate={handleTournamentUpdate}
              logoUpload={settingsManager.logoUpload}
              statAdminManager={settingsManager.statAdminManager}
              saving={settingsManager.saving}
              onSave={settingsManager.handleSaveSettings}
              onDeleteClick={() => setShowDeleteConfirm(true)}
              teamDistribution={teamDistribution}
            />
          </TabsContent>
        </Tabs>
      </div>

      <DeleteConfirmDialog
        open={showDeleteConfirm}
        tournamentName={tournament.name}
        deleting={deleting}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// --- Sub-components ---

function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30 pt-24 pb-12 px-6">
      <div className="max-w-5xl mx-auto animate-pulse">
        <div className="h-9 bg-muted rounded w-40 mb-6" />
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-muted rounded-xl" />
          <div className="flex-1">
            <div className="h-8 bg-muted rounded w-64 mb-2" />
            <div className="h-5 bg-muted rounded w-48" />
          </div>
        </div>
        <div className="h-12 bg-muted rounded w-full mb-6" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

function NotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/50 via-background to-red-50/30">
      <div className="text-center">
        <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">Tournament Not Found</h2>
        <p className="text-muted-foreground mb-6">The tournament you're looking for doesn't exist.</p>
        <button onClick={onBack} className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity">
          Back to Tournaments
        </button>
      </div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
      <ArrowLeft className="w-4 h-4" />
      Back to Tournaments
    </button>
  );
}

interface TournamentHeaderProps {
  tournament: Tournament;
  logoLoaded: boolean;
  logoError: boolean;
  onLogoLoad: () => void;
  onLogoError: () => void;
}

function TournamentHeader({ tournament, logoLoaded, logoError, onLogoLoad, onLogoError }: TournamentHeaderProps) {
  const getStatusBadge = (status: Tournament['status']) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-700 border-green-200',
      draft: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      completed: 'bg-blue-100 text-blue-700 border-blue-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
          {tournament.logo ? (
            <>
              {!logoLoaded && !logoError && (
                <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              )}
              <img
                src={tournament.logo}
                alt={`${tournament.name} logo`}
                className={`w-full h-full object-cover transition-opacity duration-300 ${logoLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={onLogoLoad}
                onError={onLogoError}
              />
              {logoError && <Trophy className="w-7 h-7 text-white" />}
            </>
          ) : (
            <Trophy className="w-7 h-7 text-white" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-foreground">{tournament.name}</h1>
            <Badge variant="outline" className={`${getStatusBadge(tournament.status)} uppercase text-xs font-semibold`}>
              {tournament.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">{tournament.description}</p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(`/tournament/${tournament.id}`, '_blank')}>
        <ExternalLink className="w-4 h-4" />
        <span className="hidden sm:inline">Public View</span>
      </Button>
    </div>
  );
}

interface TabTriggerStyledProps {
  value: string;
  icon?: React.ReactNode;
  badge?: number;
  children: React.ReactNode;
}

function TabTriggerStyled({ value, icon, badge, children }: TabTriggerStyledProps) {
  return (
    <TabsTrigger
      value={value}
      className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:shadow-none px-4 py-3 gap-2"
    >
      {icon}
      {children}
      {badge !== undefined && <Badge variant="secondary" className="ml-1 text-xs">{badge}</Badge>}
    </TabsTrigger>
  );
}

interface DeleteConfirmDialogProps {
  open: boolean;
  tournamentName: string;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteConfirmDialog({ open, tournamentName, deleting, onClose, onConfirm }: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Delete Tournament
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{tournamentName}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" disabled={deleting} onClick={onConfirm}>
            {deleting ? 'Deleting...' : 'Delete Tournament'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
