'use client';

import React from 'react';
import { ConnectionStatus } from '@/hooks/useWebRTCStream';
import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';
import { LiveGame } from '@/types/liveStream';

interface LiveStreamControlsProps {
  games: LiveGame[];
  selectedGameId: string | null;
  onGameSelect: (gameId: string) => void;
  connectionStatus: ConnectionStatus;
  loading: boolean;
}

function StatusIndicator({ status }: { status: ConnectionStatus }) {
  let icon = <WifiOff className="w-5 h-5" />;
  let text = 'Not Connected';
  let colorClass = 'text-muted-foreground';

  if (status === 'connecting') {
    icon = <Wifi className="w-5 h-5 animate-pulse" />;
    text = 'Connecting...';
    colorClass = 'text-yellow-500';
  } else if (status === 'connected') {
    icon = <CheckCircle className="w-5 h-5" />;
    text = 'Connected';
    colorClass = 'text-green-500';
  } else if (status === 'error') {
    icon = <AlertCircle className="w-5 h-5" />;
    text = 'Error';
    colorClass = 'text-destructive';
  }

  return (
    <div className={`flex items-center gap-2 ${colorClass}`}>
      {icon}
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}

export function LiveStreamControls({
  games,
  selectedGameId,
  onGameSelect,
  connectionStatus,
  loading,
}: LiveStreamControlsProps) {
  return (
    <div className="space-y-4 mb-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Select Game</label>
        <StatusIndicator status={connectionStatus} />
      </div>
      
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading games...</div>
      ) : games.length === 0 ? (
        <div className="text-sm text-muted-foreground">No live games available</div>
      ) : (
        <select
          value={selectedGameId || ''}
          onChange={(e) => onGameSelect(e.target.value || '')}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">-- Select a game --</option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.team_b_name} vs {game.team_a_name} (Q{game.quarter}) - {game.home_score}:{game.away_score}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

