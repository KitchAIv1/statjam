"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { hybridSupabaseService } from '@/lib/services/hybridSupabaseService';
import { TeamService } from '@/lib/services/tournamentService';
import { GameService } from '@/lib/services/gameService';
import { useLiveGameCount } from '@/hooks/useLiveGameCount';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';
import { TournamentsListHeader } from './TournamentsListHeader';
import { GlobalSearchBar } from '@/components/search/GlobalSearchBar';
import { FeaturedTournamentHero } from './FeaturedTournamentHero';
import { LiveTournamentCard } from './LiveTournamentCard';
import { UpcomingTournamentCard } from './UpcomingTournamentCard';
import { CompletedTournamentCard } from './CompletedTournamentCard';
import { TournamentsEmptyState } from './TournamentsEmptyState';
import { TournamentSocialFooter } from '@/components/shared/TournamentSocialFooter';
import { SocialLinks } from '@/components/shared/SocialLinks';
import { ArrowRight } from 'lucide-react';

/**
 * 🚫 EXCLUDED TOURNAMENTS: IDs of tournaments to hide from public list
 * These are test tournaments or tournaments that should not be publicly visible
 */
const EXCLUDED_TOURNAMENT_IDS = [
  '40e68d1d-84da-4095-833e-63962983a02f', // Excluded by request
];

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
  completedGameCount: number; // ✅ NEW: For featuring data-rich tournaments
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
          // ✅ Filter out excluded tournaments
          const filteredTournamentData = tournamentData.filter(t => 
            !EXCLUDED_TOURNAMENT_IDS.includes(t.id)
          );
          
          setTournaments(filteredTournamentData);
          
          // ✅ BATCH OPTIMIZATION: Get completed game counts for ALL tournaments in ONE query
          const tournamentIds = filteredTournamentData.map(t => t.id);
          const completedGameCounts = await GameService.getCompletedGameCountsBatch(tournamentIds).catch(() => new Map<string, number>());
          
          const tournamentsWithStatsData = await Promise.all(
            filteredTournamentData.map(async (tournament) => {
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
                  completedGameCount: completedGameCounts.get(tournament.id) || 0, // ✅ From batch query
                  topPlayers: [], // Skipped for performance
                  isVerified: false
                };
              } catch (error) {
                console.error(`Failed to load stats for tournament ${tournament.id}:`, error);
                return {
                  ...tournament,
                  teamCount: 0,
                  gameCount: 0,
                  completedGameCount: 0,
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

  // ✅ HELPER: Check if tournament is "effectively completed" (derived status)
  const isTournamentEffectivelyCompleted = useCallback((t: TournamentWithStats) => {
    const status = (t.status || '').toLowerCase();
    
    // Explicit completed status
    if (status === 'completed') return true;
    
    // Derived completion: end_date passed AND no live games
    if (t.end_date) {
      const now = new Date();
      const endDate = new Date(t.end_date);
      endDate.setHours(23, 59, 59, 999);
      endDate.setDate(endDate.getDate() + 1); // 24h grace period
      
      const hasExpired = endDate < now;
      const hasNoLiveGames = (liveGameCountByTournament.get(t.id) || 0) === 0;
      
      if (hasExpired && hasNoLiveGames) {
        return true;
      }
    }
    
    return false;
  }, [liveGameCountByTournament]);

  // ✅ HELPER: Check if tournament is "truly upcoming" based on dates
  // A tournament is upcoming ONLY if start_date is in the future or not set
  // Strict cutoff: If start_date has passed, it's no longer upcoming (it's ongoing or completed)
  const isTournamentTrulyUpcoming = useCallback((t: TournamentWithStats) => {
    const now = new Date();
    
    // If no start_date, consider it upcoming (draft state, dates not set yet)
    if (!t.start_date) return true;
    
    const startDate = new Date(t.start_date);
    // Strict cutoff: start_date must be in the future
    return startDate > now;
  }, []);

  const filteredTournaments = useMemo(() => {
    // ✅ EDGE CASE: Filter out empty tournaments (no games AND no teams)
    let filtered = tournamentsWithStats.filter(t => t.teamCount > 0 || t.gameCount > 0);
    
    // ✅ FILTER: Remove tournaments with "TEST" in name
    filtered = filtered.filter(t => !t.name.toLowerCase().includes('test'));
    
    // ✅ FILTER: Remove completed tournaments with 0 games OR 0 teams
    filtered = filtered.filter(t => {
      const isCompleted = isTournamentEffectivelyCompleted(t);
      if (isCompleted && (t.gameCount === 0 || t.teamCount === 0)) {
        return false;
      }
      return true;
    });
    
    // ✅ FILTER: Remove tournaments with teams but 0 games
    filtered = filtered.filter(t => !(t.teamCount > 0 && t.gameCount === 0));

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(t => {
        const status = (t.status || '').toLowerCase();
        if (selectedFilter === 'live') return status === 'active' || status === 'live';
        if (selectedFilter === 'upcoming') {
          // ✅ Must pass BOTH status check AND date check
          // Exclude derived-completed tournaments
          if (isTournamentEffectivelyCompleted(t)) return false;
          // Exclude tournaments that have already started (strict date check)
          if (!isTournamentTrulyUpcoming(t)) return false;
          return status === 'draft' || status === 'upcoming' || !status;
        }
        if (selectedFilter === 'completed') {
          // ✅ Include derived-completed tournaments
          return isTournamentEffectivelyCompleted(t);
        }
        return true;
      });
    }

    if (showVerifiedOnly) {
      filtered = filtered.filter(t => t.isVerified);
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
  }, [tournamentsWithStats, selectedFilter, showVerifiedOnly, isTournamentEffectivelyCompleted, isTournamentTrulyUpcoming]);

  // ✅ FEATURED TOURNAMENTS: Show top 2 tournaments
  // Prioritizes: Live games > Completed tournaments with data > Upcoming
  const featuredTournaments = useMemo(() => {
    const validTournaments = tournamentsWithStats.filter(t => {
      // ✅ EDGE CASE: Must have at least teams OR games to be featured
      const isEmpty = t.teamCount === 0 && t.gameCount === 0;
      const isTestTournament = t.name.toLowerCase().startsWith('test');
      // ✅ INCLUDE completed tournaments - they can be featured if data-rich
      return !isEmpty && !isTestTournament;
    });

    // Score and sort tournaments by priority
    const scoredTournaments = validTournaments.map(t => {
      const status = (t.status || '').toLowerCase();
      const liveGameCount = liveGameCountByTournament.get(t.id) || 0;
      const hasLiveGames = liveGameCount > 0;
      const isUpcomingStatus = status === 'draft' || status === 'upcoming' || !status;
      const isTrulyUpcoming = isTournamentTrulyUpcoming(t);
      const isCompleted = isTournamentEffectivelyCompleted(t);
      
      // Calculate day spread for multi-day tournament bonus
      let daySpread = 0;
      if (t.start_date && t.end_date) {
        const start = new Date(t.start_date);
        const end = new Date(t.end_date);
        daySpread = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      }
      
      // Priority scoring: higher = more important
      let score = 0;
      
      // 🥇 HIGHEST PRIORITY: Live games
      if (hasLiveGames) {
        score += 2000 + (liveGameCount * 10);
      }
      
      // 🥈 SECOND PRIORITY: Completed tournaments with lots of data
      // (Showcases successful, data-rich tournaments)
      if (isCompleted && t.completedGameCount > 0) {
        score += 1000 + (t.completedGameCount * 15); // Heavy weight on completed games
        score += daySpread * 20; // Multi-day tournaments get big bonus
      }
      
      // 🥉 THIRD PRIORITY: Truly upcoming tournaments
      if (isUpcomingStatus && isTrulyUpcoming) {
        score += 500;
      }
      
      // Active but no live games
      if (status === 'active' && !hasLiveGames && !isCompleted) {
        score += 400;
      }
      
      // Engagement bonuses (applies to all)
      score += t.teamCount * 5; // More teams = more important
      score += t.gameCount * 2; // More games = more activity
      
      return { tournament: t, score };
    });
    
    // Sort by score descending and take top 2
    scoredTournaments.sort((a, b) => b.score - a.score);
    const top2 = scoredTournaments.slice(0, 2).map(s => s.tournament);
    
    // ✅ PRIORITY: Put tournament with most completed games on the LEFT
    // This showcases data-rich tournaments prominently
    if (top2.length === 2) {
      top2.sort((a, b) => (b.completedGameCount || 0) - (a.completedGameCount || 0));
    }
    
    return top2;
  }, [tournamentsWithStats, isTournamentEffectivelyCompleted, isTournamentTrulyUpcoming, liveGameCountByTournament]);

  // Keep single reference for backwards compatibility (first featured)
  const featuredTournament = featuredTournaments[0] || null;

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
      const isUpcomingStatus = status === 'draft' || status === 'upcoming' || !status;
      const hasNoTeams = t.teamCount === 0;
      const isTestTournament = t.name.toLowerCase().startsWith('test');
      
      // ✅ EXCLUDE DERIVED-COMPLETED: Use helper for consistent logic
      if (isTournamentEffectivelyCompleted(t)) {
        return false;
      }
      
      // ✅ STRICT DATE CHECK: Exclude tournaments that have already started
      if (!isTournamentTrulyUpcoming(t)) {
        return false;
      }
      
      // Exclude featured tournaments from the upcoming grid
      const isFeatured = featuredTournaments.some(ft => ft.id === t.id);
      
      return isUpcomingStatus && 
             !isFeatured && 
             !hasNoTeams && 
             !isTestTournament;
    });
    
    return filtered.slice(0, displayLimit);
  }, [filteredTournaments, featuredTournaments, displayLimit, isTournamentEffectivelyCompleted, isTournamentTrulyUpcoming]);

  const completedTournaments = useMemo(() => {
    // Get all completed tournaments
    let completed = tournamentsWithStats.filter(t => isTournamentEffectivelyCompleted(t));
    
    // ✅ FILTER: Remove tournaments with "TEST" in name
    completed = completed.filter(t => !t.name.toLowerCase().includes('test'));
    
    // ✅ FILTER: Remove completed tournaments with 0 games OR 0 teams
    completed = completed.filter(t => !(t.gameCount === 0 || t.teamCount === 0));
    
    // ✅ FILTER: Remove tournaments with teams but 0 games
    completed = completed.filter(t => !(t.teamCount > 0 && t.gameCount === 0));
    
    return completed;
  }, [tournamentsWithStats, isTournamentEffectivelyCompleted]);

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
            <GlobalSearchBar />
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
            showVerifiedOnly={showVerifiedOnly}
          />
        ) : (
          <div className="space-y-12">
            {/* Featured Tournaments (Top 2) */}
            {featuredTournaments.length > 0 && selectedFilter !== 'completed' && (
              <div className={`grid ${featuredTournaments.length === 2 ? 'gap-6 lg:gap-8 lg:grid-cols-2' : 'grid-cols-1'}`}>
                {featuredTournaments.map((tournament) => (
                  <FeaturedTournamentHero
                    key={tournament.id}
                    tournament={tournament}
                    liveGameCount={liveGameCountByTournament.get(tournament.id) || 0}
                    onClick={() => handleTournamentClick(tournament)}
                    onLiveGamesClick={() => {
                      handleTournamentClick(tournament);
                      // Scroll to live games section on tournament page
                      setTimeout(() => {
                        const liveSection = document.getElementById('live-games');
                        if (liveSection) {
                          liveSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }, 500);
                    }}
                    shareUrl={typeof window !== 'undefined' ? `${window.location.origin}/tournament/${tournament.id}` : undefined}
                    fullWidth={featuredTournaments.length === 2}
                  />
                ))}
              </div>
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
