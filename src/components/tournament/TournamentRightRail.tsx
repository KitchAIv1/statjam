"use client";

import { useMemo, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useLiveGamesHybrid } from '@/hooks/useLiveGamesHybrid';
import { useTournamentMatchups } from '@/hooks/useTournamentMatchups';
import { useTournamentStreamStatus } from '@/hooks/useTournamentStreamStatus';
import { TeamService } from '@/lib/services/tournamentService';
import { TournamentPageData } from '@/lib/services/tournamentPublicService';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Shield, Calendar, Video, Clock, Tv, ExternalLink } from 'lucide-react';
import { TournamentOrganizerCard } from './TournamentOrganizerCard';
import { PhaseBadge } from './PhaseBadge';
import { TournamentLiveStreamEmbed, PlayerState } from '@/components/live-streaming/TournamentLiveStreamEmbed';

interface TournamentRightRailProps {
  data: TournamentPageData;
  /** Active tab - used to hide redundant stream when on Live tab */
  activeTab?: string;
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

export function TournamentRightRail({ data, activeTab }: TournamentRightRailProps) {
  const { games, loading } = useLiveGamesHybrid();
  const [gamesWithLogos, setGamesWithLogos] = useState<GameWithLogos[]>([]);
  const [streamPlayerState, setStreamPlayerState] = useState<PlayerState>('loading');
  
  // ✅ Real-time subscription to streaming status - auto-updates on URL/toggle changes
  const { isStreaming, liveStreamUrl, streamPlatform } = useTournamentStreamStatus(
    data.tournament.id,
    {
      initialIsStreaming: data.tournament.isStreaming,
      initialLiveStreamUrl: data.tournament.liveStreamUrl,
      initialStreamPlatform: data.tournament.streamPlatform,
    }
  );

  const handleStreamStateChange = useCallback((state: PlayerState) => {
    setStreamPlayerState(state);
  }, []);
  
  // ✅ Fetch upcoming scheduled games for this tournament
  const { matchups: upcomingGames, loading: upcomingLoading } = useTournamentMatchups(data.tournament.id, {
    status: 'scheduled',
    limit: 5
  });

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

  // Get current live game for stream details
  const currentLiveGame = gamesWithLogos[0];

  return (
    <div className="space-y-6">
      {/* Section 1: Live Stream Video - Hidden when on Live tab to avoid redundant embeds */}
      {activeTab !== 'live' && (
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121212]">
          <header className="flex items-center gap-2 p-4 pb-0">
            <Video className="h-4 w-4 text-[#FF3B30]" />
            <span className="text-sm font-semibold text-white">Live Stream</span>
          </header>
          {/* Stream content based on state */}
          <StreamContent
            isStreaming={isStreaming}
            liveStreamUrl={liveStreamUrl}
            streamPlatform={streamPlatform}
            streamPlayerState={streamPlayerState}
            onStateChange={handleStreamStateChange}
            currentLiveGame={currentLiveGame}
            nextGame={upcomingGames[0]}
          />
        </section>
      )}

      {/* Section 2: Play-by-Play Feed - Links to detailed game viewer */}
      <section className="rounded-2xl border border-white/10 bg-[#121212] p-5">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Play-by-Play Feed</span>
          </div>
          <span className="text-[10px] text-[#B3B3B3] uppercase tracking-wide">Live Stats</span>
        </header>
        <div className="space-y-3">
          {loading && (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-16 rounded-xl bg-white/5" />
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5 shrink-0 border border-white/10">
                      {game.teamALogo ? (
                        <AvatarImage src={game.teamALogo} alt="" className="object-cover" loading="lazy" />
                      ) : null}
                      <AvatarFallback className="bg-[#FF3B30]/10">
                        <Shield className="h-2.5 w-2.5 text-[#FF3B30]" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-white">{game.team_a_name || 'Team A'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">{game.home_score || 0}</span>
                    <span className="text-[10px] text-[#FF3B30] font-semibold">
                      {formatClock(game.quarter, game.game_clock_minutes, game.game_clock_seconds)}
                    </span>
                    <span className="text-sm font-bold text-white">{game.away_score || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white">{game.team_b_name || 'Team B'}</span>
                    <Avatar className="h-5 w-5 shrink-0 border border-white/10">
                      {game.teamBLogo ? (
                        <AvatarImage src={game.teamBLogo} alt="" className="object-cover" loading="lazy" />
                      ) : null}
                      <AvatarFallback className="bg-[#FF3B30]/10">
                        <Shield className="h-2.5 w-2.5 text-[#FF3B30]" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <p className="text-[10px] text-[#B3B3B3] text-center mt-2">Tap for detailed play-by-play →</p>
              </div>
            ))}
        </div>
      </section>

      {/* Section 3: Upcoming Schedule */}
      <section className="rounded-2xl border border-white/10 bg-[#121212] p-5">
        <header className="mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#FF3B30]" />
          <span className="text-sm font-semibold text-white">Upcoming Games</span>
        </header>
        <div className="space-y-2.5 max-h-64 overflow-y-auto">
          {upcomingLoading && (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-12 rounded-lg bg-white/5" />
              ))}
            </div>
          )}
          {!upcomingLoading && upcomingGames.length === 0 && (
            <p className="text-xs text-[#B3B3B3] py-2">
              No upcoming games scheduled
            </p>
          )}
          {!upcomingLoading && upcomingGames.map((game) => (
            <UpcomingGameItem
              key={game.gameId}
              gameId={game.gameId}
              teamA={game.teamA.name}
              teamB={game.teamB.name}
              gameDate={game.gameDate}
              gamePhase={game.gamePhase}
            />
          ))}
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
        <Image
          src="/announcements/player-claim-announcement-2.png"
          alt="Own Your Game - Claim your profile on StatJam"
          width={380}
          height={380}
          className="w-full h-auto object-cover"
          loading="lazy"
          sizes="(max-width: 768px) 100vw, 380px"
        />
      </section>
    </div>
  );
}

