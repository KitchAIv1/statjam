'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';

interface TournamentDangerZoneProps {
  onDeleteClick: () => void;
}

export function TournamentDangerZone({ onDeleteClick }: TournamentDangerZoneProps) {
  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <CardTitle className="text-base text-red-700 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          Delete Tournament
        </CardTitle>
        <CardDescription className="text-red-600/80">
          This will permanently delete the tournament and all associated data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-red-700">
            <p className="font-medium mb-2">This action will delete:</p>
            <ul className="list-disc list-inside space-y-1 text-red-600">
              <li>All teams and their player assignments</li>
              <li>All scheduled and completed games</li>
              <li>All game statistics and player stats</li>
              <li>Tournament settings and configurations</li>
            </ul>
          </div>
          <Button variant="destructive" onClick={onDeleteClick} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Delete Tournament
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
