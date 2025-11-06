# Feedback System Setup Guide

## Overview

StatJam includes a user feedback system that allows users to submit feedback from any page via:
- **Floating bubble** (bottom-right corner)
- **Footer link** ("Give Feedback")

Feedback is sent to a Discord channel via webhook for instant team notifications.

---

## Setup Instructions

### 1. Create Discord Webhook

1. Open your Discord server
2. Go to **Server Settings** > **Integrations** > **Webhooks**
3. Click **New Webhook**
4. Name it: `StatJam Feedback`
5. Select the channel where feedback should be posted
6. Click **Copy Webhook URL**

### 2. Add to Environment Variables

Add the webhook URL to your `.env.local`:

```bash
DISCORD_FEEDBACK_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-id/your-webhook-token
```

### 3. Test the System

1. Start the dev server: `npm run dev`
2. Navigate to any page
3. Click the orange floating bubble (bottom-right)
4. Fill out the feedback form
5. Click "Send Feedback"
6. Check your Discord channel for the message

---

## Features

### User Experience

- **Floating Bubble**: Always visible, bottom-right corner
- **Tooltip**: Shows "Share Feedback" on hover
- **Modal Form**: Clean UI with textarea and optional email
- **Success State**: Confirmation message after submission
- **Auto-close**: Modal closes 2 seconds after success

### Data Captured

- Feedback message (required)
- Email (optional)
- Current page URL
- User agent (browser/device info)
- Timestamp

### Discord Message Format

```
📝 New Feedback Received

💬 Feedback: [User's message]
📧 Email: [Email or "Anonymous"]
📍 Page: /dashboard/coach
🕐 Time: Nov 6, 2025, 3:45 PM
🖥️ User Agent: Mozilla/5.0...
```

---

## File Structure

```
src/
├── components/
│   └── feedback/
│       ├── FeedbackButton.tsx    # Floating bubble component
│       └── FeedbackModal.tsx     # Form modal
├── app/
│   ├── api/
│   │   └── feedback/
│   │       └── route.ts          # API endpoint
│   └── layout.tsx                # Global FeedbackButton placement
└── components/
    └── Footer.tsx                # Footer link integration
```

---

## Customization

### Change Bubble Position

Edit `src/components/feedback/FeedbackButton.tsx`:

```tsx
// Current: bottom-right
className="fixed bottom-6 right-6 z-50..."

// Example: bottom-left
className="fixed bottom-6 left-6 z-50..."
```

### Change Bubble Color

```tsx
// Current: orange
className="...bg-orange-500 hover:bg-orange-600..."

// Example: blue
className="...bg-blue-500 hover:bg-blue-600..."
```

### Disable on Specific Pages

In `src/app/layout.tsx`:

```tsx
// Add conditional rendering
{!pathname.includes('/stat-tracker-v3') && <FeedbackButton />}
```

---

## Troubleshooting

### Feedback not appearing in Discord

1. **Check webhook URL**: Ensure `DISCORD_FEEDBACK_WEBHOOK_URL` is set in `.env.local`
2. **Verify webhook is active**: Test the webhook URL directly with curl:
   ```bash
   curl -X POST "YOUR_WEBHOOK_URL" \
     -H "Content-Type: application/json" \
     -d '{"content": "Test message"}'
   ```
3. **Check API logs**: Look for errors in the console when submitting feedback

### Bubble not visible

1. **Check z-index**: Ensure no other elements have `z-index > 50`
2. **Check viewport**: Bubble is hidden on very small screens (< 640px width)
3. **Clear cache**: Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

### Modal not opening

1. **Check console**: Look for React errors
2. **Verify imports**: Ensure all components are imported correctly
3. **Check Dialog component**: Ensure Shadcn Dialog is installed

---

## Security Notes

- **Webhook URL**: Never commit `.env.local` to git (already in `.gitignore`)
- **Rate limiting**: Consider adding rate limiting to the API route for production
- **Validation**: API validates feedback content before sending
- **Fail silently**: If webhook fails, user still sees success (prevents error exposure)

---

## Future Enhancements

- [ ] Add rate limiting (prevent spam)
- [ ] Add feedback categories (Bug, Feature Request, General)
- [ ] Add screenshot attachment
- [ ] Add feedback history for logged-in users
- [ ] Add admin dashboard to view all feedback
- [ ] Add email notifications (alternative to Discord)

---

## Support

If you encounter issues:
1. Check the [Common Issues](#troubleshooting) section above
2. Review the API logs in your terminal
3. Test the Discord webhook directly
4. Contact the dev team via Discord

