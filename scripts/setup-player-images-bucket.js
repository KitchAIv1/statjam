/**
 * Setup Script: Player Images Storage Bucket
 * 
 * Creates the player-images storage bucket in Supabase with proper policies.
 * Run this script with service role key access.
 * 
 * Usage:
 *   node scripts/setup-player-images-bucket.js
 * 
 * Environment Variables Required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// BUCKET CREATION
// ============================================================================

async function createPlayerImagesBucket() {
  try {
    console.log('🚀 Creating player-images storage bucket...\n');
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('player-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 5242880 // 5MB in bytes
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket already exists');
        return true;
      }
      throw error;
    }

    console.log('✅ player-images bucket created successfully');
    console.log('📁 Bucket details:', data);
    console.log('');

    // Test the bucket by listing contents
    const { data: listData, error: listError } = await supabase.storage
      .from('player-images')
      .list('', { limit: 1 });

    if (listError) {
      console.warn('⚠️  Warning: Could not list bucket contents:', listError.message);
    } else {
      console.log('✅ Bucket is accessible and ready for uploads');
    }

    return true;

  } catch (error) {
    console.error('❌ Failed to create bucket:', error.message);
    return false;
  }
}

// ============================================================================
// VERIFICATION
// ============================================================================

async function verifyBucket() {
  try {
    console.log('\n🔍 Verifying bucket configuration...\n');

    // List all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      throw error;
    }

    const playerImagesBucket = buckets.find(b => b.id === 'player-images');

    if (playerImagesBucket) {
      console.log('✅ Bucket found:');
      console.log('   - ID:', playerImagesBucket.id);
      console.log('   - Name:', playerImagesBucket.name);
      console.log('   - Public:', playerImagesBucket.public);
      console.log('   - File Size Limit:', playerImagesBucket.file_size_limit, 'bytes (5MB)');
      console.log('   - Allowed MIME Types:', playerImagesBucket.allowed_mime_types);
      return true;
    } else {
      console.error('❌ player-images bucket not found');
      return false;
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Player Images Storage Bucket Setup');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Step 1: Create bucket
  const created = await createPlayerImagesBucket();
  
  if (!created) {
    console.log('\n❌ Setup failed. Please check the errors above.');
    process.exit(1);
  }

  // Step 2: Verify bucket
  const verified = await verifyBucket();

  if (!verified) {
    console.log('\n❌ Verification failed. Please check the errors above.');
    process.exit(1);
  }

  // Success
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  ✅ Setup Complete!');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('Next steps:');
  console.log('  1. Run the SQL policies script: database/storage/003_player_images_bucket.sql');
  console.log('  2. Test photo upload in the Edit Profile modal');
  console.log('  3. Verify photos appear in Supabase Storage dashboard\n');
}

// Run the script
main();

