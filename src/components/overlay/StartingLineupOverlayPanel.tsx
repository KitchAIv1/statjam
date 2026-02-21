/**
 * StartingLineupOverlayPanel - Live Broadcast Starting Lineup Overlay
 *
 * Lightweight overlay showing tournament, label, and 5v5 starting lineup
 * with team logos and player avatars. No card container; floats on video.
 *
 * @module StartingLineupOverlayPanel
 */

'use client';

import React from 'react';

export interface LineupPlayer {
  id: string;
  name: string;
  jerseyNumber?: string | number | null;
  photo_url?: string | null;
}

export interface StartingLineupPayload {
  tournamentName: string;
  tournamentLogo?: string | null;
  teamA: {
    name: string;
    logo?: string | null;
    /** From teams.primary_color via useGameOverlayData (same source as Box Score / scoring overlay) */
    primaryColor?: string | null;
    players: LineupPlayer[];
  };
  teamB: {
    name: string;
    logo?: string | null;
    /** From teams.primary_color via useGameOverlayData (same source as Box Score / scoring overlay) */
    primaryColor?: string | null;
    players: LineupPlayer[];
  };
}

interface StartingLineupOverlayPanelProps {
  isVisible: boolean;
  isLoading: boolean;
  payload: StartingLineupPayload | null;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function StartingLineupOverlayPanel({
  isVisible,
  isLoading,
  payload,
}: StartingLineupOverlayPanelProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden transition-opacity duration-500 ease-out animate-in fade-in-0">
      <div className="flex flex-col items-center max-w-[90%] w-[720px] flex-shrink-0 px-4 max-h-[calc(100%-32px)] mb-4">
        {payload ? (
          <>
            <CompactHeader
              tournamentName={payload.tournamentName}
              tournamentLogo={payload.tournamentLogo}
            />
            <PlayersBand teamA={payload.teamA} teamB={payload.teamB} />
          </>
        ) : isLoading ? (
          <StartingLineupSkeleton />
        ) : null}
      </div>
    </div>
  );
}

function CompactHeader({
  tournamentName,
  tournamentLogo,
}: {
  tournamentName: string;
  tournamentLogo?: string | null;
}) {
  return (
    <div className="flex items-center justify-center gap-3 mb-3 px-4 w-full">
      {tournamentLogo ? (
        <img src={tournamentLogo} alt="" className="w-5 h-5 rounded object-cover" />
      ) : null}
      <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/60">
        {tournamentName}
      </span>
      <div className="w-px h-3 bg-white/25" />
      <span className="text-[11px] font-black tracking-[0.22em] uppercase text-yellow-400/90">
        Starting Lineup
      </span>
      <div className="w-px h-3 bg-white/25" />
      <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/40">
        StatJam
      </span>
    </div>
  );
}

function PlayersBand({
  teamA,
  teamB,
}: {
  teamA: StartingLineupPayload['teamA'];
  teamB: StartingLineupPayload['teamB'];
}) {
  return (
    <div className="relative w-full py-3" style={{ background: 'transparent' }}>
      {/* Layer 1 — Two-team color gradient band */}
      {(() => {
        const teamAColor = teamA.primaryColor || '#DC2626';
        const teamBColor = teamB.primaryColor || '#DC2626';
        const bandGradient = `linear-gradient(to right, transparent 0%, transparent 5%, ${teamAColor}45 18%, ${teamAColor}80 50%, ${teamBColor}80 50%, ${teamBColor}45 82%, transparent 95%, transparent 100%)`;
        return (
          <>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: bandGradient,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
            <div
              className="absolute left-[10%] right-[10%] top-0 h-px z-0 pointer-events-none"
              style={{ background: `${teamAColor}66` }}
            />
            <div
              className="absolute left-[10%] right-[10%] bottom-0 h-px z-0 pointer-events-none"
              style={{ background: `${teamBColor}66` }}
            />
          </>
        );
      })()}
      {/* Layer 2 — Content grid */}
      <div
        className="relative z-[1] grid gap-0 py-0 px-4 overflow-hidden"
        style={{ gridTemplateColumns: '1fr 24px 1fr' }}
      >
        <TeamHalf team={teamA} side="left" />
        <div className="flex flex-col items-center min-w-[24px] min-h-0 w-6">
          <span className="text-[9px] font-black tracking-[0.15em] text-white/20 mt-1">
            VS
          </span>
          <div className="flex-1 min-h-0 w-px bg-gradient-to-b from-transparent via-white/8 to-transparent" />
        </div>
        <TeamHalf team={teamB} side="right" />
      </div>
    </div>
  );
}

