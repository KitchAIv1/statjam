/**
 * TournamentCarouselService - Fetch tournaments for carousel display
 * 
 * Purpose: Fetch active/public tournaments with stats for carousel showcase
 * Follows .cursorrules: <200 lines, business logic only
 */

import { hybridSupabaseService } from './hybridSupabaseService';
import { getCountry } from '@/data/countries';
import { getTeamLogoCdn } from '@/lib/utils/cdnUrl';

/**
 * 🕐 STALENESS THRESHOLD: Games are considered stale if not updated in 6 hours
 * This prevents abandoned/unclosed games from affecting carousel display
 */
const STALE_GAME_HOURS = 6;

export interface TournamentCarouselData {
  id: string;
  name: string;
  logo: string | null;
  status: string;
  venue: string | null;
  country: string | null;
  countryFlag: string | null; // Country flag emoji or image URL
  organizerName: string | null;
  teamCount: number;
  gameCount: number;
  liveGameCount: number;
  featureHighlight: string;
  teamLogos: string[]; // Array of team logo URLs (max 6)
}

/**
 * Fetch active tournaments for carousel display
 * Returns tournaments with live games prioritized, then active tournaments
 */
export async function fetchTournamentsForCarousel(): Promise<TournamentCarouselData[]> {
  try {
    // Fetch tournaments with live games first (includes timestamps for staleness check)
    const liveGamesRaw = await hybridSupabaseService.query<any>(
      'games',
      'tournament_id,status,updated_at,start_time',
      {
        'or': '(status.eq.live,status.eq.LIVE,status.eq.in_progress,status.eq.IN_PROGRESS,status.eq.overtime,status.eq.OVERTIME)',
        'order': 'updated_at.desc',
        'limit': '50'
      }
    );
    
    // ✅ STALENESS CHECK: Filter out games not updated in the last 6 hours
    const now = new Date();
    const staleThreshold = new Date(now.getTime() - STALE_GAME_HOURS * 60 * 60 * 1000);
    
    const liveGames = liveGamesRaw.filter((game: any) => {
      const updatedAt = game.updated_at ? new Date(game.updated_at) : null;
      const startTime = game.start_time ? new Date(game.start_time) : null;
      const lastActivity = updatedAt || startTime;
      
      if (lastActivity && lastActivity < staleThreshold) {
        return false; // Stale game - exclude
      }
      return true;
    });

    // Get unique tournament IDs from live games
    const liveTournamentIds = [...new Set(liveGames.map((g: any) => g.tournament_id).filter(Boolean))];

    // Fetch tournament details
    const tournamentIds = liveTournamentIds.length > 0 ? liveTournamentIds : [];
    
    let tournaments: any[] = [];
    
    if (tournamentIds.length > 0) {
      tournaments = await hybridSupabaseService.query<any>(
        'tournaments',
        'id,name,logo,status,venue,country,organizer_id',
        {
          'id': `in.(${tournamentIds.join(',')})`,
          'order': 'created_at.desc'
        }
      );
    }

    // If no live tournaments, fetch active/public tournaments
    if (tournaments.length === 0) {
      tournaments = await hybridSupabaseService.query<any>(
        'tournaments',
        'id,name,logo,status,venue,country,organizer_id',
        {
          'or': '(status.eq.active,status.eq.ACTIVE,is_public.eq.true)',
          'order': 'created_at.desc',
          'limit': '10'
        }
      );
    }

    if (!tournaments || tournaments.length === 0) {
      return [];
    }

    // Enrich tournaments with stats
    const enrichedTournaments = await enrichTournamentsWithStats(tournaments, liveGames);

    // Sort: Live tournaments first, then by game count
    enrichedTournaments.sort((a, b) => {
      if (a.liveGameCount > 0 && b.liveGameCount === 0) return -1;
      if (a.liveGameCount === 0 && b.liveGameCount > 0) return 1;
      return b.gameCount - a.gameCount;
    });

    // Limit to top 8 tournaments
    return enrichedTournaments.slice(0, 8);
  } catch (error) {
    console.error('❌ TournamentCarouselService: Error fetching tournaments:', error);
    return [];
  }
}

/**
 * Enrich tournaments with team count, game count, and live game count
 */
