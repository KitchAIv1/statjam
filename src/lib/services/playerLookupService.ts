/**
 * PlayerLookupService - Lightweight player name resolution
 * 
 * PURPOSE: Fetch player display name from users or custom_players tables
 * Returns formatted string: "#33 GINOBLI" or "PLAYER" if not found
 * 
 * @module PlayerLookupService
 */

import { supabase } from '@/lib/supabase';

interface PlayerDisplayInfo {
  displayName: string;
  lastName: string;
  jerseyNumber: string | null;
}

/**
 * Fetch player display name for overlay
 * Checks users table first, then custom_players
 * Returns formatted: "#33 GINOBLI" or just "GINOBLI" if no jersey
 */
export async function fetchPlayerDisplayName(playerId: string): Promise<string> {
  if (!supabase) return 'PLAYER';

  // Try users table first (regular players)
  const { data: regularPlayer } = await supabase
    .from('users')
    .select('name, jersey_number')
    .eq('id', playerId)
    .single();

  if (regularPlayer?.name) {
    return formatPlayerName(regularPlayer.name, regularPlayer.jersey_number);
  }

  // Try custom_players table
  const { data: customPlayer } = await supabase
    .from('custom_players')
    .select('name, jersey_number')
    .eq('id', playerId)
    .single();

  if (customPlayer?.name) {
    return formatPlayerName(customPlayer.name, customPlayer.jersey_number);
  }

  return 'PLAYER';
}

/**
 * Format player name for overlay display
 * Extracts last name and prepends jersey number if available
 */
function formatPlayerName(fullName: string, jerseyNumber: number | string | null): string {
  const nameParts = fullName.trim().split(' ');
  const lastName = nameParts[nameParts.length - 1] || fullName;
  const jersey = jerseyNumber ? `#${jerseyNumber}` : '';
  
  return jersey ? `${jersey} ${lastName}` : lastName;
}
