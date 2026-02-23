/**
 * Admin GA4 Analytics API Route
 * Fetches GA4 data via Google Analytics Data API (service account)
 *
 * SECURITY: Requires authenticated admin user (Bearer token + admin role)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getAnalyticsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !key) {
    throw new Error('GA4 credentials missing: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
  }

  return new BetaAnalyticsDataClient({
    credentials: { client_email: email, private_key: key },
  });
}

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const accessToken = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
    if (!propertyId) {
      return NextResponse.json({ error: 'GA4 property ID not configured' }, { status: 500 });
    }

    const client = getAnalyticsClient();
    const property = `properties/${propertyId}`;
    const dateRange = { startDate: '30daysAgo', endDate: 'today' };

    const [dailyResponse] = await client.runReport({
      property,
      dateRanges: [dateRange],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
      ],
      dimensions: [{ name: 'date' }],
      orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
    });

    const [pagesResponse] = await client.runReport({
      property,
      dateRanges: [dateRange],
      metrics: [{ name: 'screenPageViews' }],
      dimensions: [{ name: 'pagePath' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 5,
    });

    const [eventsResponse] = await client.runReport({
      property,
      dateRanges: [dateRange],
      metrics: [{ name: 'eventCount' }],
      dimensions: [{ name: 'eventName' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 8,
    });

    const dailyStats = (dailyResponse.rows ?? []).map((row) => ({
      date: row.dimensionValues?.[0]?.value ?? '',
      activeUsers: Number(row.metricValues?.[0]?.value ?? 0),
      sessions: Number(row.metricValues?.[1]?.value ?? 0),
      pageViews: Number(row.metricValues?.[2]?.value ?? 0),
      avgSessionDuration: Number(row.metricValues?.[3]?.value ?? 0),
    }));

    const topPages = (pagesResponse.rows ?? []).map((row) => ({
      path: row.dimensionValues?.[0]?.value ?? '',
      views: Number(row.metricValues?.[0]?.value ?? 0),
    }));

    const topEvents = (eventsResponse.rows ?? []).map((row) => ({
      name: row.dimensionValues?.[0]?.value ?? '',
      count: Number(row.metricValues?.[0]?.value ?? 0),
    }));

    const totals = dailyStats.reduce(
      (acc, d) => ({
        activeUsers: acc.activeUsers + d.activeUsers,
        sessions: acc.sessions + d.sessions,
        pageViews: acc.pageViews + d.pageViews,
        totalDuration: acc.totalDuration + d.avgSessionDuration * d.sessions,
        sessionCount: acc.sessionCount + d.sessions,
      }),
      { activeUsers: 0, sessions: 0, pageViews: 0, totalDuration: 0, sessionCount: 0 }
    );

    return NextResponse.json({
      dailyStats,
      topPages,
      topEvents,
      totals: {
        activeUsers: totals.activeUsers,
        sessions: totals.sessions,
        pageViews: totals.pageViews,
        avgSessionDuration: totals.sessionCount > 0 ? totals.totalDuration / totals.sessionCount : 0,
      },
    });
  } catch (err) {
    console.error('GA4 API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
