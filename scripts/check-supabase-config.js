#!/usr/bin/env node

/**
 * Check Supabase Configuration
 * Compares local and production Supabase URLs to identify mismatches
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Supabase Configuration...\n');

// Check local .env.local
const envLocalPath = path.join(__dirname, '..', '.env.local');
let localUrl = null;
let localKeyExists = false;

if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
  
  if (urlMatch) {
    localUrl = urlMatch[1].trim();
    // Extract project ID from URL
    const projectId = localUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    console.log('✅ LOCAL (.env.local):');
    console.log(`   Project ID: ${projectId || 'UNKNOWN'}`);
    console.log(`   URL: ${localUrl.substring(0, 30)}...`);
  }
  
  if (keyMatch) {
    localKeyExists = true;
    console.log(`   Anon Key: ${keyMatch[1].substring(0, 20)}...`);
  }
} else {
  console.log('❌ LOCAL: No .env.local file found');
}

console.log('\n📋 PRODUCTION CHECK:');
console.log('   To check production environment variables:');
console.log('   1. Go to your deployment platform (Vercel/Netlify/etc.)');
console.log('   2. Navigate to Project Settings > Environment Variables');
console.log('   3. Check NEXT_PUBLIC_SUPABASE_URL value');
console.log('   4. Compare the project ID with local above\n');

console.log('🔧 VERIFICATION STEPS:');
console.log('   1. Ensure both use the SAME Supabase project');
console.log('   2. Check RLS policies are identical in both environments');
console.log('   3. Verify database migrations have been run in production');
console.log('   4. Check team.is_official_team flags match between environments\n');

console.log('💡 TIP: If URLs differ, that explains the discrepancy!');
console.log('   Local and production MUST use the same Supabase project for consistency.');

