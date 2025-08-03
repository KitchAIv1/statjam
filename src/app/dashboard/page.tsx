'use client';

import { motion } from 'framer-motion';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { redirect, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Activity,
  Plus,
  BarChart3,
  Settings,
  Eye
} from 'lucide-react';
import { TournamentCard } from '@/components/dashboard/TournamentCard';

export default function DashboardPage() {
  const { user, userRole, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || userRole !== 'organizer')) {
      redirect('/auth/login');
    }
  }, [user, userRole, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user || userRole !== 'organizer') {
    return null;
  }

  // Mock data for demo
  const stats = [
    {
      title: 'Active Tournaments',
      value: '3',
      subtitle: '+1 this month',
      trend: 'up' as const,
      icon: <Trophy className="w-6 h-6" />
    },
    {
      title: 'Total Teams',
      value: '24',
      subtitle: '+6 this week',
      trend: 'up' as const,
      icon: <Users className="w-6 h-6" />
    },
    {
      title: 'Scheduled Games',
      value: '12',
      subtitle: '8 upcoming',
      trend: 'neutral' as const,
      icon: <Calendar className="w-6 h-6" />
    },
    {
      title: 'Live Games',
      value: '2',
      subtitle: 'Right now',
      trend: 'neutral' as const,
      icon: <Activity className="w-6 h-6" />
    }
  ];

  const quickActions = [
    {
      title: 'Create Tournament',
      description: 'Start a new tournament from scratch',
      icon: <Plus className="w-8 h-8" />,
      action: () => router.push('/dashboard/create-tournament'),
      primary: true
    },
    {
      title: 'Manage Teams',
      description: 'Add or edit teams and players',
      icon: <Users className="w-8 h-8" />,
      action: () => console.log('Manage teams'),
      primary: false
    },
    {
      title: 'View Analytics',
      description: 'Tournament performance insights',
      icon: <BarChart3 className="w-8 h-8" />,
      action: () => console.log('View analytics'),
      primary: false
    },
    {
      title: 'Tournament Settings',
      description: 'Configure tournament rules',
      icon: <Settings className="w-8 h-8" />,
      action: () => console.log('Settings'),
      primary: false
    }
  ];

  const recentTournaments = [
    {
      id: '1',
      name: 'Summer League 2024',
      status: 'active' as const,
      startDate: '2024-06-15',
      endDate: '2024-07-15',
      venue: 'Downtown Arena',
      maxTeams: 8,
      currentTeams: 8,
      tournamentType: 'single_elimination',
      isPublic: true,
      entryFee: 50,
      prizePool: 1000
    },
    {
      id: '2',
      name: 'City Championship',
      status: 'active' as const,
      startDate: '2024-07-01',
      endDate: '2024-07-30',
      venue: 'Sports Complex',
      maxTeams: 16,
      currentTeams: 12,
      tournamentType: 'double_elimination',
      isPublic: true,
      entryFee: 100,
      prizePool: 2500
    },
    {
      id: '3',
      name: 'Youth Tournament',
      status: 'draft' as const,
      startDate: '2024-08-01',
      endDate: '2024-08-15',
      venue: 'Community Center',
      maxTeams: 6,
      currentTeams: 0,
      tournamentType: 'round_robin',
      isPublic: false,
      entryFee: 25,
      prizePool: 500
    }
  ];

  return (
    <div className="min-h-screen pt-16" style={{ backgroundColor: '#121212' }}>
      <div className="container-responsive py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Anton, system-ui, sans-serif' }}>
            ORGANIZER DASHBOARD
          </h1>
          <p className="text-gray-400 text-lg">
            Welcome back, {user.email?.split('@')[0]}! Here's what's happening with your tournaments.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid-stat-cards mb-12"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid-responsive-cards">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
                onClick={action.action}
                className="p-6 rounded-lg border transition-all duration-300 hover:scale-105 text-left"
                style={{
                  backgroundColor: action.primary ? '#4B0082' : '#1a1a1a',
                  borderColor: action.primary ? '#4B0082' : '#1f2937',
                }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div style={{ color: action.primary ? '#FFD700' : '#FFD700' }}>
                    {action.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{action.title}</h3>
                </div>
                <p className="text-gray-400 text-sm">{action.description}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Recent Tournaments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Tournaments</h2>
            <Button variant="outline" size="lg">
              View All
            </Button>
          </div>
          
          <div className="grid-responsive-cards">
            {recentTournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                onView={(id) => console.log('View tournament:', id)}
                onEdit={(id) => console.log('Edit tournament:', id)}
                onManage={(id) => router.push(`/dashboard/tournaments/${id}/teams`)}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}