'use client';

import { HeroSection } from '@/components/ui/HeroSection';
import { StatCard } from '@/components/ui/StatCard';
import { GameCard } from '@/components/ui/GameCard';
import { Button } from '@/components/ui/Button';
import { Trophy, Users, Activity, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  // Mock data for demo
  const featuredStats = [
    { title: 'Active Tournaments', value: '24', icon: <Trophy className="w-5 h-5" />, trend: 'up' as const },
    { title: 'Registered Players', value: '1,247', icon: <Users className="w-5 h-5" />, trend: 'up' as const },
    { title: 'Live Games', value: '8', icon: <Activity className="w-5 h-5" />, trend: 'neutral' as const },
    { title: 'Stats Recorded', value: '45K+', icon: <TrendingUp className="w-5 h-5" />, trend: 'up' as const },
  ];

  const featuredGames = [
    {
      homeTeam: { name: 'Lakers Elite', score: 98 },
      awayTeam: { name: 'Warriors Pro', score: 102 },
      status: 'finished' as const,
      time: '2h ago',
      venue: 'Staples Center'
    },
    {
      homeTeam: { name: 'Heat Squad', score: 76 },
      awayTeam: { name: 'Bulls United', score: 84 },
      status: 'live' as const,
      time: 'Q4 2:45',
      venue: 'Miami Arena'
    },
    {
      homeTeam: { name: 'Nets Force' },
      awayTeam: { name: 'Celtics Prime' },
      status: 'upcoming' as const,
      time: '8:00 PM',
      venue: 'Brooklyn Center'
    },
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <HeroSection
        subtitle="Welcome to StatJam"
        title="YOUR COURTSIDE COMMAND CENTER"
        description="Professional-grade tournament management with real-time stat tracking. Built for organizers, players, and fans who demand the best."
        primaryAction={{
          label: 'Create Tournament',
          onClick: () => console.log('Create Tournament')
        }}
        secondaryAction={{
          label: 'Join as Player',
          onClick: () => console.log('Join as Player')
        }}
      />

      {/* Live Stats Section */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-header text-5xl md:text-6xl font-bold text-white mb-4">
              LIVE TOURNAMENT DATA
            </h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: '#b3b3b3' }}>
              Real-time statistics and insights from tournaments happening right now
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 place-items-center">
            {featuredStats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <StatCard {...stat} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Games Section */}
      <section className="py-20 px-4 md:px-8" style={{ backgroundColor: 'rgba(26, 26, 26, 0.3)' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-header text-5xl md:text-6xl font-bold text-white mb-4">
              FEATURED GAMES
            </h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: '#b3b3b3' }}>
              Don't miss the action from today's biggest matchups
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 place-items-center">
            {featuredGames.map((game, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <GameCard
                  {...game}
                  onClick={() => console.log('View game details')}
                />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-16"
          >
            <Button variant="outline" size="lg">
              View All Games
            </Button>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-header text-5xl md:text-6xl font-bold text-white mb-6">
              READY TO ELEVATE YOUR GAME?
            </h2>
            <p className="text-xl mb-10 max-w-3xl mx-auto" style={{ color: '#b3b3b3' }}>
              Join thousands of organizers and players who trust StatJam for their tournament management needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button variant="primary" size="xl">
                Start Your Tournament
              </Button>
              <Button variant="secondary" size="xl">
                Browse Public Games
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}