function TeamHalf({
  team,
  side,
}: {
  team: StartingLineupPayload['teamA'];
  side: 'left' | 'right';
}) {
  const isLeft = side === 'left';

  return (
    <div className="flex flex-col gap-[6px] min-w-0 min-h-0 overflow-hidden">
      {/* Team name header — inside this team-half column */}
      <div className={isLeft ? 'flex justify-end mb-1 pr-2 flex-shrink-0' : 'flex justify-start mb-1 pl-2 flex-shrink-0'}>
        <span className="text-[15px] font-black tracking-tight" style={{ color: team.primaryColor || '#ffffff' }}>
          {team.name}
        </span>
      </div>
      {/* 5 player rows */}
      {(team.players || []).slice(0, 5).map((player) => (
        <PlayerRow key={player.id} player={player} side={side} primaryColor={team.primaryColor} />
      ))}
    </div>
  );
}

function PlayerRow({
  player,
  side,
  primaryColor,
}: {
  player: LineupPlayer;
  side: 'left' | 'right';
  primaryColor?: string | null;
}) {
  const isLeft = side === 'left';
  const justify = isLeft ? 'flex-end' : 'flex-start';
  const initials = getInitials(player.name);
  const raw = player.jerseyNumber;
  const jerseyStr =
    raw !== null && raw !== undefined && raw !== '' && String(raw) !== '0'
      ? String(raw)
      : null;

  const rowGap = isLeft ? 'gap-[3px]' : 'gap-[6px]';
  const nameMaxW = isLeft ? 'max-w-[130px]' : 'max-w-[260px]';
  return (
    <div
      className={`flex items-center ${rowGap} flex-shrink-0 py-0 border-b border-white/[0.05] last:border-b-0`}
      style={{ justifyContent: justify }}
    >
      {isLeft ? (
        <>
          <div className="flex flex-col items-end min-w-0">
            <span className={`text-[13px] font-bold text-white truncate ${nameMaxW} text-right capitalize`}>
              {player.name}
            </span>
            {jerseyStr !== null && (
              <span className="text-[9.5px] text-white/35 text-right">#{jerseyStr}</span>
            )}
          </div>
          <PlayerAvatar photoUrl={player.photo_url} initials={initials} jerseyStr={jerseyStr} primaryColor={primaryColor} />
        </>
      ) : (
        <>
          <PlayerAvatar photoUrl={player.photo_url} initials={initials} jerseyStr={jerseyStr} primaryColor={primaryColor} />
          <div className="flex flex-col items-start min-w-0">
            <span className={`text-[13px] font-bold text-white truncate ${nameMaxW} text-left capitalize`}>
              {player.name}
            </span>
            {jerseyStr !== null && (
              <span className="text-[9.5px] text-white/35 text-left">#{jerseyStr}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PlayerAvatar({
  photoUrl,
  initials,
  jerseyStr,
  primaryColor,
}: {
  photoUrl?: string | null;
  initials: string;
  jerseyStr: string | null;
  primaryColor?: string | null;
}) {
  const bgColor = 'rgba(0,0,0,0.45)';
  const borderColor = primaryColor ? `${primaryColor}40` : 'rgba(255,255,255,0.2)';
  return (
    <div style={{ width: '40px', height: '40px', flexShrink: 0 }}>
      <div
        className="relative flex items-center justify-center"
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '40px',
          maxHeight: '40px',
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: bgColor,
          border: `1.5px solid ${borderColor}`,
        }}
      >
        {photoUrl ? (
          <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span
            className="text-[12px] font-bold text-white"
            style={{ textShadow: '0 0 8px rgba(0,0,0,0.6)' }}
          >
            {initials}
          </span>
        )}
        {jerseyStr !== null && (
          <div className="absolute bottom-0 right-0 w-[16px] h-[16px] rounded flex items-center justify-center bg-black/90 border border-white/25 text-[8px] font-bold text-white">
            {jerseyStr}
          </div>
        )}
      </div>
    </div>
  );
}

function StartingLineupSkeleton() {
  return (
    <div className="flex flex-col items-center w-full max-w-[720px] px-4">
      <div className="flex items-center justify-center gap-3 mb-3 px-4 w-full">
        <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
        <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
        <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
      </div>
      <div
        className="w-full grid gap-0 py-4 px-4 rounded-lg overflow-hidden"
        style={{ gridTemplateColumns: '1fr 24px 1fr' }}
      >
        <div className="flex flex-col gap-2">
          <div className="flex justify-end mb-2">
            <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-end gap-2">
              <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
              <div className="h-[40px] w-[40px] min-w-[40px] min-h-[40px] rounded-full bg-white/10 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="bg-white/10 min-w-[24px] min-h-0" />
        <div className="flex flex-col gap-2">
          <div className="flex justify-start mb-2">
            <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-start gap-2">
              <div className="h-[40px] w-[40px] min-w-[40px] min-h-[40px] rounded-full bg-white/10 animate-pulse" />
              <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
