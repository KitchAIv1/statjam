'use client';

import React from 'react';
import { ArrowLeft, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GameHeaderV3Props {
  gameId: string;
  onBack: () => void;
}

export function GameHeaderV3({ gameId, onBack }: GameHeaderV3Props) {
  return (
    <Card className="mb-6" style={{ 
      background: 'var(--dashboard-card)', 
      borderColor: 'var(--dashboard-border)',
      borderWidth: '1px'
    }}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onBack}
              className="hover:bg-orange-500/10 hover:border-orange-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--dashboard-gradient)' }}
              >
                <Activity className="w-5 h-5 text-white" />
              </div>
              
              <div>
                <h1 
                  className="text-xl font-bold"
                  style={{ color: 'var(--dashboard-text-primary)' }}
                >
                  Stat Tracker V3
                </h1>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--dashboard-text-secondary)' }}
                >
                  Game ID: {gameId.slice(0, 8)}...
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge 
              variant="outline"
              className="text-orange-500 border-orange-500 bg-orange-500/10"
            >
              Live
            </Badge>
            
            <div 
              className="w-3 h-3 rounded-full bg-green-500 animate-pulse"
              title="Connected"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}