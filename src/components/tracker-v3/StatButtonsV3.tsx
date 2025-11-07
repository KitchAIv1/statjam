'use client';

import React, { useState } from 'react';
import { BarChart3, Target, Trophy, Shield, Zap, AlertTriangle, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';

interface StatButtonsV3Props {
  selectedPlayer: string | null;
  onStatRecord: (statType: string, modifier?: string) => void;
}

// Stat button configuration with Figma orange/red theme
const statButtons = [
  // Scoring Stats (Primary Orange)
  { id: 'field_goal_made', label: '+2 FG', icon: Target, color: 'bg-orange-500 hover:bg-orange-600 text-white', modifier: 'made' },
  { id: 'three_pointer_made', label: '+3 FG', icon: Trophy, color: 'bg-orange-600 hover:bg-orange-700 text-white', modifier: 'made' },
  { id: 'free_throw_made', label: 'FT', icon: Target, color: 'bg-red-500 hover:bg-red-600 text-white', modifier: 'made' },
  
  // Performance Stats (Secondary)
  { id: 'assist', label: 'AST', icon: Zap, color: 'bg-blue-500 hover:bg-blue-600 text-white' },
  { id: 'rebound', label: 'REB', icon: Shield, color: 'bg-green-500 hover:bg-green-600 text-white' },
  { id: 'steal', label: 'STL', icon: Zap, color: 'bg-purple-500 hover:bg-purple-600 text-white' },
  
  // Defensive Stats
  { id: 'block', label: 'BLK', icon: Shield, color: 'bg-indigo-500 hover:bg-indigo-600 text-white' },
  { id: 'turnover', label: 'TO', icon: AlertTriangle, color: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
  { id: 'foul', label: 'FOUL', icon: AlertTriangle, color: 'bg-red-600 hover:bg-red-700 text-white' },
];

// Missed shot buttons
const missedButtons = [
  { id: 'field_goal_missed', label: 'Miss 2', color: 'bg-gray-500 hover:bg-gray-600 text-white', modifier: 'missed' },
  { id: 'three_pointer_missed', label: 'Miss 3', color: 'bg-gray-600 hover:bg-gray-700 text-white', modifier: 'missed' },
  { id: 'free_throw_missed', label: 'Miss FT', color: 'bg-gray-700 hover:bg-gray-800 text-white', modifier: 'missed' },
];

export function StatButtonsV3({ selectedPlayer, onStatRecord }: StatButtonsV3Props) {
  const [showMissedShots, setShowMissedShots] = useState(false);
  const [lastStat, setLastStat] = useState<{ type: string; modifier?: string } | null>(null);

  const handleStatClick = (statType: string, modifier?: string) => {
    if (!selectedPlayer) {
      alert('Please select a player first');
      return;
    }

    setLastStat({ type: statType, modifier });
    onStatRecord(statType, modifier);
  };

  const handleUndo = () => {
    if (lastStat) {
      // TODO: Implement undo functionality
      console.log('Undo last stat:', lastStat);
      setLastStat(null);
    }
  };

  return (
    <Card
      data-coach-tour="stat-buttons"
      style={{ 
      background: 'var(--dashboard-card)', 
      borderColor: 'var(--dashboard-border)',
      borderWidth: '1px'
      }}
    >
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2" style={{ color: 'var(--dashboard-text-primary)' }}>
          <BarChart3 className="w-5 h-5 text-orange-500" />
          Record Stats
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Player Selection Warning */}
        {!selectedPlayer && (
          <div 
            className="p-3 rounded-lg border border-yellow-500 bg-yellow-500/10"
          >
            <p className="text-sm text-yellow-600 font-medium">
              ⚠️ Select a player to record stats
            </p>
          </div>
        )}

        {/* Last Action Display */}
        {lastStat && (
          <div 
            className="p-3 rounded-lg"
            style={{ background: 'var(--dashboard-primary)' + '10', borderColor: 'var(--dashboard-primary)' }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-orange-500">
                Last: {lastStat.type.replace('_', ' ').toUpperCase()} {lastStat.modifier || ''}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                className="h-6 text-xs hover:bg-red-500/10 hover:border-red-500"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Undo
              </Button>
            </div>
          </div>
        )}

        {/* Made Stats Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 
              className="font-medium"
              style={{ color: 'var(--dashboard-text-primary)' }}
            >
              Made Shots & Stats
            </h4>
            <Badge variant="outline" className="text-green-500 border-green-500">
              Made
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {statButtons.map((stat) => {
              const Icon = stat.icon;
              return (
                <Button
                  key={stat.id}
                  onClick={() => handleStatClick(stat.id.split('_')[0] === 'field' ? 'field_goal' : stat.id.split('_')[0] === 'three' ? 'three_pointer' : stat.id.split('_')[0] === 'free' ? 'free_throw' : stat.id, stat.modifier)}
                  className={`h-16 flex flex-col gap-1 transition-all ${stat.color}`}
                  disabled={!selectedPlayer}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-bold">{stat.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Toggle Missed Shots */}
        <div className="border-t pt-4">
          <Button
            variant="outline"
            onClick={() => setShowMissedShots(!showMissedShots)}
            className="w-full mb-3 hover:bg-gray-500/10"
          >
            {showMissedShots ? 'Hide' : 'Show'} Missed Shots
          </Button>

          {/* Missed Stats Grid */}
          {showMissedShots && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 
                  className="font-medium"
                  style={{ color: 'var(--dashboard-text-primary)' }}
                >
                  Missed Shots
                </h4>
                <Badge variant="outline" className="text-red-500 border-red-500">
                  Missed
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {missedButtons.map((stat) => (
                  <Button
                    key={stat.id}
                    onClick={() => handleStatClick(stat.id.split('_')[0] === 'field' ? 'field_goal' : stat.id.split('_')[0] === 'three' ? 'three_pointer' : 'free_throw', stat.modifier)}
                    className={`h-12 flex flex-col gap-1 transition-all ${stat.color}`}
                    disabled={!selectedPlayer}
                  >
                    <span className="text-xs font-bold">{stat.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="border-t pt-4">
          <h4 
            className="font-medium mb-3"
            style={{ color: 'var(--dashboard-text-primary)' }}
          >
            Quick Actions
          </h4>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => {/* TODO: Implement timeout */}}
              className="h-12 hover:bg-orange-500/10 hover:border-orange-500"
            >
              Timeout
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {/* TODO: Implement technical foul */}}
              className="h-12 hover:bg-red-500/10 hover:border-red-500"
            >
              Technical
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}