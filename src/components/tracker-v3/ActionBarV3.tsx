'use client';

import React from 'react';
import { Square, Save, AlertCircle, BarChart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';

interface ActionBarV3Props {
  gameId: string;
  lastAction: string | null;
  onGameEnd: () => void;
}

export function ActionBarV3({ gameId, lastAction, onGameEnd }: ActionBarV3Props) {
  const handleSaveGame = () => {
    // TODO: Implement manual save functionality
    console.log('Saving game state...');
  };

  const handleViewStats = () => {
    // TODO: Navigate to stats view
    console.log('Viewing game stats...');
  };

  return (
    <Card style={{ 
      background: 'var(--dashboard-card)', 
      borderColor: 'var(--dashboard-border)',
      borderWidth: '1px'
    }}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Last Action Display */}
          {lastAction && (
            <div 
              className="p-3 rounded-lg"
              style={{ background: 'var(--dashboard-primary)' + '10' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-sm font-medium text-orange-500">
                  Last Action: {lastAction}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-3">
            {/* Save Game */}
            <Button
              onClick={handleSaveGame}
              variant="outline"
              className="w-full h-12 justify-start gap-3 hover:bg-blue-500/10 hover:border-blue-500"
            >
              <Save className="w-5 h-5 text-blue-500" />
              <div className="text-left">
                <div className="font-medium">Save Progress</div>
                <div className="text-xs text-gray-500">Backup current game state</div>
              </div>
            </Button>

            {/* View Stats */}
            <Button
              onClick={handleViewStats}
              variant="outline"
              className="w-full h-12 justify-start gap-3 hover:bg-green-500/10 hover:border-green-500"
            >
              <BarChart className="w-5 h-5 text-green-500" />
              <div className="text-left">
                <div className="font-medium">View Statistics</div>
                <div className="text-xs text-gray-500">See game stats summary</div>
              </div>
            </Button>

            {/* End Game */}
            <Button
              onClick={onGameEnd}
              variant="outline"
              className="w-full h-12 justify-start gap-3 hover:bg-red-500/10 hover:border-red-500 border-red-500/20"
            >
              <Square className="w-5 h-5 text-red-500" />
              <div className="text-left">
                <div className="font-medium text-red-500">End Game</div>
                <div className="text-xs text-red-400">Mark game as completed</div>
              </div>
            </Button>
          </div>

          {/* Game Status */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-sm font-medium"
                  style={{ color: 'var(--dashboard-text-primary)' }}
                >
                  Game Status
                </p>
                <p 
                  className="text-xs"
                  style={{ color: 'var(--dashboard-text-secondary)' }}
                >
                  ID: {gameId.slice(0, 8)}...
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <Badge 
                  variant="outline"
                  className="text-green-500 border-green-500 bg-green-500/10"
                >
                  Live
                </Badge>
              </div>
            </div>
          </div>

          {/* Emergency Actions */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs hover:bg-yellow-500/10 hover:border-yellow-500"
                onClick={() => {
                  // TODO: Implement emergency pause
                  console.log('Emergency pause requested');
                }}
              >
                <AlertCircle className="w-4 h-4 mr-1" />
                Emergency
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="text-xs hover:bg-orange-500/10 hover:border-orange-500"
                onClick={() => {
                  // TODO: Implement sync check
                  console.log('Checking sync status');
                }}
              >
                <Save className="w-4 h-4 mr-1" />
                Sync Check
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}