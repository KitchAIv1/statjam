# Firebase Setup for Live Streaming

This guide will help you set up Firebase Realtime Database for WebRTC signaling in the STATJAM live streaming feature.

## Prerequisites

- A Google account
- Access to Firebase Console

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `statjam-live-streaming` (or your preferred name)
4. Disable Google Analytics (optional for MVP)
5. Click "Create project"

## Step 2: Enable Realtime Database

1. In the Firebase Console, select your project
2. Click "Realtime Database" in the left sidebar (under "Build")
3. Click "Create Database"
4. Choose a database location (select closest to your users)
5. Start in **Test Mode** for MVP (we'll secure it later)
6. Click "Enable"

## Step 3: Configure Security Rules (Test Mode)

For MVP testing, use these permissive rules:

```json
{
  "rules": {
    "rooms": {
      "$gameId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

**⚠️ WARNING**: These rules allow anyone to read/write. For production, you must add authentication.

### Production Security Rules (Phase 2)

```json
{
  "rules": {
    "rooms": {
      "$gameId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

## Step 4: Get Firebase Configuration

1. In Firebase Console, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps"
4. Click the Web icon (`</>`) to add a web app
5. Register app with nickname: "STATJAM Web"
6. Copy the Firebase configuration object

## Step 5: Add Configuration to Environment Variables

Create or update `statjam/.env.local` file:

```bash
# Firebase Configuration for Live Streaming
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

**Replace** `your-*` values with actual values from Firebase Console.

## Step 6: Update env.example

Add these variables to `statjam/env.example`:

```bash
# Firebase Configuration for Live Streaming
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Step 7: Install Dependencies

Run in the `statjam/` directory:

```bash
npm install
```

This will install `firebase` and `simple-peer` packages.

## Step 8: Verify Setup

1. Start the development server: `npm run dev`
2. Navigate to `/dashboard?section=live-stream`
3. Check the browser console for Firebase initialization messages
4. If you see errors, verify your environment variables

## Database Structure

The live streaming feature uses this structure in Firebase Realtime Database:

```
/rooms
  /{gameId}
    /offer: "..."              # WebRTC offer from mobile camera
    /answer: "..."             # WebRTC answer from dashboard
    /candidates
      /mobile: ["...", "..."]  # ICE candidates from mobile
      /dashboard: ["...", "..."] # ICE candidates from dashboard
    /status: "connected"       # Connection status
    /timestamp: 1234567890     # Last update timestamp
```

## Troubleshooting

### Error: "Firebase: No Firebase App '[DEFAULT]' has been created"

**Solution**: Ensure environment variables are set correctly and restart the dev server.

### Error: "Permission denied"

**Solution**: Check Firebase Realtime Database rules. For testing, use Test Mode rules above.

### Database URL not found

**Solution**: Make sure you're using the correct database URL format with `-default-rtdb` in the domain.

### CORS errors

**Solution**: Firebase automatically handles CORS for web apps. Ensure you're accessing from `localhost:3000` or your deployed domain.

## Cost Estimate

Firebase Realtime Database Free Tier (Spark Plan):
- 1 GB stored
- 10 GB/month downloaded
- 100 simultaneous connections

For a basketball tournament with 10 concurrent games streaming:
- **Estimated usage**: ~5-10 MB/hour per stream for signaling only
- **Monthly cost**: $0 (well within free tier limits)

**Note**: Video data does NOT go through Firebase - it uses peer-to-peer WebRTC. Firebase only handles signaling messages.

## Next Steps

After setup:
1. The WebRTC service will automatically connect to Firebase
2. Open the mobile camera page on iPhone
3. Open the dashboard viewer on desktop
4. Select the same game on both devices
5. Video should stream automatically

## Security Recommendations for Production

1. **Enable Firebase Authentication**
   - Integrate with existing Supabase auth
   - Require authenticated users for signaling

2. **Add Rate Limiting**
   - Prevent abuse of signaling channel
   - Limit connections per user

3. **Set Data Expiration**
   - Auto-delete signaling data after 24 hours
   - Clean up old room data

4. **Monitor Usage**
   - Set up Firebase alerts for quota limits
   - Track connection metrics

5. **Add Input Validation**
   - Validate all signaling messages
   - Sanitize user inputs

## Support

For Firebase-specific issues:
- [Firebase Documentation](https://firebase.google.com/docs/database)
- [Firebase Support](https://firebase.google.com/support)

For STATJAM integration issues:
- Check the main project documentation
- Review WebRTC service logs in browser console