function UpcomingGameItem({ gameId, teamA, teamB, gameDate, gamePhase }: { gameId: string; teamA: string; teamB: string; gameDate?: string; gamePhase?: 'regular' | 'playoffs' | 'finals' }) {
  const formatGameDate = (dateString?: string): string => {
    if (!dateString) return 'TBD';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return 'TBD';
    }
  };

  return (
    <div 
      className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-xs cursor-pointer hover:border-white/10 hover:bg-white/10 transition"
      onClick={() => window.open(`/game-viewer/${gameId}`, '_blank')}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-white font-medium truncate">{teamA} vs {teamB}</div>
          <PhaseBadge phase={gamePhase} size="sm" showIcon={false} />
        </div>
        <div className="flex items-center gap-1 text-[#B3B3B3] mt-0.5">
          <Clock className="h-3 w-3" />
          <span className="text-[10px]">{formatGameDate(gameDate)}</span>
        </div>
      </div>
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

/** Stream content with contextual states - handles loading, live, ended, error */
function StreamContent({
  isStreaming,
  liveStreamUrl,
  streamPlatform,
  streamPlayerState,
  onStateChange,
  currentLiveGame,
  nextGame,
}: {
  isStreaming?: boolean;
  liveStreamUrl?: string | null;
  streamPlatform?: 'youtube' | 'twitch' | 'facebook' | null;
  streamPlayerState: PlayerState;
  onStateChange: (state: PlayerState) => void;
  currentLiveGame?: GameWithLogos;
  nextGame?: { teamA: { name: string }; teamB: { name: string }; gameDate?: string };
}) {
  const streamActive = isStreaming && liveStreamUrl && streamPlatform;
  
  // No stream configured - show placeholder
  if (!streamActive) {
    return (
      <div className="p-4 pt-3">
        <NextStreamPlaceholder nextGame={nextGame} />
      </div>
    );
  }

  // Stream ended - show message with link to platform
  if (streamPlayerState === 'ended') {
    return (
      <div className="p-4 pt-3">
        <div className="flex flex-col items-center justify-center py-8 text-center" style={{ aspectRatio: '16/9' }}>
          <Tv className="h-10 w-10 text-white/30 mb-3" />
          <p className="text-sm font-semibold text-white mb-1">Stream Ended</p>
          <p className="text-xs text-white/50 mb-3">This broadcast has concluded</p>
          <a
            href={liveStreamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#FF3B30] hover:text-[#FF3B30]/80 transition"
          >
            Watch on {streamPlatform === 'youtube' ? 'YouTube' : streamPlatform === 'twitch' ? 'Twitch' : 'Facebook'}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    );
  }

  // Error loading stream - show fallback with external link
  if (streamPlayerState === 'error') {
    return (
      <div className="p-4 pt-3">
        <div className="flex flex-col items-center justify-center py-8 text-center" style={{ aspectRatio: '16/9' }}>
          <Video className="h-10 w-10 text-white/30 mb-3" />
          <p className="text-sm font-semibold text-white mb-1">Unable to Load Stream</p>
          <p className="text-xs text-white/50 mb-3">Watch directly on the platform</p>
          <a
            href={liveStreamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#FF3B30] hover:text-[#FF3B30]/80 transition"
          >
            Open in {streamPlatform === 'youtube' ? 'YouTube' : streamPlatform === 'twitch' ? 'Twitch' : 'Facebook'}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    );
  }

  // Stream active (loading, playing, buffering, paused, unstarted) - show embed
  return (
    <div>
      <div className="p-4 pt-3">
        <TournamentLiveStreamEmbed
          streamUrl={liveStreamUrl}
          platform={streamPlatform}
          className="w-full rounded-lg"
          onStateChange={onStateChange}
        />
      </div>
      {/* Game details below stream */}
      {currentLiveGame && (
        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5 border border-white/10">
                {currentLiveGame.teamALogo ? (
                  <AvatarImage src={currentLiveGame.teamALogo} alt="" className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-[#FF3B30]/10">
                  <Shield className="h-2.5 w-2.5 text-[#FF3B30]" />
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-white font-medium">{currentLiveGame.team_a_name}</span>
              <span className="text-sm font-bold text-white">{currentLiveGame.home_score ?? 0}</span>
            </div>
            <span className="text-[10px] text-[#FF3B30] font-semibold px-2 py-0.5 bg-[#FF3B30]/10 rounded">
              {formatClock(currentLiveGame.quarter, currentLiveGame.game_clock_minutes, currentLiveGame.game_clock_seconds)}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{currentLiveGame.away_score ?? 0}</span>
              <span className="text-xs text-white font-medium">{currentLiveGame.team_b_name}</span>
              <Avatar className="h-5 w-5 border border-white/10">
                {currentLiveGame.teamBLogo ? (
                  <AvatarImage src={currentLiveGame.teamBLogo} alt="" className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-[#FF3B30]/10">
                  <Shield className="h-2.5 w-2.5 text-[#FF3B30]" />
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Placeholder when no active stream - shows next upcoming game or generic message */
function NextStreamPlaceholder({ nextGame }: { nextGame?: { teamA: { name: string }; teamB: { name: string }; gameDate?: string } }) {
  const formatGameDate = (dateString?: string): string => {
    if (!dateString) return 'Soon';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return 'Soon';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center" style={{ aspectRatio: '16/9' }}>
      <Tv className="h-10 w-10 text-[#FF3B30]/40 mb-3" />
      {nextGame ? (
        <>
          <p className="text-sm font-semibold text-white mb-1">Next Game Coming!</p>
          <p className="text-xs text-white/70 mb-2">
            {nextGame.teamA.name} vs {nextGame.teamB.name}
          </p>
          <p className="text-[10px] text-white/50">{formatGameDate(nextGame.gameDate)}</p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-white mb-1">Stay Tuned!</p>
          <p className="text-xs text-white/50">Check the schedule for upcoming games</p>
        </>
      )}
    </div>
  );
}
