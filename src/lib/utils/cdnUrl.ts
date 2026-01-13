/**
 * CDN URL Helper
 * 
 * Routes Supabase Storage images through Bunny.net CDN for faster loading
 * Images stay in Supabase - Bunny.net acts as a caching proxy
 * 
 * @module cdnUrl
 */

const SUPABASE_STORAGE_DOMAIN = 'xhunnsczqjwfrwgjetff.supabase.co';
const BUNNY_CDN_DOMAIN = 'statjam-images.b-cdn.net';

/**
 * Convert Supabase Storage URL to Bunny.net CDN URL
 * Falls back to original URL if not a Supabase storage URL
 */
export function getCdnUrl(supabaseUrl: string | null | undefined): string | null {
  if (!supabaseUrl) return null;
  
  // Only transform Supabase storage URLs
  if (!supabaseUrl.includes(SUPABASE_STORAGE_DOMAIN)) {
    return supabaseUrl;
  }
  
  // Replace Supabase domain with Bunny CDN domain
  return supabaseUrl.replace(SUPABASE_STORAGE_DOMAIN, BUNNY_CDN_DOMAIN);
}

/**
 * Get CDN URL for team logo
 * Convenience wrapper with type safety
 */
export function getTeamLogoCdn(logoUrl: string | null | undefined): string | null {
  return getCdnUrl(logoUrl);
}

/**
 * Get CDN URL for player photo
 * Convenience wrapper with type safety
 */
export function getPlayerPhotoCdn(photoUrl: string | null | undefined): string | null {
  return getCdnUrl(photoUrl);
}

