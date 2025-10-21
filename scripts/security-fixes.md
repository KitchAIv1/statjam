# 🔒 StatJam Security Fixes - Quick Implementation Guide

## 🚨 CRITICAL FIX #1: Update Next.js Dependency

**Issue**: Next.js SSRF vulnerability (moderate severity)  
**Time**: 5 minutes  
**Impact**: HIGH

```bash
# Update Next.js to patched version
cd /Users/willis/SJAM.v1/statjam
npm audit fix --force

# Test the application
npm run build
npm run dev

# Verify no breaking changes
# Test auth flow, dashboards, stat tracker
```

---

## 🚨 CRITICAL FIX #2: Add Content Security Policy

**Issue**: Missing CSP headers  
**Time**: 10 minutes  
**Impact**: HIGH

### File: `next.config.ts`

Add CSP to the headers function:

```typescript
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
        // 🆕 ADD THIS - Content Security Policy
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data:",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://images.unsplash.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
          ].join('; ')
        },
        // 🆕 ADD THIS - HSTS (only for production HTTPS)
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload'
        },
        // 🆕 ADD THIS - Permissions Policy
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
        }
      ],
    },
  ];
}
```

---

## ⚠️ HIGH PRIORITY FIX #3: Re-enable TypeScript/ESLint

**Issue**: Build checks disabled  
**Time**: 30-60 minutes  
**Impact**: MEDIUM

### Step 1: Fix TypeScript Errors

```bash
# Check for TypeScript errors
npm run build

# Fix errors one by one
# Common fixes:
# - Add proper types to function parameters
# - Fix any/unknown types
# - Add return types to functions
```

### Step 2: Fix ESLint Violations

```bash
# Run ESLint
npm run lint

# Auto-fix what can be fixed
npm run lint -- --fix

# Manually fix remaining issues
```

### Step 3: Update next.config.ts

```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // ✅ RE-ENABLE THESE (after fixing errors)
  eslint: {
    ignoreDuringBuilds: false, // 🆕 Changed from true
  },
  
  typescript: {
    ignoreBuildErrors: false, // 🆕 Changed from true
  },
  
  // ... rest of config
};
```

---

## ⚠️ HIGH PRIORITY FIX #4: Create .env.example

**Issue**: Missing environment variable documentation  
**Time**: 5 minutes  
**Impact**: LOW (but important for deployment)

### File: `.env.example`

Create this file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Development/Production flags
NODE_ENV=development

# Optional: Analytics, Error Tracking, etc.
# NEXT_PUBLIC_ANALYTICS_ID=
```

---

##  MEDIUM PRIORITY FIX #5: Add Rate Limiting

**Issue**: No rate limiting on auth endpoints  
**Time**: 30 minutes  
**Impact**: MEDIUM

### Create: `src/lib/utils/rateLimit.ts`

```typescript
interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  isRateLimited(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Get existing attempts for this key
    let keyAttempts = this.attempts.get(key) || [];
    
    // Filter out attempts outside the window
    keyAttempts = keyAttempts.filter(timestamp => timestamp > windowStart);
    
    // Check if rate limit exceeded
    if (keyAttempts.length >= config.maxAttempts) {
      return true; // Rate limited
    }
    
    // Add new attempt
    keyAttempts.push(now);
    this.attempts.set(key, keyAttempts);
    
    return false; // Not rate limited
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const authRateLimiter = new RateLimiter();

// Usage example:
export const AUTH_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000 // 15 minutes
};
```

### Update: `src/hooks/useAuthFlow.ts`

```typescript
import { authRateLimiter, AUTH_RATE_LIMIT } from '@/lib/utils/rateLimit';

const handleSignIn = async () => {
  const email = formData.email.toLowerCase().trim();
  
  // 🆕 ADD RATE LIMITING
  if (authRateLimiter.isRateLimited(email, AUTH_RATE_LIMIT)) {
    setError('Too many login attempts. Please try again in 15 minutes.');
    return;
  }
  
  // ... existing sign-in logic
};
```

---

## 📝 MEDIUM PRIORITY FIX #6: Extend XSS Protection

**Issue**: DOMPurify only used for error messages  
**Time**: 20 minutes  
**Impact**: MEDIUM

### Create: `src/lib/utils/sanitize.ts`

```typescript
import DOMPurify from 'dompurify';

export const sanitizeUserContent = (content: string): string => {
  // Allow only safe HTML tags
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target']
  });
};

export const sanitizeText = (text: string): string => {
  // Strip all HTML
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

export const sanitizeName = (name: string): string => {
  // Allow only alphanumeric, spaces, hyphens, apostrophes
  return name.replace(/[^a-zA-Z0-9\s\-']/g, '').trim();
};
```

### Usage:

```typescript
// In player profile, tournament names, etc.
import { sanitizeText, sanitizeName } from '@/lib/utils/sanitize';

const safeName = sanitizeName(playerName);
const safeDescription = sanitizeText(description);
```

---

## 🧪 Testing Checklist After Fixes

- [ ] Run `npm run build` successfully
- [ ] Test authentication flow (sign in, sign up, sign out)
- [ ] Test organizer dashboard
- [ ] Test player dashboard
- [ ] Test stat tracker
- [ ] Test live viewer
- [ ] Verify security headers in browser DevTools (Network tab)
- [ ] Test on mobile devices
- [ ] Check console for any errors
- [ ] Verify environment variables work

---

## 🚀 Deployment Checklist

- [ ] All critical and high-priority fixes applied
- [ ] Tests passing
- [ ] Security headers verified
- [ ] Environment variables configured in Vercel
- [ ] .env files NOT committed to git
- [ ] npm audit shows no critical/high vulnerabilities
- [ ] CSP tested and not breaking functionality
- [ ] Rate limiting tested and working

---

## 📞 Need Help?

If any fix causes issues:
1. Check the error message carefully
2. Review the changes made
3. Test in development first
4. Roll back if necessary using git

## Priority Order

1. **Fix Next.js vulnerability** (5 min) 🚨
2. **Add CSP headers** (10 min) 🚨
3. **Create .env.example** (5 min) ⚠️
4. **Add rate limiting** (30 min) ⚠️
5. **Extend XSS protection** (20 min) 📝
6. **Re-enable TypeScript/ESLint** (60 min) ⚠️

**Total Time**: ~2 hours for all fixes

---

**Last Updated**: October 21, 2025

