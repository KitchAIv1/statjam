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
    <div className="flex items-center justify-between mb-4 px-2">
      {/* Left - Back Button */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onBack}
        className="hover:bg-orange-500/10 hover:border-orange-500"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Dashboard
      </Button>

      {/* Right - Live Status */}
      <div className="flex items-center gap-2">
        <Badge 
          variant="outline"
          className="text-orange-500 border-orange-500 bg-orange-500/10 text-xs"
        >
          Live
        </Badge>
        
        <div 
          className="w-2 h-2 rounded-full bg-green-500 animate-pulse"
          title="Connected"
        />
      </div>
    </div>
  );
}