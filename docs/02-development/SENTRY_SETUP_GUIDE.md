# Sentry Setup Guide

## ✅ Quick Setup Steps

### 1. Select Platform in Sentry Dashboard

When Sentry asks you to "Select the platform you want to monitor", choose:
- **Next.js** (this is your platform)

### 2. Get Your Sentry DSN

After creating your project, Sentry will show you a DSN (Data Source Name) that looks like:
```
https://abc123@o123456.ingest.sentry.io/123456
```

### 3. Add Environment Variables

Add these to your `.env.local` file:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-auth-token  # Optional: for source map uploads
```

**Where to find these values:**
- **NEXT_PUBLIC_SENTRY_DSN**: Project Settings → Client Keys (DSN)
- **SENTRY_ORG**: Organization Settings → Organization Slug
- **SENTRY_PROJECT**: Project Settings → Project Slug
- **SENTRY_AUTH_TOKEN**: User Settings → Auth Tokens (create one with `project:releases` scope)

### 4. Test Sentry Integration

1. **Start your dev server**:
   ```bash
   npm run dev
   ```

2. **Trigger a test error** (Sentry will show you how in the dashboard)

3. **Check Sentry dashboard** - you should see the error appear

## 📁 Files Created

The following files were created for Sentry integration:

- `sentry.client.config.ts` - Client-side Sentry configuration
- `sentry.server.config.ts` - Server-side Sentry configuration
- `sentry.edge.config.ts` - Edge runtime Sentry configuration
- `instrumentation.ts` - Next.js instrumentation hook
- `src/lib/services/errorLoggingService.ts` - Updated to use Sentry

## 🔧 Configuration Details

### Error Logging Service

The `errorLoggingService` automatically sends errors to Sentry in production:

```typescript
import { errorLoggingService } from '@/lib/services/errorLoggingService';

// Log an error with context
errorLoggingService.logError(error, {
  userId: 'user-123',
  gameId: 'game-456',
  action: 'record_stat',
  metadata: { statType: 'foul' }
});
```

### Already Integrated

Sentry is already integrated into:
- ✅ `ErrorBoundary.tsx` - React error boundaries
- ✅ `useTracker.ts` - Stat recording errors
- ✅ `statWriteQueueService.ts` - Queue processing errors

## 🚀 Production Deployment

### Vercel Deployment

1. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`
   - `SENTRY_AUTH_TOKEN` (optional, for source maps)

2. Deploy - Sentry will automatically upload source maps during build

### Source Maps

Source maps are automatically uploaded during build if `SENTRY_AUTH_TOKEN` is set. This gives you readable stack traces in production.

## 📊 What Gets Logged

Sentry will automatically capture:
- ✅ Unhandled errors (React error boundaries)
- ✅ Stat recording failures
- ✅ Database write failures
- ✅ Network errors
- ✅ All errors logged via `errorLoggingService`

## 🔒 Privacy & Security

- **No PII**: User IDs are hashed/anonymized
- **Development**: Errors are NOT sent in development mode
- **Production Only**: Sentry only activates when `NODE_ENV=production` and DSN is set

## 🐛 Troubleshooting

### Errors not appearing in Sentry?

1. **Check DSN**: Make sure `NEXT_PUBLIC_SENTRY_DSN` is set correctly
2. **Check Environment**: Sentry only works in production (`NODE_ENV=production`)
3. **Check Console**: Look for Sentry initialization errors
4. **Check CSP**: Make sure Sentry domains are allowed in `next.config.ts` (already done)

### Source maps not uploading?

1. **Check Auth Token**: Make sure `SENTRY_AUTH_TOKEN` has `project:releases` scope
2. **Check Build Logs**: Look for Sentry upload messages during build
3. **Manual Upload**: You can upload source maps manually via Sentry CLI

## 📚 Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Dashboard](https://sentry.io)
- [Error Logging Service](../src/lib/services/errorLoggingService.ts)

---

**Status**: ✅ Ready to use - just add your DSN!

