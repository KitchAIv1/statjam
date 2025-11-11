import { Card } from '@/components/ui/card';

interface MediaTabProps {
  tournamentId: string;
}

export function MediaTab({ tournamentId }: MediaTabProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80 backdrop-blur sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white sm:text-xl">Media & Highlights</h2>
            <p className="text-xs text-white/50 sm:text-sm">Game clips, condensed games, and photo galleries drop here instantly.</p>
          </div>
          <span className="mt-2 rounded-full border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-wide text-white/60 sm:mt-0 sm:px-4 sm:py-2 sm:text-xs">Tournament {tournamentId}</span>
        </div>

        <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <div key={index} className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-3 sm:space-y-3 sm:rounded-3xl sm:p-4">
              <div className="aspect-video rounded-xl bg-white/10 sm:rounded-2xl" />
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="font-semibold text-white">Highlight {index}</div>
                <div className="text-[10px] text-white/50 sm:text-xs">Clip syncing with live games soon</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70 backdrop-blur sm:rounded-3xl sm:p-6">
        <h3 className="text-base font-semibold text-white sm:text-lg">Content Pipeline</h3>
        <p className="mt-2 text-xs text-white/50 sm:text-sm">
          Organizer Pro surfaces auto-generated recap articles, social media packages, and player spotlights powered by StatJam AI.
        </p>
      </Card>
    </div>
  );
}
