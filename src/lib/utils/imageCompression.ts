/**
 * Image Compression Utility
 * 
 * Compresses images client-side before upload for faster loading.
 * Isolated to team logos - keeps files small without losing quality.
 * 
 * @module imageCompression
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;  // 0-1
  maxSizeKB?: number;
}

const TEAM_LOGO_DEFAULTS: CompressionOptions = {
  maxWidth: 400,
  maxHeight: 400,
  quality: 0.85,
  maxSizeKB: 200,
};

/**
 * Compress an image file for team logo use
 * - Resizes to max 400x400 (plenty for display)
 * - Compresses to ~85% quality
 * - Targets ~200KB max file size
 */
export async function compressTeamLogo(file: File): Promise<File> {
  return compressImage(file, TEAM_LOGO_DEFAULTS);
}

/**
 * Compress an image file for tournament logo use
 * Same settings as team logo
 */
export async function compressTournamentLogo(file: File): Promise<File> {
  return compressImage(file, TEAM_LOGO_DEFAULTS);
}

/**
 * Generic image compression function
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.85,
    maxSizeKB = 500,
  } = options;

  // Skip if already small enough
  if (file.size <= maxSizeKB * 1024) {
    console.log(`✅ Image already small (${(file.size / 1024).toFixed(1)}KB), skipping compression`);
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        // Draw with white background (for transparent PNGs)
        ctx!.fillStyle = '#FFFFFF';
        ctx!.fillRect(0, 0, width, height);
        ctx!.drawImage(img, 0, 0, width, height);

        // Try WebP first (best compression), fallback to JPEG
        const outputType = 'image/webp';
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              // Fallback: return original if compression fails
              console.warn('⚠️ Compression failed, using original');
              resolve(file);
              return;
            }

            // Create new file with compressed data
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, '.webp'),
              { type: outputType }
            );

            const originalKB = (file.size / 1024).toFixed(1);
            const compressedKB = (compressedFile.size / 1024).toFixed(1);
            const savings = ((1 - compressedFile.size / file.size) * 100).toFixed(0);
            
            console.log(`✅ Compressed: ${originalKB}KB → ${compressedKB}KB (${savings}% smaller)`);
            resolve(compressedFile);
          },
          outputType,
          quality
        );
      } catch (error) {
        console.error('❌ Compression error:', error);
        resolve(file); // Fallback to original
      }
    };

    img.onerror = () => {
      console.error('❌ Failed to load image for compression');
      resolve(file); // Fallback to original
    };

    // Load image from file
    img.src = URL.createObjectURL(file);
  });
}

