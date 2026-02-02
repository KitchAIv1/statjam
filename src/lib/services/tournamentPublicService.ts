import { hybridSupabaseService } from '@/lib/services/hybridSupabaseService';
import { TeamService } from '@/lib/services/tournamentService';
import { GameService } from '@/lib/services/gameService';

export interface TournamentPageData {
  tournament: {
    id: string;
    slug: string;
    name: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    location: string | null;
    venue?: string | null;
    country?: string | null;
    organizerId: string | null;
    logo?: string | null;
    branding?: Record<string, unknown> | null;
    // Live streaming fields
    isStreaming?: boolean;
    liveStreamUrl?: string | null;
    streamPlatform?: 'youtube' | 'twitch' | 'facebook' | null;
  };
  summary: {
    teamCount: number;
    gameCount: number;
    venueCount: number;
    divisionCount: number;
  };
  sponsors: Array<{
    id: string;
    slot?: string | null;
    imageUrl?: string | null;
    linkUrl?: string | null;
  }>;
}

interface RawTournament {
  id: string;
  name: string;
  status?: string;
  start_date?: string | null;
  end_date?: string | null;
  venue?: string | null;
  country?: string | null;
  organizer_id?: string | null;
  logo?: string | null;
  // Live streaming fields
  is_streaming?: boolean;
  live_stream_url?: string | null;
  stream_platform?: string | null;
}

export async function getTournamentPageData(slug: string): Promise<TournamentPageData | null> {
  if (!slug) return null;

  // Try to find by ID first (slug might be an ID)
  // Simplified: Let RLS handle visibility, don't use is_public filter to avoid query issues
  let tournaments: RawTournament[] = [];
  
  try {
    tournaments = await hybridSupabaseService.query<RawTournament>(
      'tournaments',
      'id, name, status, start_date, end_date, venue, country, organizer_id, logo, is_streaming, live_stream_url, stream_platform',
      { id: `eq.${slug}` }
    );
  } catch (error: any) {
    console.error('❌ TournamentPublicService: Failed to fetch tournament by ID:', error.message);
    // If query fails completely, return null
    return null;
  }

  const tournament = tournaments[0];

  if (!tournament) {
    // Tournament not found by ID - return null (don't try fallback to avoid infinite loops)
    console.warn('⚠️ TournamentPublicService: Tournament not found:', slug);
    return null;
  }

  return await buildTournamentPageData(tournament);
}

/**
 * Safely query a table that may not exist - returns empty array if table doesn't exist
 */
async function safeQuery<T>(table: string, select: string, filters: Record<string, string>): Promise<T[]> {
  try {
    return await hybridSupabaseService.query<T>(table, select, filters);
  } catch (error: any) {
    // If table doesn't exist (404), return empty array silently
    // Other errors are also handled gracefully
    if (error?.message?.includes('does not exist') || error?.message?.includes('404')) {
      return [];
    }
    // For other errors, still return empty array but log for debugging
    console.warn(`⚠️ TournamentPublicService: Query failed for ${table}:`, error.message);
    return [];
  }
}

async function buildTournamentPageData(tournament: RawTournament): Promise<TournamentPageData> {
  const tournamentId = tournament.id;

  const [teamCount, games, venues, divisions, sponsors] = await Promise.all([
    TeamService.getTeamCountByTournament(tournamentId).catch(() => 0),
    GameService.getGamesByTournament(tournamentId).catch(() => []),
    safeQuery<{ id: string }>('venues', 'id', { tournament_id: `eq.${tournamentId}` }),
    safeQuery<{ id: string }>('divisions', 'id', { tournament_id: `eq.${tournamentId}` }),
    safeQuery<{ id: string; slot?: string | null; image_url?: string | null; link_url?: string | null }>(
      'sponsors',
      'id, slot, image_url, link_url',
      { tournament_id: `eq.${tournamentId}` }
    )
  ]);

  return {
    tournament: {
      id: tournament.id,
      slug: tournament.id, // Use ID as slug until slug column is added
      name: tournament.name,
      status: tournament.status || 'upcoming',
      startDate: tournament.start_date || null,
      endDate: tournament.end_date || null,
      location: tournament.venue || null, // Use venue as location
      venue: tournament.venue || null,
      country: tournament.country || null,
      organizerId: tournament.organizer_id || null,
      logo: tournament.logo || null,
      branding: null,
      // Live streaming fields
      isStreaming: tournament.is_streaming ?? false,
      liveStreamUrl: tournament.live_stream_url ?? null,
      streamPlatform: tournament.stream_platform as 'youtube' | 'twitch' | 'facebook' | null,
    },
    summary: {
      teamCount: teamCount ?? 0,
      gameCount: games?.length ?? 0,
      venueCount: venues?.length ?? 0,
      divisionCount: divisions?.length ?? 0
    },
    sponsors: sponsors.map((sponsor) => ({
      id: sponsor.id,
      slot: sponsor.slot ?? null,
      imageUrl: sponsor.image_url ?? null,
      linkUrl: sponsor.link_url ?? null
    }))
  };
}
