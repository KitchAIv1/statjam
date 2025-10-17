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
  if (typeof window !== 'undefined') {
    const accessToken = localStorage.getItem('sb-access-token');
    const refreshToken = localStorage.getItem('sb-refresh-token');
    const userStr = localStorage.getItem('sb-user');
    
    if (accessToken && refreshToken && userStr) {
      const user = JSON.parse(userStr);
      console.log('🔐 Syncing authServiceV2 session to Supabase client...');
      
      // Set the session manually
      client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      }).then(() => {
        console.log('✅ Supabase client session synced with authServiceV2');
      }).catch((err) => {
        console.warn('⚠️ Failed to sync session:', err);
      });
    }
  }
  
  console.log('✅ Enterprise Supabase Client created successfully');
  
  return client;
};

export const supabase = createSupabaseClient();

// ✅ OLD AUTH FUNCTIONS REMOVED
// All authentication now handled by authServiceV2.ts and useAuthV2.ts
// This file only exports the Supabase client for data operations and real-time subscriptions