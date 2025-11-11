/**
 * Optimized Avatar Component
 * Facebook-like avatar loading with progressive enhancement, blur placeholders, and caching
 */

'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import Image from 'next/image';
import { cn } from './utils';
import { avatarCache } from '@/lib/utils/avatarCache';

interface OptimizedAvatarProps extends React.ComponentProps<typeof AvatarPrimitive.Root> {
  src?: string | null;
  alt?: string;
  fallback?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  priority?: boolean; // Load with priority (above-the-fold)
}

interface OptimizedAvatarImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const sizeMap = {
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-16',
  xl: 'size-32',
};

/**
 * Optimized Avatar Root Component
 */
export function OptimizedAvatar({
  className,
  src,
  alt = 'Avatar',
  fallback,
  size = 'md',
  priority = false,
  ...props
}: OptimizedAvatarProps) {
  const [imageStatus, setImageStatus] = React.useState<'loading' | 'loaded' | 'error'>('loading');
  const [blurDataUrl, setBlurDataUrl] = React.useState<string | null>(null);

  // Preload avatar on mount if priority
  React.useEffect(() => {
    if (priority && src) {
      avatarCache.preloadAvatar(src);
    }
  }, [priority, src]);

  // Generate blur placeholder and check cache
  React.useEffect(() => {
    if (!src) {
      setImageStatus('error');
      return;
    }

    // Try to get cached blob URL for instant display
    const cachedBlobUrl = avatarCache.getCachedBlobUrl(src);
    if (cachedBlobUrl) {
      setBlurDataUrl(cachedBlobUrl);
      setImageStatus('loading'); // Still loading, but have cached version
      return;
    }

    // Generate simple gradient blur placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Create a subtle gradient placeholder
      const gradient = ctx.createLinearGradient(0, 0, 40, 40);
      gradient.addColorStop(0, '#e5e7eb');
      gradient.addColorStop(1, '#d1d5db');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 40, 40);
      setBlurDataUrl(canvas.toDataURL());
    }

    setImageStatus('loading');
  }, [src]);

  const handleLoad = () => {
    setImageStatus('loaded');
  };

  const handleError = () => {
    setImageStatus('error');
  };

  return (
    <AvatarPrimitive.Root
      data-slot="optimized-avatar"
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-lg',
        sizeMap[size],
        className,
      )}
      {...props}
    >
      {/* Blur placeholder - shows immediately */}
      {blurDataUrl && imageStatus === 'loading' && (
        <div
          className="absolute inset-0 bg-cover bg-center blur-sm scale-110"
          style={{
            backgroundImage: `url(${blurDataUrl})`,
            filter: 'blur(10px)',
          }}
        />
      )}

      {/* Main avatar image */}
      {src && imageStatus !== 'error' && (
        <OptimizedAvatarImage
          src={src}
          alt={alt}
          priority={priority}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'aspect-square size-full transition-opacity duration-300',
            imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}

      {/* Fallback */}
      <AvatarPrimitive.Fallback
        data-slot="avatar-fallback"
        className={cn(
          'bg-muted flex size-full items-center justify-center rounded-lg',
          imageStatus === 'error' ? 'opacity-100' : 'opacity-0',
        )}
      >
        {fallback}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

/**
 * Optimized Avatar Image Component
 * Uses optimized loading with proper caching and fallbacks
 */
function OptimizedAvatarImage({
  src,
  alt,
  className,
  priority,
  onLoad,
  onError,
}: OptimizedAvatarImageProps) {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const [useNextImage, setUseNextImage] = React.useState(false);

  React.useEffect(() => {
    if (!src) {
      setImageSrc(null);
      return;
    }

    // Check if URL is from Supabase storage (can use Next.js Image)
    const isSupabaseUrl = src.includes('supabase.co') || src.includes('supabase.storage');
    setUseNextImage(isSupabaseUrl);
    setImageSrc(src);
  }, [src]);

  if (!imageSrc) return null;

  // Use Next.js Image for Supabase storage URLs (better optimization)
  if (useNextImage) {
    try {
      return (
        <Image
          src={imageSrc}
          alt={alt || 'Avatar'}
          fill
          className={className}
          sizes="(max-width: 768px) 40px, 80px"
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={onLoad}
          onError={() => {
            setUseNextImage(false);
            onError?.();
          }}
          style={{ objectFit: 'cover' }}
          unoptimized={false}
        />
      );
    } catch (error) {
      // Fallback to regular img if Next.js Image fails
      setUseNextImage(false);
    }
  }

  // Fallback to regular img tag for external URLs or if Next.js Image fails
  return (
    <img
      src={imageSrc}
      alt={alt || 'Avatar'}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={onLoad}
      onError={onError}
    />
  );
}

export { OptimizedAvatarImage };
