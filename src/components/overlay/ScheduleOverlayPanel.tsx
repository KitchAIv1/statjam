/**
 * ScheduleOverlayPanel - Live Broadcast Day Schedule Overlay
 *
 * Semi-transparent overlay showing games for the selected day.
 * Team logos, time, venue, country per game.
 *
 * @module ScheduleOverlayPanel
 */

'use client';

import React from 'react';
import type { ScheduleOverlayPayload, ScheduleGameRow } from '@/lib/types/scheduleOverlay';
import { Skeleton } from '@/components/ui/skeleton';

interface ScheduleOverlayPanelProps {
  isVisible: boolean;
  isLoading: boolean;
  payload: ScheduleOverlayPayload | null;
}

export function ScheduleOverlayPanel({
  isVisible,
  isLoading,
  payload,
}: ScheduleOverlayPanelProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden transition-opacity duration-500 ease-out animate-in fade-in-0">
      <div className="w-[620px] max-w-[90%] flex-shrink-0 animate-in slide-in-from-right-4 duration-500 ease-out">
        {payload ? (
          <div
            className="relative overflow-hidden rounded-[14px] border border-white/20 shadow-[0_32px_80px_rgba(0,0,0,0.85),0_8px_24px_rgba(0,0,0,0.6)]"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop&fm=webp)',
              backgroundSize: 'cover',
              backgroundPosition: '20% center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/88 via-black/75 to-black/82" />
            <div className="relative z-10 flex flex-col w-full">
              {payload.games.length > 4 ? (
                <div className="px-[15px] pt-[11px] pb-[9px] border-b border-white/[0.09] flex-shrink-0">
                  <div className="flex items-center justify-between mb-[3px]">
                    <span className="text-[8.5px] font-bold tracking-[0.18em] uppercase text-white/28">
                      Day Schedule
                    </span>
                    <span className="text-[8px] font-extrabold tracking-[0.2em] uppercase text-[rgba(255,185,0,0.5)]">
                      StatJam
                    </span>
                  </div>
                  <div className="text-[15px] font-bold text-white tracking-tight leading-tight">
                    {payload.displayDate}
                  </div>
                </div>
              ) : null}
              <div className="w-full grid grid-cols-2 divide-x divide-white/[0.06]">
                <div className="flex flex-col divide-y divide-white/[0.06]">
                  {payload.games.length > 0 && payload.games.length > 4
                    ? payload.games.slice(0, Math.ceil(payload.games.length / 2)).map((game) => (
                        <ScheduleGameRow key={game.id} game={game} />
                      ))
                    : null}
                </div>
                <div className="flex flex-col divide-y divide-white/[0.06]">
                  {payload.games.length > 0 && payload.games.length <= 4 ? (
                    <>
                      <div className="px-[10px] pt-[8px] pb-[6px] flex-shrink-0 flex justify-center">
                        <div className="text-[15px] font-bold text-white tracking-tight leading-tight text-center">
                          {payload.displayDate}
                        </div>
                      </div>
                      {payload.games.map((game) => (
                        <ScheduleGameRow key={game.id} game={game} />
                      ))}
                    </>
                  ) : payload.games.length > 0 ? (
                    payload.games.slice(Math.ceil(payload.games.length / 2)).map((game) => (
                      <ScheduleGameRow key={game.id} game={game} />
                    ))
                  ) : null}
                </div>
              </div>
              <div className="px-[15px] py-[6px] border-t border-white/[0.07] flex items-center justify-center gap-[5px]">
                <div className="w-[3px] h-[3px] rounded-full bg-[rgba(255,185,0,0.4)]" />
                <span className="text-[7.5px] font-bold tracking-[0.2em] uppercase text-white/16">
                  Powered by StatJam
                </span>
                <div className="w-[3px] h-[3px] rounded-full bg-[rgba(255,185,0,0.4)]" />
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <ScheduleOverlaySkeleton />
        ) : null}
      </div>
    </div>
  );
}

function ScheduleOverlaySkeleton() {
  return (
    <div className="relative overflow-hidden border border-white/20 backdrop-blur-sm p-2 max-w-sm w-full">
      <div className="absolute inset-0 bg-black/75" />
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <Skeleton className="h-3 w-28 mb-2 bg-white/20 mx-auto" />
        <div className="space-y-1 w-full">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-0.5 py-1.5 border-b border-white/15 last:border-0">
              <div className="flex items-center justify-center gap-2">
                <Skeleton className="h-3 w-12 bg-white/20" />
                <Skeleton className="h-6 w-6 rounded bg-white/20" />
                <Skeleton className="h-6 w-6 rounded bg-white/20" />
                <Skeleton className="h-3 w-12 bg-white/20" />
              </div>
              <Skeleton className="h-2.5 w-24 bg-white/15" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ScheduleGameRowProps {
  game: ScheduleGameRow;
}

function ScheduleGameRow({ game }: ScheduleGameRowProps) {
  return (
    <div className="flex flex-col items-stretch py-[5px] px-[10px] flex-shrink-0 even:bg-white/[0.025]">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-[7px] min-w-0">
        <div className="flex items-center justify-end gap-[7px] min-w-0">
          <span className="text-white text-[11.5px] font-bold truncate max-w-[75px] text-right tracking-tight">
            {game.teamAName}
          </span>
          <TeamLogo url={game.teamALogoUrl} fallback={game.teamAName} />
        </div>
        <span className="text-white/90 text-[9px] font-extrabold tracking-[0.12em] px-[8px] py-[3px] border border-white/25 rounded-md bg-white/12 flex-shrink-0 text-center shadow-sm">
          vs
        </span>
        <div className="flex items-center justify-start gap-[7px] min-w-0">
          <TeamLogo url={game.teamBLogoUrl} fallback={game.teamBName} />
          <span className="text-white text-[11.5px] font-bold truncate max-w-[75px] text-left tracking-tight">
            {game.teamBName}
          </span>
        </div>
      </div>
      <div className="text-white/50 text-[9.5px] font-semibold mt-[2px] truncate w-full text-center tracking-[0.01em]">
        {game.timeFormatted}
        {game.venue && ` · ${game.venue}`}
        {game.country && ` · ${game.country}`}
      </div>
    </div>
  );
}

function TeamLogo({
  url,
  fallback,
}: {
  url?: string;
  fallback: string;
}) {
  const initial = fallback?.charAt(0) ?? '?';
  return (
    <div className="w-6 h-6 rounded-full flex-shrink-0 overflow-hidden bg-white/10 flex items-center justify-center border border-white/15">
      {url ? (
        <img
          src={url}
          alt={fallback}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-white/80 text-[7px] font-extrabold">{initial}</span>
      )}
    </div>
  );
}
