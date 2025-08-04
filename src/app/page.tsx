'use client';

import { HeroSection } from '@/components/ui/HeroSection';
import { StatCard } from '@/components/ui/StatCard';
import { GameCard } from '@/components/ui/GameCard';

import { HeroButton } from '@/components/ui/Button';
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
        backgroundImage="/images/hero-bg.jpg"
        primaryAction={{
          label: 'Create Tournament',
          onClick: () => window.location.href = '/auth'
        }}
        secondaryAction={{
          label: 'Join as Player',
          onClick: () => window.location.href = '/auth'
        }}
      />

      {/* Live Stats Section */}
      <section className="section-spacing">
        <div className="max-width-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-header text-4xl md:text-5xl lg:text-6xl font-bold text-visible-yellow mb-4">
              LIVE TOURNAMENT DATA
            </h2>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-visible-gray">
              Real-time statistics and insights from tournaments happening right now
            </p>
          </motion.div>

          <div className="landing-stats-grid">
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
      <section className="section-spacing" style={{ backgroundColor: 'rgba(26, 26, 26, 0.3)' }}>
        <div className="max-width-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-header text-4xl md:text-5xl lg:text-6xl font-bold text-visible-yellow mb-4">
              FEATURED GAMES
            </h2>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-visible-gray">
              Don't miss the action from today's biggest matchups
            </p>
          </motion.div>

          <div className="landing-games-grid">
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
            <HeroButton variant="secondary">
              <span>View All Games</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </HeroButton>
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
              <HeroButton variant="primary">
                <span>Start Your Tournament</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </HeroButton>
              <HeroButton variant="secondary">
                <span>Browse Public Games</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </HeroButton>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}