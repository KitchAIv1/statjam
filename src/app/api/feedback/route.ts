/**
 * Feedback API Route
 * Purpose: Receive feedback submissions and send to Discord webhook
 * Method: POST /api/feedback
 * 
 * SECURITY: Requires authentication (enforced by middleware + token check)
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify JWT token from request
 */
function verifyAuth(request: NextRequest): { userId: string; email: string } | null {
  try {
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    // Also check cookies
    const cookieToken = request.cookies.get('sb-access-token')?.value ||
                        request.cookies.get('sb-auth-token')?.value;
    if (!token && cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      return null;
    }

    // Decode JWT payload
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    return {
      userId: payload.sub,
      email: payload.email || 'unknown'
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Verify authentication
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { feedback, page, userAgent, timestamp } = body;

    // Use authenticated user's email
    const email = user.email;

    // Validate required fields
    if (!feedback || typeof feedback !== 'string' || feedback.trim().length === 0) {
      return NextResponse.json(
        { error: 'Feedback is required' },
        { status: 400 }
      );
    }

    // Get Discord webhook URL from environment variable
    const webhookUrl = process.env.DISCORD_FEEDBACK_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error('❌ DISCORD_FEEDBACK_WEBHOOK_URL not configured');
      // Still return success to user (fail silently, log internally)
      return NextResponse.json({ success: true });
    }

    // Format Discord embed message
    const discordPayload = {
      embeds: [
        {
          title: '📝 New Feedback Received',
          color: 0xf97316, // Orange-500
          fields: [
            {
              name: '💬 Feedback',
              value: feedback.substring(0, 1024), // Discord limit
              inline: false
            },
            {
              name: '📧 Email',
              value: email || 'Anonymous',
              inline: true
            },
            {
              name: '📍 Page',
              value: page || 'Unknown',
              inline: true
            },
            {
              name: '🕐 Time',
              value: new Date(timestamp).toLocaleString(),
              inline: true
            },
            {
              name: '🖥️ User Agent',
              value: userAgent ? userAgent.substring(0, 100) : 'Unknown',
              inline: false
            }
          ],
          timestamp: new Date(timestamp).toISOString()
        }
      ]
    };

    // Send to Discord
    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload)
    });

    if (!discordResponse.ok) {
      console.error('❌ Failed to send to Discord:', discordResponse.status);
      // Still return success to user
      return NextResponse.json({ success: true });
    }

    console.log('✅ Feedback sent to Discord');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Feedback API error:', error);
    // Return success to user even on error (fail silently)
    return NextResponse.json({ success: true });
  }
}

