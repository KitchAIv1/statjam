import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xhunnsczqjwfrwgjetff.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhodW5uc2N6cWp3ZnJ3Z2pldGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNDk4MTQsImV4cCI6MjA2OTgyNTgxNH0.5-1h0PHnsw_CkBNMRrfjpgkisD30uz-XdnPZxJ3aRZQ';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

// Auth helper functions
export const signUp = async (email: string, password: string, userData?: any) => {
  try {
    console.log('🔍 DEBUG - Signup userData:', userData);
    console.log('🔍 DEBUG - userType being set:', userData?.userType);
    
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

    console.log('Supabase signup successful:', { 
      user: data.user?.id, 
      role: data.user?.user_metadata?.role 
    });

    return { data, error: null };
  } catch (error) {
    console.error('Signup error:', error);
    return { data: null, error };
  }
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};