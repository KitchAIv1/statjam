"use client";

import { useMemo, useEffect, useState } from 'react';
import Image from 'next/image';
import { useLiveGamesHybrid } from '@/hooks/useLiveGamesHybrid';
import { TeamService } from '@/lib/services/tournamentService';
import LiveGameCard from '@/components/LiveGameCard';
import { TournamentPageData } from '@/lib/services/tournamentPublicService';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Shield } from 'lucide-react';
import { TournamentOrganizerCard } from './TournamentOrganizerCard';

interface TournamentRightRailProps {
  data: TournamentPageData;
}

interface GameWithLogos {
  id: string;
  team_a_name?: string;
  team_b_name?: string;
  team_a_id?: string;
  team_b_id?: string;
  home_score?: number;
  away_score?: number;
  quarter?: number;
  game_clock_minutes?: number;
  game_clock_seconds?: number;
  teamALogo?: string;
  teamBLogo?: string;
}

export function TournamentRightRail({ data }: TournamentRightRailProps) {
  const { games, loading } = useLiveGamesHybrid();
  const [gamesWithLogos, setGamesWithLogos] = useState<GameWithLogos[]>([]);

  const filteredGames = useMemo(() => {
    return games.filter((game) => game.tournament_id === data.tournament.id).slice(0, 3);
  }, [games, data.tournament.id]);

  // ✅ FIX: Create stable game IDs array for dependency tracking
  const filteredGameIds = useMemo(() => {
    return filteredGames.map(g => g.id).sort().join(',');
  }, [filteredGames]);

  useEffect(() => {
    let mounted = true;

    const loadLogos = async () => {
      if (filteredGames.length === 0) {
        if (mounted) {
          setGamesWithLogos([]);
        }
        return;
      }

      const gamesWithLogosData = await Promise.all(
        filteredGames.map(async (game) => {
          const [teamAInfo, teamBInfo] = await Promise.all([
            game.team_a_id ? TeamService.getTeamInfo(game.team_a_id) : Promise.resolve(null),
            game.team_b_id ? TeamService.getTeamInfo(game.team_b_id) : Promise.resolve(null),
          ]);

          return {
            ...game,
            teamALogo: teamAInfo?.logo,
            teamBLogo: teamBInfo?.logo,
          };
        })
      );

      if (mounted) {
        setGamesWithLogos(gamesWithLogosData);
      }
    };

    loadLogos();

    return () => {
      mounted = false;
    };
  }, [filteredGameIds]); // ✅ FIX: Use stable game IDs instead of filteredGames array

  return (
    <div className="space-y-6">
      {/* Section 1: Live Now */}
      <section className="rounded-2xl border border-white/10 bg-[#121212] p-5">
        <header className="mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Live Now</span>
          <span className="text-xs text-[#B3B3B3]">Realtime</span>
        </header>
        <div className="space-y-3">
          {loading && (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 rounded-xl bg-white/5" />
              ))}
            </div>
          )}
          {!loading && filteredGames.length === 0 && (
            <p className="rounded-xl bg-white/5 p-4 text-sm text-[#B3B3B3]">
              No live games at the moment.
            </p>
          )}
          {!loading &&
            gamesWithLogos.map((game) => (
              <div
                key={game.id}
                className="cursor-pointer rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-[#FF3B30]/30 hover:bg-white/10"
                onClick={() => window.open(`/game-viewer/${game.id}`, '_blank')}
              >
                <div className="mb-2 flex items-center justify-center gap-2">
                  <Avatar className="h-6 w-6 shrink-0 border border-white/10">
                    {game.teamALogo ? (
                      <AvatarImage
                        src={game.teamALogo}
                        alt={`${game.team_a_name || 'Team A'} logo`}
                        className="object-cover"
                        loading="lazy"
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
                      <Shield className="h-3 w-3 text-[#FF3B30]" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-[#B3B3B3]">vs</span>
                  <Avatar className="h-6 w-6 shrink-0 border border-white/10">
                    {game.teamBLogo ? (
                      <AvatarImage
                        src={game.teamBLogo}
                        alt={`${game.team_b_name || 'Team B'} logo`}
                        className="object-cover"
                        loading="lazy"
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10">
                      <Shield className="h-3 w-3 text-[#FF3B30]" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <LiveGameCard
                  gameId={game.id}
                  teamLeftName={game.team_a_name || 'Team A'}
                  teamRightName={game.team_b_name || 'Team B'}
                  leftScore={game.home_score || 0}
                  rightScore={game.away_score || 0}
                  timeLabel={formatClock(game.quarter, game.game_clock_minutes, game.game_clock_seconds)}
                  onClick={() => window.open(`/game-viewer/${game.id}`, '_blank')}
                  isLive={true}
                />
              </div>
            ))}
        </div>
      </section>

      {/* Section 2: Embedded Stream Player (PiP capable) */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121212]">
        <div className="relative aspect-video bg-black">
          <div className="absolute inset-0 flex items-center justify-center text-[#B3B3B3]">
            <div className="text-center">
              <div className="mb-2 text-sm">Live Stream</div>
              <div className="text-xs text-white/40">PiP capable</div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 p-3 text-xs text-[#B3B3B3]">
          Stream syncs with StatJam play-by-play
        </div>
      </section>

      {/* Section 3: Play-by-Play Ticker */}
      <section className="rounded-2xl border border-white/10 bg-[#121212] p-5">
        <header className="mb-3 text-sm font-semibold text-white">Play-by-Play</header>
        <div className="space-y-2.5 max-h-64 overflow-y-auto">
          <PlayByPlayItem timestamp="3:12" description="Wildcats fast break layup. Murray +2" />
          <PlayByPlayItem timestamp="3:27" description="Jones shooting foul. Score tied 44–44" />
          <PlayByPlayItem timestamp="3:44" description="Razorbacks defensive rebound. Turner" />
          <PlayByPlayItem timestamp="4:06" description="Timeout called by Hurricanes" />
          <PlayByPlayItem timestamp="4:32" description="Thunder 3PT made. Lead extends to 6" />
        </div>
      </section>

      {/* Section 4: Sponsor Carousel */}
      <section>
        <header className="mb-3 text-sm font-semibold text-white">Sponsors</header>
        <div className="grid grid-cols-2 gap-3">
          {data.sponsors.length === 0
            ? DEFAULT_SPONSORS.map((sponsor) => (
                <SponsorCard key={sponsor} label={sponsor} />
              ))
            : data.sponsors.map((sponsor) => (
                <SponsorCard key={sponsor.id} label={sponsor.slot || 'Partner'} imageUrl={sponsor.imageUrl ?? undefined} linkUrl={sponsor.linkUrl ?? undefined} />
              ))}
        </div>
      </section>

      {/* Section 5: Organizer Card */}
      <TournamentOrganizerCard organizerId={data.tournament.organizerId} />

      {/* Section 6: StatJam Promo Poster */}
      <section className="overflow-hidden">
        <a href="/features" target="_blank" rel="noopener noreferrer" className="block">
          <Image
            src="/announcements/player-claim-announcement-2.png"
            alt="Own Your Game - Claim your profile on StatJam"
            width={380}
            height={380}
            className="w-full h-auto object-cover"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 380px"
          />
        </a>
      </section>
    </div>
  );
}

function PlayByPlayItem({ timestamp, description }: { timestamp: string; description: string }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="shrink-0 font-semibold text-[#B3B3B3]">{timestamp}</span>
      <p className="text-[#B3B3B3]">{description}</p>
    </div>
  );
}

function SponsorCard({ label, imageUrl, linkUrl }: { label: string; imageUrl?: string; linkUrl?: string }) {
  const content = (
    <div className="flex h-20 items-center justify-center rounded-xl border border-white/10 bg-[#121212] text-sm font-semibold text-[#B3B3B3] transition hover:border-[#FF3B30]/30 hover:text-white">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={label} className="h-12 w-32 object-contain" />
      ) : (
        label
      )}
    </div>
  );

  if (linkUrl) {
    return (
      <a href={linkUrl} target="_blank" rel="noreferrer" className="block">
        {content}
      </a>
    );
  }

  return content;
}

const DEFAULT_SPONSORS = ['Sponsor', 'Elite Courts', 'GearLab', 'SportsFuel'];

function formatClock(quarter?: number, minutes?: number, seconds?: number) {
  const q = !quarter || quarter <= 4 ? `Q${quarter ?? 1}` : `OT${(quarter ?? 5) - 4}`;
  const mm = String(minutes ?? 0).padStart(2, '0');
  const ss = String(seconds ?? 0).padStart(2, '0');
  return `${q} ${mm}:${ss}`;
}
