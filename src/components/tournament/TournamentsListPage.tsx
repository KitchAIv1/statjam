"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { hybridSupabaseService } from '@/lib/services/hybridSupabaseService';
import { TeamService } from '@/lib/services/tournamentService';
import { GameService } from '@/lib/services/gameService';
import { useLiveGameCount } from '@/hooks/useLiveGameCount';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';
import { TournamentsListHeader } from './TournamentsListHeader';
import { FeaturedTournamentHero } from './FeaturedTournamentHero';
import { LiveTournamentCard } from './LiveTournamentCard';
import { UpcomingTournamentCard } from './UpcomingTournamentCard';
import { CompletedTournamentCard } from './CompletedTournamentCard';
import { TournamentsEmptyState } from './TournamentsEmptyState';
import { TournamentSocialFooter } from '@/components/shared/TournamentSocialFooter';
import { SocialLinks } from '@/components/shared/SocialLinks';
import { ArrowRight } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  status?: string;
  start_date?: string | null;
  end_date?: string | null;
  venue?: string | null;
  country?: string | null;
  logo?: string | null;
  organizer_id?: string | null;
  description?: string | null;
}

interface TournamentWithStats extends Tournament {
  teamCount: number;
  gameCount: number;
  topPlayers?: Array<{ id: string; name: string; photoUrl?: string; pointsPerGame: number }>;
  isVerified?: boolean;
}

/**
 * TournamentsListPage - Main tournaments listing page
 * 
 * Purpose: Orchestrate tournament data fetching and display
 * Follows .cursorrules: <500 lines, orchestration only
 */
