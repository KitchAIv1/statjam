/**
 * GameViewerPlayerService
 * Player data transformation utilities for game viewer.
 * NO database calls - operates on pre-fetched data only.
 */

import { GameViewerV3APIResponse } from '@/providers/GameViewerV3Provider';

export interface PlayerIdentity {
  id: string;
  name: string;
  profilePhotoUrl?: string;
  jerseyNumber?: number;
  isCustomPlayer: boolean;
  teamId: string;
}

/** Build a map of player identities from game data */
export function buildPlayerIdentityMap(
  gameData: GameViewerV3APIResponse
): Map<string, PlayerIdentity> {
  const identityMap = new Map<string, PlayerIdentity>();

  for (const tp of gameData.teamPlayers) {
    const isCustom = !!tp.custom_player_id;
    const playerId = tp.custom_player_id || tp.player_id;
    if (!playerId) continue;

    if (isCustom) {
      const cp = gameData.customPlayers.find((p) => p.id === playerId);
      if (cp) {
        identityMap.set(playerId, {
          id: playerId,
          name: cp.name,
          profilePhotoUrl: cp.profile_photo_url,
          jerseyNumber: cp.jersey_number || tp.jersey_number,
          isCustomPlayer: true,
          teamId: tp.team_id,
        });
      }
    } else {
      const user = gameData.users.find((u) => u.id === playerId);
      if (user) {
        identityMap.set(playerId, {
          id: playerId,
          name: user.name,
          profilePhotoUrl: user.profile_photo_url,
          jerseyNumber: tp.jersey_number,
          isCustomPlayer: false,
          teamId: tp.team_id,
        });
      }
    }
  }

  return identityMap;
}

/** Get player identity by ID */
export function getPlayerIdentity(
  gameData: GameViewerV3APIResponse,
  playerId?: string,
  customPlayerId?: string
): PlayerIdentity | null {
  const targetId = customPlayerId || playerId;
  if (!targetId) return null;

  const identityMap = buildPlayerIdentityMap(gameData);
  return identityMap.get(targetId) || null;
}

/** Get team name by ID */
export function getTeamName(
  gameData: GameViewerV3APIResponse,
  teamId: string
): string {
  const team = gameData.teams.find((t) => t.id === teamId);
  return team?.name || 'Unknown Team';
}

/** Get team logo URL by ID */
export function getTeamLogo(
  gameData: GameViewerV3APIResponse,
  teamId: string
): string | undefined {
  const team = gameData.teams.find((t) => t.id === teamId);
  return team?.logo_url;
}
