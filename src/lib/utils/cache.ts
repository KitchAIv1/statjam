/**
 * Simple client-side cache for reducing database calls
 * Optimized for StatJam performance improvements
 */

import { logger } from '@/lib/utils/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Set cache entry with TTL
   */
  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    const ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Get cache entry if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
export const cache = new SimpleCache();

// Cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

// Cache key generators for consistent naming
export const CacheKeys = {
  team: (teamId: string) => `team:${teamId}`,
  teamPlayers: (teamId: string) => `team_players:${teamId}`,
  user: (userId: string) => `user:${userId}`,
  tournament: (tournamentId: string) => `tournament:${tournamentId}`,
  gameBasic: (gameId: string) => `game_basic:${gameId}`,
  playerDashboard: (userId: string) => `player_dashboard:${userId}`,
  playerGameStats: (userId: string) => `player_game_stats:${userId}`,
  organizerDashboard: (userId: string) => `organizer_dashboard:${userId}`,
  organizerTournaments: (userId: string) => `organizer_tournaments:${userId}`,
  organizerGames: (userId: string) => `organizer_games:${userId}`,
  coachTeams: (coachId: string) => `coach_teams:${coachId}`,
  tournamentSchedule: (tournamentId: string) => `tournament_schedule:${tournamentId}`,
  tournamentLeaders: (tournamentId: string, category: string, minGames: number) => `tournament_leaders:${tournamentId}:${category}:${minGames}`,
  tournamentStandings: (tournamentId: string) => `tournament_standings:${tournamentId}`,
  tournamentTeams: (tournamentId: string) => `tournament_teams:${tournamentId}`,
  teamStats: (gameId: string, teamId: string) => `team_stats:${gameId}:${teamId}`,
  playerTournaments: (userId: string) => `player_tournaments:${userId}`,
  gameAwards: (gameId: string) => `game_awards:${gameId}`,
  tournamentMatchups: (tournamentId: string, status: string, limit: number) => `tournament_matchups:${tournamentId}:${status}:${limit}`,
  publicPlayerProfile: (playerId: string) => `public_player_profile:${playerId}`,
  tournamentsList: () => `tournaments_list`,
} as const;

// Cache TTL constants (in minutes)
export const CacheTTL = {
  TEAM_DATA: 10,
  PLAYER_DATA: 5,
  USER_DATA: 15,
  TOURNAMENT_DATA: 30,
  GAME_BASIC: 2,
  DASHBOARD_DATA: 3,
  playerDashboard: 3,
  playerGameStats: 5,
  organizerDashboard: 3,
  organizerTournaments: 3,
  organizerGames: 3,
  coachTeams: 3,
  tournamentSchedule: 5,
  tournamentLeaders: 2,
  tournamentStandings: 3,
  tournamentTeams: 10,
  teamStats: 2, // Short TTL since stats change frequently during games
  playerTournaments: 5, // Moderate TTL for player tournament data
  gameAwards: 5, // 5 minutes TTL for game awards
  tournamentMatchups: 3, // 3 minutes TTL for matchup data (balance between freshness and performance)
  publicPlayerProfile: 5, // 5 minutes TTL for public player profiles
  tournamentsList: 5, // 5 minutes TTL for public tournaments list
} as const;

/**
 * ⚡ Cache invalidation helper for organizer dashboard
 * Call this after tournament/game mutations to refresh overview data
 */
export function invalidateOrganizerDashboard(userId: string): void {
  const cacheKey = CacheKeys.organizerDashboard(userId);
  cache.delete(cacheKey);
  logger.debug('🗑️ Cache invalidated: organizer dashboard for user', userId);
}

/**
 * ⚡ Cache invalidation helper for organizer tournaments list
 * Call this after tournament create/update/delete
 */
export function invalidateOrganizerTournaments(userId: string): void {
  const cacheKey = CacheKeys.organizerTournaments(userId);
  cache.delete(cacheKey);
  logger.debug('🗑️ Cache invalidated: organizer tournaments for user', userId);
}

/**
 * ⚡ Cache invalidation helper for organizer games list
 * Call this after game create/update/delete
 */
export function invalidateOrganizerGames(userId: string): void {
  const cacheKey = CacheKeys.organizerGames(userId);
  cache.delete(cacheKey);
  logger.debug('🗑️ Cache invalidated: organizer games for user', userId);
}

/**
 * ⚡ Invalidate all organizer caches at once
 * Use when you want to refresh everything
 */
export function invalidateAllOrganizerCaches(userId: string): void {
  invalidateOrganizerDashboard(userId);
  invalidateOrganizerTournaments(userId);
  invalidateOrganizerGames(userId);
  logger.debug('🗑️ Cache invalidated: all organizer caches for user', userId);
}

/**
 * ⚡ Cache invalidation helper for coach teams list
 * Call this after team create/update/delete or roster/game changes
 */
export function invalidateCoachTeams(coachId: string): void {
  const cacheKey = CacheKeys.coachTeams(coachId);
  cache.delete(cacheKey);
  logger.debug('🗑️ Cache invalidated: coach teams for coach', coachId);
}
