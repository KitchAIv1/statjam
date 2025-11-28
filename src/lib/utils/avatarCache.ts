/**
 * Avatar Cache Utility
 * 
 * Preloads and caches player avatar images for faster display.
 * Uses browser's Image API to prefetch images.
 */

class AvatarCache {
  private cache = new Map<string, boolean>();

  /**
   * Preload a list of avatar URLs
   */
  async preloadAvatars(urls: string[]): Promise<void> {
    const uncachedUrls = urls.filter(url => url && !this.cache.has(url));
    
    await Promise.all(
      uncachedUrls.map(url => this.preloadSingle(url))
    );
  }

  /**
   * Preload a single avatar image
   */
  private preloadSingle(url: string): Promise<void> {
    return new Promise((resolve) => {
      if (!url || this.cache.has(url)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        this.cache.set(url, true);
        resolve();
      };
      img.onerror = () => {
        // Don't cache failed loads
        resolve();
      };
      img.src = url;
    });
  }

  /**
   * Check if an avatar is cached
   */
  isCached(url: string): boolean {
    return this.cache.has(url);
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
  }
}

export const avatarCache = new AvatarCache();

