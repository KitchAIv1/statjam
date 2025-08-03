'use client';

import { motion } from 'framer-motion';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { redirect } from 'next/navigation';
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

export default function DashboardPage() {
  const { user, userRole, loading } = useAuthStore();

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
      action: () => console.log('Create tournament'),
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
      name: 'Summer League 2024',
      status: 'Active',
      teams: 8,
      games: 14,
      lastUpdate: '2 hours ago'
    },
    {
      name: 'City Championship',
      status: 'Active',
      teams: 16,
      games: 30,
      lastUpdate: '5 hours ago'
    },
    {
      name: 'Youth Tournament',
      status: 'Draft',
      teams: 6,
      games: 0,
      lastUpdate: '1 day ago'
    }
  ];

  return (
    <div className="min-h-screen pt-16" style={{ backgroundColor: '#121212' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#1a1a1a', border: '1px solid #1f2937' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: '#2a2a2a' }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                      Tournament
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                      Teams
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                      Games
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                      Last Update
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentTournaments.map((tournament, index) => (
                    <tr key={tournament.name} className="border-t border-gray-800 hover:bg-gray-800/50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{tournament.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          tournament.status === 'Active' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {tournament.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{tournament.teams}</td>
                      <td className="px-6 py-4 text-gray-300">{tournament.games}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{tournament.lastUpdate}</td>
                      <td className="px-6 py-4">
                        <button className="text-purple-400 hover:text-purple-300 transition-colors duration-200">
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}