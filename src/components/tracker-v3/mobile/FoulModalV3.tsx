'use client';

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';

interface FoulModalV3Props {
  isOpen: boolean;
  onClose: () => void;
  selectedPlayer: string | null;
  playerName?: string;
  onConfirm: (foulType: 'personal' | 'technical') => Promise<void>;
}

export function FoulModalV3({
  isOpen,
  onClose,
  selectedPlayer,
  playerName,
  onConfirm
}: FoulModalV3Props) {
  const [isRecording, setIsRecording] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleFoulSelect = async (foulType: 'personal' | 'technical') => {
    if (!selectedPlayer) return;
    
    setIsRecording(foulType);
    try {
      await onConfirm(foulType);
      onClose();
    } catch (error) {
      console.error('Error recording foul:', error);
    } finally {
      setIsRecording(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card 
        className="relative w-full max-w-sm mx-4"
        style={{ 
          background: 'var(--dashboard-card)', 
          borderColor: 'var(--dashboard-border)',
          borderWidth: '1px'
        }}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2" style={{ color: 'var(--dashboard-text-primary)' }}>
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Record Foul
            </CardTitle>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-red-500/10 hover:border-red-500"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Player Info */}
          <div 
            className="p-3 rounded-lg text-center"
            style={{ background: 'var(--dashboard-primary)' + '10', borderColor: 'var(--dashboard-primary)' }}
          >
            <p className="text-sm font-medium text-orange-500 mb-1">
              Recording foul for:
            </p>
            <p 
              className="text-sm font-bold"
              style={{ color: 'var(--dashboard-text-primary)' }}
            >
              {playerName || `Player #${selectedPlayer?.slice(0, 8)}...`}
            </p>
          </div>

          {/* Foul Type Selection */}
          <div className="space-y-3">
            <p 
              className="text-sm text-center"
              style={{ color: 'var(--dashboard-text-secondary)' }}
            >
              Select foul type:
            </p>

            {/* Personal Foul */}
            <Button
              onClick={() => handleFoulSelect('personal')}
              disabled={isRecording === 'personal'}
              className={`w-full h-16 flex flex-col justify-center gap-2 transition-all ${
                isRecording === 'personal'
                  ? 'bg-orange-600 text-white animate-pulse' 
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              <div className="text-sm font-bold">Personal Foul</div>
              <div className="text-xs opacity-90">Common defensive/offensive foul</div>
            </Button>

            {/* Technical Foul */}
            <Button
              onClick={() => handleFoulSelect('technical')}
              disabled={isRecording === 'technical'}
              variant="outline"
              className={`w-full h-16 flex flex-col justify-center gap-2 transition-all ${
                isRecording === 'technical'
                  ? 'bg-red-600 text-white animate-pulse border-red-600' 
                  : 'hover:bg-red-500/10 hover:border-red-500 hover:text-red-500'
              }`}
            >
              <div className="text-sm font-bold">Technical Foul</div>
              <div className="text-xs opacity-75">Unsportsmanlike conduct</div>
            </Button>
          </div>

          {/* Info Note */}
          <div 
            className="text-xs text-center p-2 rounded"
            style={{ 
              background: 'var(--dashboard-border)',
              color: 'var(--dashboard-text-secondary)' 
            }}
          >
            These are the only foul types currently supported in the database
          </div>

          {/* Cancel Button */}
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full hover:bg-gray-500/10"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}