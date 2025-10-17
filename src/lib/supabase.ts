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

// ✅ OLD AUTH FUNCTIONS REMOVED
// All authentication now handled by authServiceV2.ts and useAuthV2.ts
// This file only exports the Supabase client for data operations and real-time subscriptions