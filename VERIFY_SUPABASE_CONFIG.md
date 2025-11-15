# Verify Supabase Configuration - Local vs Production

## 🔍 Quick Check Results

**Local Development:**
- Project ID: `xhunnsczqjwfrwgjetff`
- URL: `https://xhunnsczqjwfrwgjetff.supabase.co`

## 📋 Production Check Steps

### Option 1: Check via Browser Console (Easiest)

1. Open your production site
2. Open browser console (F12)
3. Run this command:
```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not available in browser');
```

**Note:** `NEXT_PUBLIC_*` vars are embedded at build time, so you might need Option 2.

### Option 2: Check Deployment Platform

**If using Vercel:**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Check `NEXT_PUBLIC_SUPABASE_URL` value
5. Extract project ID from URL (format: `https://[PROJECT_ID].supabase.co`)

**If using Netlify:**
1. Go to https://app.netlify.com
2. Select your site
3. Go to Site settings → Environment variables
4. Check `NEXT_PUBLIC_SUPABASE_URL` value

**If using other platform:**
- Check your deployment platform's environment variables settings
- Look for `NEXT_PUBLIC_SUPABASE_URL`

### Option 3: Use Debug API Endpoint

1. Temporarily enable debug mode in production:
   - Add `NEXT_PUBLIC_DEBUG=true` to production environment variables
2. Visit: `https://your-production-site.com/api/debug/supabase-config`
3. Compare the `projectId` with local: `xhunnsczqjwfrwgjetff`
4. **Remove debug flag after checking** (security)

## ✅ Expected Result

**Both should show:**
- Project ID: `xhunnsczqjwfrwgjetff`
- Same Supabase project = Same database = Same RLS = Same data

## 🔧 If They Don't Match

**Problem:** Different Supabase projects = Different databases = Different behavior

**Solution:**
1. Update production environment variables to match local
2. Or update local to match production (if production is correct)
3. Redeploy production after updating env vars
4. Clear production cache if applicable

## 🎯 Why This Matters

- **Same Project** = Same database, same RLS policies, same data → Consistent behavior
- **Different Projects** = Different databases, different RLS, different data → Inconsistent behavior (your current issue)

## 📊 Current Issue Analysis

Based on your SQL results:
- **Local:** Shows 16 games (likely bypassing RLS or different RLS config)
- **Production:** Shows 2 games (RLS filtering out coach games from practice teams)

**Root Cause:** Either:
1. Different Supabase projects (most likely)
2. Different RLS policies between projects
3. Different `is_official_team` flags in databases

**Fix:** Ensure both use the same Supabase project and same RLS policies.

