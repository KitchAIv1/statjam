/**
 * Cloudflare TURN Credentials API
 * 
 * Generates temporary TURN credentials via Cloudflare API.
 * Credentials are valid for ~24 hours.
 */

import { NextResponse } from 'next/server';

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_TURN_KEY_ID = process.env.CLOUDFLARE_TURN_KEY_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

interface CloudflareTurnCredentials {
  iceServers: {
    urls: string[];
    username: string;
    credential: string;
  };
}

export async function GET() {
  // Validate env vars
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_TURN_KEY_ID || !CLOUDFLARE_API_TOKEN) {
    console.error('Missing Cloudflare TURN configuration');
    return NextResponse.json(
      { error: 'TURN service not configured' },
      { status: 500 }
    );
  }

  try {
    // Generate temporary credentials via Cloudflare API
    const response = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${CLOUDFLARE_TURN_KEY_ID}/credentials/generate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ttl: 86400, // 24 hours
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudflare TURN API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to generate TURN credentials' },
        { status: 500 }
      );
    }

    const data: CloudflareTurnCredentials = await response.json();

    // Return credentials in standard WebRTC format
    return NextResponse.json({
      iceServers: [
        // STUN servers (free)
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:stun.l.google.com:19302' },
        // Cloudflare TURN (from API response)
        data.iceServers,
      ],
    });
  } catch (error) {
    console.error('Error generating TURN credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
