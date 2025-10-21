import React from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { BookOpen } from 'lucide-react';
import { useOrganizerGuideSafe } from '@/contexts/OrganizerGuideContext';

export function OrganizerGuideButton() {
  // Safety check: only render if provider is available
  const guideContext = useOrganizerGuideSafe();
  
  // If no provider available (not on dashboard page), don't render
  if (!guideContext) {
    return null;
  }

  const { openGuide, showBadge, isGuideOpen } = guideContext;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openGuide();
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className="relative gap-2 text-white hover:text-orange-400 hover:bg-orange-400/10 z-10"
        title="Organizer Guide: setup, statisticians, live tracking"
      >
        <BookOpen className="w-4 h-4" />
        <span className="hidden sm:inline">Guide</span>
      </Button>
      {showBadge && (
        <Badge 
          variant="secondary" 
          className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground animate-pulse pointer-events-none"
        >
          New
        </Badge>
      )}
      {showBadge && (
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-pulse pointer-events-none" />
      )}
    </div>
  );
}
