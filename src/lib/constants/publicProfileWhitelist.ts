/**
 * Tournament Whitelist for Public Profiles
 * 
 * Custom players in these tournaments can view their public profile
 * WITHOUT going through the claim process.
 * 
 * To disable: Remove the tournament ID from the array
 * To add more: Add the tournament ID to the array
 */
export const ALLOW_UNCLAIMED_PROFILES_TOURNAMENTS = [
  'c2fa28fa-ec92-40b4-a0db-0a94b68db103', // Special showcase tournament
];

/**
 * Check if a tournament allows unclaimed player profiles
 */
export function isTournamentWhitelistedForPublicProfiles(tournamentId: string | null | undefined): boolean {
  if (!tournamentId) return false;
  return ALLOW_UNCLAIMED_PROFILES_TOURNAMENTS.includes(tournamentId);
}

