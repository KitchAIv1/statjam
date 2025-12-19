'use client';

import React from 'react';
import { Tournament } from '@/lib/types/tournament';
import { Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface TeamDistribution {
  division: string;
  count: number;
}

interface TournamentDivisionCardProps {
  tournament: Tournament;
  onUpdate: (updates: Partial<Tournament>) => void;
  teamDistribution?: TeamDistribution[];
}

export function TournamentDivisionCard({ 
  tournament, 
  onUpdate, 
  teamDistribution 
}: TournamentDivisionCardProps) {
  const handleToggleDivisions = (checked: boolean) => {
    if (checked) {
      const count = tournament.division_count || 2;
      const names = tournament.division_names || generateDivisionNames(count);
      onUpdate({ has_divisions: true, division_count: count, division_names: names });
    } else {
      onUpdate({ has_divisions: false, division_count: undefined, division_names: undefined });
    }
  };

  const handleDivisionCountChange = (value: string) => {
    const count = parseInt(value);
    const names = generateDivisionNames(count);
    onUpdate({ division_count: count, division_names: names });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="w-4 h-4 text-primary" />
          Division Configuration
        </CardTitle>
        <CardDescription className="text-xs">Organize teams into divisions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <DivisionToggle 
          enabled={tournament.has_divisions || false} 
          onToggle={handleToggleDivisions} 
        />

        {tournament.has_divisions && (
          <>
            <DivisionCountSelect 
              count={tournament.division_count || 2} 
              onChange={handleDivisionCountChange} 
            />
            <DivisionNameBadges names={tournament.division_names} />
            <TeamDistributionDisplay distribution={teamDistribution} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function generateDivisionNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
}

function DivisionToggle({ enabled, onToggle }: { enabled: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">Enable Divisions</Label>
        <p className="text-xs text-muted-foreground">Split teams into groups</p>
      </div>
      <Switch checked={enabled} onCheckedChange={onToggle} />
    </div>
  );
}

function DivisionCountSelect({ count, onChange }: { count: number; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">Number of Divisions</Label>
      <Select value={count.toString()} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {[2, 3, 4, 5, 6, 7, 8].map(num => (
            <SelectItem key={num} value={num.toString()}>{num} Divisions</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function DivisionNameBadges({ names }: { names?: string[] }) {
  if (!names || names.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {names.map((name, index) => (
        <Badge key={index} variant="outline" className="px-3 py-1">Division {name}</Badge>
      ))}
    </div>
  );
}

function TeamDistributionDisplay({ distribution }: { distribution?: TeamDistribution[] }) {
  if (!distribution || distribution.length === 0) return null;
  return (
    <div className="pt-2 border-t">
      <Label className="text-sm font-medium mb-2 block">Team Distribution</Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {distribution.map(({ division, count }) => (
          <div key={division} className="bg-muted/50 rounded-lg p-2 text-center">
            <div className="text-xs text-muted-foreground">Division {division}</div>
            <div className="text-lg font-semibold">{count} teams</div>
          </div>
        ))}
      </div>
    </div>
  );
}
