'use client';

import { HeroSection } from '@/components/ui/HeroSection';
import { StatCard } from '@/components/ui/StatCard';
import { GameCard } from '@/components/ui/GameCard';

import { HeroButton } from '@/components/ui/Button';
import { Trophy, Users, Activity, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type LiveGameRow = {
  id: string;
  status: string;
  start_time: string | null;
  home_score: number | null;
  away_score: number | null;
  quarter: number | null;
  game_clock_minutes: number | null;
  game_clock_seconds: number | null;
  team_a_id: string;
  team_b_id: string;
  is_clock_running: boolean | null;
};

export default function HomePage() {
  const router = useRouter();
  const [liveGames, setLiveGames] = useState<LiveGameRow[]>([]);
  const [loadingLive, setLoadingLive] = useState<boolean>(true);
  // Mock data for demo
  const featuredStats = [
    { title: 'Active Tournaments', value: '24', icon: <Trophy className="w-5 h-5" />, trend: 'up' as const },
    { title: 'Registered Players', value: '1,247', icon: <Users className="w-5 h-5" />, trend: 'up' as const },
    { title: 'Live Games', value: '8', icon: <Activity className="w-5 h-5" />, trend: 'neutral' as const },
    { title: 'Stats Recorded', value: '45K+', icon: <TrendingUp className="w-5 h-5" />, trend: 'up' as const },
  ];

  // Shared fetcher for live games
  const fetchLiveGames = useCallback(async () => {
    try {
      setLoadingLive(true);
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .in('status', ['in_progress', 'overtime', 'live', 'scheduled'])
        .order('start_time', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('Landing: failed to load live games', error);
        setLiveGames([]);
        return;
      }
      setLiveGames((data as unknown as LiveGameRow[]) || []);
    } catch (e) {
      console.warn('Landing: unexpected error loading live games', e);
      setLiveGames([]);
    } finally {
      setLoadingLive(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchLiveGames();
  }, [fetchLiveGames]);

  // Realtime + polling updates
  useEffect(() => {
    const channel = supabase
      .channel('landing-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games' },
        () => {
          // debounce small to allow DB to settle
          setTimeout(() => fetchLiveGames(), 300);
        }
      )
      .subscribe();

    const poll = setInterval(() => {
      fetchLiveGames();
    }, 10000);

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [fetchLiveGames]);

  const liveCards = useMemo(() => {
    const toLabelStatus = (s: string) => (s === 'in_progress' || s === 'overtime' || s === 'live') ? 'live' as const
      : s === 'completed' ? 'finished' as const
      : 'upcoming' as const;
    const isLiveComputed = (g: LiveGameRow) => (
      g.status === 'in_progress' ||
      g.status === 'overtime' ||
      g.status === 'live' ||
      Boolean(g.is_clock_running) ||
      (g.status === 'scheduled' && ((g.home_score ?? 0) > 0 || (g.away_score ?? 0) > 0))
    );

    return (liveGames || []).filter(isLiveComputed).map(g => {
      const mm = Math.max(0, Number(g.game_clock_minutes ?? 0));
      const ss = Math.max(0, Number(g.game_clock_seconds ?? 0));
      const timeLabel = g.quarter ? `Q${g.quarter} ${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : 'LIVE';
      return {
        key: g.id,
        onClick: () => router.push(`/game-viewer/${g.id}`),
        props: {
          homeTeam: { name: 'Home', score: g.home_score ?? undefined },
          awayTeam: { name: 'Away', score: g.away_score ?? undefined },
          status: toLabelStatus(g.status),
          time: timeLabel,
          venue: undefined as string | undefined,
        }
      };
    });
  }, [liveGames, router]);

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

      {/* Live Games Section */}
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
              LIVE GAMES
            </h2>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-visible-gray">
              Watch games in progress right now
            </p>
          </motion.div>

          <div className="landing-games-grid">
            {(!loadingLive && liveCards.length === 0) && (
              <div className="text-center text-gray-400 py-8">No live games right now.</div>
            )}
            {liveCards.map((cg, index) => (
              <motion.div
                key={cg.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
              >
                <GameCard {...cg.props} onClick={cg.onClick} />
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