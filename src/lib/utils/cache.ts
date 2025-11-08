/**
 * Simple client-side cache for reducing database calls
 * Optimized for StatJam performance improvements
 */

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
  playerGameStats: (userId: string) => `player_game_stats:${userId}`, // ⚡ NEW
  organizerDashboard: (userId: string) => `organizer_dashboard:${userId}`, // ⚡ Organizer overview cache
  organizerTournaments: (userId: string) => `organizer_tournaments:${userId}`, // ⚡ Organizer tournaments list
  organizerGames: (userId: string) => `organizer_games:${userId}`, // ⚡ Organizer games list
} as const;

// Cache TTL constants (in minutes)
export const CacheTTL = {
  TEAM_DATA: 10,        // Team info changes rarely
  PLAYER_DATA: 5,       // Player data changes occasionally  
  USER_DATA: 15,        // User profiles change rarely
  TOURNAMENT_DATA: 30,  // Tournament info is mostly static
  GAME_BASIC: 2,        // Game basic info can change during games
  DASHBOARD_DATA: 3,    // Dashboard data should be relatively fresh
  playerDashboard: 3,   // ⚡ Player dashboard (aligned with DASHBOARD_DATA)
  playerGameStats: 5,   // ⚡ Player game stats (changes after each game)
  organizerDashboard: 3, // ⚡ Organizer dashboard (aligned with DASHBOARD_DATA)
  organizerTournaments: 3, // ⚡ Organizer tournaments list (aligned with DASHBOARD_DATA)
  organizerGames: 3,    // ⚡ Organizer games list (aligned with DASHBOARD_DATA)
} as const;

/**
 * ⚡ Cache invalidation helper for organizer dashboard
 * Call this after tournament/game mutations to refresh overview data
 */
export function invalidateOrganizerDashboard(userId: string): void {
  const cacheKey = CacheKeys.organizerDashboard(userId);
  cache.delete(cacheKey);
  console.log('🗑️ Cache invalidated: organizer dashboard for user', userId);
}

/**
 * ⚡ Cache invalidation helper for organizer tournaments list
 * Call this after tournament create/update/delete
 */
export function invalidateOrganizerTournaments(userId: string): void {
  const cacheKey = CacheKeys.organizerTournaments(userId);
  cache.delete(cacheKey);
  console.log('🗑️ Cache invalidated: organizer tournaments for user', userId);
}

/**
 * ⚡ Cache invalidation helper for organizer games list
 * Call this after game create/update/delete
 */
export function invalidateOrganizerGames(userId: string): void {
  const cacheKey = CacheKeys.organizerGames(userId);
  cache.delete(cacheKey);
  console.log('🗑️ Cache invalidated: organizer games for user', userId);
}

/**
 * ⚡ Invalidate all organizer caches at once
 * Use when you want to refresh everything
 */
export function invalidateAllOrganizerCaches(userId: string): void {
  invalidateOrganizerDashboard(userId);
  invalidateOrganizerTournaments(userId);
  invalidateOrganizerGames(userId);
  console.log('🗑️ Cache invalidated: all organizer caches for user', userId);
}