async function enrichTournamentsWithStats(
  tournaments: any[],
  liveGames: any[]
): Promise<TournamentCarouselData[]> {
  const tournamentIds = tournaments.map(t => t.id);
  
  // Fetch team counts, team logos, game counts, and organizer names in parallel
  const [teamCounts, teamLogosMap, allGames, organizerNamesMap] = await Promise.all([
    fetchTeamCountsForTournaments(tournamentIds),
    fetchTeamLogosForTournaments(tournamentIds),
    fetchGameCountsForTournaments(tournamentIds),
    fetchOrganizerNames(tournaments)
  ]);

  // Count live games per tournament
  const liveGameCounts = new Map<string, number>();
  for (const game of liveGames) {
    if (game.tournament_id) {
      liveGameCounts.set(game.tournament_id, (liveGameCounts.get(game.tournament_id) || 0) + 1);
    }
  }

  // Feature highlights rotation
  const features = [
    'Live Play-by-Play',
    'Leaderboards',
    'Standings',
    'Live Viewing',
    'Brackets',
    'Stats & Analytics'
  ];

  return tournaments.map((tournament, index) => ({
    id: tournament.id,
    name: tournament.name || 'Unnamed Tournament',
    logo: tournament.logo || null,
    status: tournament.status || 'active',
    venue: tournament.venue || null,
    country: tournament.country || null,
    countryFlag: getCountryFlag(tournament.country),
    organizerName: organizerNamesMap.get(tournament.organizer_id) || null,
    teamCount: teamCounts.get(tournament.id) || 0,
    gameCount: allGames.filter((g: any) => g.tournament_id === tournament.id).length,
    liveGameCount: liveGameCounts.get(tournament.id) || 0,
    featureHighlight: features[index % features.length],
    teamLogos: teamLogosMap.get(tournament.id) || []
  }));
}

/**
 * Fetch team counts for tournaments
 */
async function fetchTeamCountsForTournaments(tournamentIds: string[]): Promise<Map<string, number>> {
  if (tournamentIds.length === 0) {
    return new Map();
  }

  try {
    const teams = await hybridSupabaseService.query<any>(
      'teams',
      'id,tournament_id',
      {
        'tournament_id': `in.(${tournamentIds.join(',')})`,
        'or': '(approval_status.is.null,approval_status.eq.approved)'
      }
    );

    // Count teams per tournament
    const teamCounts = new Map<string, number>();
    for (const team of teams) {
      if (team.tournament_id) {
        teamCounts.set(team.tournament_id, (teamCounts.get(team.tournament_id) || 0) + 1);
      }
    }

    return teamCounts;
  } catch (error) {
    console.error('❌ TournamentCarouselService: Error fetching team counts:', error);
    return new Map();
  }
}

/**
 * Fetch team logos for tournaments (max 6 per tournament)
 */
async function fetchTeamLogosForTournaments(tournamentIds: string[]): Promise<Map<string, string[]>> {
  if (tournamentIds.length === 0) return new Map();

  try {
    const teams = await hybridSupabaseService.query<any>(
      'teams',
      'tournament_id,logo_url',
      {
        'tournament_id': `in.(${tournamentIds.join(',')})`,
        'or': '(approval_status.is.null,approval_status.eq.approved)',
        'order': 'created_at.asc'
      }
    );

    const logosMap = new Map<string, string[]>();
    const counts = new Map<string, number>();

    for (const team of teams) {
      if (!team.tournament_id || !team.logo_url) continue;
      const count = counts.get(team.tournament_id) || 0;
      if (count >= 6) continue;

      if (!logosMap.has(team.tournament_id)) {
        logosMap.set(team.tournament_id, []);
      }
      // ✅ CDN for faster logo loading
      const cdnUrl = getTeamLogoCdn(team.logo_url);
      if (cdnUrl) {
        logosMap.get(team.tournament_id)!.push(cdnUrl);
        counts.set(team.tournament_id, count + 1);
      }
    }

    return logosMap;
  } catch (error) {
    console.error('❌ TournamentCarouselService: Error fetching team logos:', error);
    return new Map();
  }
}

/**
 * Fetch organizer names for tournaments
 */
async function fetchOrganizerNames(tournaments: any[]): Promise<Map<string, string>> {
  const organizerIds = [...new Set(tournaments.map(t => t.organizer_id).filter(Boolean))];
  
  if (organizerIds.length === 0) {
    return new Map();
  }

  try {
    const organizers = await hybridSupabaseService.query<any>(
      'users',
      'id,name,email',
      {
        'id': `in.(${organizerIds.join(',')})`
      }
    );

    const organizerMap = new Map<string, string>();
    for (const organizer of organizers) {
      organizerMap.set(organizer.id, organizer.name || organizer.email || 'Unknown Organizer');
    }

    return organizerMap;
  } catch (error) {
    console.error('❌ TournamentCarouselService: Error fetching organizer names:', error);
    return new Map();
  }
}

/**
 * Get country flag emoji from country code
 * Uses the standard getCountry utility that expects ISO 3166-1 alpha-2 codes
 */
function getCountryFlag(country: string | null): string | null {
  if (!country) return null;
  
  const countryData = getCountry(country);
  return countryData?.flag || null;
}

/**
 * Fetch game counts for tournaments
 */
async function fetchGameCountsForTournaments(tournamentIds: string[]): Promise<any[]> {
  if (tournamentIds.length === 0) {
    return [];
  }

  try {
    const games = await hybridSupabaseService.query<any>(
      'games',
      'id,tournament_id,status',
      {
        'tournament_id': `in.(${tournamentIds.join(',')})`
      }
    );

    return games || [];
  } catch (error) {
    console.error('❌ TournamentCarouselService: Error fetching game counts:', error);
    return [];
  }
}

