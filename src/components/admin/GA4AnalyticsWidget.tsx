'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, Eye, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface DailyStatRow {
  date: string;
  activeUsers: number;
  sessions: number;
  pageViews: number;
  avgSessionDuration: number;
}

interface AnalyticsResponse {
  dailyStats: DailyStatRow[];
  topPages: { path: string; views: number }[];
  topEvents: { name: string; count: number }[];
  totals: {
    activeUsers: number;
    sessions: number;
    pageViews: number;
    avgSessionDuration: number;
  };
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins < 1) return `${Math.round(seconds)}s`;
  return `${mins}m ${Math.round(seconds % 60)}s`;
}

function GA4SummaryCards({ totals }: { totals: AnalyticsResponse['totals'] }) {
  const cards = [
    { title: 'Total Users (30d)', value: totals.activeUsers, icon: Users, desc: 'Active users' },
    { title: 'Sessions (30d)', value: totals.sessions, icon: Eye, desc: 'Total sessions' },
    { title: 'Page Views (30d)', value: totals.pageViews, icon: BarChart3, desc: 'Screen views' },
    { title: 'Avg Session', value: formatDuration(totals.avgSessionDuration), icon: Clock, desc: 'Duration' },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.title} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{c.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function GA4AnalyticsWidget() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const accessToken = localStorage.getItem('sb-access-token');
        const res = await fetch('/api/admin/analytics', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `HTTP ${res.status}`);
        }
        const json: AnalyticsResponse = await res.json();
        setAnalyticsData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="w-full rounded-lg border border-border bg-muted/30 p-8">
        <div className="animate-pulse space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded-lg" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-32 bg-muted rounded-lg" />
            <div className="h-32 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Ensure GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, and
            GOOGLE_ANALYTICS_PROPERTY_ID are set in environment.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData) return null;

  const chartData = analyticsData.dailyStats.map((d) => ({
    date: d.date.slice(5),
    users: d.activeUsers,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <BarChart3 className="h-5 w-5" />
            Site Analytics
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Google Analytics 4 – last 30 days
          </CardDescription>
        </div>
        <Link
          href="https://analytics.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Open GA4
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>

      <GA4SummaryCards totals={analyticsData.totals} />

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Daily Active Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#71717a" />
                <YAxis tick={{ fontSize: 10 }} stroke="#71717a" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {analyticsData.topPages.map((p) => (
                <li key={p.path} className="flex justify-between text-foreground">
                  <span className="truncate mr-2">{p.path || '/'}</span>
                  <span className="text-muted-foreground font-medium">{p.views}</span>
                </li>
              ))}
              {analyticsData.topPages.length === 0 && (
                <li className="text-muted-foreground">No data</li>
              )}
            </ul>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Top Events</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {analyticsData.topEvents.map((e) => (
                <li key={e.name} className="flex justify-between text-foreground">
                  <span className="truncate mr-2">{e.name}</span>
                  <span className="text-muted-foreground font-medium">{e.count}</span>
                </li>
              ))}
              {analyticsData.topEvents.length === 0 && (
                <li className="text-muted-foreground">No data</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
