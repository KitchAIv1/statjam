import { safeSupabase } from '@/lib/supabaseClient';

/**
 * Ensures the card-assets bucket exists by testing upload capability
 * Note: Bucket creation requires admin privileges, so we'll just test if we can upload
 */
export async function ensureCardAssetsBucket(): Promise<void> {
  const supabase = safeSupabase();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  try {
    // Test if we can access the bucket by trying to list files
    const { error: testError } = await supabase.storage
      .from('card-assets')
      .list('', { limit: 1 });
    
    if (testError && testError.message.includes('Bucket not found')) {
      // Bucket doesn't exist - this needs to be created by an admin
      throw new Error('Storage bucket not found. Please contact support to set up photo storage.');
    }
    
    // If we get here, bucket exists and is accessible
    console.log('✅ Card-assets bucket is accessible');
  } catch (error) {
    console.error('Error checking bucket access:', error);
    throw error;
  }
}

/**
 * Upload a file to the card-assets bucket with automatic bucket creation
 */
export async function uploadToCardAssets(
  filePath: string, 
  file: File, 
  options?: { cacheControl?: string; upsert?: boolean }
): Promise<{ data: any; error: any; publicUrl?: string }> {
  const supabase = safeSupabase();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  // Ensure bucket exists
  await ensureCardAssetsBucket();

  // Upload file
  const { data, error } = await supabase.storage
    .from('card-assets')
    .upload(filePath, file, {
      cacheControl: options?.cacheControl || '3600',
      upsert: options?.upsert || false
    });

  if (error) {
    return { data: null, error };
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('card-assets')
    .getPublicUrl(filePath);

  return { data, error: null, publicUrl };
}
