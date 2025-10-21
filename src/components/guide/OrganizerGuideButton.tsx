import React from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BookOpen } from 'lucide-react';
import { useOrganizerGuide } from '@/hooks/useOrganizerGuide';

export function OrganizerGuideButton() {
  const { openGuide, showBadge } = useOrganizerGuide();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={openGuide}
            className="relative gap-2 hover:bg-primary/10"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Guide</span>
            {showBadge && (
              <Badge 
                variant="secondary" 
                className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground animate-pulse"
              >
                New
              </Badge>
            )}
            {showBadge && (
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Organizer Guide: setup, statisticians, live tracking</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
