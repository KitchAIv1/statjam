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
} as const;

// Cache TTL constants (in minutes)
export const CacheTTL = {
  TEAM_DATA: 10,        // Team info changes rarely
  PLAYER_DATA: 5,       // Player data changes occasionally  
  USER_DATA: 15,        // User profiles change rarely
  TOURNAMENT_DATA: 30,  // Tournament info is mostly static
  GAME_BASIC: 2,        // Game basic info can change during games
  DASHBOARD_DATA: 3,    // Dashboard data should be relatively fresh
} as const;
