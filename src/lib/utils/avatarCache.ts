/**
 * Avatar Image Cache Utility
 * Provides browser-level caching for avatar images with Facebook-like performance
 */

interface CachedImage {
  url: string;
  blob: Blob;
  timestamp: number;
}

class AvatarImageCache {
  private cache = new Map<string, CachedImage>();
  private readonly MAX_CACHE_SIZE = 50; // Max cached avatars
  private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Preload and cache an avatar image
   */
  async preloadAvatar(url: string | null | undefined): Promise<void> {
    if (!url) return;

    // Check if already cached
    if (this.cache.has(url)) {
      return;
    }

    try {
      // Fetch image
      const response = await fetch(url, {
        cache: 'force-cache', // Use browser cache
        headers: {
          'Cache-Control': 'public, max-age=31536000', // 1 year
        },
      });

      if (!response.ok) return;

      // Convert to blob and cache
      const blob = await response.blob();
      
      // Cleanup old entries if cache is full
      if (this.cache.size >= this.MAX_CACHE_SIZE) {
        this.cleanup();
      }

      this.cache.set(url, {
        url,
        blob,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn('Failed to preload avatar:', url, error);
    }
  }

  /**
   * Get cached avatar blob URL
   */
  getCachedBlobUrl(url: string | null | undefined): string | null {
    if (!url) return null;

    const cached = this.cache.get(url);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(url);
      return null;
    }

    return URL.createObjectURL(cached.blob);
  }

  /**
   * Preload multiple avatars in parallel
   */
  async preloadAvatars(urls: (string | null | undefined)[]): Promise<void> {
    const validUrls = urls.filter((url): url is string => !!url);
    await Promise.all(validUrls.map(url => this.preloadAvatar(url)));
  }

  /**
   * Cleanup expired and old entries
   */
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    // Remove expired entries
    entries.forEach(([url, entry]) => {
      if (now - entry.timestamp > this.CACHE_TTL) {
        URL.revokeObjectURL(URL.createObjectURL(entry.blob));
        this.cache.delete(url);
      }
    });

    // If still full, remove oldest entries
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const sortedEntries = entries
        .filter(([url]) => this.cache.has(url))
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = sortedEntries.slice(0, this.cache.size - this.MAX_CACHE_SIZE + 1);
      toRemove.forEach(([url, entry]) => {
        URL.revokeObjectURL(URL.createObjectURL(entry.blob));
        this.cache.delete(url);
      });
    }
  }

  /**
   * Clear all cached avatars
   */
  clear(): void {
    this.cache.forEach((entry) => {
      URL.revokeObjectURL(URL.createObjectURL(entry.blob));
    });
    this.cache.clear();
  }
}

// Global instance
export const avatarCache = new AvatarImageCache();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    avatarCache.clear();
  });
}
