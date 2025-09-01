import { supabase } from './supabase';

/**
 * Safe Supabase client that throws meaningful errors when client is not available
 * This handles the case where environment variables are missing during build
 */
export function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase client is not initialized. Please check your environment variables.');
  }
  return supabase;
}

/**
 * Type-safe wrapper that ensures supabase is not null
 * Use this in all service files instead of importing supabase directly
 */
export const safeSupabase = () => getSupabaseClient();
