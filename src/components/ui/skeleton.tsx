/**
 * Reusable Skeleton Loading Component
 * Provides elegant loading states across the app
 */

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className = '', variant = 'default' }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]';
  
  const variantClasses = {
    default: 'rounded-md',
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none'
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{
        animation: 'shimmer 2s infinite'
      }}
    />
  );
}

// Pre-built skeleton patterns for common use cases
export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          variant="text" 
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-6 space-y-4 ${className}`}>
      <Skeleton className="h-6 w-1/3" />
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonStat({ className = '', size = 'default' }: { className?: string; size?: 'default' | 'large' | 'small' }) {
  const sizes = {
    large: { number: 'h-10 w-12', label: 'h-4 w-16' },      // For text-3xl stats (hero section)
    default: { number: 'h-6 w-10', label: 'h-4 w-20' },     // For text-xl stats
    small: { number: 'h-6 w-12', label: 'h-4 w-16' }        // For text-lg stats (career highs)
  };
  
  return (
    <div className={`space-y-2 ${className}`}>
      <Skeleton className={sizes[size].number} />
      <Skeleton className={sizes[size].label} />
    </div>
  );
}
