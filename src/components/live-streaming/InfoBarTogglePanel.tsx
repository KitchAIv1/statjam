/**
 * InfoBarTogglePanel - Studio controls for info bar overlays
 * 
 * Allows users to enable/disable which overlay items can appear
 * in the info bar below the NBA scoreboard.
 * 
 * Follows .cursorrules: under 200 lines, reusable component
 */

'use client';

import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Trophy, 
  Clock, 
  Timer, 
  Flame, 
  Award,
  Tv2
} from 'lucide-react';
import { InfoBarToggles, DEFAULT_TOGGLES } from '@/lib/services/canvas-overlay/infoBarManager';

interface InfoBarTogglePanelProps {
  toggles: InfoBarToggles;
  onChange: (toggles: InfoBarToggles) => void;
  className?: string;
}

interface ToggleItemConfig {
  key: keyof InfoBarToggles;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const TOGGLE_ITEMS: ToggleItemConfig[] = [
  {
    key: 'tournamentName',
    label: 'Tournament Name',
    description: 'Default display when no events',
    icon: <Trophy className="w-4 h-4" />,
  },
  {
    key: 'halftime',
    label: 'Halftime',
    description: 'Shows at end of 2nd quarter',
    icon: <Clock className="w-4 h-4" />,
  },
  {
    key: 'overtime',
    label: 'Overtime',
    description: 'Shows during OT periods',
    icon: <Timer className="w-4 h-4" />,
  },
  {
    key: 'timeout',
    label: 'Timeout',
    description: 'Shows when timeout is active',
    icon: <Tv2 className="w-4 h-4" />,
  },
  {
    key: 'teamRun',
    label: 'Team Run',
    description: '8+ unanswered points',
    icon: <Flame className="w-4 h-4 text-orange-500" />,
  },
  {
    key: 'milestone',
    label: 'Player Milestones',
    description: '30+ pts, double-double, etc.',
    icon: <Award className="w-4 h-4 text-yellow-500" />,
  },
];

export function InfoBarTogglePanel({
  toggles,
  onChange,
  className = '',
}: InfoBarTogglePanelProps) {
  const handleToggle = (key: keyof InfoBarToggles, checked: boolean) => {
    onChange({
      ...toggles,
      [key]: checked,
    });
  };

  const enabledCount = Object.values(toggles).filter(Boolean).length;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Info Bar Overlays
        </h3>
        <span className="text-xs text-muted-foreground">
          {enabledCount}/{TOGGLE_ITEMS.length} enabled
        </span>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Control which notifications appear in the bottom bar. 
        Higher priority events override lower ones automatically.
      </p>

      <div className="space-y-3">
        {TOGGLE_ITEMS.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-background">
                {item.icon}
              </div>
              <div>
                <Label 
                  htmlFor={`toggle-${item.key}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {item.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
            <Switch
              id={`toggle-${item.key}`}
              checked={toggles[item.key]}
              onCheckedChange={(checked) => handleToggle(item.key, checked)}
            />
          </div>
        ))}
      </div>

      <div className="pt-2 border-t">
        <button
          type="button"
          onClick={() => onChange(DEFAULT_TOGGLES)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
