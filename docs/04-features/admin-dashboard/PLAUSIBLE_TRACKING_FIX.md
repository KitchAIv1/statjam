# Plausible Analytics Tracking Fix

**Date**: November 6, 2025  
**Status**: ✅ Fixed - Tracking Script Installed

## Problem

Plausible Analytics dashboard was showing no site visitors despite having:
- ✅ Embedded Plausible iframe in admin dashboard
- ✅ CSP configured to allow Plausible
- ✅ Custom event tracking code on homepage

**Root Cause**: The actual **tracking script** was never installed in the site's `<head>` section.

---

## What Was Fixed

### 1. Added Plausible Tracking Script to Root Layout

**File**: `src/app/layout.tsx`

Added the Plausible tracking script using Next.js `Script` component:

```typescript
import Script from 'next/script'

// In the <body> section:
<Script
  src="https://plausible.io/js/pa-NNW082sSo-ye6M6LkIgUu.js"
  strategy="afterInteractive"
  async
/>
<Script
  id="plausible-init"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      window.plausible = window.plausible || function() { (plausible.q = plausible.q || []).push(arguments) };
      plausible.init = plausible.init || function(i) { plausible.o = i || {} };
      plausible.init();
    `,
  }}
/>
```

### 2. Added Performance Optimization

Added preconnect and dns-prefetch hints for faster script loading:

```html
<link rel="preconnect" href="https://plausible.io" />
<link rel="dns-prefetch" href="https://plausible.io" />
```

---

## Key Points

### What the Script Does

1. **Tracks Page Views**: Automatically tracks all page views across your site
2. **Custom Events**: Enables the custom event tracking already implemented in your code
3. **Privacy-Friendly**: The custom proxy path `pa-NNW082sSo-ye6M6LkIgUu.js` helps bypass ad blockers

### Embedded vs Tracking

- **Embedded iframe** (`/admin/dashboard`): **DISPLAYS** analytics data
- **Tracking script** (now installed): **COLLECTS** analytics data

You need BOTH for the system to work:
- ✅ Tracking script collects data
- ✅ Embedded iframe displays data

---

## Verification Steps

### 1. Deploy to Production

```bash
# Build and deploy your changes
npm run build
# Deploy to your hosting platform (Vercel, etc.)
```

### 2. Test the Installation

After deploying:

1. **Visit your live site** (https://www.statjam.net)
2. **Open Plausible dashboard** (https://plausible.io/statjam.net)
3. **Check for real-time visitors**
   - Should show within 30 seconds
   - Look for your own visit

### 3. Verify Script Loading

**Option A: Use Plausible's Verification Tool**
1. Go to Plausible dashboard
2. Click "Settings" → "General"
3. Use the "Verify installation" button

**Option B: Manual Browser Check**
1. Open your site in a browser
2. Open Developer Tools (F12)
3. Go to "Network" tab
4. Filter by "plausible"
5. You should see requests to:
   - `pa-NNW082sSo-ye6M6LkIgUu.js` (200 status)
   - `api/event` requests (202 status)

**Option C: Console Check**
1. Open Developer Tools (F12)
2. Go to "Console" tab
3. Type: `window.plausible`
4. Should see: `ƒ plausible() { ... }` (not undefined)

---

## Custom Events Already Implemented

Your site already has custom event tracking for:

### Homepage Events
- `carousel_view` - Carousel section viewed
- `carousel_slide_change` - User changes carousel slide
- `section_view` - Feature section viewed
- `cta_click` - Call-to-action button clicked

These will now start working properly with the tracking script installed.

---

## Expected Results

### Immediate (within 1 hour)
- Real-time visitors showing in Plausible dashboard
- Page view counts incrementing
- Custom events being tracked

### After 24 hours
- Accurate visitor metrics
- Page view trends
- Custom event analytics
- Geographic data
- Device/browser breakdown

---

## CSP Configuration

Already correctly configured in `next.config.ts`:

```typescript
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://plausible.io",
"script-src-elem 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://plausible.io",
"connect-src 'self' ... https://plausible.io",
"frame-src 'self' https://plausible.io"
```

No changes needed here - it's all set up correctly.

---

## Troubleshooting

### Still No Visitors After Deployment?

1. **Check script loading**:
   ```javascript
   // In browser console:
   console.log(window.plausible); // Should not be undefined
   ```

2. **Verify domain match**:
   - Plausible tracks based on domain
   - Make sure "statjam.net" matches in Plausible settings
   - Check if you need to add "www.statjam.net" as an alias

3. **Ad blockers**:
   - Even with proxy, some blockers may interfere
   - Test in incognito mode
   - Test with ad blocker disabled

4. **Local testing won't work**:
   - Plausible doesn't track `localhost`
   - Must test on production domain

5. **Check Plausible status**:
   - Visit https://status.plausible.io
   - Ensure service is operational

### Common Issues

**"Script not loading"**
- Check browser console for errors
- Verify CSP isn't blocking (should be configured correctly)
- Check network tab for 404s

**"Events not showing"**
- Wait 30-60 seconds for real-time updates
- Verify `window.plausible` exists
- Check custom event syntax

**"Only some pages tracking"**
- Ensure it's a Next.js client-side navigation issue
- The script in root layout should cover all pages

---

## Optional: Enable Additional Features

In your Plausible dashboard settings, you can enable:

### Recommended
- ✅ **Outbound links**: Track external link clicks
- ✅ **File downloads**: Track PDF/file downloads
- ✅ **404 error pages**: Track broken links

### Advanced
- **Revenue/Goals**: Set up conversion tracking
- **Funnels**: Track user journey
- **Custom properties**: Enhanced event data

---

## Files Modified

1. ✅ `src/app/layout.tsx` - Added tracking script and preconnect hints
2. ✅ `next.config.ts` - Already configured (no changes needed)
3. ✅ `src/app/admin/dashboard/page.tsx` - Already has embedded viewer

---

## Success Criteria

- [ ] Script loads successfully on all pages
- [ ] Plausible dashboard shows real-time visitors
- [ ] Page views are being tracked
- [ ] Custom events are being captured
- [ ] Admin dashboard embedded viewer works
- [ ] No console errors related to Plausible

---

## Next Steps

1. **Deploy to production** (if not already deployed)
2. **Verify installation** using steps above
3. **Monitor for 24 hours** to see full analytics
4. **Check custom events** are firing correctly
5. **Optional**: Enable additional tracking features

---

## Notes

- **Privacy-Compliant**: Plausible is GDPR/CCPA compliant by default
- **No Cookie Banner Needed**: Plausible doesn't use cookies
- **Lightweight**: Script is only ~1KB
- **Ad-Blocker Resistant**: Custom proxy path helps bypass blockers

---

## Contact Support

If issues persist after verification:

1. **Plausible Support**: support@plausible.io
2. **Documentation**: https://plausible.io/docs
3. **Community**: https://github.com/plausible/analytics/discussions





