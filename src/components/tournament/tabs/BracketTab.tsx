'use client';

import { Card } from '@/components/ui/card';
import { useTournamentTheme } from '@/contexts/TournamentThemeContext';
import { getTournamentThemeClass } from '@/lib/utils/tournamentThemeClasses';

interface BracketTabProps {
  tournamentId: string;
}

export function BracketTab({ tournamentId }: BracketTabProps) {
  const { theme } = useTournamentTheme();
  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className={`rounded-2xl border p-4 backdrop-blur sm:rounded-3xl sm:p-6 ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBgSubtle', theme)} ${getTournamentThemeClass('cardTextMuted', theme)}`}>
        <h2 className={`text-lg font-semibold sm:text-xl ${getTournamentThemeClass('cardText', theme)}`}>Interactive Bracket</h2>
        <p className={`mt-2 text-xs sm:text-sm ${getTournamentThemeClass('cardTextMuted', theme)}`}>
          Bracket visualization syncing with live results is coming soon.
        </p>
        <div className={`mt-4 grid gap-4 text-xs sm:mt-6 sm:gap-6 sm:text-sm md:grid-cols-2 ${getTournamentThemeClass('cardTextDim', theme)}`}>
          <div className={`rounded-xl border p-4 sm:rounded-2xl sm:p-6 ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBg', theme)}`}>
            <h3 className={`text-sm sm:text-base ${getTournamentThemeClass('cardText', theme)}`}>Supported Formats</h3>
            <ul className="mt-2 space-y-1.5 sm:mt-3 sm:space-y-2">
              <li>• Single & Double Elimination</li>
              <li>• Pool to Bracket transitions</li>
              <li>• Consolation paths / placement games</li>
              <li>• Automatic seeding from standings</li>
            </ul>
          </div>
          <div className={`rounded-xl border p-4 sm:rounded-2xl sm:p-6 ${getTournamentThemeClass('cardBorder', theme)} ${getTournamentThemeClass('cardBg', theme)}`}>
            <h3 className={`text-sm sm:text-base ${getTournamentThemeClass('cardText', theme)}`}>Roadmap</h3>
            <ul className="mt-2 space-y-1.5 sm:mt-3 sm:space-y-2">
              <li>• Hover tooltips with game stats & links</li>
              <li>• Mobile minimap navigation</li>
              <li>• Broadcast overlays for live streams</li>
              <li>• Export to PNG / PDF</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
