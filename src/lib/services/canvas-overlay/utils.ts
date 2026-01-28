/**
 * Canvas Overlay Utilities
 * 
 * Provides interface definitions and utility functions for Canvas-based
 * game overlay rendering. Matches EnhancedScoreOverlay React component.
 */

/**
 * Overlay variant type
 * 'classic' - Original floating elements design
 * 'nba' - ESPN/NBA-style horizontal bar design
 */
export type OverlayVariant = 'classic' | 'nba';

/**
 * Game overlay data interface
 * Matches EnhancedScoreOverlayProps from React component
 */
export interface GameOverlayData {
  // Team info (required)
  teamAName: string;
  teamBName: string;
  teamAId: string;
  teamBId: string;
  
  // Scores (required)
  homeScore: number;
  awayScore: number;
  
  // Game state (required)
  quarter: number;
  gameClockMinutes: number;
  gameClockSeconds: number;
  shotClockSeconds?: number;
  
  // Team branding (optional)
  teamALogo?: string;
  teamBLogo?: string;
  teamAPrimaryColor?: string;
  teamBPrimaryColor?: string;
  teamASecondaryColor?: string;
  teamBSecondaryColor?: string;
  teamAAccentColor?: string;
  teamBAccentColor?: string;
  
  // Game stats (use defaults if not provided)
  teamAFouls: number;        // Default: 0 if missing
  teamBFouls: number;        // Default: 0 if missing
  teamATimeouts: number;     // Default: 5 if missing
  teamBTimeouts: number;     // Default: 5 if missing
  currentPossessionTeamId?: string;
  jumpBallArrowTeamId?: string;
  
  // Tournament/venue (optional - not yet in LiveGame, but accepted by overlay)
  tournamentName?: string;
  tournamentLogo?: string;
  venue?: string;
  
  // NBA-style player stats overlay (shows during free throws)
  activePlayerStats?: PlayerStatsOverlayData;
  
  // Info bar overlay item (managed by infoBarManager)
  infoBarLabel?: string;          // Active info bar display text
  infoBarType?: string;           // Item type for styling (team_run, timeout, etc.)
}

/**
 * Player stats overlay data for NBA-style free throw display
 * Follows existing calculatePlayerStats pattern from game-viewer
 */
export interface PlayerStatsOverlayData {
  // Player identification
  playerId: string;
  playerName: string;
  jerseyNumber?: number;
  teamName: string;
  teamId: string;
  teamPrimaryColor?: string;
  profilePhotoUrl?: string;
  
  // Current game stats (matches game-viewer calculatePlayerStats)
  points: number;
  rebounds: number;
  assists: number;
  
  // Free throw line
  freeThrowMade: number;
  freeThrowAttempts: number;
  
  // Display control
  isVisible: boolean;
  showUntil?: number; // Timestamp to auto-hide (7 seconds after trigger)
}

/**
 * Logo cache for efficient image loading
 * Prevents reloading the same logo multiple times
 */
export class LogoCache {
  private cache = new Map<string, HTMLImageElement>();
  
  /**
   * Load logo image with caching
   * Returns cached image if available, otherwise loads and caches
   */
  async load(url: string): Promise<HTMLImageElement | null> {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }
    
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load logo: ${url}`));
        img.src = url;
      });
      
      this.cache.set(url, img);
      return img;
    } catch (error) {
      console.error('Logo load error:', error);
      return null;
    }
  }
  
  /**
   * Clear all cached logos
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get number of cached logos
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * Convert hex color to rgba string
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Map Tailwind color names to hex values
 * Matches colors used in React overlay component
 */
export function getTailwindColor(name: string): string {
  const colors: Record<string, string> = {
    'black': '#000000',
    'white': '#FFFFFF',
    'gray-300': '#D1D5DB',
    'gray-400': '#9CA3AF',
    'gray-500': '#6B7280',
    'red-600': '#DC2626',
    'red-500': '#EF4444',
    'orange-500': '#F97316',
    'yellow-400': '#FBBF24',
    'yellow-500': '#EAB308',
    'green-600': '#16A34A',
    'blue-500': '#3B82F6',
  };
  return colors[name] || '#000000';
}

/**
 * Get rgba color with opacity
 */
export function getTailwindRgba(name: string, opacity: number): string {
  const hex = getTailwindColor(name);
  return hexToRgba(hex, opacity);
}

/**
 * Measure text width with given font
 * Temporarily sets font, measures, then restores
 */
export function measureText(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string
): number {
  const previousFont = ctx.font;
  ctx.font = font;
  const width = ctx.measureText(text).width;
  ctx.font = previousFont;
  return width;
}

