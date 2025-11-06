/**
 * Feedback API Route
 * Purpose: Receive feedback submissions and send to Discord webhook
 * Method: POST /api/feedback
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedback, email, page, userAgent, timestamp } = body;

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

