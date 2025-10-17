import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 🏢 ENTERPRISE SUPABASE CLIENT CONFIGURATION
// Optimized for Next.js 15 + React 19 + Real-time subscriptions
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, return null to prevent build failures
    if (typeof window === 'undefined') {
      console.warn('⚠️ Supabase environment variables not found during build');
      return null;
    }
    throw new Error('❌ Missing Supabase environment variables');
  }
  
  console.log('🏢 Creating Enterprise Supabase Client...');
  
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // 🔧 ENTERPRISE: Optimize auth for live tracking
      flowType: 'pkce',
      debug: false
    },
    realtime: {
      // 🔧 ENTERPRISE: Optimized real-time configuration
      params: {
        eventsPerSecond: 20 // Increased for live sports
      }
    },
    // 🔧 ENTERPRISE: Global configuration
    global: {
      headers: {
        'X-Client-Info': 'statjam-enterprise-v1',
        'X-Client-Version': '1.0.0'
      }
    },
    // 🔧 ENTERPRISE: Database configuration
    db: {
      schema: 'public'
    }
  });
  
  console.log('✅ Enterprise Supabase Client created successfully');
  
  return client;
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

export const resendConfirmationEmail = async (email: string) => {
  if (!supabase) {
    return { error: new Error('Supabase client not initialized') };
  }
  
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email
  });
  
  return { error };
};