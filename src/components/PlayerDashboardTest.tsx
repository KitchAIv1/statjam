"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayerDashboardService } from '@/lib/services/playerDashboardService';
import { supabase } from '@/lib/supabase';

export function PlayerDashboardTest() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (name: string, testFn: () => Promise<any>) => {
    try {
      console.log(`🧪 Testing ${name}...`);
      const result = await testFn();
      setResults(prev => ({ ...prev, [name]: { success: true, data: result } }));
      console.log(`✅ ${name} success:`, result);
    } catch (error) {
      setResults(prev => ({ ...prev, [name]: { success: false, error: error } }));
      console.error(`❌ ${name} error:`, error);
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults({});

    // Test auth first
    await testEndpoint('auth', async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return { userId: user?.id, email: user?.email };
    });

    // Test direct Supabase queries
    await testEndpoint('users_direct', async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');
      const { data, error } = await supabase
        .from('users')
        .select('id, name, jersey_number, position, age, height, weight, country, profile_photo_url, pose_photo_url')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    });

    await testEndpoint('season_averages_direct', async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');
      const { data, error } = await supabase
        .from('player_season_averages')
        .select('*')
        .eq('player_id', user.id)
        .single();
      if (error) throw error;
      return data;
    });

    await testEndpoint('career_highs_direct', async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');
      const { data, error } = await supabase
        .from('player_career_highs')
        .select('*')
        .eq('player_id', user.id)
        .single();
      if (error) throw error;
      return data;
    });

    await testEndpoint('performance_analytics_direct', async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');
      const { data, error } = await supabase
        .from('player_performance_analytics')
        .select('*')
        .eq('player_id', user.id);
      if (error) throw error;
      return data;
    });

    // Test service methods
    await testEndpoint('identity_service', () => PlayerDashboardService.getIdentity());
    await testEndpoint('season_service', () => PlayerDashboardService.getSeasonAverages());
    await testEndpoint('career_service', () => PlayerDashboardService.getCareerHighs());
    await testEndpoint('performance_service', () => PlayerDashboardService.getPerformance());

    setLoading(false);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Player Dashboard Backend Test</CardTitle>
        <Button onClick={runAllTests} disabled={loading}>
          {loading ? 'Testing...' : 'Run All Tests'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(results).map(([name, result]) => (
            <div key={name} className="p-4 border rounded">
              <div className="flex items-center gap-2 mb-2">
                <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                  {result.success ? '✅' : '❌'}
                </span>
                <strong>{name}</strong>
              </div>
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(result.success ? result.data : result.error, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
