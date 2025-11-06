import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserStats } from '@/lib/services/adminService';
import { Users, TrendingUp, Activity, Star } from 'lucide-react';

interface AdminStatsCardsProps {
  stats: UserStats;
  loading?: boolean;
}

/**
 * Admin Stats Cards Component
 * Displays 4 key metrics: total users, new this week, active today, premium users
 * Max 200 lines per component rule
 */
export function AdminStatsCards({ stats, loading }: AdminStatsCardsProps) {
  const cards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      description: 'All registered users',
      color: 'text-blue-600'
    },
    {
      title: 'New This Week',
      value: stats.newUsersThisWeek,
      icon: TrendingUp,
      description: 'Signups in last 7 days',
      color: 'text-green-600'
    },
    {
      title: 'Active Today',
      value: stats.activeUsersToday,
      icon: Activity,
      description: 'Users with activity today',
      color: 'text-orange-600'
    },
    {
      title: 'Premium Users',
      value: stats.premiumUsers,
      icon: Star,
      description: 'Users with premium status',
      color: 'text-purple-600'
    }
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

