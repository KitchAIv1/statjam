'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { TournamentService } from '@/lib/services/tournamentService';
import { Tournament } from '@/lib/types/tournament';
import { 
  Trophy, 
  ArrowLeft, 
  Users, 
  Calendar, 
  Settings, 
  Eye, 
  Play, 
  Pause, 
  CheckCircle,
  MapPin,
  DollarSign,
  Globe,
  Lock,
  Edit
} from 'lucide-react';

interface TournamentDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

const TournamentDetailPage = ({ params }: TournamentDetailPageProps) => {
  const { user, loading } = useAuthV2();
  const userRole = user?.role;
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loadingTournament, setLoadingTournament] = useState(true);
  
  const { id: tournamentId } = use(params);

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

  // Loading State
  if (loading || loadingTournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/50 via-background to-red-50/30 animate-fadeIn">
        <div className="flex items-center gap-4 text-lg font-medium">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          Loading Tournament...
        </div>
      </div>
    );
  }

  // Not Found State
  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/50 via-background to-red-50/30 animate-fadeIn">
        <div className="text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Tournament Not Found</h2>
          <p className="text-muted-foreground mb-6">The tournament you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/dashboard?section=tournaments')}
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700';
      case 'draft':
        return 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700';
      case 'completed':
        return 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700';
      default:
        return 'bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-700';
    }
  };

  const quickActions = [
    {
      title: 'Manage Teams',
      description: 'Add, edit, and organize tournament teams',
      icon: Users,
      action: () => router.push(`/dashboard/tournaments/${tournamentId}/teams`),
    },
    {
      title: 'Schedule Games',
      description: 'Set up matches and tournament brackets',
      icon: Calendar,
      action: () => router.push(`/dashboard/tournaments/${tournamentId}/schedule`),
    },
    {
      title: 'Tournament Settings',
      description: 'Edit tournament configuration',
      icon: Settings,
      action: () => console.log('Edit settings'),
    },
    {
      title: 'Public View',
      description: 'See how fans will view your tournament',
      icon: Eye,
      action: () => console.log('Public view'),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30 pt-24 pb-12 px-6 animate-fadeIn">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard?section=tournaments')}
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tournaments
          </button>

          <div className="flex items-start justify-between gap-6 flex-wrap mb-8">
            <div className="flex-1 min-w-[300px]">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                {tournament.name}
              </h1>
              <p className="text-lg text-muted-foreground mb-4">{tournament.description}</p>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold uppercase border ${getStatusColor(tournament.status)}`}>
                {tournament.status === 'active' && <Play className="w-4 h-4" />}
                {tournament.status === 'draft' && <Edit className="w-4 h-4" />}
                {tournament.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                {tournament.status === 'cancelled' && <Pause className="w-4 h-4" />}
                {tournament.status}
              </div>
            </div>

            <div className="flex flex-col gap-3 min-w-[200px]">
              {tournament.status === 'draft' && (
                <button
                  onClick={() => console.log('Start tournament')}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  <Play className="w-4 h-4" />
                  Start Tournament
                </button>
              )}
              <button
                onClick={() => console.log('Edit tournament')}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-orange-300 text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit Details
              </button>
            </div>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Tournament Details */}
          <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-orange-300 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Tournament Details</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground font-medium">Format</span>
                <span className="text-sm font-semibold">
                  {tournament.tournamentType.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground font-medium">Teams</span>
                <span className="text-sm font-semibold">
                  {tournament.currentTeams} / {tournament.maxTeams}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground font-medium">Visibility</span>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {tournament.isPublic ? (
                    <Globe className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  {tournament.isPublic ? 'Public' : 'Private'}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground font-medium">Country</span>
                <span className="text-sm font-semibold">{tournament.country}</span>
              </div>
            </div>
          </div>

          {/* Schedule & Venue */}
          <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-orange-300 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Schedule & Venue</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground font-medium">Start Date</span>
                <span className="text-sm font-semibold">
                  {new Date(tournament.startDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground font-medium">End Date</span>
                <span className="text-sm font-semibold">
                  {new Date(tournament.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground font-medium">Venue</span>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="w-4 h-4" />
                  {tournament.venue}
                </div>
              </div>
            </div>
          </div>

          {/* Financial Overview */}
          <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-orange-300 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Financial Overview</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground font-medium">Entry Fee</span>
                <span className="text-sm font-semibold">${tournament.entryFee}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground font-medium">Prize Pool</span>
                <span className="text-sm font-semibold">${tournament.prizePool}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground font-medium">Total Revenue</span>
                <span className="text-sm font-semibold">
                  ${tournament.entryFee * tournament.currentTeams}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="group bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6 hover:bg-orange-100 dark:hover:bg-orange-950/40 hover:border-orange-400 transition-all duration-300 hover:-translate-y-1 text-center"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-sm font-semibold mb-2">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentDetailPage;
