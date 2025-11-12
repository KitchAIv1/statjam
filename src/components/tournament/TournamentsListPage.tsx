"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { hybridSupabaseService } from '@/lib/services/hybridSupabaseService';
import { TeamService } from '@/lib/services/tournamentService';
import { GameService } from '@/lib/services/gameService';
import { TournamentLeadersService } from '@/lib/services/tournamentLeadersService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Trophy, Calendar, MapPin, Users, Shield, Play, Clock, TrendingUp, ExternalLink, ArrowRight, Search, X, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useLiveGamesHybrid } from '@/hooks/useLiveGamesHybrid';
import { getCountry } from '@/data/countries';

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
}

interface TournamentWithStats extends Tournament {
  teamCount: number;
  gameCount: number;
  topPlayers?: Array<{ id: string; name: string; photoUrl?: string; pointsPerGame: number }>;
  isVerified?: boolean; // Future: organizer verification status
}

export function TournamentsListPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentsWithStats, setTournamentsWithStats] = useState<TournamentWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(12); // Limit initial display
  const { games: liveGames } = useLiveGamesHybrid();

  useEffect(() => {
    let mounted = true;

    const loadTournaments = async () => {
      try {
        const data = await hybridSupabaseService.query<Tournament>(
          'tournaments',
          'id, name, status, start_date, end_date, venue, country, logo, organizer_id',
          {}
        );

        if (mounted) {
          setTournaments(data);
          
          // Load stats for each tournament
          const tournamentsWithStatsData = await Promise.all(
            data.map(async (tournament) => {
              try {
                const [teamCount, games] = await Promise.all([
                  TeamService.getTeamCountByTournament(tournament.id).catch(() => 0),
                  GameService.getGamesByTournament(tournament.id).catch(() => [])
                ]);

                // Get top 3 players for featured tournaments
                let topPlayers: Array<{ id: string; name: string; photoUrl?: string; pointsPerGame: number }> = [];
                if (tournament.status === 'active' || tournament.status === 'live') {
                  try {
                    const leaders = await TournamentLeadersService.getTournamentPlayerLeaders(
                      tournament.id,
                      'points',
                      1
                    );
                    topPlayers = leaders.slice(0, 3).map(l => ({
                      id: l.playerId,
                      name: l.playerName,
                      photoUrl: l.profilePhotoUrl,
                      pointsPerGame: l.pointsPerGame
                    }));
                  } catch {
                    // Ignore errors for top players
                  }
                }

                return {
                  ...tournament,
                  teamCount: teamCount || 0,
                  gameCount: games?.length || 0,
                  topPlayers,
                  isVerified: false // Future: Check organizer verification status
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

  // Filter and search tournaments
  const filteredTournaments = useMemo(() => {
    let filtered = tournamentsWithStats;

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(t => {
        const status = (t.status || '').toLowerCase();
        if (selectedFilter === 'live') return status === 'active' || status === 'live';
        if (selectedFilter === 'upcoming') return status === 'draft' || status === 'upcoming' || !status;
        if (selectedFilter === 'completed') return status === 'completed';
        return true;
      });
    }

    // Apply verified filter (prioritize verified tournaments)
    if (showVerifiedOnly) {
      filtered = filtered.filter(t => t.isVerified);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) ||
        (t.venue && t.venue.toLowerCase().includes(query))
      );
    }

    // Sort: Verified first, then by date/status
    filtered.sort((a, b) => {
      // Verified tournaments first
      if (a.isVerified && !b.isVerified) return -1;
      if (!a.isVerified && b.isVerified) return 1;
      
      // Then by status (live > upcoming > completed)
      const statusOrder = { 'active': 0, 'live': 0, 'draft': 1, 'upcoming': 1, 'completed': 2 };
      const aStatus = (a.status || '').toLowerCase();
      const bStatus = (b.status || '').toLowerCase();
      const aOrder = statusOrder[aStatus as keyof typeof statusOrder] ?? 1;
      const bOrder = statusOrder[bStatus as keyof typeof statusOrder] ?? 1;
      if (aOrder !== bOrder) return aOrder - bOrder;
      
      // Then by start date (most recent first)
      if (a.start_date && b.start_date) {
        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      }
      return 0;
    });

    return filtered;
  }, [tournamentsWithStats, selectedFilter, searchQuery, showVerifiedOnly]);

  // Get featured tournament (first live, or first upcoming)
  // Applies same filtering as upcoming tournaments: excludes 0 teams and TEST tournaments
  const featuredTournament = useMemo(() => {
    // Filter out tournaments that shouldn't be featured
    const validTournaments = tournamentsWithStats.filter(t => {
      const hasNoTeams = t.teamCount === 0;
      const isTestTournament = t.name.toLowerCase().startsWith('test');
      return !hasNoTeams && !isTestTournament;
    });

    // First priority: Find first live tournament
    const live = validTournaments.find(t => {
      const status = (t.status || '').toLowerCase();
      return status === 'active' || status === 'live';
    });
    
    // Second priority: First upcoming tournament
    if (!live) {
      const upcoming = validTournaments.find(t => {
        const status = (t.status || '').toLowerCase();
        return status === 'draft' || status === 'upcoming' || !status;
      });
      return upcoming || validTournaments[0];
    }
    
    return live;
  }, [tournamentsWithStats]);

  // Get live tournaments
  const liveTournaments = useMemo(() => {
    return tournamentsWithStats.filter(t => {
      const status = (t.status || '').toLowerCase();
      return status === 'active' || status === 'live';
    }).slice(0, 6);
  }, [tournamentsWithStats]);

  // Get upcoming tournaments (excluding featured) - with search/filter applied
  const upcomingTournaments = useMemo(() => {
    const filtered = filteredTournaments.filter(t => {
      const status = (t.status || '').toLowerCase();
      const isUpcoming = status === 'draft' || status === 'upcoming' || !status;
      
      // Filter out tournaments that shouldn't be shown:
      // 1. Tournaments with 0 teams
      // 2. Tournaments with name starting with "TEST" or "test"
      const hasNoTeams = t.teamCount === 0;
      const isTestTournament = t.name.toLowerCase().startsWith('test');
      
      return isUpcoming && 
             t.id !== featuredTournament?.id && 
             !hasNoTeams && 
             !isTestTournament;
    });
    
    // Limit display
    return filtered.slice(0, displayLimit);
  }, [filteredTournaments, featuredTournament, displayLimit]);

  // Get completed tournaments
  const completedTournaments = useMemo(() => {
    return tournamentsWithStats.filter(t => {
      const status = (t.status || '').toLowerCase();
      return status === 'completed';
    });
  }, [tournamentsWithStats]);

  const formatDateRange = (start?: string | null, end?: string | null): string => {
    if (!start && !end) return 'Date TBA';
    if (start && !end) {
      try {
        return new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch {
        return 'Date TBA';
      }
    }
    if (!start && end) {
      try {
        return new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch {
        return 'Date TBA';
      }
    }

    try {
      const startDate = new Date(start as string);
      const endDate = new Date(end as string);
      const sameMonth = startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear();

      if (sameMonth) {
        const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(startDate);
        return `${month} ${startDate.getDate()}–${endDate.getDate()}, ${startDate.getFullYear()}`;
      }

      const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
      return `${formatter.format(startDate)} – ${formatter.format(endDate)}, ${startDate.getFullYear()}`;
    } catch (error) {
      return 'Date TBA';
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header - Same as Tournament Page */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-2 px-4 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
          {/* Left: StatJam Logo */}
          <a href="/" className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80">
            <h1 className="text-lg font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent sm:text-xl">
              StatJam
            </h1>
          </a>

          {/* Center: Global Search Bar */}
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

          {/* Right: Log In + Start Tournament */}
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
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2 sm:text-5xl">Tournaments</h1>
          <p className="text-lg text-[#B3B3B3] sm:text-xl">Discover and follow live basketball tournaments</p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#B3B3B3]" />
            <input
              type="text"
              placeholder="Search tournaments by name or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-white/10 bg-[#121212] px-10 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#FF3B30]/50 focus:outline-none focus:ring-1 focus:ring-[#FF3B30]/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#B3B3B3] hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Tabs and Verified Toggle */}
          <div className="flex flex-wrap items-center gap-3 border-b border-white/10 pb-4">
            <div className="flex flex-wrap gap-2">
              {(['all', 'live', 'upcoming', 'completed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide transition ${
                    selectedFilter === filter
                      ? 'bg-[#FF3B30] text-white'
                      : 'bg-[#121212] text-[#B3B3B3] hover:text-white border border-white/10'
                  }`}
                >
                  {filter === 'all' ? 'All Tournaments' : filter}
                </button>
              ))}
            </div>
            
            {/* Verified Toggle */}
            <button
              onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
              className={`ml-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                showVerifiedOnly
                  ? 'bg-[#FF3B30]/20 text-[#FF3B30] border border-[#FF3B30]/50'
                  : 'bg-[#121212] text-[#B3B3B3] hover:text-white border border-white/10'
              }`}
            >
              <CheckCircle2 className={`h-4 w-4 ${showVerifiedOnly ? 'text-[#FF3B30]' : ''}`} />
              Verified Only
            </button>
          </div>

          {/* Results Count */}
          {searchQuery || showVerifiedOnly ? (
            <div className="text-sm text-[#B3B3B3]">
              Showing {filteredTournaments.length} tournament{filteredTournaments.length !== 1 ? 's' : ''}
              {searchQuery && ` matching "${searchQuery}"`}
              {showVerifiedOnly && ' (verified only)'}
            </div>
          ) : null}
        </div>

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
          <Card className="rounded-2xl border border-white/10 bg-[#121212] p-12 text-center">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-[#B3B3B3]" />
            <h2 className="text-xl font-semibold text-white mb-2">No tournaments yet</h2>
            <p className="text-[#B3B3B3]">Check back soon for upcoming tournaments and live events.</p>
          </Card>
        ) : (
          <div className="space-y-12">
            {/* Featured Tournament Hero Section */}
            {featuredTournament && selectedFilter !== 'completed' && (
              <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#121212] to-black max-w-4xl mx-auto">
                <div className="relative p-6 sm:p-8 lg:p-10 max-h-[500px] lg:max-h-[450px] overflow-hidden">
                  <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 h-full">
                    {/* Left: Tournament Info */}
                    <div className="flex-1 space-y-3 lg:space-y-4 min-w-0 overflow-hidden">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <Avatar className="h-14 w-14 shrink-0 border border-white/10 bg-[#121212] sm:h-16 sm:w-16 lg:h-18 lg:w-18">
                          {featuredTournament.logo ? (
                            <AvatarImage
                              src={featuredTournament.logo}
                              alt={`${featuredTournament.name} logo`}
                              className="object-contain"
                            />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
                            <Trophy className="h-7 w-7 text-[#FF3B30] sm:h-8 sm:w-8" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                            <h2 className="text-xl font-bold text-white sm:text-2xl lg:text-3xl truncate">
                              {featuredTournament.name}
                            </h2>
                            {(featuredTournament.status === 'active' || featuredTournament.status === 'live') && (
                              <span className="flex items-center gap-1.5 rounded-full bg-[#FF3B30] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shrink-0 sm:px-3 sm:text-xs">
                                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                Live Now
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#B3B3B3] sm:text-sm sm:gap-3">
                            {featuredTournament.country && getCountry(featuredTournament.country) && (
                              <>
                                <span className="text-base sm:text-lg shrink-0" title={getCountry(featuredTournament.country)?.name}>
                                  {getCountry(featuredTournament.country)?.flag}
                                </span>
                                <span className="shrink-0">·</span>
                              </>
                            )}
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              <span className="truncate">{featuredTournament.venue || 'Venue TBA'}</span>
                            </div>
                            <span>·</span>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{formatDateRange(featuredTournament.start_date, featuredTournament.end_date)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-3 border-t border-white/10">
                        <div>
                          <div className="text-xl font-bold text-white sm:text-2xl lg:text-3xl">{featuredTournament.teamCount}</div>
                          <div className="text-[10px] text-[#B3B3B3] uppercase tracking-wide mt-0.5 sm:text-xs sm:mt-1">Teams</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-white sm:text-2xl lg:text-3xl">{featuredTournament.gameCount}</div>
                          <div className="text-[10px] text-[#B3B3B3] uppercase tracking-wide mt-0.5 sm:text-xs sm:mt-1">Games</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-white sm:text-2xl lg:text-3xl">
                            {featuredTournament.topPlayers?.length || 0}
                          </div>
                          <div className="text-[10px] text-[#B3B3B3] uppercase tracking-wide mt-0.5 sm:text-xs sm:mt-1">Top Players</div>
                        </div>
                      </div>

                      {/* Top Players - Compact */}
                      {featuredTournament.topPlayers && featuredTournament.topPlayers.length > 0 && (
                        <div className="pt-3 border-t border-white/10">
                          <div className="text-[10px] uppercase tracking-wide text-[#B3B3B3] mb-2 sm:text-xs sm:mb-3">Top Scorers</div>
                          <div className="flex flex-wrap gap-2 sm:gap-3">
                            {featuredTournament.topPlayers.map((player) => (
                              <div key={player.id} className="flex items-center gap-1.5 sm:gap-2">
                                <Avatar className="h-8 w-8 border-2 border-white/10 sm:h-10 sm:w-10">
                                  {player.photoUrl ? (
                                    <AvatarImage src={player.photoUrl} alt={player.name} />
                                  ) : null}
                                  <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10 text-white text-[10px] sm:text-xs">
                                    {getInitials(player.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-xs font-semibold text-white sm:text-sm">{player.name}</div>
                                  <div className="text-[10px] text-[#FF3B30] sm:text-xs">{player.pointsPerGame.toFixed(1)} PPG</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => handleTournamentClick(featuredTournament)}
                        className="mt-3 rounded-full bg-[#FF3B30] px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-[#FF3B30]/30 transition hover:brightness-110 sm:px-6 sm:py-2 sm:text-sm sm:mt-4"
                      >
                        View Tournament
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:ml-2 sm:h-4 sm:w-4" />
                      </Button>
                    </div>

                    {/* Right: Quick Stats - Fixed Width */}
                    <div className="lg:w-64 xl:w-72 shrink-0">
                      <div className="rounded-xl border border-white/10 bg-[#121212] p-3 sm:p-4">
                        <div className="text-[10px] uppercase tracking-wide text-[#B3B3B3] mb-2 sm:text-xs sm:mb-3">Quick Stats</div>
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-[#B3B3B3]">Teams Registered</span>
                            <span className="font-semibold text-white">{featuredTournament.teamCount}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-[#B3B3B3]">Games Scheduled</span>
                            <span className="font-semibold text-white">{featuredTournament.gameCount}</span>
                          </div>
                          {(featuredTournament.status === 'active' || featuredTournament.status === 'live') && (
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-[#B3B3B3]">Live Games</span>
                              <span className="font-semibold text-[#FF3B30]">
                                {liveGames.filter(g => g.tournament_id === featuredTournament.id).length}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Live Now Section - Horizontal Scroll */}
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
                    {liveTournaments.map((tournament) => {
                      const liveGameCount = liveGames.filter(g => g.tournament_id === tournament.id).length;
                      return (
                        <Card
                          key={tournament.id}
                          onClick={() => handleTournamentClick(tournament)}
                          className="group cursor-pointer min-w-[280px] sm:min-w-0 rounded-2xl border border-white/10 bg-[#121212] p-5 transition-all hover:border-[#FF3B30]/50 hover:bg-[#121212]/80"
                        >
                          <div className="flex items-start gap-3 mb-4">
                            <Avatar className="h-12 w-12 shrink-0 border border-white/10 bg-[#0A0A0A]">
                              {tournament.logo ? (
                                <AvatarImage
                                  src={tournament.logo}
                                  alt={`${tournament.name} logo`}
                                  className="object-contain"
                                />
                              ) : null}
                              <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
                                <Trophy className="h-6 w-6 text-[#FF3B30]" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-white mb-1 truncate group-hover:text-[#FF3B30] transition-colors">
                                {tournament.name}
                              </h3>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="flex items-center gap-1 rounded-full bg-[#FF3B30] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                  Live
                                </span>
                                {liveGameCount > 0 && (
                                  <span className="text-xs text-[#B3B3B3]">{liveGameCount} game{liveGameCount !== 1 ? 's' : ''} live</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm text-[#B3B3B3] mb-4">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>{tournament.teamCount} teams</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Play className="h-4 w-4" />
                              <span>{tournament.gameCount} games</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span className="truncate">{tournament.venue || 'Venue TBA'}</span>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-full border-white/20 bg-white/5 text-white/70 hover:border-[#FF3B30]/50 hover:text-white hover:bg-[#FF3B30]/10"
                          >
                            Watch Live
                          </Button>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Upcoming Tournaments Grid - Smaller Cards */}
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
                    <Card
                      key={tournament.id}
                      onClick={() => handleTournamentClick(tournament)}
                      className="group cursor-pointer rounded-xl border border-white/10 bg-[#121212] p-4 transition-all hover:border-[#FF3B30]/30 hover:bg-[#121212]/80"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="h-10 w-10 shrink-0 border border-white/10 bg-[#0A0A0A]">
                          {tournament.logo ? (
                            <AvatarImage
                              src={tournament.logo}
                              alt={`${tournament.name} logo`}
                              className="object-contain"
                            />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
                            <Trophy className="h-5 w-5 text-[#FF3B30]" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-base font-bold text-white truncate group-hover:text-[#FF3B30] transition-colors">
                              {tournament.name}
                            </h3>
                            {tournament.isVerified && (
                              <div title="Verified Tournament">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#FF3B30]" />
                              </div>
                            )}
                          </div>
                          <div className="mt-1 space-y-1 text-xs text-[#B3B3B3]">
                            <div className="flex items-center gap-1.5 truncate">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span className="truncate">{formatDateRange(tournament.start_date, tournament.end_date)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              {tournament.country && getCountry(tournament.country) && (
                                <>
                                  <span className="text-sm shrink-0" title={getCountry(tournament.country)?.name}>
                                    {getCountry(tournament.country)?.flag}
                                  </span>
                                  <span className="shrink-0">·</span>
                                </>
                              )}
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{tournament.venue || 'Venue TBA'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <div className="flex items-center gap-4 text-xs">
                          <div>
                            <div className="font-semibold text-white">{tournament.teamCount}</div>
                            <div className="text-[#B3B3B3]">Teams</div>
                          </div>
                          <div>
                            <div className="font-semibold text-white">{tournament.gameCount}</div>
                            <div className="text-[#B3B3B3]">Games</div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 rounded-full border-white/20 bg-white/5 px-3 text-xs text-white/70 hover:border-[#FF3B30]/50 hover:text-white hover:bg-[#FF3B30]/10"
                        >
                          View
                        </Button>
                      </div>
                    </Card>
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
                    <Card
                      key={tournament.id}
                      onClick={() => handleTournamentClick(tournament)}
                      className="group cursor-pointer rounded-xl border border-white/10 bg-[#121212] p-4 transition-all hover:border-white/20 hover:bg-[#121212]/80"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 shrink-0 border border-white/10 bg-[#0A0A0A]">
                          {tournament.logo ? (
                            <AvatarImage
                              src={tournament.logo}
                              alt={`${tournament.name} logo`}
                              className="object-contain"
                            />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
                            <Trophy className="h-6 w-6 text-[#B3B3B3]" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-white mb-1 truncate group-hover:text-[#FF3B30] transition-colors">
                            {tournament.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-[#B3B3B3]">
                            <span>{tournament.venue || 'Venue TBA'}</span>
                            <span>·</span>
                            <span>{formatDateRange(tournament.start_date, tournament.end_date)}</span>
                            <span>·</span>
                            <span>{tournament.teamCount} teams</span>
                            <span>·</span>
                            <span>{tournament.gameCount} games</span>
                          </div>
                        </div>
                        <ExternalLink className="h-5 w-5 text-[#B3B3B3] group-hover:text-[#FF3B30] transition-colors shrink-0" />
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Footer - Same as Tournament Page */}
      <footer className="border-t border-white/10 bg-[#121212] py-6 sm:py-10 mt-12">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 sm:gap-6 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-white/40 sm:text-sm">StatJam</div>
            <div className="mt-1 text-base font-semibold text-white/90 sm:text-lg">Basketball Tournament Platform</div>
            <div className="text-xs text-[#B3B3B3] sm:text-sm">Real-time stats • Live tracking • Professional analytics</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#B3B3B3] sm:gap-3 sm:text-sm">
            <a href="#" className="transition hover:text-white">Privacy</a>
            <span className="h-4 w-px bg-white/20" />
            <a href="#" className="transition hover:text-white">Terms</a>
            <span className="h-4 w-px bg-white/20" />
            <a href="#" className="transition hover:text-white">Contact</a>
            <span className="h-4 w-px bg-white/20" />
            <span>© {new Date().getFullYear()} StatJam</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
