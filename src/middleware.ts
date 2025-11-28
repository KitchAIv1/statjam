/**
 * Next.js Middleware - API Protection & Rate Limiting
 * 
 * FEATURES:
 * 1. Rate limiting - Prevents API abuse (100 requests/minute per IP)
 * 2. Auth protection - Specific API routes require valid JWT
 * 
 * NOTE: Page routes use client-side auth (localStorage tokens).
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

// Rate limit: requests per window
const RATE_LIMIT = {
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 100,     // 100 requests per minute per IP
};

// API routes that require authentication
const PROTECTED_API_ROUTES = [
  '/api/feedback',
];

// API routes exempt from rate limiting (health checks, etc.)
const RATE_LIMIT_EXEMPT = [
  '/api/health',
];

// ═══════════════════════════════════════════════════════════════
// RATE LIMITER (In-Memory, Edge-Compatible)
// ═══════════════════════════════════════════════════════════════

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Clean up expired entries periodically (every 100th request)
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!record || record.resetTime < now) {
    // New window
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return false;
  }

  // Increment count
  record.count++;
  
  if (record.count > RATE_LIMIT.maxRequests) {
    return true;
  }

  return false;
}

// ═══════════════════════════════════════════════════════════════
// AUTH HELPERS
// ═══════════════════════════════════════════════════════════════

function getTokenFromRequest(request: NextRequest): boolean {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.slice(7);
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      return false;
    }

    // Decode and check expiration
    const payload = JSON.parse(atob(parts[1]));
    
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get client IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || request.headers.get('x-real-ip') 
    || 'unknown';

  // ─────────────────────────────────────────────────────────────
  // 1. Rate Limiting (all API routes except exempt)
  // ─────────────────────────────────────────────────────────────
  const isExempt = RATE_LIMIT_EXEMPT.some(route => pathname.startsWith(route));
  
  if (!isExempt && isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(RATE_LIMIT.maxRequests),
        }
      }
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Auth Protection (specific routes only)
  // ─────────────────────────────────────────────────────────────
  const isProtectedApi = PROTECTED_API_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isProtectedApi && !getTokenFromRequest(request)) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

// Only run on API routes
export const config = {
  matcher: '/api/:path*',
};
