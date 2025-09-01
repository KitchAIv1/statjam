import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a safe client that handles missing env vars gracefully during build
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, return a mock client to prevent build failures
    if (typeof window === 'undefined') {
      console.warn('Supabase environment variables not found during build');
      return null;
    }
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
};

export const supabase = createSupabaseClient();

// Auth helper functions
export const signUp = async (email: string, password: string, userData?: any) => {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    // Direct Supabase Auth signup with user metadata
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: userData?.userType || 'player',
          country: userData?.country || 'US',
          firstName: userData?.firstName || '',
          lastName: userData?.lastName || '',
        }
      }
    });

    if (error) {
      console.error('Supabase signup error:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Signup error:', error);
    return { data: null, error };
  }
};

export const signIn = async (email: string, password: string) => {
  if (!supabase) {
    return { data: null, error: new Error('Supabase client not initialized') };
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
};

export const signOut = async () => {
  if (!supabase) {
    return { error: new Error('Supabase client not initialized') };
  }
  
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  if (!supabase) {
    return { user: null, error: new Error('Supabase client not initialized') };
  }
  
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};