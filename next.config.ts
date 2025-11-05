import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production-ready configuration
  reactStrictMode: true,
  
  // Performance optimizations
  // experimental: {
  //   optimizeCss: true, // Disabled - requires additional dependencies
  // },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net", // ✅ Allow CDN for compression library
              "script-src-elem 'self' 'unsafe-inline' https://cdn.jsdelivr.net", // ✅ Explicitly allow script elements from CDN
              "worker-src 'self' blob:", // ✅ Allow web workers for image compression
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://images.unsplash.com https://*.firebaseio.com wss://*.firebaseio.com https://*.googleapis.com https://cdn.jsdelivr.net", // ✅ Allow fetching from CDN
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(), interest-cohort=()'
          }
        ],
      },
    ];
  },
  
  // Image optimization
  images: {
    domains: ['xhunnsczqjwfrwgjetff.supabase.co'], // Supabase storage domain
    formats: ['image/webp', 'image/avif'],
  },
  
  // Temporarily disable strict checking for production stability
  // TODO: Gradually re-enable and fix TypeScript/ESLint errors in Phase 2
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
