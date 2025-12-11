/**
 * Shot Chart Service
 * 
 * Fetches and processes shot location data from game_stats for visualization.
 * Used by ShotChartView and ShotChartModal components.
 * 
 * @module shotChartService
 */

import { supabase } from '@/lib/supabase';
import { ShotZone, CourtCoordinates, ZONE_CONFIGS } from '@/lib/types/shotTracker';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Individual shot record for chart display
 */
export interface ShotRecord {
  id: string;
  playerId: string | null;
  playerName: string | null;
  teamId: string;
  location: CourtCoordinates;
  zone: ShotZone;
  made: boolean;
  points: number;
  timestamp: string;
}

/**
 * Shot statistics by zone
 */
export interface ZoneStats {
  zone: ShotZone;
  label: string;
  made: number;
  attempted: number;
  percentage: number;
}

/**
 * Aggregated shot chart data
 */
export interface ShotChartData {
  shots: ShotRecord[];
  stats: {
    totalMade: number;
    totalAttempted: number;
    fgPercentage: number;
    twoPointMade: number;
    twoPointAttempted: number;
    twoPointPercentage: number;
    threePointMade: number;
    threePointAttempted: number;
    threePointPercentage: number;
    zoneBreakdown: ZoneStats[];
  };
}

/**
 * Filters for fetching shot data
 */
export interface ShotChartFilters {
  gameId: string;
  playerId?: string;
  teamId?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

/**
 * Fetch shot chart data for a game with optional filters
 */
export async function getShotChartData(filters: ShotChartFilters): Promise<ShotChartData> {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  // Build query for shots with location data
  let query = supabase
    .from('game_stats')
    .select(`
      id,
      player_id,
      team_id,
      stat_type,
      modifier,
      shot_location_x,
      shot_location_y,
      shot_zone,
      created_at,
      players:player_id (name)
    `)
    .eq('game_id', filters.gameId)
    .in('stat_type', ['field_goal', 'three_pointer'])
    .not('shot_location_x', 'is', null)
    .not('shot_location_y', 'is', null);
  
  // Apply optional filters
  if (filters.playerId) {
    query = query.eq('player_id', filters.playerId);
  }
  
  if (filters.teamId) {
    query = query.eq('team_id', filters.teamId);
  }
  
  // Order by timestamp
  query = query.order('created_at', { ascending: true });
  
  const { data, error } = await query;
  
  if (error) {
    console.error('❌ Error fetching shot chart data:', error);
    throw new Error('Failed to fetch shot chart data');
  }
  
  // Transform to ShotRecord[]
  const shots: ShotRecord[] = (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    playerId: row.player_id as string | null,
    playerName: (row.players as { name: string } | null)?.name || null,
    teamId: row.team_id as string,
    location: {
      x: row.shot_location_x as number,
      y: row.shot_location_y as number
    },
    zone: (row.shot_zone as ShotZone) || 'mid_range',
    made: row.modifier === 'made',
    points: row.stat_type === 'three_pointer' ? 3 : 2,
    timestamp: row.created_at as string
  }));
  
  // Calculate statistics
  const stats = calculateShotStats(shots);
  
  return { shots, stats };
}

/**
 * Calculate shooting statistics from shot records
 */
function calculateShotStats(shots: ShotRecord[]): ShotChartData['stats'] {
  const totalMade = shots.filter(s => s.made).length;
  const totalAttempted = shots.length;
  
  const twoPointers = shots.filter(s => s.points === 2);
  const twoPointMade = twoPointers.filter(s => s.made).length;
  const twoPointAttempted = twoPointers.length;
  
  const threePointers = shots.filter(s => s.points === 3);
  const threePointMade = threePointers.filter(s => s.made).length;
  const threePointAttempted = threePointers.length;
  
  // Zone breakdown
  const zoneBreakdown: ZoneStats[] = Object.keys(ZONE_CONFIGS).map(zoneKey => {
    const zone = zoneKey as ShotZone;
    const zoneShots = shots.filter(s => s.zone === zone);
    const zoneMade = zoneShots.filter(s => s.made).length;
    const zoneAttempted = zoneShots.length;
    
    return {
      zone,
      label: ZONE_CONFIGS[zone].label,
      made: zoneMade,
      attempted: zoneAttempted,
      percentage: zoneAttempted > 0 ? Math.round((zoneMade / zoneAttempted) * 100) : 0
    };
  }).filter(z => z.attempted > 0); // Only include zones with shots
  
  return {
    totalMade,
    totalAttempted,
    fgPercentage: totalAttempted > 0 ? Math.round((totalMade / totalAttempted) * 100) : 0,
    twoPointMade,
    twoPointAttempted,
    twoPointPercentage: twoPointAttempted > 0 ? Math.round((twoPointMade / twoPointAttempted) * 100) : 0,
    threePointMade,
    threePointAttempted,
    threePointPercentage: threePointAttempted > 0 ? Math.round((threePointMade / threePointAttempted) * 100) : 0,
    zoneBreakdown
  };
}

/**
 * Check if a game has any shot location data
 */
export async function hasGameShotData(gameId: string): Promise<boolean> {
  if (!supabase) return false;
  
  const { count, error } = await supabase
    .from('game_stats')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', gameId)
    .in('stat_type', ['field_goal', 'three_pointer'])
    .not('shot_location_x', 'is', null);
  
  if (error) {
    console.error('❌ Error checking shot data:', error);
    return false;
  }
  
  return (count || 0) > 0;
}

/**
 * Get player shot chart data for a specific game
 */
export async function getPlayerShotChart(
  gameId: string, 
  playerId: string
): Promise<ShotChartData> {
  return getShotChartData({ gameId, playerId });
}

/**
 * Get team shot chart data for a specific game
 */
export async function getTeamShotChart(
  gameId: string, 
  teamId: string
): Promise<ShotChartData> {
  return getShotChartData({ gameId, teamId });
}