export function TournamentsListPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentsWithStats, setTournamentsWithStats] = useState<TournamentWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(12);
  // ✅ OPTIMIZED: Use lightweight hook (1 query vs 14+ queries)
  const { liveGameCountByTournament } = useLiveGameCount();

  useEffect(() => {
    let mounted = true;

    const loadTournaments = async () => {
      // ✅ Cache-first: Check cache before loading
      const cacheKey = CacheKeys.tournamentsList();
      const cachedData = cache.get<TournamentWithStats[]>(cacheKey);
      
      if (cachedData && cachedData.length > 0) {
        setTournamentsWithStats(cachedData);
        setTournaments(cachedData);
        setLoading(false);
        return; // Use cached data, skip fetch
      }

      try {
        const tournamentData = await hybridSupabaseService.query<Tournament>(
          'tournaments',
          'id, name, status, start_date, end_date, venue, country, logo, organizer_id, description',
          {}
        );

        if (mounted) {
          setTournaments(tournamentData);
          
          const tournamentsWithStatsData = await Promise.all(
            tournamentData.map(async (tournament) => {
              try {
                // ✅ OPTIMIZED: Only fetch counts, skip leaders (saves ~40% load time)
                const [teamCount, gameCount] = await Promise.all([
                  TeamService.getTeamCountByTournament(tournament.id).catch(() => 0),
                  GameService.getGameCountByTournament(tournament.id).catch(() => 0)
                ]);

                return {
                  ...tournament,
                  teamCount: teamCount || 0,
                  gameCount: gameCount || 0,
                  topPlayers: [], // Skipped for performance
                  isVerified: false
                };
              } catch (error) {
                console.error(`Failed to load stats for tournament ${tournament.id}:`, error);
                return {
                  ...tournament,
                  teamCount: 0,
                  gameCount: 0,
                  topPlayers: []
                };
              }
            })
          );

          setTournamentsWithStats(tournamentsWithStatsData);
          
          // ✅ Cache the result for faster repeat visits
          cache.set(cacheKey, tournamentsWithStatsData, CacheTTL.tournamentsList);
        }
      } catch (error) {
        console.error('Failed to load tournaments:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadTournaments();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSignIn = () => {
    router.push('/auth?mode=signin');
  };

  const handleStartTournament = () => {
    if (user && user.role === 'organizer') {
      router.push('/dashboard/create-tournament');
    } else {
      router.push('/auth?mode=signup');
    }
  };

  const handleTournamentClick = (tournament: Tournament) => {
    router.push(`/tournament/${tournament.id}`);
  };

  const filteredTournaments = useMemo(() => {
    let filtered = tournamentsWithStats;

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(t => {
        const status = (t.status || '').toLowerCase();
        if (selectedFilter === 'live') return status === 'active' || status === 'live';
        if (selectedFilter === 'upcoming') return status === 'draft' || status === 'upcoming' || !status;
        if (selectedFilter === 'completed') return status === 'completed';
        return true;
      });
    }

    if (showVerifiedOnly) {
      filtered = filtered.filter(t => t.isVerified);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) ||
        (t.venue && t.venue.toLowerCase().includes(query))
      );
    }

    filtered.sort((a, b) => {
      if (a.isVerified && !b.isVerified) return -1;
      if (!a.isVerified && b.isVerified) return 1;
      
      const statusOrder = { 'active': 0, 'live': 0, 'draft': 1, 'upcoming': 1, 'completed': 2 };
      const aStatus = (a.status || '').toLowerCase();
      const bStatus = (b.status || '').toLowerCase();
      const aOrder = statusOrder[aStatus as keyof typeof statusOrder] ?? 1;
      const bOrder = statusOrder[bStatus as keyof typeof statusOrder] ?? 1;
      if (aOrder !== bOrder) return aOrder - bOrder;
      
      if (a.start_date && b.start_date) {
        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      }
      return 0;
    });

    return filtered;
  }, [tournamentsWithStats, selectedFilter, searchQuery, showVerifiedOnly]);

  const featuredTournament = useMemo(() => {
    const validTournaments = tournamentsWithStats.filter(t => {
      const hasNoTeams = t.teamCount === 0;
      const isTestTournament = t.name.toLowerCase().startsWith('test');
      return !hasNoTeams && !isTestTournament;
    });

    const live = validTournaments.find(t => {
      const status = (t.status || '').toLowerCase();
      return status === 'active' || status === 'live';
    });
    
    if (!live) {
      const upcoming = validTournaments.find(t => {
        const status = (t.status || '').toLowerCase();
        return status === 'draft' || status === 'upcoming' || !status;
      });
      return upcoming || validTournaments[0];
    }
    
    return live;
  }, [tournamentsWithStats]);

  const liveTournaments = useMemo(() => {
    // ✅ OPTIMIZED: Only show tournaments with ACTUAL live games
    return tournamentsWithStats.filter(t => {
      const actualLiveGameCount = liveGameCountByTournament.get(t.id) || 0;
      return actualLiveGameCount > 0;
    }).slice(0, 6);
  }, [tournamentsWithStats, liveGameCountByTournament]);

  const upcomingTournaments = useMemo(() => {
    const filtered = filteredTournaments.filter(t => {
      const status = (t.status || '').toLowerCase();
      const isUpcoming = status === 'draft' || status === 'upcoming' || !status;
      const hasNoTeams = t.teamCount === 0;
      const isTestTournament = t.name.toLowerCase().startsWith('test');
      
      return isUpcoming && 
             t.id !== featuredTournament?.id && 
             !hasNoTeams && 
             !isTestTournament;
    });
    
    return filtered.slice(0, displayLimit);
  }, [filteredTournaments, featuredTournament, displayLimit]);

  const completedTournaments = useMemo(() => {
    return tournamentsWithStats.filter(t => {
      const status = (t.status || '').toLowerCase();
      return status === 'completed';
    });
  }, [tournamentsWithStats]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-2 px-4 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
          <a href="/" className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80">
            <h1 className="text-lg font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent sm:text-xl">
              StatJam
            </h1>
          </a>

          <div className="hidden flex-1 max-w-md md:block">
            <div className="relative">
              <input
                type="search"
                placeholder="Search Teams, Tournaments, Players..."
                className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 pl-10 text-sm text-white placeholder:text-white/40 focus:border-[#FF3B30]/50 focus:outline-none focus:ring-1 focus:ring-[#FF3B30]/30"
              />
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="hidden md:flex shrink-0 items-center gap-4">
            <SocialLinks variant="icon-only" size="sm" />
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button 
              onClick={handleSignIn}
              className="hidden rounded-full border border-white/10 bg-transparent px-3 py-1.5 text-xs text-white/70 transition hover:border-white/30 hover:text-white sm:block sm:px-4 sm:py-2 sm:text-sm"
            >
              Log In
            </button>
            <button 
              onClick={handleStartTournament}
              className="rounded-full bg-[#FF3B30] px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-[#FF3B30]/30 transition hover:brightness-110 sm:px-4 sm:py-2 sm:text-sm"
            >
              Start Tournament
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
        <TournamentsListHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          showVerifiedOnly={showVerifiedOnly}
          onVerifiedToggle={() => setShowVerifiedOnly(!showVerifiedOnly)}
          filteredCount={filteredTournaments.length}
          onSignIn={handleSignIn}
          onStartTournament={handleStartTournament}
          user={user}
        />

        {loading ? (
          <div className="space-y-8">
            <div className="h-96 animate-pulse rounded-2xl bg-[#121212]" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="h-64 animate-pulse rounded-2xl bg-[#121212]" />
              ))}
            </div>
          </div>
        ) : tournamentsWithStats.length === 0 ? (
          <TournamentsEmptyState 
            searchQuery={searchQuery}
            showVerifiedOnly={showVerifiedOnly}
          />
        ) : (
          <div className="space-y-12">
            {/* Featured Tournament Hero */}
            {featuredTournament && selectedFilter !== 'completed' && (
              <FeaturedTournamentHero
                tournament={featuredTournament}
                liveGameCount={liveGameCountByTournament.get(featuredTournament.id) || 0}
                onClick={() => handleTournamentClick(featuredTournament)}
                onLiveGamesClick={() => {
                  handleTournamentClick(featuredTournament);
                  // Scroll to live games section on tournament page
                  setTimeout(() => {
                    const liveSection = document.getElementById('live-games');
                    if (liveSection) {
                      liveSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 500);
                }}
                shareUrl={typeof window !== 'undefined' ? `${window.location.origin}/tournament/${featuredTournament.id}` : undefined}
              />
            )}

            {/* Live Now Section */}
            {liveTournaments.length > 0 && selectedFilter !== 'completed' && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white sm:text-3xl">Live Now</h2>
                    <span className="h-2 w-2 rounded-full bg-[#FF3B30] animate-pulse" />
                  </div>
                  {liveTournaments.length > 4 && (
                    <button className="text-sm text-[#B3B3B3] hover:text-white transition">
                      View All
                      <ArrowRight className="ml-1 inline h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                  <div className="flex gap-4 min-w-max sm:min-w-0 sm:grid sm:grid-cols-2 lg:grid-cols-3">
                    {liveTournaments.map((tournament) => (
                      <LiveTournamentCard
                        key={tournament.id}
                        tournament={tournament}
                        liveGameCount={liveGameCountByTournament.get(tournament.id) || 0}
                        onClick={() => handleTournamentClick(tournament)}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Upcoming Tournaments Grid */}
            {upcomingTournaments.length > 0 && selectedFilter !== 'completed' && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white sm:text-3xl">Upcoming Tournaments</h2>
                  {filteredTournaments.filter(t => {
                    const status = (t.status || '').toLowerCase();
                    const isUpcoming = status === 'draft' || status === 'upcoming' || !status;
                    const hasNoTeams = t.teamCount === 0;
                    const isTestTournament = t.name.toLowerCase().startsWith('test');
                    return isUpcoming && 
                           t.id !== featuredTournament?.id && 
                           !hasNoTeams && 
                           !isTestTournament;
                  }).length > displayLimit && (
                    <button
                      onClick={() => setDisplayLimit(prev => prev + 12)}
                      className="text-sm text-[#B3B3B3] hover:text-white transition flex items-center gap-1"
                    >
                      Show More
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {upcomingTournaments.map((tournament) => (
                    <UpcomingTournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      onClick={() => handleTournamentClick(tournament)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Completed Tournaments List */}
            {completedTournaments.length > 0 && selectedFilter !== 'live' && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-6 sm:text-3xl">Completed Tournaments</h2>
                <div className="space-y-3">
                  {completedTournaments.map((tournament) => (
                    <CompletedTournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      onClick={() => handleTournamentClick(tournament)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <TournamentSocialFooter />
    </div>
  );
}
