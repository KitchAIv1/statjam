import { Card } from '@/components/ui/card';

interface BracketTabProps {
  tournamentId: string;
}

export function BracketTab({ tournamentId }: BracketTabProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80 backdrop-blur sm:rounded-3xl sm:p-6">
        <h2 className="text-lg font-semibold text-white sm:text-xl">Interactive Bracket</h2>
        <p className="mt-2 text-xs text-white/60 sm:text-sm">
          Bracket visualization syncing with live results is coming soon.
        </p>
        <div className="mt-4 grid gap-4 text-xs text-white/50 sm:mt-6 sm:gap-6 sm:text-sm md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 sm:rounded-2xl sm:p-6">
            <h3 className="text-sm text-white/80 sm:text-base">Supported Formats</h3>
            <ul className="mt-2 space-y-1.5 sm:mt-3 sm:space-y-2">
              <li>• Single & Double Elimination</li>
              <li>• Pool to Bracket transitions</li>
              <li>• Consolation paths / placement games</li>
              <li>• Automatic seeding from standings</li>
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 sm:rounded-2xl sm:p-6">
            <h3 className="text-sm text-white/80 sm:text-base">Roadmap</h3>
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
