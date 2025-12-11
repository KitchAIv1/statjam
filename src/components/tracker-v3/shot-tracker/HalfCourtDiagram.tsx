'use client';

/**
 * HalfCourtDiagram - Interactive basketball half-court for shot tracking
 * 
 * Displays the court image with an invisible overlay for tap detection.
 * Converts tap coordinates to normalized court coordinates (0-100).
 * 
 * @module HalfCourtDiagram
 */

import React, { useRef, useCallback } from 'react';
import Image from 'next/image';
import { CourtCoordinates, CourtPerspective, ShotMarker } from '@/lib/types/shotTracker';
import { pixelToCourtCoordinates } from '@/lib/services/shotLocationService';
import { ShotLocationMarker } from './ShotLocationMarker';

interface HalfCourtDiagramProps {
  /** Callback when court is tapped/clicked */
  onCourtTap: (coordinates: CourtCoordinates) => void;
  /** Current court perspective */
  perspective: CourtPerspective;
  /** Shot markers to display on court */
  shotMarkers?: ShotMarker[];
  /** Whether court is interactive (disabled during confirmation) */
  isInteractive?: boolean;
  /** Pending tap location to highlight */
  pendingLocation?: CourtCoordinates | null;
}

export function HalfCourtDiagram({
  onCourtTap,
  perspective,
  shotMarkers = [],
  isInteractive = true,
  pendingLocation
}: HalfCourtDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!isInteractive || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const pixelX = event.clientX - rect.left;
    const pixelY = event.clientY - rect.top;

    let coords = pixelToCourtCoordinates(
      pixelX,
      pixelY,
      rect.width,
      rect.height
    );

    // Flip coordinates if perspective is reversed
    if (perspective === 'team_b_attacks_up') {
      coords = {
        x: 100 - coords.x,
        y: 100 - coords.y
      };
    }

    onCourtTap(coords);
  }, [onCourtTap, perspective, isInteractive]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[4/3] select-none ${
        isInteractive ? 'cursor-crosshair' : 'cursor-not-allowed opacity-75'
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Basketball half-court. Tap to mark shot location."
    >
      {/* Court Background Image */}
      <Image
        src="/assets/halfcourt.png"
        alt="Basketball half-court"
        fill
        className={`object-contain pointer-events-none ${
          perspective === 'team_b_attacks_up' ? 'rotate-180' : ''
        }`}
        priority
        draggable={false}
      />

      {/* Shot Markers Layer */}
      <div className="absolute inset-0 pointer-events-none">
        {shotMarkers.map((marker) => (
          <ShotLocationMarker
            key={marker.id}
            location={marker.location}
            made={marker.made}
            perspective={perspective}
          />
        ))}
      </div>

      {/* Pending Shot Indicator */}
      {pendingLocation && (
        <div className="absolute inset-0 pointer-events-none">
          <ShotLocationMarker
            location={pendingLocation}
            made={null}
            perspective={perspective}
            isPending
          />
        </div>
      )}

      {/* Visual feedback overlay when not interactive */}
      {!isInteractive && (
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      )}
    </div>
  );
}
