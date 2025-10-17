/**
 * Script to create the card-assets storage bucket
 * This should be run by an admin user or through the Supabase dashboard
 */

import { createClient } from '@supabase/supabase-js';

// You'll need to set these environment variables or replace with your values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key needed for bucket creation

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createCardAssetsBucket() {
  try {
    console.log('🚀 Creating card-assets storage bucket...');
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('card-assets', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 10485760 // 10MB
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket already exists');
        return;
      }
      throw error;
    }

    console.log('✅ Card-assets bucket created successfully');
    console.log('📁 Bucket details:', data);

    // Test the bucket by listing contents
    const { data: listData, error: listError } = await supabase.storage
      .from('card-assets')
      .list('', { limit: 1 });

    if (listError) {
      console.warn('⚠️ Warning: Could not list bucket contents:', listError.message);
    } else {
      console.log('✅ Bucket is accessible and ready for uploads');
    }

  } catch (error) {
    console.error('❌ Failed to create bucket:', error.message);
    process.exit(1);
  }
}

// Run the script
createCardAssetsBucket();
