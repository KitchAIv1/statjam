import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { X, Trophy, Users, Target } from 'lucide-react';
import { useOrganizerGuide } from '@/contexts/OrganizerGuideContext';

export function OrganizerGuideCallout() {
  const { showCallout, openGuide, dismissCallout } = useOrganizerGuide();

  if (!showCallout) return null;

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Organizer Guide</CardTitle>
            <Badge variant="secondary" className="bg-primary text-primary-foreground">
              New
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissCallout}
            className="h-8 w-8 p-0 hover:bg-destructive/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Quick steps for tournaments and live stat tracking.
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3 text-sm">
            <Trophy className="w-4 h-4 text-primary flex-shrink-0" />
            <span>Create tournament and add teams</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Users className="w-4 h-4 text-primary flex-shrink-0" />
            <span>Assign a Stat Profile in Game Settings</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Target className="w-4 h-4 text-primary flex-shrink-0" />
            <span>Stat admin launches Stat Tracker for live stats</span>
          </div>
        </div>
        <Button onClick={openGuide} className="w-full sm:w-auto">
          Open Guide
        </Button>
      </CardContent>
    </Card>
  );
}
