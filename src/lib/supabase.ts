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
      debug: false,
      // 🔧 CRITICAL: Use custom storage to sync with authServiceV2
      storage: typeof window !== 'undefined' ? {
        getItem: (key: string) => {
          // Map authServiceV2 keys to Supabase expected keys
          if (key.includes('auth-token')) {
            const accessToken = localStorage.getItem('sb-access-token');
            const refreshToken = localStorage.getItem('sb-refresh-token');
            const user = localStorage.getItem('sb-user');
            
            if (accessToken && refreshToken && user) {
              // Return session in Supabase format
              return JSON.stringify({
                access_token: accessToken,
                refresh_token: refreshToken,
                user: JSON.parse(user),
                expires_at: Date.now() + 3600000, // 1 hour
                expires_in: 3600,
                token_type: 'bearer'
              });
            }
          }
          return localStorage.getItem(key);
        },
        setItem: (key: string, value: string) => {
          localStorage.setItem(key, value);
        },
        removeItem: (key: string) => {
          localStorage.removeItem(key);
        }
      } : undefined
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
  
  // 🔧 CRITICAL: Manually set session from authServiceV2 tokens on client creation
  // This must happen SYNCHRONOUSLY before returning the client
  if (typeof window !== 'undefined') {
    const accessToken = localStorage.getItem('sb-access-token');
    const refreshToken = localStorage.getItem('sb-refresh-token');
    const userStr = localStorage.getItem('sb-user');
    
    if (accessToken && refreshToken && userStr) {
      console.log('🔐 Syncing authServiceV2 session to Supabase client...');
      
      // ⚠️ CRITICAL: This is async but we need it to complete before queries
      // The Supabase client will queue queries until session is set
      client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      }).then(() => {
        console.log('✅ Supabase client session synced with authServiceV2');
      }).catch((err) => {
        console.error('❌ Failed to sync session:', err);
      });
    } else {
      console.warn('⚠️ No authServiceV2 tokens found in localStorage');
    }
  }
  
  console.log('✅ Enterprise Supabase Client created successfully');
  
  return client;
};

export const supabase = createSupabaseClient();

// 🔧 CRITICAL: Helper to ensure session is synced before queries
let sessionSyncPromise: Promise<void> | null = null;

export const ensureSupabaseSession = async (): Promise<void> => {
  console.log('🔍 ensureSupabaseSession: Starting...');
  
  if (typeof window === 'undefined') {
    console.log('🔍 ensureSupabaseSession: Server-side, skipping');
    return;
  }
  
  if (!supabase) {
    console.warn('⚠️ ensureSupabaseSession: No supabase client');
    return;
  }
  
  // If already syncing, wait for it
  if (sessionSyncPromise) {
    console.log('🔍 ensureSupabaseSession: Already syncing, waiting...');
    return sessionSyncPromise;
  }
  
  // ⚠️ CRITICAL: Skip getSession() check - it hangs with custom storage
  // Just force set the session from localStorage
  console.log('🔍 ensureSupabaseSession: Forcing session sync from localStorage...');
  const accessToken = localStorage.getItem('sb-access-token');
  const refreshToken = localStorage.getItem('sb-refresh-token');
  
  if (!accessToken || !refreshToken) {
    console.warn('⚠️ ensureSupabaseSession: No authServiceV2 tokens found in localStorage');
    return;
  }
  
  console.log('🔐 ensureSupabaseSession: Setting session...');
  
  // Set session with timeout to prevent hanging
  sessionSyncPromise = Promise.race([
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    }),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('setSession timeout')), 5000)
    )
  ]).then(() => {
    console.log('✅ ensureSupabaseSession: Session synced successfully');
    sessionSyncPromise = null;
  }).catch((err) => {
    console.error('❌ ensureSupabaseSession: Failed to sync session:', err);
    sessionSyncPromise = null;
    // Don't throw - let queries try anyway
  });
  
  return sessionSyncPromise;
};

// ✅ OLD AUTH FUNCTIONS REMOVED
// All authentication now handled by authServiceV2.ts and useAuthV2.ts
// This file only exports the Supabase client for data operations and real-time subscriptions