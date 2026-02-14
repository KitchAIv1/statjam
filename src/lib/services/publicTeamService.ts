/**
 * PublicTeamService - Read-only public team page data
 *
 * Does NOT add to legacy tournamentService.ts.
 * Uses hybridSupabaseService for public/anon access.
 */

import { hybridSupabaseService } from '@/lib/services/hybridSupabaseService';

export interface PublicTeamPlayer {
  id: string;
  name: string;
  profilePhotoUrl?: string;
  position?: string;
  jerseyNumber?: number;
  is_custom_player?: boolean;
  country?: string;
  height?: string;
  weight?: string;
}

function formatHeightForRoster(raw: number | string | undefined): string | undefined {
  if (raw == null) return undefined;
  if (typeof raw === 'string' && raw !== 'N/A' && raw.length > 0) return raw;
  if (typeof raw === 'number' && raw > 0) {
    const ft = Math.floor(raw / 12);
    const inch = raw % 12;
    return `${ft}-${inch}`;
  }
  return undefined;
}

function formatWeightForRoster(raw: number | string | undefined): string | undefined {
  if (raw == null) return undefined;
  if (typeof raw === 'string' && raw !== 'N/A' && raw.length > 0) return raw;
  if (typeof raw === 'number' && raw > 0) return String(raw);
  return undefined;
}

export interface PublicTeamProfile {
  id: string;
  name: string;
  logoUrl?: string;
  division?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  tournamentId: string;
  tournamentName?: string;
  players: PublicTeamPlayer[];
}

async function mapTeamPlayers(
  rawTeamPlayers: any[],
  usersMap: Map<string, any>,
  customPlayersMap: Map<string, any>
): Promise<PublicTeamPlayer[]> {
  if (!rawTeamPlayers?.length) return [];

  const result: PublicTeamPlayer[] = [];
  let jerseyFallback = 1;

  for (const tp of rawTeamPlayers) {
    if (tp?.player_id) {
      const user = usersMap.get(tp.player_id);
      if (!user) continue;
      const playerName =
        user.name ||
        (user.email
          ? user.email.includes('@')
            ? user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim()
            : user.email
          : `Player ${jerseyFallback}`);
      result.push({
        id: user.id,
        name: playerName,
        profilePhotoUrl: user.profile_photo_url || undefined,
        position: user.position || 'PG',
        jerseyNumber: user.jersey_number ?? jerseyFallback++,
        is_custom_player: false,
        country: user.country || undefined,
        height: formatHeightForRoster(user.height),
        weight: formatWeightForRoster(user.weight),
      });
    } else if (tp?.custom_player_id) {
      const cp = customPlayersMap.get(tp.custom_player_id);
      if (!cp) continue;
      result.push({
        id: cp.id,
        name: cp.name || `Player ${jerseyFallback}`,
        profilePhotoUrl: cp.profile_photo_url || undefined,
        position: (cp.position || 'PG') as string,
        jerseyNumber: cp.jersey_number ?? jerseyFallback++,
        is_custom_player: true,
      });
    }
  }

  return result;
}

export async function getTeamPublicProfile(
  teamId: string,
  tournamentId: string
): Promise<PublicTeamProfile | null> {
  if (!teamId || !tournamentId) return null;

  const teams = await hybridSupabaseService.query<any>(
    'teams',
    'id,name,logo_url,tournament_id,division,primary_color,secondary_color,accent_color',
    { id: `eq.${teamId}` }
  );

  const team = teams[0];
  if (!team) return null;

  const linkedViaDirect = team.tournament_id === tournamentId;

  let linkedViaJunction = false;
  if (!linkedViaDirect) {
    const links = await hybridSupabaseService.query<any>(
      'team_tournaments',
      'team_id',
      { team_id: `eq.${teamId}`, tournament_id: `eq.${tournamentId}` }
    );
    linkedViaJunction = links.length > 0;
  }

  if (!linkedViaDirect && !linkedViaJunction) return null;

  const tournamentRows = await hybridSupabaseService.query<any>(
    'tournaments',
    'id,name',
    { id: `eq.${tournamentId}` }
  );
  const tournamentName = tournamentRows[0]?.name;

  // team_players only has: id, team_id, player_id, custom_player_id, created_at, updated_at
  // (no jersey_number/position - source: migration 006_fix_team_players_rls.sql)
  const teamPlayersRows = await hybridSupabaseService.query<any>(
    'team_players',
    'player_id,custom_player_id',
    { team_id: `eq.${teamId}` }
  );

  const rawTps = teamPlayersRows || [];
  const regularIds = rawTps.filter((tp: any) => tp?.player_id).map((tp: any) => tp.player_id);
  const customIds = rawTps.filter((tp: any) => tp?.custom_player_id).map((tp: any) => tp.custom_player_id);

  // users: include country, height, weight for roster card stats (POS, ORIGIN, HT, WT)
  const usersMap = new Map<string, any>();
  if (regularIds.length > 0) {
    const users = await hybridSupabaseService.query<any>(
      'users',
      'id,name,email,profile_photo_url,jersey_number,position,country,height,weight',
      { id: `in.(${regularIds.join(',')})` }
    );
    (users || []).forEach((u: any) => usersMap.set(u.id, u));
  }

  const customPlayersMap = new Map<string, any>();
  if (customIds.length > 0) {
    const cps = await hybridSupabaseService.query<any>(
      'custom_players',
      'id,name,jersey_number,position,profile_photo_url',
      { id: `in.(${customIds.join(',')})` }
    );
    (cps || []).forEach((cp: any) => customPlayersMap.set(cp.id, cp));
  }

  const players = await mapTeamPlayers(rawTps, usersMap, customPlayersMap);

  return {
    id: team.id,
    name: team.name,
    logoUrl: team.logo_url || undefined,
    division: team.division || undefined,
    primaryColor: team.primary_color || undefined,
    secondaryColor: team.secondary_color || undefined,
    accentColor: team.accent_color || undefined,
    tournamentId,
    tournamentName: tournamentName || undefined,
    players,
  };
}
